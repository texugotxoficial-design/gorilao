import React from 'react';
import MobileNav from './MobileNav';
import { Link } from 'react-router-dom';
import Icon from './Icon';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-background-dark text-white font-display antialiased pb-20 lg:pb-0">
            {/* Minimal Header for Mobile, Hidden on Desktop */}
            <header className="lg:hidden sticky top-0 z-[90] bg-background-dark/95 backdrop-blur-md border-b border-border-dark px-4 py-3 flex items-center justify-between">
                <Link to="/home" className="flex items-center gap-2">
                    <div className="size-8 flex items-center justify-center bg-primary rounded-lg text-white">
                        <Icon name="lunch_dining" className="text-xl" />
                    </div>
                    <h1 className="text-lg font-black tracking-tighter">Gorilão</h1>
                </Link>
                <div className="flex items-center gap-2">
                    <Link to="/contact" className="p-2 text-gray-400 hover:text-white">
                        <Icon name="help_outline" />
                    </Link>
                </div>
            </header>

            {/* Desktop Navigation (Existing style) */}
            <header className="hidden lg:block sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-border-dark">
                <div className="px-10 py-3 flex items-center justify-between max-w-[1280px] mx-auto w-full">
                    <Link to="/home" className="flex items-center gap-3 text-white group">
                        <div className="size-10 flex items-center justify-center bg-primary rounded-lg text-white">
                            <Icon name="lunch_dining" className="text-2xl" />
                        </div>
                        <h2 className="text-2xl font-black leading-tight tracking-[-0.015em] group-hover:text-primary transition-colors">Gorilão</h2>
                    </Link>
                    <nav className="flex items-center gap-8">
                        <Link to="/menu" className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-2">Cardápio</Link>
                        <Link to="/dashboard" className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-2">Pedidos</Link>
                        <Link to="/contact" className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-2">Contato</Link>
                        <Link to="/profile" className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-2">Perfil</Link>
                    </nav>
                </div>
            </header>

            <main className="flex-grow w-full max-w-[1280px] mx-auto pt-4 lg:pt-0">
                {children}
            </main>

            <MobileNav />
        </div>
    );
};

export default MainLayout;
