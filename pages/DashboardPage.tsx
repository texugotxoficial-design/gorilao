
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
        <div className="flex flex-col gap-6 p-4 bg-background-dark pb-24">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase">Meus Pedidos</h1>
                <p className="text-gray-400 text-sm">Acompanhe seus golaços no Gorilão! 🦍🔥</p>
            </div>

            <main className="flex-1">
                {loading ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-surface-dark rounded-2xl"></div>)}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-surface-dark/30 border-2 border-dashed border-border-dark rounded-[32px] p-12 text-center flex flex-col items-center">
                        <div className="size-20 bg-surface-dark rounded-full flex items-center justify-center text-gray-600 mb-6">
                            <Icon name="receipt" className="text-4xl" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Sem histórico ainda</h3>
                        <p className="text-gray-400 text-sm mb-8 max-w-[200px]">Você ainda não finalizou nenhum pedido. Que tal começar agora?</p>
                        <Link to="/menu" className="bg-primary text-white px-8 py-4 rounded-2xl text-base font-black flex items-center gap-2 hover:bg-red-700 shadow-xl shadow-primary/20 transition-all active:scale-95">
                            Ver Cardápio <Icon name="restaurant" />
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {orders.map(order => (
                            <div key={order.id} className="bg-surface-dark border border-border-dark p-5 rounded-[24px] flex flex-col gap-4 hover:border-primary/40 transition-all active:scale-[0.98] shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 bg-background-dark rounded-xl flex items-center justify-center border border-border-dark text-primary">
                                            <Icon name="lunch_dining" className="text-2xl" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[8px] font-black uppercase tracking-widest bg-border-dark px-1.5 py-0.5 rounded text-gray-400">ID #{order.id.slice(0, 8).toUpperCase()}</span>
                                                <span className="text-[10px] font-bold text-gray-500">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <p className="font-bold text-sm">{order.items.length} {order.items.length === 1 ? 'Item' : 'Itens'}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusLabel(order.status).color}`}>
                                        {getStatusLabel(order.status).text}
                                    </div>
                                </div>

                                <div className="border-t border-border-dark pt-4 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Total Pago</span>
                                        <span className="text-xl font-black text-primary leading-none">{formatPrice(order.total_amount)}</span>
                                    </div>
                                    <button className="size-10 bg-background-dark border border-border-dark rounded-xl flex items-center justify-center text-gray-400">
                                        <Icon name="chevron_right" className="text-xl" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;
