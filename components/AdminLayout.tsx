
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const { signOut } = useAuth();

    const menuItems = [
        { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
        { path: '/admin/products', icon: 'lunch_dining', label: 'Produtos' },
        { path: '/admin/categories', icon: 'category', label: 'Categorias' },
        { path: '/admin/extras', icon: 'add_circle', label: 'Adicionais' },
        { path: '/admin/promotions', icon: 'local_offer', label: 'Promoções' },
    ];

    return (
        <div className="flex min-h-screen bg-background-dark font-display text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-[#181112] border-r border-border-dark flex flex-col sticky top-0 h-screen">
                <div className="p-6 border-b border-border-dark">
                    <Link to="/home" className="flex items-center gap-3 text-primary">
                        <div className="size-10 flex items-center justify-center bg-primary rounded-lg text-white">
                            <Icon name="lunch_dining" className="text-2xl" />
                        </div>
                        <h2 className="text-white text-xl font-black tracking-tighter">Admin Selva</h2>
                    </Link>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${location.pathname === item.path
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-gray-400 hover:bg-surface-dark hover:text-white'
                                }`}
                        >
                            <Icon name={item.icon} className="text-[20px]" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-border-dark flex flex-col gap-2">
                    <Link to="/home" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-gray-400 hover:bg-surface-dark hover:text-white transition-all">
                        <Icon name="home" className="text-[20px]" />
                        Voltar à Loja
                    </Link>
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-400 hover:bg-red-500/10 transition-all text-left"
                    >
                        <Icon name="logout" className="text-[20px]" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-20 border-b border-border-dark flex items-center justify-between px-10 bg-background-dark/95 backdrop-blur-md sticky top-0 z-10">
                    <h1 className="text-xl font-black uppercase tracking-widest text-gray-400">
                        Painel de Controle
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold">Admin Gorilão</p>
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest">Acesso Total</p>
                        </div>
                        <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/50 text-primary">
                            <Icon name="admin_panel_settings" />
                        </div>
                    </div>
                </header>

                <div className="p-10">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
