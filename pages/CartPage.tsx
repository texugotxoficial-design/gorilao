
import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useCart } from '../contexts/CartContext';

const CartPage: React.FC = () => {
    const { cartItems, updateQuantity, removeFromCart, subtotal, total } = useCart();
    const deliveryFee = 5.00;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    return (
        <div className="bg-background-dark font-display text-white min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b border-border-dark bg-background-dark/95 backdrop-blur-md px-4 py-3 lg:px-10">
                <div className="mx-auto flex max-w-[1280px] items-center justify-between">
                    <Link to="/home" className="flex items-center gap-3 text-primary group">
                        <div className="size-10 flex items-center justify-center bg-primary rounded-lg text-white">
                            <Icon name="lunch_dining" className="text-2xl" />
                        </div>
                        <h2 className="text-white text-xl font-black leading-tight tracking-[-0.015em]">Gorilão</h2>
                    </Link>
                    <div className="flex gap-4">
                        <Link to="/menu" className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                            <Icon name="restaurant" /> Cardápio
                        </Link>
                        <Link to="/profile" className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                            <Icon name="person" /> Perfil
                        </Link>
                        <div className="flex bg-surface-dark rounded-lg p-1">
                            <button className="flex h-10 w-10 items-center justify-center rounded-lg text-white relative">
                                <Icon name="shopping_cart" className="text-[20px]" />
                                {cartItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                        {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow px-4 py-8 md:py-12">
                <div className="mx-auto flex max-w-[1280px] flex-col gap-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl italic">Seu Carrinho</h1>
                        <p className="text-gray-400 text-lg">Revise seus itens delicíosos antes de marcar o golaço!</p>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-dark/30 rounded-3xl border border-dashed border-border-dark">
                            <div className="size-24 bg-surface-dark rounded-full flex items-center justify-center text-gray-600 mb-6">
                                <Icon name="shopping_basket" className="text-5xl" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Seu carrinho está vazio</h2>
                            <p className="text-gray-400 mb-8 max-w-xs">Parece que você ainda não escolheu seu lanche monstro.</p>
                            <Link to="/menu" className="inline-flex items-center justify-center gap-3 rounded-xl bg-primary px-8 py-4 text-lg font-black text-white shadow-xl shadow-primary/20 hover:bg-red-700 transition-all hover:scale-105 active:scale-95">
                                Ver Cardápio <Icon name="arrow_forward" />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-10 lg:flex-row">
                            <div className="flex flex-1 flex-col gap-5">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-border-dark bg-surface-dark/50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between transition-all hover:border-primary/40 hover:bg-surface-dark">
                                        <div className="flex items-start gap-5">
                                            <div className="aspect-square size-24 shrink-0 rounded-2xl bg-cover bg-center border border-border-dark overflow-hidden" style={{ backgroundImage: `url("${item.image_url}")` }}></div>
                                            <div className="flex flex-col justify-center py-1">
                                                <p className="text-lg font-black leading-tight mb-1">{item.name}</p>
                                                <p className="text-primary text-xl font-black mb-2">{formatPrice(item.price)}</p>
                                                {item.extras && item.extras.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.extras.map((ex, i) => (
                                                            <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md">
                                                                + {ex.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-8">
                                            <div className="flex items-center rounded-xl bg-background-dark/80 p-1 border border-border-dark">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-primary hover:text-white transition-all"><Icon name="remove" /></button>
                                                <span className="w-10 text-center font-black text-lg">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-primary hover:text-white transition-all"><Icon name="add" /></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="flex h-12 w-12 items-center justify-center rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all" title="Remover item">
                                                <Icon name="delete" className="text-2xl" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div className="mt-4">
                                    <Link to="/menu" className="inline-flex items-center gap-2 text-base font-bold text-gray-400 hover:text-primary transition-colors">
                                        <Icon name="keyboard_backspace" /> Continuar Comprando
                                    </Link>
                                </div>
                            </div>

                            <div className="w-full lg:w-[420px]">
                                <div className="sticky top-28 flex flex-col gap-8 rounded-3xl border border-border-dark bg-surface-dark p-8 shadow-2xl">
                                    <h3 className="text-2xl font-black italic">Resumo</h3>
                                    <div className="flex flex-col gap-4 border-b border-border-dark pb-8">
                                        <div className="flex justify-between text-lg"><span className="text-gray-400">Subtotal</span><span className="font-bold">{formatPrice(subtotal)}</span></div>
                                        <div className="flex justify-between text-lg"><span className="text-gray-400">Taxa de Entrega</span><span className="font-bold text-green-500">GRÁTIS</span></div>
                                    </div>
                                    <div className="flex flex-col gap-8">
                                        <div className="flex items-end justify-between">
                                            <span className="text-lg font-bold text-gray-400 uppercase tracking-widest">Total</span>
                                            <span className="text-4xl font-black text-white">{formatPrice(subtotal)}</span>
                                        </div>
                                        <Link to="/checkout" className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-xl font-black text-white shadow-[0_10px_30px_rgba(212,17,33,0.3)] transition-all hover:bg-red-700 hover:scale-[1.02] active:scale-95">
                                            Finalizar Pedido <Icon name="shopping_bag" className="text-2xl" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CartPage;
