import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const MobileNav: React.FC = () => {
    const { cartItems } = useCart();
    const { user } = useAuth();
    const location = useLocation();

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const navItems = [
        { path: '/home', icon: 'home', label: 'Início' },
        { path: '/menu', icon: 'restaurant', label: 'Cardápio' },
        { path: '/cart', icon: 'shopping_cart', label: 'Carrinho', isCart: true },
        ...(user ? [
            { path: '/dashboard', icon: 'receipt_long', label: 'Pedidos' },
            { path: '/profile', icon: 'person', label: 'Perfil' }
        ] : []),
    ];

    // Don't show on login/register
    if (location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background-dark/95 backdrop-blur-lg border-t border-border-dark px-2 pb-safe-area-inset-bottom">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all duration-300
                            ${isActive ? 'text-primary scale-110' : 'text-gray-500 hover:text-gray-300'}
                        `}
                    >
                        <div className="relative">
                            <Icon name={item.icon} className="text-[24px]" />
                            {item.isCart && cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-background-dark animate-in zoom-in">
                                    {cartCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default MobileNav;
