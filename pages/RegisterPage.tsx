
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';

const RegisterPage: React.FC = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (signUpError) throw signUpError;

            // Registration successful - typical Supabase setup requires email confirmation
            // but for simplicity here we might redirect or show a message.
            alert('Cadastro realizado com sucesso! Verifique seu email para confirmar.');
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar cadastro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-dark min-h-screen flex flex-col items-center justify-center p-6 text-white font-display overflow-hidden relative">
            {/* Background blur effect */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>

            <Link to="/home" className="mb-10 flex flex-col items-center gap-2 group relative z-10">
                <div className="size-32 flex items-center justify-center drop-shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <img src="/logo.jpg" alt="Gorilão Lanches" className="w-full h-full object-contain rounded-full border-4 border-primary/20 p-1 bg-background-dark shadow-2xl shadow-primary/20" />
                </div>
            </Link>

            <div className="w-full max-w-[420px] bg-surface-dark border border-border-dark rounded-[48px] p-10 pt-12 shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-700 relative z-10 backdrop-blur-sm bg-opacity-95">
                <div className="mb-10">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2 leading-none">Criar Conta</h2>
                    <p className="text-gray-500 text-sm font-medium tracking-tight">Junte-se à tribo e peça seu lanche monstro.</p>
                </div>

                {error && (
                    <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-3">
                        <Icon name="error" />
                        <p>{error}</p>
                    </div>
                )}

                <form className="flex flex-col gap-6" onSubmit={handleRegister}>
                    <div className="flex flex-col gap-2">
                        <span className="text-gray-500 text-[11px] font-black uppercase tracking-widest ml-1">Nome Completo</span>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors">
                                <Icon name="person" className="text-xl" />
                            </div>
                            <input
                                className="w-full h-16 pl-14 pr-4 bg-background-dark/80 border border-border-dark rounded-[24px] text-white placeholder:text-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
                                placeholder="Seu nome"
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-gray-500 text-[11px] font-black uppercase tracking-widest ml-1">Email</span>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors">
                                <Icon name="mail" className="text-xl" />
                            </div>
                            <input
                                className="w-full h-16 pl-14 pr-4 bg-background-dark/80 border border-border-dark rounded-[24px] text-white placeholder:text-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
                                placeholder="ex: joao@email.com"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-gray-500 text-[11px] font-black uppercase tracking-widest ml-1">Senha</span>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors">
                                <Icon name="lock" className="text-xl" />
                            </div>
                            <input
                                className="w-full h-16 pl-14 pr-14 bg-background-dark/80 border border-border-dark rounded-[24px] text-white placeholder:text-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base"
                                placeholder="Mínimo 6 caracteres"
                                type={passwordVisible ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                            />
                            <button
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white transition-colors"
                                type="button"
                                onClick={togglePasswordVisibility}
                            >
                                <Icon name={passwordVisible ? 'visibility_off' : 'visibility'} className="text-2xl" />
                            </button>
                        </div>
                    </div>

                    <button
                        className="mt-6 w-full h-16 bg-primary text-white rounded-[24px] font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 hover:brightness-110 transition-all duration-300 flex items-center justify-center gap-3 disabled:grayscale disabled:opacity-50"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="size-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>Criar Conta <Icon name="how_to_reg" /></>
                        )}
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-[13px] font-bold">
                            Já tem uma conta?{' '}
                            <Link className="text-primary hover:underline font-black" to="/login">Faça Login</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
