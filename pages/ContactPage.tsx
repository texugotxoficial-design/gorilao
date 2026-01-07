
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
        <div className="flex flex-col gap-6 p-4 bg-background-dark pb-32">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Fale Conosco</h1>
                <p className="text-gray-400 text-sm">O Gorilão está pronto para te ouvir! Escolha como falar com a gente.</p>
            </div>

            <main className="flex flex-col gap-8">
                <div className="grid grid-cols-1 gap-4">
                    {contactInfo.map((info, i) => (
                        <div key={i} className="bg-surface-dark border border-border-dark p-6 rounded-[32px] flex items-center gap-5 shadow-xl">
                            <div className="shrink-0 size-14 bg-background-dark/50 rounded-2xl flex items-center justify-center border border-border-dark">
                                <Icon name={info.icon} className="text-2xl text-primary" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <h3 className="font-black italic uppercase tracking-tighter text-gray-500 text-xs">{info.title}</h3>
                                <p className="text-white font-black text-lg leading-tight">{info.details}</p>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{info.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-4">
                    <a
                        href="https://wa.me/5516991122177"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] text-white py-5 rounded-[24px] font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-[#25D366]/20 transition-all active:scale-95"
                    >
                        <Icon name="chat" className="text-2xl" />
                        WhatsApp Direto
                    </a>
                </div>

                <div className="relative rounded-[40px] overflow-hidden border border-border-dark shadow-2xl">
                    <img
                        src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000"
                        alt="Restaurante"
                        className="w-full h-64 object-cover grayscale opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.2em]">
                            <Icon name="stars" className="text-sm" />
                            Ribeirão Preto - SP
                        </div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Visite nossa selva!</h2>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-surface-dark/50 rounded-2xl p-4 text-center border border-border-dark flex flex-col items-center">
                        <p className="text-xl font-black text-white italic">4.9</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Google</p>
                    </div>
                    <div className="bg-surface-dark/50 rounded-2xl p-4 text-center border border-border-dark flex flex-col items-center">
                        <p className="text-xl font-black text-white italic">15k+</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Gorilas</p>
                    </div>
                    <div className="bg-surface-dark/50 rounded-2xl p-4 text-center border border-border-dark flex flex-col items-center">
                        <p className="text-xl font-black text-white italic">20+</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Opções</p>
                    </div>
                </div>
            </main>

            <p className="text-[10px] text-gray-600 text-center font-bold uppercase tracking-[0.3em] mt-8">
                Gorilão Lanches • 2024
            </p>
        </div>
    );
};

export default ContactPage;
