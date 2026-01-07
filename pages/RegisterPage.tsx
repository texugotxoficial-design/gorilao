
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
        <div className="bg-background-dark min-h-screen flex flex-col items-center justify-center p-6 text-white font-display">
            <Link to="/home" className="mb-10 flex flex-col items-center gap-4 group">
                <div className="size-16 flex items-center justify-center bg-primary rounded-[24px] text-white shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                    <Icon name="lunch_dining" className="text-4xl" />
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Gorilão</h1>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Join the Jungle</span>
                </div>
            </Link>

            <div className="w-full max-w-[400px] bg-surface-dark border border-border-dark rounded-[40px] p-8 shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="mb-8">
                    <h2 className="text-2xl font-black italic uppercase tracking-tight mb-1">Criar Conta</h2>
                    <p className="text-gray-500 text-sm">Junte-se à tribo e peça seu lanche monstro.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-3">
                        <Icon name="error" />
                        <p>{error}</p>
                    </div>
                )}

                <form className="flex flex-col gap-5" onSubmit={handleRegister}>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider ml-4">Nome Completo</span>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors">
                                <Icon name="person" className="text-lg" />
                            </div>
                            <input
                                className="w-full h-14 pl-12 pr-4 bg-background-dark/50 border border-border-dark rounded-[20px] text-white placeholder:text-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm"
                                placeholder="Seu nome"
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider ml-4">Email</span>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors">
                                <Icon name="mail" className="text-lg" />
                            </div>
                            <input
                                className="w-full h-14 pl-12 pr-4 bg-background-dark/50 border border-border-dark rounded-[20px] text-white placeholder:text-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm"
                                placeholder="ex: joao@email.com"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider ml-4">Senha</span>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors">
                                <Icon name="lock" className="text-lg" />
                            </div>
                            <input
                                className="w-full h-14 pl-12 pr-12 bg-background-dark/50 border border-border-dark rounded-[20px] text-white placeholder:text-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm"
                                placeholder="Mínimo 6 caracteres"
                                type={passwordVisible ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                            />
                            <button
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                                type="button"
                                onClick={togglePasswordVisibility}
                            >
                                <Icon name={passwordVisible ? 'visibility_off' : 'visibility'} className="text-xl" />
                            </button>
                        </div>
                    </div>

                    <button
                        className="mt-4 w-full h-14 bg-primary text-white rounded-[20px] font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:grayscale disabled:opacity-50"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="size-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>Criar Conta <Icon name="how_to_reg" /></>
                        )}
                    </button>

                    <div className="mt-4 text-center">
                        <p className="text-gray-500 text-xs font-bold">
                            Já tem uma conta?{' '}
                            <Link className="text-primary hover:underline" to="/login">Faça Login</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
