
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabaseClient';

const CheckoutPage: React.FC = () => {
    const { user } = useAuth();
    const { cartItems, subtotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState('');
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [tempAddress, setTempAddress] = useState('');
    const [addressSaving, setAddressSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('profiles')
                .select('address')
                .eq('id', user.id)
                .single();

            if (data?.address) {
                setAddress(data.address);
                setTempAddress(data.address);
            }
        };
        fetchProfile();
    }, [user]);

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setAddressSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: user.id, address: tempAddress, email: user.email });
            if (error) throw error;
            setAddress(tempAddress);
            setIsAddressModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar endereço.');
        } finally {
            setAddressSaving(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const handlePlaceOrder = async () => {
        if (!user) return;
        if (!address || address === 'Defina seu endereço no perfil') {
            alert('Por favor, defina um endereço de entrega.');
            return;
        }
        setLoading(true);

        try {
            const { data, error } = await supabase.from('orders').insert({
                user_id: user.id,
                status: 'pending',
                total_amount: subtotal,
                delivery_address: address,
                items: cartItems
            }).select();

            if (error) throw error;

            // Format WhatsApp Message
            const orderId = data?.[0]?.id.slice(0, 8).toUpperCase() || 'NOVO';
            const userName = user.email?.split('@')[0] || 'Cliente';

            let message = `*🍔 NOVO PEDIDO - GORILÃO LANCHES*\n\n`;
            message += `*Pedido:* #${orderId}\n`;
            message += `*Cliente:* ${userName} (${user.email})\n`;
            message += `*Endereço:* ${address}\n`;
            message += `*Pagamento:* ${paymentMethod.toUpperCase()}\n\n`;
            message += `*ITENS:*\n`;

            cartItems.forEach(item => {
                message += `• ${item.quantity}x ${item.name} (${formatPrice(item.price)})\n`;
                if (item.extras && item.extras.length > 0) {
                    message += `  _Adicionais: ${item.extras.map(e => e.name).join(', ')}_\n`;
                }
            });

            message += `\n*TOTAL: ${formatPrice(subtotal)}*`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/5516991122177?text=${encodedMessage}`;

            // Save order to store and clear cart
            clearCart();

            // Open WhatsApp and redirect
            window.open(whatsappUrl, '_blank');
            alert('🔥 Pedido realizado! Você será redirecionado para o WhatsApp para confirmar.');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Erro ao processar pedido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="bg-background-dark min-h-screen flex flex-col items-center justify-center text-white">
                <Icon name="shopping_basket" className="text-6xl text-gray-600 mb-6" />
                <h2 className="text-2xl font-bold mb-4">Seu carrinho está vazio para checkout</h2>
                <Link to="/menu" className="bg-primary px-8 py-3 rounded-xl font-bold">Voltar ao Cardápio</Link>
            </div>
        );
    }

    return (
        <div className="bg-background-dark font-display text-white min-h-screen selection:bg-primary">
            <header className="sticky top-0 z-50 border-b border-border-dark bg-background-dark/95 backdrop-blur-md px-4 py-3 md:px-10">
                <div className="max-w-[1280px] mx-auto flex items-center justify-between">
                    <Link to="/home" className="flex items-center gap-3 text-primary">
                        <div className="size-10 flex items-center justify-center bg-primary rounded-lg text-white">
                            <Icon name="lunch_dining" className="text-2xl" />
                        </div>
                        <h2 className="text-white text-xl font-black leading-tight tracking-[-0.015em]">Gorilão</h2>
                    </Link>
                    <div className="flex gap-6">
                        <Link to="/profile" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                            <Icon name="person" /> Perfil
                        </Link>
                        <Link to="/cart" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                            <Icon name="arrow_back" /> Voltar ao Carrinho
                        </Link>
                    </div>
                </div>
            </header>

            <main className="px-4 py-8 md:py-12">
                <div className="mx-auto max-w-[1280px]">
                    <div className="mb-10">
                        <h1 className="text-3xl font-black italic md:text-5xl">Finalização</h1>
                        <p className="mt-2 text-gray-400 text-lg">Quase lá! Escolha como prefere pagar e receber seu lanche.</p>
                    </div>

                    <div className="flex flex-col gap-10 lg:flex-row">
                        <div className="flex flex-1 flex-col gap-8">
                            <section className="rounded-3xl p-8 bg-surface-dark border border-border-dark">
                                <div className="mb-8 flex items-center gap-4">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/20">
                                        <Icon name="location_on" className="text-2xl" />
                                    </span>
                                    <h2 className="text-2xl font-black italic">1. Onde Entregamos?</h2>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {address ? (
                                        <div className={`group relative flex items-start gap-5 rounded-2xl border p-5 transition-all border-primary bg-primary/5`}>
                                            <div className="mt-1">
                                                <div className="size-6 bg-primary rounded-full flex items-center justify-center">
                                                    <div className="size-2 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="flex grow flex-col">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-lg font-black">Minha Casa</p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setIsAddressModalOpen(true)}
                                                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                            title="Editar endereço"
                                                        >
                                                            <Icon name="edit" className="text-sm" />
                                                        </button>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-white px-2 py-0.5 rounded">Principal</span>
                                                    </div>
                                                </div>
                                                <p className="text-gray-400">{address}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 border-2 border-dashed border-border-dark rounded-3xl text-center flex flex-col items-center gap-4">
                                            <div className="size-16 bg-surface-dark border border-border-dark rounded-2xl flex items-center justify-center text-gray-600">
                                                <Icon name="location_off" className="text-3xl" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-400">Nenhum endereço definido</p>
                                                <p className="text-xs text-gray-600 mt-1 uppercase tracking-widest font-black">Precisamos saber onde entregar!</p>
                                            </div>
                                        </div>
                                    )}

                                    {!address && (
                                        <button
                                            onClick={() => setIsAddressModalOpen(true)}
                                            className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border-dark rounded-2xl text-gray-500 hover:text-primary hover:border-primary transition-all font-bold"
                                        >
                                            <Icon name="add" /> Adicionar novo endereço
                                        </button>
                                    )}
                                </div>
                            </section>

                            {/* Address Modal */}
                            {isAddressModalOpen && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddressModalOpen(false)}></div>
                                    <div className="relative bg-surface-dark w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                                        <header className="p-6 border-b border-border-dark flex justify-between items-center">
                                            <h3 className="text-xl font-black italic uppercase tracking-tighter">
                                                {address ? 'Editar Endereço' : 'Novo Endereço'}
                                            </h3>
                                            <button onClick={() => setIsAddressModalOpen(false)}><Icon name="close" /></button>
                                        </header>
                                        <form onSubmit={handleSaveAddress} className="p-6 flex flex-col gap-6">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-sm font-bold text-gray-400">Endereço Completo</span>
                                                <div className="relative">
                                                    <Icon name="location_on" className="absolute left-4 top-6 -translate-y-1/2 text-gray-600" />
                                                    <textarea
                                                        required
                                                        className="w-full bg-background-dark border border-border-dark rounded-2xl py-4 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[120px] resize-none font-medium"
                                                        placeholder="Ex: Rua das Selvas, 123 - Bairro Gorila"
                                                        value={tempAddress}
                                                        onChange={e => setTempAddress(e.target.value)}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1 mt-1">Lembre-se de incluir pontos de referência se necessário!</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddressModalOpen(false)}
                                                    className="flex-1 py-4 bg-border-dark rounded-2xl font-black text-gray-400"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={addressSaving}
                                                    className="flex-2 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {addressSaving ? 'Salvando...' : 'Salvar Endereço'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <section className="rounded-3xl p-8 bg-surface-dark border border-border-dark">
                                <div className="mb-8 flex items-center gap-4">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/20">
                                        <Icon name="payments" className="text-2xl" />
                                    </span>
                                    <h2 className="text-2xl font-black italic">2. Como vai pagar?</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'pix', name: 'PIX', icon: 'account_balance_wallet' },
                                        { id: 'card', name: 'Cartão', icon: 'credit_card' },
                                        { id: 'cash', name: 'Dinheiro', icon: 'payments' }
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id)}
                                            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${paymentMethod === method.id ? 'border-primary bg-primary/5 text-white' : 'border-border-dark bg-background-dark/50 text-gray-500 hover:border-gray-700'}`}
                                        >
                                            <Icon name={method.icon} className="text-3xl" />
                                            <span className="font-bold">{method.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="w-full lg:w-[420px]">
                            <div className="sticky top-24 flex flex-col gap-6">
                                <div className="overflow-hidden rounded-3xl bg-surface-dark border border-border-dark shadow-2xl">
                                    <div className="bg-white/5 px-8 py-6 border-b border-border-dark">
                                        <h3 className="text-xl font-black italic text-white flex items-center gap-2">
                                            <Icon name="receipt_long" /> Resumo Final
                                        </h3>
                                    </div>
                                    <div className="p-8 flex flex-col gap-6">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between text-gray-400"><span>Itens ({cartItems.length})</span><span className="font-bold text-white">{formatPrice(subtotal)}</span></div>
                                            <div className="flex justify-between text-gray-400"><span>Entrega</span><span className="font-bold text-green-500">GRÁTIS</span></div>
                                        </div>
                                        <div className="border-t border-border-dark pt-6 flex items-end justify-between">
                                            <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">Total Geral</span>
                                            <span className="text-4xl font-black text-white">{formatPrice(subtotal)}</span>
                                        </div>
                                        <button
                                            onClick={handlePlaceOrder}
                                            disabled={loading}
                                            className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-xl font-black text-white shadow-[0_10px_30px_rgba(212,17,33,0.3)] transition-all hover:bg-red-700 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale"
                                        >
                                            {loading ? 'Processando...' : 'Confirmar Pedido'}
                                            {!loading && <Icon name="bolt" className="text-2xl" />}
                                        </button>
                                        <p className="text-[10px] text-center text-gray-500 uppercase tracking-tighter">
                                            Ao confirmar, você aceita nossos termos de uso
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CheckoutPage;
