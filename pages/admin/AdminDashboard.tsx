
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Icon from '../../components/Icon';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        products: 0,
        categories: 0,
        orders: 0,
        revenue: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();

        const channel = supabase
            .channel('admin-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchStats())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchStats())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchStats())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchStats = async () => {
        try {
            const [prodCount, catCount, orderData, recentData] = await Promise.all([
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('categories').select('*', { count: 'exact', head: true }),
                supabase.from('orders').select('total_amount'),
                supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5)
            ]);

            const totalRevenue = orderData.data?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;

            setStats({
                products: prodCount.count || 0,
                categories: catCount.count || 0,
                orders: orderData.data?.length || 0,
                revenue: totalRevenue
            });

            if (recentData.data) {
                setRecentOrders(recentData.data);
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const statCards = [
        { label: 'Produtos', value: stats.products, icon: 'lunch_dining', color: 'bg-blue-500/20 text-blue-500', link: '/admin/products' },
        { label: 'Categorias', value: stats.categories, icon: 'category', color: 'bg-purple-500/20 text-purple-500', link: '/admin/categories' },
        { label: 'Total Pedidos', value: stats.orders, icon: 'shopping_basket', color: 'bg-green-500/20 text-green-500', link: '/dashboard' },
        { label: 'Receita Total', value: formatPrice(stats.revenue), icon: 'payments', color: 'bg-yellow-500/20 text-yellow-500', link: '#' }
    ];

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10">
                <header>
                    <h2 className="text-3xl font-black italic">Visão Geral</h2>
                    <p className="text-gray-400">Bem-vindo à central de comando do Gorilão.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((card, i) => (
                        <Link
                            to={card.link}
                            key={i}
                            className="bg-surface-dark border border-border-dark p-6 rounded-3xl hover:border-primary/50 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`size-12 rounded-2xl flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}>
                                    <Icon name={card.icon} className="text-2xl" />
                                </div>
                                <Icon name="trending_up" className="text-green-500 text-sm" />
                            </div>
                            <p className="text-gray-500 font-bold text-sm uppercase tracking-wider">{card.label}</p>
                            <h3 className="text-3xl font-black mt-1">{loading ? '...' : card.value}</h3>
                        </Link>
                    ))}
                </div>

                {/* Real-time Order Feed */}
                <section className="bg-surface-dark border border-border-dark p-8 rounded-[40px] shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors">
                        <Icon name="rss_feed" className="text-9xl" />
                    </div>

                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="size-3 bg-red-500 rounded-full animate-ping"></div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Fluxo de Pedidos em Tempo Real</h3>
                        </div>
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Live Feed</span>
                    </div>

                    <div className="flex flex-col gap-4 relative z-10">
                        {recentOrders.length > 0 ? (
                            recentOrders.map((order, idx) => (
                                <div
                                    key={order.id}
                                    className={`flex items-center justify-between p-5 bg-background-dark/50 border border-border-dark rounded-2xl group/item hover:border-primary/30 transition-all animate-in slide-in-from-right-4 duration-500 delay-[${idx * 100}ms]`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform">
                                            <Icon name="shopping_bag" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm uppercase tracking-tight">Pedido #{order.order_number}</span>
                                            <span className="text-[10px] text-gray-500 font-bold">{new Date(order.created_at).toLocaleString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-black text-primary">{formatPrice(order.total_amount)}</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-green-500 px-2 py-0.5 bg-green-500/10 rounded-full">{order.status}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-gray-500 font-medium italic">
                                Aguardando o primeiro gorila fazer um pedido... 🦍
                            </div>
                        )}
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <section className="bg-surface-dark border border-border-dark p-8 rounded-3xl flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">Ações Rápidas</h3>
                            <Icon name="bolt" className="text-primary" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Link to="/admin/products" className="bg-background-dark p-4 rounded-2xl flex flex-col items-center gap-2 border border-border-dark hover:border-primary/50 transition-all">
                                <Icon name="add_circle" className="text-primary" />
                                <span className="text-sm font-bold">Novo Produto</span>
                            </Link>
                            <Link to="/admin/categories" className="bg-background-dark p-4 rounded-2xl flex flex-col items-center gap-2 border border-border-dark hover:border-primary/50 transition-all">
                                <Icon name="create_new_folder" className="text-primary" />
                                <span className="text-sm font-bold">Nova Categoria</span>
                            </Link>
                            <Link to="/admin/promotions" className="bg-background-dark p-4 rounded-2xl flex flex-col items-center gap-2 border border-border-dark hover:border-primary/50 transition-all">
                                <Icon name="campaign" className="text-primary" />
                                <span className="text-sm font-bold">Criar Promoção</span>
                            </Link>
                            <Link to="/menu" className="bg-background-dark p-4 rounded-2xl flex flex-col items-center gap-2 border border-border-dark hover:border-primary/50 transition-all">
                                <Icon name="visibility" className="text-primary" />
                                <span className="text-sm font-bold">Ver Loja</span>
                            </Link>
                        </div>
                    </section>

                    <section className="bg-surface-dark border border-border-dark p-8 rounded-3xl flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">Status do Sistema</h3>
                            <div className="flex items-center gap-2">
                                <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-black uppercase text-green-500 tracking-widest">Online</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-background-dark rounded-2xl border border-border-dark">
                                <div className="flex items-center gap-3">
                                    <Icon name="database" className="text-gray-500" />
                                    <span className="text-sm font-bold">Banco de Dados</span>
                                </div>
                                <span className="text-xs font-black text-green-500">Conectado</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-background-dark rounded-2xl border border-border-dark">
                                <div className="flex items-center gap-3">
                                    <Icon name="lock" className="text-gray-500" />
                                    <span className="text-sm font-bold">Autenticação</span>
                                </div>
                                <span className="text-xs font-black text-green-500">Ativa</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
