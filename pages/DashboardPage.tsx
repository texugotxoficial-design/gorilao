
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface Order {
    id: string;
    created_at: string;
    status: string;
    total_amount: number;
    items: any[];
}

const DashboardPage: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const navLinkClasses = "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-[#b99d9f] group transition-all";
    const activeNavLinkClasses = "bg-primary shadow-lg shadow-primary/20 text-white dark:text-white";

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setOrders(data);
            setLoading(false);
        };

        fetchOrders();
    }, [user]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, { text: string, color: string }> = {
            'pending': { text: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500' },
            'preparing': { text: 'Preparando', color: 'bg-blue-500/10 text-blue-500' },
            'delivering': { text: 'Em Entrega', color: 'bg-purple-500/10 text-purple-500' },
            'completed': { text: 'Entregue', color: 'bg-green-500/10 text-green-500' },
            'cancelled': { text: 'Cancelado', color: 'bg-red-500/10 text-red-500' }
        };
        return labels[status] || { text: status, color: 'bg-gray-500/10 text-gray-500' };
    };

    return (
        <div className="bg-background-dark font-display text-white antialiased selection:bg-primary">
            <div className="flex h-screen overflow-hidden">
                <aside className="w-72 flex-shrink-0 flex flex-col border-r border-border-dark bg-background-dark overflow-y-auto">
                    <div className="p-6 flex flex-col gap-6 h-full">
                        <div className="flex items-center gap-4 pb-6 border-b border-border-dark">
                            <div className="relative">
                                <div className="size-12 rounded-full bg-primary border-2 border-primary/50 flex items-center justify-center text-xl font-black">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-base font-bold leading-tight truncate max-w-[140px]">{user?.email?.split('@')[0]}</h1>
                                <p className="text-[#b99d9f] text-xs font-medium uppercase tracking-widest">Cliente Fiel</p>
                            </div>
                        </div>
                        <nav className="flex flex-col gap-2 flex-1">
                            <NavLink to="/dashboard" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : 'hover:bg-surface-dark'}`} end>
                                <Icon name="receipt_long" />
                                <span className="text-sm font-medium">Meus Pedidos</span>
                            </NavLink>
                            <NavLink to="/profile" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : 'hover:bg-surface-dark'}`}>
                                <Icon name="person" />
                                <span className="text-sm font-medium">Meu Perfil</span>
                            </NavLink>
                            <Link to="/menu" className={`${navLinkClasses} hover:bg-surface-dark`}>
                                <Icon name="restaurant" />
                                <span className="text-sm font-medium">Cardápio</span>
                            </Link>
                            <Link to="/contact" className={`${navLinkClasses} hover:bg-surface-dark`}>
                                <Icon name="call" />
                                <span className="text-sm font-medium">Contato</span>
                            </Link>
                            <Link to="/home" className={`${navLinkClasses} hover:bg-surface-dark`}>
                                <Icon name="home" />
                                <span className="text-sm font-medium">Sair da Conta</span>
                            </Link>
                        </nav>
                        <div className="pt-4 border-t border-border-dark">
                            <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all">
                                <Icon name="logout" />
                                <span className="text-sm font-medium">Sair do App</span>
                            </button>
                        </div>
                    </div>
                </aside>
                <main className="flex-1 overflow-y-auto bg-background-dark">
                    <div className="max-w-[1000px] mx-auto p-8 flex flex-col gap-10">
                        <header className="border-b border-border-dark pb-8">
                            <div className="flex flex-col gap-2 text-center md:text-left">
                                <h2 className="text-4xl font-black italic md:text-5xl uppercase tracking-tighter">Histórico de Pedidos</h2>
                                <p className="text-gray-400 text-lg font-medium">Acompanhe seus golaços no Gorilão! 🦍🔥</p>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 gap-8">
                            <section>
                                {loading ? (
                                    <div className="animate-pulse space-y-4">
                                        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-surface-dark rounded-2xl"></div>)}
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="bg-surface-dark/30 border-2 border-dashed border-border-dark rounded-3xl p-20 text-center flex flex-col items-center">
                                        <div className="size-24 bg-surface-dark rounded-full flex items-center justify-center text-gray-600 mb-6">
                                            <Icon name="receipt" className="text-5xl" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3">Sem histórico ainda</h3>
                                        <p className="text-gray-400 text-lg mb-8 max-w-xs">Você ainda não finalizou nenhum pedido. Que tal começar agora?</p>
                                        <Link to="/menu" className="bg-primary text-white px-10 py-4 rounded-2xl text-lg font-black flex items-center gap-3 hover:bg-red-700 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                            Ver Cardápio
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {orders.map(order => (
                                            <div key={order.id} className="bg-surface-dark/50 border border-border-dark p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 hover:border-primary/40 hover:bg-surface-dark transition-all group shadow-sm">
                                                <div className="flex items-center gap-6">
                                                    <div className="size-16 bg-background-dark rounded-2xl flex items-center justify-center border border-border-dark text-primary shadow-inner">
                                                        <Icon name="lunch_dining" className="text-3xl" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest bg-border-dark px-2 py-0.5 rounded text-gray-400">ID #{order.id.slice(0, 8).toUpperCase()}</span>
                                                            <span className="text-gray-600">•</span>
                                                            <span className="text-sm font-bold text-gray-400">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                                                        </div>
                                                        <p className="font-black text-xl mb-1">{order.items.length} {order.items.length === 1 ? 'Item' : 'Itens'} no Pedido</p>
                                                        <div className="flex flex-wrap gap-1 max-w-md">
                                                            {order.items.slice(0, 3).map((item, i) => (
                                                                <span key={i} className="text-[10px] font-bold text-gray-500 whitespace-nowrap">{item.name}{i < order.items.slice(0, 3).length - 1 ? ',' : ''}</span>
                                                            ))}
                                                            {order.items.length > 3 && <span className="text-[10px] font-bold text-gray-500">e mais {order.items.length - 3}...</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-border-dark pt-4 md:pt-0">
                                                    <div className="flex flex-col items-start md:items-end">
                                                        <p className="text-2xl font-black text-primary">{formatPrice(order.total_amount)}</p>
                                                    </div>
                                                    <button className="p-4 bg-background-dark border border-border-dark rounded-2xl hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95 group-hover:border-primary/50">
                                                        <Icon name="chevron_right" className="text-2xl" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardPage;
