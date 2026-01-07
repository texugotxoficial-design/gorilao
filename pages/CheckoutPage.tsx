
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const CheckoutPage: React.FC = () => {
    const { cartItems, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [subtotal, setSubtotal] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [address, setAddress] = useState('');
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [tempAddress, setTempAddress] = useState('');
    const [addressSaving, setAddressSaving] = useState(false);

    // Payment Sub-options
    const [needsChange, setNeedsChange] = useState(false);
    const [changeFor, setChangeFor] = useState('');
    const [cardType, setCardType] = useState('credit'); // credit, debit, voucher

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate('/menu');
            return;
        }
        const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        setSubtotal(total);

        const fetchAddress = async () => {
            if (!user) return;
            const { data } = await supabase.from('profiles').select('address').eq('id', user.id).single();
            if (data?.address) {
                setAddress(data.address);
                setTempAddress(data.address);
            }
        };
        fetchAddress();
    }, [cartItems, navigate, user]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setAddressSaving(true);
        try {
            await supabase.from('profiles').upsert({ id: user.id, address: tempAddress });
            setAddress(tempAddress);
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
                    id: orderId
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Create order items
            const orderItems = cartItems.map(item => ({
                order_id: orderId,
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            // Payment text for WhatsApp
            let paymentText = paymentMethod.toUpperCase();
            if (paymentMethod === 'cash' && needsChange) {
                paymentText += ` (Troco para ${formatPrice(Number(changeFor))})`;
            } else if (paymentMethod === 'card') {
                const cardLabels: any = { credit: 'Crédito', debit: 'Débito', voucher: 'Alimentação' };
                paymentText += ` (${cardLabels[cardType]})`;
            } else if (paymentMethod === 'pix') {
                paymentText += ` (Aguardando comprovante)`;
            }

            // Generate WhatsApp Message
            const message = `*🦍 NOVO PEDIDO - GORILÃO LANCHES*%0A%0A` +
                `*Pedido:* #${orderId}%0A` +
                `*Cliente:* ${user?.email}%0A` +
                `*Endereço:* ${address}%0A` +
                `*Pagamento:* ${paymentText}%0A%0A` +
                `*ÍTENS:*%0A` +
                cartItems.map(item => `- ${item.quantity}x ${item.name} (${formatPrice(item.price)})`).join('%0A') +
                `%0A%0A*TOTAL: ${formatPrice(subtotal)}*`;

            const whatsappUrl = `https://wa.me/5516991122177?text=${message}`;

            clearCart();
            window.location.href = whatsappUrl;
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
                <div className="flex flex-col gap-6">
                    <section className="rounded-[32px] p-6 bg-surface-dark border border-border-dark shadow-xl">
                        <div className="mb-6 flex items-center gap-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/20">
                                <Icon name="location_on" className="text-xl" />
                            </span>
                            <h2 className="text-xl font-black italic uppercase tracking-tighter">1. Onde Entregamos?</h2>
                        </div>

                        <div className="flex flex-col gap-4">
                            {address ? (
                                <div className="group relative flex items-start gap-4 rounded-2xl border p-5 transition-all border-primary bg-primary/5">
                                    <div className="flex grow flex-col">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-black uppercase tracking-widest text-primary">Minha Casa</p>
                                            <button
                                                onClick={() => setIsAddressModalOpen(true)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            >
                                                <Icon name="edit" className="text-sm" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed">{address}</p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddressModalOpen(true)}
                                    className="p-8 border-2 border-dashed border-border-dark rounded-[24px] text-center flex flex-col items-center gap-3 hover:border-primary transition-colors"
                                >
                                    <Icon name="location_off" className="text-3xl text-gray-600" />
                                    <p className="font-bold text-gray-500">Toque para definir endereço</p>
                                </button>
                            )}
                        </div>
                    </section>

                    <section className="rounded-[32px] p-6 bg-surface-dark border border-border-dark shadow-xl">
                        <div className="mb-6 flex items-center gap-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/20">
                                <Icon name="payments" className="text-xl" />
                            </span>
                            <h2 className="text-xl font-black italic uppercase tracking-tighter">2. Forma de Pagamento</h2>
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
                                <div className="bg-background-dark/50 border border-border-dark rounded-2xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-3 text-primary">
                                        <Icon name="info" />
                                        <span className="text-xs font-black uppercase tracking-wider">Pagamento via PIX</span>
                                    </div>
                                    <div className="p-3 bg-surface-dark rounded-xl border border-border-dark select-all">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Copia e Cola / Chave</p>
                                        <p className="text-sm font-mono font-bold text-white">16991122177</p>
                                    </div>
                                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                        ⚠️ <span className="text-primary font-bold">Importante:</span> Após o pagamento, você será redirecionado ao WhatsApp. Por favor, <span className="text-white font-bold">envie o comprovante</span> para iniciarmos seu pedido.
                                    </p>
                                </div>
                            )}

                            {paymentMethod === 'card' && (
                                <div className="flex flex-col gap-3">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Selecione o tipo de cartão</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'credit', name: 'Crédito' },
                                            { id: 'debit', name: 'Débito' },
                                            { id: 'voucher', name: 'Alimentação' }
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                onClick={() => setCardType(type.id)}
                                                className={`py-3 px-1 rounded-xl border-2 text-[10px] font-black uppercase tracking-tighter transition-all ${cardType === type.id ? 'border-primary bg-primary text-white' : 'border-border-dark bg-background-dark/50 text-gray-400'}`}
                                            >
                                                {type.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'cash' && (
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => setNeedsChange(!needsChange)}
                                        className="flex items-center justify-between p-4 bg-background-dark/50 border border-border-dark rounded-2xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`size-5 rounded-md border-2 flex items-center justify-center transition-all ${needsChange ? 'bg-primary border-primary' : 'border-gray-600'}`}>
                                                {needsChange && <Icon name="check" className="text-[14px] text-white" />}
                                            </div>
                                            <span className="text-sm font-bold">Precisa de troco?</span>
                                        </div>
                                        <Icon name="payments" className={needsChange ? 'text-primary' : 'text-gray-600'} />
                                    </button>

                                    {needsChange && (
                                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-1">Troco para quanto?</p>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">R$</span>
                                                <input
                                                    type="number"
                                                    value={changeFor}
                                                    onChange={e => setChangeFor(e.target.value)}
                                                    className="w-full bg-background-dark border border-border-dark rounded-xl py-4 pl-12 pr-4 text-white font-black outline-none focus:border-primary transition-all"
                                                    placeholder="Ex: 50"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="rounded-[32px] bg-surface-dark border border-border-dark p-6 flex flex-col gap-6 shadow-2xl">
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between text-sm"><span className="text-gray-500 font-bold uppercase tracking-widest">Subtotal</span><span className="font-bold">{formatPrice(subtotal)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500 font-bold uppercase tracking-widest">Entrega</span><span className="font-bold text-green-500 uppercase tracking-widest">Grátis</span></div>
                            <div className="mt-2 pt-5 border-t border-border-dark flex justify-between items-end">
                                <span className="font-black text-xs uppercase tracking-[0.2em] text-gray-500">Total Final</span>
                                <span className="text-3xl font-black text-white">{formatPrice(subtotal)}</span>
                            </div>
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 rounded-[20px] bg-primary py-5 text-lg font-black text-white shadow-2xl shadow-primary/30 transition-all active:scale-95 disabled:grayscale"
                        >
                            {loading ? (
                                <div className="size-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>Finalizar Pedido <Icon name="shopping_cart_checkout" /></>
                            )}
                        </button>
                        <p className="text-[10px] text-gray-500 text-center font-bold uppercase tracking-widest">Você será levado ao WhatsApp oficial</p>
                    </div>
                </div>
            </main>

            {isAddressModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAddressModalOpen(false)}></div>
                    <div className="relative bg-surface-dark w-full rounded-t-[40px] border-t border-border-dark p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
                        <div className="w-12 h-1.5 bg-border-dark rounded-full mx-auto mb-8"></div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">
                            Onde vamos entregar?
                        </h3>
                        <form onSubmit={handleSaveAddress} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <div className="relative group">
                                    <Icon name="location_on" className="absolute left-5 top-6 -translate-y-1/2 text-gray-500" />
                                    <textarea
                                        required
                                        autoFocus
                                        className="w-full bg-background-dark border border-border-dark rounded-[24px] py-4 pl-12 pr-4 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all min-h-[120px] resize-none text-sm font-medium"
                                        placeholder="Rua, número, bairro, complemento..."
                                        value={tempAddress}
                                        onChange={e => setTempAddress(e.target.value)}
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
