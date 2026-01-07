
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const ProfilePage: React.FC = () => {
    const { user, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [profile, setProfile] = useState({
        full_name: '',
        phone: '',
        address: '',
        avatar_url: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') throw profileError;

                if (data) {
                    setProfile({
                        full_name: data.full_name || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        avatar_url: data.avatar_url || ''
                    });
                }
            } catch (err: any) {
                console.error("Error fetching profile:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    full_name: profile.full_name,
                    phone: profile.phone,
                    address: profile.address,
                    updated_at: new Date().toISOString()
                });

            if (updateError) throw updateError;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("Error saving profile:", err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="bg-background-dark min-h-screen flex items-center justify-center text-white">
                <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-dark font-display text-white min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-border-dark px-4 py-3 md:px-10">
                <div className="max-w-[1280px] mx-auto flex items-center justify-between">
                    <Link to="/home" className="flex items-center gap-3 text-white group">
                        <div className="size-10 flex items-center justify-center bg-primary rounded-lg text-white">
                            <Icon name="lunch_dining" className="text-2xl" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black leading-tight tracking-[-0.015em] group-hover:text-primary transition-colors">Gorilão</h2>
                    </Link>
                    <div className="flex gap-4">
                        <Link to="/home" className="p-2 bg-surface-dark rounded-lg hover:text-primary transition-colors">
                            <Icon name="home" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[800px] mx-auto w-full px-4 py-12 md:py-20">
                <div className="flex flex-col gap-10">
                    <header className="flex flex-col gap-2">
                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">Meu Perfil</h1>
                        <p className="text-gray-400 text-lg">Gerencie suas informações na selva.</p>
                    </header>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                            <Icon name="error" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                            <Icon name="check_circle" />
                            <p className="text-sm font-bold">Perfil atualizado com sucesso!</p>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="bg-surface-dark border border-border-dark rounded-3xl p-8 flex flex-col gap-8 shadow-2xl">
                        <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-border-dark">
                            <div className="relative group">
                                <div className="size-32 md:size-40 rounded-full bg-primary flex items-center justify-center text-4xl font-black border-4 border-surface-dark shadow-xl overflow-hidden relative">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        profile.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()
                                    )}
                                    {saving && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-2 right-2 size-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                                    <Icon name="camera_alt" className="text-xl" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file || !user) return;

                                            setSaving(true);
                                            try {
                                                const fileExt = file.name.split('.').pop();
                                                const filePath = `avatars/${user.id}-${Math.random()}.${fileExt}`;

                                                const { error: uploadError } = await supabase.storage
                                                    .from('products') // Using existing bucket for simplicity, or could create 'avatars'
                                                    .upload(filePath, file);

                                                if (uploadError) throw uploadError;

                                                const { data: { publicUrl } } = supabase.storage
                                                    .from('products')
                                                    .getPublicUrl(filePath);

                                                setProfile({ ...profile, avatar_url: publicUrl });

                                                // Auto-save the avatar URL to profile
                                                await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

                                                setSuccess(true);
                                                setTimeout(() => setSuccess(false), 3000);
                                            } catch (err: any) {
                                                setError(err.message);
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                            <div className="flex-1 flex flex-col gap-1 text-center md:text-left">
                                <h3 className="text-2xl font-black">{profile.full_name || 'Usuário Gorilão'}</h3>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{user?.email}</p>
                                <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
                                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase border border-primary/20">Cliente Fiel</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-400">Nome Completo</span>
                                <div className="relative">
                                    <Icon name="person" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                                    <input
                                        type="text"
                                        className="w-full bg-background-dark border border-border-dark rounded-xl py-3 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        value={profile.full_name}
                                        onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-400">Telefone / WhatsApp</span>
                                <div className="relative">
                                    <Icon name="call" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                                    <input
                                        type="tel"
                                        className="w-full bg-background-dark border border-border-dark rounded-xl py-3 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="(00) 00000-0000"
                                        value={profile.phone}
                                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                    />
                                </div>
                            </label>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-gray-400">Endereço de Entrega</span>
                            <div className="relative">
                                <Icon name="location_on" className="absolute left-4 top-6 -translate-y-1/2 text-gray-600" />
                                <textarea
                                    className="w-full bg-background-dark border border-border-dark rounded-xl py-3 pl-12 pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[100px] resize-none"
                                    placeholder="Rua, número, bairro, cidade..."
                                    value={profile.address}
                                    onChange={e => setProfile({ ...profile, address: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-gray-400">Email (Não editável)</span>
                            <div className="relative">
                                <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" />
                                <input
                                    type="email"
                                    className="w-full bg-background-dark/50 border border-border-dark rounded-xl py-3 pl-12 pr-4 text-gray-600 cursor-not-allowed"
                                    value={user?.email || ''}
                                    disabled
                                />
                            </div>
                        </div>

                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="w-full bg-surface-dark border border-primary/30 text-primary py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-primary/5 transition-all mb-4"
                            >
                                <Icon name="admin_panel_settings" /> Painel Administrativo (Modo Edição)
                            </Link>
                        )}

                        <div className="pt-6 flex flex-col md:flex-row gap-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-lg hover:bg-red-700 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:grayscale"
                            >
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="bg-border-dark text-gray-400 px-8 py-4 rounded-2xl font-bold hover:bg-red-500/10 hover:text-red-500 transition-all"
                            >
                                Sair da Conta
                            </button>
                        </div>
                    </form>

                    <div className="flex justify-center gap-8 mt-4">
                        <Link to="/dashboard" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-2">
                            <Icon name="receipt_long" /> Meus Pedidos
                        </Link>
                        <Link to="/menu" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-2">
                            <Icon name="restaurant" /> Ver Cardápio
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
