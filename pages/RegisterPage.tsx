
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
        <div className="bg-background-dark min-h-screen flex flex-col overflow-x-hidden text-white font-display">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#39282a] px-6 lg:px-10 py-4 bg-[#181112]">
                <div className="flex items-center gap-4 text-white">
                    <div className="size-8 text-primary">
                        <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="currentColor"></path>
                            <path clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z" fill="currentColor" fillRule="evenodd"></path>
                        </svg>
                    </div>
                    <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Gorilão Lanches</h2>
                </div>
                <Link to="/login" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold leading-normal tracking-[0.015em] transition-colors duration-200">
                    <span className="truncate">Fazer login</span>
                </Link>
            </header>
            <main className="flex-1 flex flex-col lg:flex-row h-full">
                <div className="hidden lg:flex lg:w-1/2 relative bg-[#181112]">
                    <img alt="Hambúrguer gourmet" className="absolute inset-0 w-full h-full object-cover opacity-80" src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80" />
                    <div className="absolute inset-0 bg-gradient-to-r from-background-dark/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-10 left-10 text-white max-w-md">
                        <p className="text-3xl font-bold leading-tight mb-2">Sua jornada de sabor começa aqui.</p>
                        <p className="text-gray-300 text-lg">Crie sua conta e aproveite o melhor da gastronomia local.</p>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#181112]">
                    <div className="w-full max-w-[420px] flex flex-col">
                        <div className="mb-8 text-center lg:text-left">
                            <h1 className="text-white tracking-light text-3xl md:text-4xl font-bold leading-tight pb-2">Criar conta</h1>
                            <p className="text-gray-400 text-base font-normal leading-normal">Junte-se à família Gorilão Lanches.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-3">
                                <Icon name="error" className="text-xl shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <form className="flex flex-col gap-5" onSubmit={handleRegister}>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-gray-200 text-sm font-semibold leading-normal">Nome completo</span>
                                <div className="relative">
                                    <input
                                        className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-white border border-[#543b3d] bg-[#271c1c] focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 placeholder:text-[#b99d9f] text-base font-normal leading-normal transition-all"
                                        placeholder="Seu nome"
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                    <div className="absolute right-3 top-3 text-[#b99d9f] pointer-events-none">
                                        <Icon name="person" className="text-[20px]" />
                                    </div>
                                </div>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-gray-200 text-sm font-semibold leading-normal">Email</span>
                                <div className="relative">
                                    <input
                                        className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-white border border-[#543b3d] bg-[#271c1c] focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 placeholder:text-[#b99d9f] text-base font-normal leading-normal transition-all"
                                        placeholder="ex: joao@email.com"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <div className="absolute right-3 top-3 text-[#b99d9f] pointer-events-none">
                                        <Icon name="mail" className="text-[20px]" />
                                    </div>
                                </div>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-gray-200 text-sm font-semibold leading-normal">Senha</span>
                                <div className="flex w-full items-stretch rounded-lg relative group">
                                    <input
                                        className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-white border border-[#543b3d] bg-[#271c1c] focus:border-primary focus:ring-1 focus:ring-primary h-12 pl-4 pr-12 placeholder:text-[#b99d9f] text-base font-normal leading-normal transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                        type={passwordVisible ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={6}
                                    />
                                    <button
                                        className="absolute right-0 top-0 h-full px-3 text-[#b99d9f] hover:text-white transition-colors flex items-center justify-center"
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                    >
                                        <Icon name={passwordVisible ? 'visibility_off' : 'visibility'} className="text-[24px]" />
                                    </button>
                                </div>
                            </label>

                            <button
                                className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white text-base font-bold leading-normal tracking-[0.015em] shadow-lg shadow-red-900/20 transition-all duration-200 transform active:scale-[0.99]"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="truncate">Criar conta grátis</span>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-400 text-sm">
                                Já tem uma conta?{' '}
                                <Link className="text-primary font-bold hover:underline" to="/login">Entrar</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RegisterPage;
