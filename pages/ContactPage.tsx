
import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useCart } from '../contexts/CartContext';

const ContactPage: React.FC = () => {
    const { cartItems } = useCart();

    const contactInfo = [
        {
            icon: 'location_on',
            title: 'Onde Estamos',
            details: 'Av. Saudade, 1234 - Campos Elíseos',
            sub: 'Ribeirão Preto - SP'
        },
        {
            icon: 'call',
            title: 'WhatsApp / Telefone',
            details: '(16) 99112-2177',
            sub: 'Atendimento das 18h às 23h59'
        },
        {
            icon: 'schedule',
            title: 'Horário de Funcionamento',
            details: 'Terça a Domingo',
            sub: '18:00h às 23:59h'
        },
        {
            icon: 'mail',
            title: 'E-mail para Contato',
            details: 'contato@gorilaolanches.com.br',
            sub: 'Feedback e parcerias'
        }
    ];

    return (
        <div className="bg-background-dark font-display text-white min-h-screen">
            <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-border-dark">
                <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-[1280px] mx-auto w-full">
                    <Link to="/home" className="flex items-center gap-3 text-white group">
                        <div className="size-10 flex items-center justify-center bg-primary rounded-lg text-white">
                            <Icon name="lunch_dining" className="text-2xl" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black tracking-tighter group-hover:text-primary transition-colors">Gorilão</h2>
                    </Link>
                    <div className="flex gap-4">
                        <Link to="/cart" className="flex items-center justify-center rounded-lg h-10 w-10 bg-surface-dark text-white hover:bg-primary transition-colors relative">
                            <Icon name="shopping_cart" className="text-[20px]" />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                                </span>
                            )}
                        </Link>
                        <Link to="/profile" className="p-2 bg-surface-dark rounded-lg hover:text-primary transition-colors">
                            <Icon name="person" />
                        </Link>
                        <Link to="/home" className="p-2 bg-surface-dark rounded-lg hover:text-primary transition-colors">
                            <Icon name="home" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-12 md:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Info Side */}
                    <div className="flex flex-col gap-10">
                        <div className="flex flex-col gap-4">
                            <span className="text-primary font-black uppercase tracking-widest text-sm">Fale Conosco</span>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter italic">O Gorilão está pronto para te ouvir!</h1>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Dúvidas, críticas ou aquela vontade incontrolável de comer o melhor burguer de RP?
                                Escolha abaixo a melhor forma de falar com a nossa selva.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {contactInfo.map((info, i) => (
                                <div key={i} className="bg-surface-dark/40 border border-border-dark p-6 rounded-2xl hover:border-primary/50 transition-all group">
                                    <div className="size-12 bg-background-dark rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Icon name={info.icon} className="text-2xl text-primary" />
                                    </div>
                                    <h3 className="font-bold text-white mb-1">{info.title}</h3>
                                    <p className="text-primary font-black text-sm mb-0.5">{info.details}</p>
                                    <p className="text-gray-500 text-xs">{info.sub}</p>
                                </div>
                            ))}
                        </div>

                        <a
                            href="https://wa.me/5516991122177"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-fit bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-red-700 shadow-2xl shadow-primary/30 transition-all hover:scale-105"
                        >
                            <Icon name="chat" className="text-2xl" />
                            Chamar no WhatsApp
                        </a>
                    </div>

                    {/* Visual Side */}
                    <div className="relative">
                        <div className="sticky top-32">
                            <div className="w-full aspect-square rounded-3xl overflow-hidden border-4 border-surface-dark shadow-2xl relative">
                                <img
                                    src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000"
                                    alt="Restaurant Interior"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                <div className="absolute bottom-10 left-10 right-10 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-primary font-black">
                                        <Icon name="stars" />
                                        MUITO MAIS QUE UM LANCHE
                                    </div>
                                    <h2 className="text-3xl font-black italic">Visite nossa selva em Ribeirão Preto!</h2>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-4 mt-6">
                                <div className="flex-1 bg-surface-dark rounded-2xl p-4 text-center border border-border-dark">
                                    <p className="text-2xl font-black text-primary">4.9</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-black">Nota Google</p>
                                </div>
                                <div className="flex-1 bg-surface-dark rounded-2xl p-4 text-center border border-border-dark">
                                    <p className="text-2xl font-black text-primary">15k+</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-black">Gorilas Satisfeitos</p>
                                </div>
                                <div className="flex-1 bg-surface-dark rounded-2xl p-4 text-center border border-border-dark">
                                    <p className="text-2xl font-black text-primary">20+</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-black">Opções no Menu</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-border-dark/30 border-t border-border-dark py-12">
                <div className="max-w-[1280px] mx-auto px-4 md:px-10 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">© 2024 Gorilão Lanches. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default ContactPage;
