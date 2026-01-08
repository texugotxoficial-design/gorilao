
import React, { useEffect, useState } from 'react'; // v1.1.0-payment-fix
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
};

console.log('GORILAO_APP_V: 1.1.5-final-fix');

const CheckoutPage: React.FC = () => {
    const { cartItems, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [subtotal, setSubtotal] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [address, setAddress] = useState('');
    const [referencePoint, setReferencePoint] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [tempAddress, setTempAddress] = useState('');
    const [tempReferencePoint, setTempReferencePoint] = useState('');
    const [tempName, setTempName] = useState('');
    const [tempPhone, setTempPhone] = useState('');
    const [addressSaving, setAddressSaving] = useState(false);
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
            if (!user) return;
            const { data } = await supabase
                .from('profiles')
                .select('address, reference_point, full_name, phone')
                .eq('id', user.id)
                .single();

            if (data) {
                if (data.address) {
                    setAddress(data.address);
                    setTempAddress(data.address);
                }
                if (data.reference_point) {
                    setReferencePoint(data.reference_point);
                    setTempReferencePoint(data.reference_point);
                }
                if (data.full_name) {
                    setCustomerName(data.full_name);
                    setTempName(data.full_name);
                }
                if (data.phone) {
                    setCustomerPhone(data.phone);
                    setTempPhone(data.phone);
                }
            }
        };
        fetchProfile();
    }, [cartItems, navigate, user]);

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setAddressSaving(true);
        try {
            await supabase.from('profiles').upsert({
                id: user.id,
                address: tempAddress,
                reference_point: tempReferencePoint,
                full_name: tempName,
                phone: tempPhone
            });
            setAddress(tempAddress);
            setReferencePoint(tempReferencePoint);
            setCustomerName(tempName);
            setCustomerPhone(tempPhone);
            setIsAddressModalOpen(false);
        } finally {
            setAddressSaving(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!address) {
            setIsAddressModalOpen(true);
            return;
        }

        if (paymentMethod === 'cash' && needsChange && !changeFor) {
            alert('Por favor, informe o valor para o troco.');
            return;
        }

        setLoading(true);
        try {
            const orderId = Math.random().toString(36).substring(7).toUpperCase();

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
                    delivery_address: address,
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

            // Fetch latest profile info to ensure accuracy
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, phone')
                .eq('id', user?.id)
                .single();

            const customerDisplayName = profile?.full_name || customerName || user?.email || 'Cliente';
            const customerDisplayPhone = profile?.phone || customerPhone || 'Não informado';

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
                const extrasTotal = (item.extras || []).reduce((sum: number, e: any) => sum + Number(e.price), 0);
                const basePrice = item.price - extrasTotal;
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
                `*Pedido:* #${orderId}`,
                `*Cliente:* ${customerDisplayName}`,
                `*WhatsApp:* ${customerDisplayPhone}`,
                `*Endereço:* ${address}`,
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

            // Using wa.me with proper encoding and avoiding characters that might cause issues
            const whatsappUrl = `https://wa.me/5516991122177?text=${encodeURIComponent(message)}`;
            console.log('WHATSAPP_URL:', whatsappUrl);

            setOrderPlaced(true);
            setTimeout(() => {
                clearCart();
                window.location.href = whatsappUrl;
            }, 100);
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Erro ao processar pedido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 bg-background-dark pb-24">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Finalização</h1>
                <p className="text-gray-400 text-sm">Quase lá! Escolha como prefere pagar e receber seu lanche.</p>
            </div>

            <main className="flex flex-col gap-6">
                {/* Delivery Section */}
                <section className="bg-surface-dark rounded-[32px] border border-border-dark p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <Icon name="location_on" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Entrega</h2>
                        </div>
                        <button
                            onClick={() => setIsAddressModalOpen(true)}
                            className="text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-all"
                        >
                            Alterar
                        </button>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Icon name="person" className="text-gray-500 text-xs" />
                            <p className="text-white font-bold text-sm leading-relaxed">
                                {customerName || 'Identifique-se'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="location_on" className="text-gray-500 text-xs" />
                            <p className="text-gray-300 text-xs leading-relaxed">
                                {address || 'Nenhum endereço cadastrado'}
                            </p>
                        </div>
                        {referencePoint && (
                            <p className="text-gray-400 text-[10px] italic ml-6 mb-2">
                                Ref: {referencePoint}
                            </p>
                        )}
                        <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase tracking-widest">
                            <Icon name="check_circle" className="text-xs" /> Frete Grátis na Selva
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

            {/* Address Modal */}
            {isAddressModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAddressModalOpen(false)}></div>
                    <div className="relative bg-surface-dark w-full rounded-t-[40px] border-t border-border-dark p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
                        <div className="w-12 h-1.5 bg-border-dark rounded-full mx-auto mb-8"></div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">
                            Onde vamos entregar?
                        </h3>
                        <form onSubmit={handleSaveAddress} className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Seu Nome</span>
                                    <div className="relative group">
                                        <Icon name="person" className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-background-dark border border-border-dark rounded-[24px] py-4 pl-12 pr-4 focus:border-primary outline-none transition-all text-sm font-medium"
                                            placeholder="Ex: João Silva"
                                            value={tempName}
                                            onChange={e => setTempName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">WhatsApp</span>
                                    <div className="relative group">
                                        <Icon name="phone" className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="tel"
                                            required
                                            className="w-full bg-background-dark border border-border-dark rounded-[24px] py-4 pl-12 pr-4 focus:border-primary outline-none transition-all text-sm font-medium"
                                            placeholder="Ex: (16) 99911-2217"
                                            value={tempPhone}
                                            onChange={e => setTempPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Endereço de Entrega</span>
                                <div className="relative group">
                                    <Icon name="location_on" className="absolute left-5 top-6 -translate-y-1/2 text-gray-500" />
                                    <textarea
                                        required
                                        className="w-full bg-background-dark border border-border-dark rounded-[24px] py-4 pl-12 pr-4 focus:border-primary outline-none transition-all min-h-[100px] resize-none text-sm font-medium"
                                        placeholder="Rua, número, bairro..."
                                        value={tempAddress}
                                        onChange={e => setTempAddress(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Ponto de Referência (Opcional)</span>
                                <div className="relative group">
                                    <Icon name="explore" className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        className="w-full bg-background-dark border border-border-dark rounded-[24px] py-4 pl-12 pr-4 focus:border-primary outline-none transition-all text-sm font-medium"
                                        placeholder="Ex: Próximo ao mercado..."
                                        value={tempReferencePoint}
                                        onChange={e => setTempReferencePoint(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={addressSaving}
                                className="w-full py-5 bg-primary text-white rounded-[20px] font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                {addressSaving ? (
                                    <div className="size-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>Salvar Endereço <Icon name="check" /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPage;
