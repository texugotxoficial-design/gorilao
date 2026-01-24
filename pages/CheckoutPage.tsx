
import React, { useEffect, useState } from 'react'; // v1.1.0-payment-fix
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
};

console.log('GORILAO_APP_V: 1.1.7');

const CheckoutPage: React.FC = () => {
    const { cartItems, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [subtotal, setSubtotal] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [street, setStreet] = useState('');
    const [houseNumber, setHouseNumber] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [referencePoint, setReferencePoint] = useState('');
    const [orderPlaced, setOrderPlaced] = useState(false);

    // Payment Sub-options
    const [needsChange, setNeedsChange] = useState(false);
    const [changeFor, setChangeFor] = useState('');
    const [cardType, setCardType] = useState('credit'); // credit, debit, voucher

    useEffect(() => {
        if (cartItems.length === 0 && !orderPlaced) {
            navigate('/menu');
            return;
        }
        const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        setSubtotal(total);

        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            const { data } = await supabase
                .from('profiles')
                .select('address, reference_point, full_name, phone')
                .eq('id', user.id)
                .single();

            if (data) {
                if (data.address) {
                    // Best effort parsing: "Street, Number - Neighborhood"
                    const addressStr = data.address;
                    const dashSplit = addressStr.split(' - ');
                    const neighborhoodPart = dashSplit.length > 1 ? dashSplit[1] : '';
                    const mainPart = dashSplit[0];
                    const commaSplit = mainPart.split(', ');
                    const streetPart = commaSplit[0];
                    const numberPart = commaSplit.length > 1 ? commaSplit[1] : '';

                    setStreet(streetPart);
                    setHouseNumber(numberPart);
                    setNeighborhood(neighborhoodPart);
                }
                if (data.reference_point) {
                    setReferencePoint(data.reference_point);
                }
                if (data.full_name) {
                    setCustomerName(data.full_name);
                }
                if (data.phone) {
                    setCustomerPhone(data.phone);
                }
            }
        };
        fetchProfile();
    }, [cartItems, navigate, user]);


    const handlePlaceOrder = async () => {
        if (!customerName || !customerPhone || !street || !houseNumber) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        if (paymentMethod === 'cash' && needsChange && !changeFor) {
            alert('Por favor, informe o valor para o troco.');
            return;
        }

        setLoading(true);
        try {
            const orderId = Math.random().toString(36).substring(7).toUpperCase();
            const fullAddress = `${street}, ${houseNumber}${neighborhood ? ` - ${neighborhood}` : ''}`;

            // Prepare payment details
            const paymentDetails: any = {};
            if (paymentMethod === 'cash' && needsChange) {
                paymentDetails.change_for = changeFor;
            } else if (paymentMethod === 'card') {
                paymentDetails.card_type = cardType;
            }

            // Create order in Supabase
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user?.id,
                    total_amount: subtotal,
                    status: 'pending',
                    payment_method: paymentMethod,
                    payment_details: paymentDetails,
                    delivery_address: fullAddress,
                    reference_point: referencePoint,
                    order_number: orderId,
                    items: cartItems.map(item => ({
                        product_id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image_url: item.image_url,
                        extras: item.extras || []
                    }))
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Update user profile with latest delivery info
            if (user) {
                await supabase.from('profiles').upsert({
                    id: user?.id,
                    full_name: customerName,
                    phone: customerPhone,
                    address: fullAddress,
                    reference_point: referencePoint
                });
            }

            // Payment text for WhatsApp
            let paymentText = paymentMethod.toUpperCase();
            if (paymentMethod === 'cash' && needsChange) {
                paymentText += ` (Troco para ${formatPrice(Number(changeFor))})`;
            } else if (paymentMethod === 'card') {
                const cardLabels: any = { credit: 'Crédito', debit: 'Débito', voucher: 'Alimentação' };
                paymentText += ` (${cardLabels[cardType]})`;
            } else if (paymentMethod === 'pix') {
                paymentText += ` (PAGAMENTO VIA PIX)`;
            }

            // Generate Detailed WhatsApp Message
            const itemsList = cartItems.map(item => {
                let text = `🔸 *${item.quantity}x ${item.name}* (${formatPrice(item.price)})`;
                if (item.extras && item.extras.length > 0) {
                    item.extras.forEach((extra: any) => {
                        text += `\n   └─ + ${extra.name} (${formatPrice(extra.price)})`;
                    });
                }
                return text;
            }).join('\n\n');

            const message = [
                `*🦍 NOVO PEDIDO - GORILÃO LANCHES*`,
                `----------------------------------`,
                `*Pedido:* No ${orderId}`,
                `*Cliente:* ${customerName}`,
                `*WhatsApp:* ${customerPhone}`,
                `*Endereço:* ${street}, nº ${houseNumber}`,
                `*Bairro:* ${neighborhood}`,
                `*Ponto de Ref.:* ${referencePoint || 'Não informado'}`,
                `*Pagamento:* ${paymentText}`,
                `----------------------------------`,
                ``,
                `*ÍTENS DO PEDIDO:*`,
                itemsList,
                ``,
                `----------------------------------`,
                `*TOTAL: ${formatPrice(subtotal)}*`,
                `----------------------------------`,
                ``,
                `_Pedido enviado via Gorilão App_`,
                `_Aguarde a confirmação da nossa equipe._`
            ].join('\n');

            const whatsappUrl = `https://wa.me/5516990508328?text=${encodeURIComponent(message)}`;

            setOrderPlaced(true);
            setTimeout(() => {
                clearCart();
                window.location.href = whatsappUrl;
            }, 1500); // Give 1.5s for the user to see the success message
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Erro ao processar pedido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="size-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-green-500/20 animate-bounce">
                    <Icon name="check" className="text-5xl" />
                </div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Pedido Confirmado!</h2>
                <p className="text-gray-400 mb-8 max-w-[280px]">Estamos te levando para o WhatsApp para finalizar os detalhes.</p>
                <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 bg-background-dark pb-24">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Finalização</h1>
                <p className="text-gray-400 text-sm">Quase lá! Escolha como prefere pagar e receber seu lanche.</p>
            </div>

            <main className="flex flex-col gap-6">
                {/* Delivery Section */}
                <section className="bg-surface-dark rounded-[32px] border border-border-dark p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Icon name="location_on" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Informações de Entrega</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Seu Nome</span>
                            <div className="relative">
                                <Icon name="person" className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Ex: João Silva"
                                    className="w-full bg-background-dark border border-border-dark rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary font-bold text-white"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">WhatsApp</span>
                            <div className="relative">
                                <Icon name="phone" className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="Ex: (16) 99999-9999"
                                    className="w-full bg-background-dark border border-border-dark rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary font-bold text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2 flex flex-col gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Rua</span>
                                <input
                                    type="text"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    placeholder="Nome da rua"
                                    className="w-full bg-background-dark border border-border-dark rounded-2xl py-4 px-4 outline-none focus:border-primary font-bold text-white"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Nº</span>
                                <input
                                    type="text"
                                    value={houseNumber}
                                    onChange={(e) => setHouseNumber(e.target.value)}
                                    placeholder="123"
                                    className="w-full bg-background-dark border border-border-dark rounded-2xl py-4 px-4 outline-none focus:border-primary font-bold text-white text-center"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Bairro</span>
                            <input
                                type="text"
                                value={neighborhood}
                                onChange={(e) => setNeighborhood(e.target.value)}
                                placeholder="Seu bairro"
                                className="w-full bg-background-dark border border-border-dark rounded-2xl py-4 px-4 outline-none focus:border-primary font-bold text-white"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Ponto de Referência</span>
                            <input
                                type="text"
                                value={referencePoint}
                                onChange={(e) => setReferencePoint(e.target.value)}
                                placeholder="Ex: Perto do mercado"
                                className="w-full bg-background-dark border border-border-dark rounded-2xl py-4 px-4 outline-none focus:border-primary font-bold text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Payment Section */}
                <section className="bg-surface-dark rounded-[32px] border border-border-dark p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Icon name="payments" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Pagamento</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {[
                            { id: 'pix', name: 'PIX', icon: 'qr_code_2' },
                            { id: 'card', name: 'Cartão', icon: 'credit_card' },
                            { id: 'cash', name: 'Dinheiro', icon: 'payments' }
                        ].map(method => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[20px] border-2 transition-all ${paymentMethod === method.id ? 'border-primary bg-primary/10 text-white shadow-lg shadow-primary/10' : 'border-border-dark bg-background-dark/50 text-gray-500'}`}
                            >
                                <Icon name={method.icon} className="text-xl" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{method.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Payment Sub-options */}
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {paymentMethod === 'pix' && (
                            <div className="bg-background-dark/50 border border-border-dark rounded-3xl p-6 flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-primary">
                                    <Icon name="info" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Pagamento via PIX</span>
                                </div>
                                <div className="bg-surface-dark rounded-2xl border border-border-dark p-4">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-1">Copia e Cola / Chave</span>
                                    <p className="font-bold text-white text-sm select-all">16991122177</p>
                                </div>
                                <p className="text-[10px] font-medium text-gray-400 leading-relaxed">
                                    <span className="text-yellow-500">⚠️ Importante:</span> Após o pagamento, você será redirecionado ao WhatsApp. Por favor, <span className="text-white font-bold uppercase underline">envie o comprovante</span> para iniciarmos seu pedido.
                                </p>
                            </div>
                        )}

                        {paymentMethod === 'card' && (
                            <div className="bg-background-dark/50 border border-border-dark rounded-3xl p-6 flex flex-col gap-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Selecione o tipo de cartão</span>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { id: 'credit', name: 'Crédito' },
                                        { id: 'debit', name: 'Débito' },
                                        { id: 'voucher', name: 'Alimentação' }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setCardType(type.id)}
                                            className={`py-4 px-6 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${cardType === type.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-surface-dark border-border-dark text-gray-400 hover:border-gray-600'}`}
                                        >
                                            {type.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'cash' && (
                            <div className="bg-background-dark/50 border border-border-dark rounded-3xl p-6 flex flex-col gap-4">
                                <button
                                    onClick={() => setNeedsChange(!needsChange)}
                                    className="flex items-center justify-between w-full"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`size-5 rounded-md border-2 flex items-center justify-center transition-all ${needsChange ? 'bg-primary border-primary' : 'border-border-dark'}`}>
                                            {needsChange && <Icon name="check" className="text-[10px] text-white" />}
                                        </div>
                                        <span className="text-sm font-bold">Precisa de troco?</span>
                                    </div>
                                    <Icon name="payments" className="text-gray-500" />
                                </button>

                                {needsChange && (
                                    <div className="flex flex-col gap-2 mt-2 animate-in slide-in-from-top-4 duration-300">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Troco para quanto?</span>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">R$</span>
                                            <input
                                                type="number"
                                                className="w-full bg-surface-dark border border-border-dark rounded-2xl py-4 pl-12 pr-4 focus:border-primary outline-none font-black text-lg"
                                                placeholder="Ex: 50"
                                                value={changeFor}
                                                onChange={e => setChangeFor(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Subtotal Section */}
                <section className="bg-surface-dark rounded-[40px] border border-border-dark p-8 shadow-2xl">
                    <div className="flex flex-col gap-4 mb-8">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-white font-bold">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-gray-500">Entrega</span>
                            <span className="text-green-500 font-black uppercase tracking-widest text-[10px]">Grátis</span>
                        </div>
                        <div className="h-px bg-border-dark/50 my-2"></div>
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 pb-1">Total Final</span>
                            <span className="text-4xl font-black text-white tracking-tighter">{formatPrice(subtotal)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className="w-full py-6 bg-primary text-white rounded-[24px] font-black text-xl shadow-2xl shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="size-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>Finalizar Agora 🦍 <Icon name="shopping_cart_checkout" /></>
                        )}
                    </button>
                    <p className="text-center text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mt-6 mt-6">
                        Você será levado ao WhatsApp Oficial
                    </p>
                </section>
            </main>

        </div>
    );
};

export default CheckoutPage;
