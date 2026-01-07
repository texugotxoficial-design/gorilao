
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
        <div className="flex flex-col gap-6 p-4 bg-background-dark pb-24">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase">Meu Carrinho</h1>
                <p className="text-gray-400 text-sm">Revise seus itens antes de finalizar o pedido!</p>
            </div>

            {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-dark/30 rounded-[32px] border border-dashed border-border-dark">
                    <div className="size-20 bg-surface-dark rounded-full flex items-center justify-center text-gray-600 mb-6">
                        <Icon name="shopping_basket" className="text-4xl" />
                    </div>
                    <h2 className="text-xl font-bold mb-2 tracking-tight">O carrinho está vazio</h2>
                    <p className="text-gray-400 text-sm mb-8 max-w-[200px]">Sua selva interna está roncando de fome!</p>
                    <Link to="/menu" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-black text-white shadow-xl shadow-primary/20 transition-all active:scale-95">
                        Ir para o Cardápio <Icon name="arrow_forward" />
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        {cartItems.map(item => (
                            <div key={item.id} className="bg-surface-dark rounded-[24px] border border-border-dark p-4 flex gap-4 transition-all">
                                <div className="size-20 bg-cover bg-center rounded-2xl border border-border-dark shrink-0" style={{ backgroundImage: `url("${item.image_url}")` }}></div>
                                <div className="flex-grow flex flex-col justify-between overflow-hidden">
                                    <div>
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h4 className="font-bold text-sm truncate">{item.name}</h4>
                                            <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                                                <Icon name="delete" className="text-lg" />
                                            </button>
                                        </div>
                                        {item.extras && item.extras.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {item.extras.map((ex, i) => (
                                                    <span key={i} className="text-[8px] font-black uppercase tracking-tighter bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/10">
                                                        + {ex.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-primary font-black text-base">{formatPrice(item.price)}</span>
                                        <div className="flex items-center bg-background-dark/50 rounded-xl p-0.5 border border-border-dark">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="size-8 flex items-center justify-center text-gray-400"><Icon name="remove" className="text-sm" /></button>
                                            <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="size-8 flex items-center justify-center text-gray-400"><Icon name="add" className="text-sm" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-surface-dark rounded-[32px] border border-border-dark p-6 flex flex-col gap-4 shadow-xl">
                        <h3 className="text-lg font-black italic uppercase tracking-widest text-gray-400">Resumo</h3>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-bold">{formatPrice(subtotal)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Entrega</span><span className="font-bold text-green-500">GRÁTIS</span></div>
                            <div className="mt-2 pt-4 border-t border-border-dark flex justify-between items-end">
                                <span className="font-black text-sm uppercase tracking-widest text-gray-400">Total Final</span>
                                <span className="text-3xl font-black text-white">{formatPrice(subtotal)}</span>
                            </div>
                        </div>
                        <Link to="/checkout" className="mt-2 w-full flex items-center justify-center gap-3 rounded-[20px] bg-primary py-5 text-lg font-black text-white shadow-2xl shadow-primary/30 transition-all active:scale-95">
                            Finalizar Pedido <Icon name="check_circle" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
