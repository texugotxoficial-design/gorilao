
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Icon from '../../components/Icon';
import { supabase } from '../../lib/supabaseClient';

interface Category {
    slug: string;
    name: string;
}

interface Extra {
    id: string;
    name: string;
    price: number;
    category: string;
}

const AdminExtras: React.FC = () => {
    const [extras, setExtras] = useState<Extra[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
    const [formData, setFormData] = useState<Partial<Extra>>({
        name: '',
        price: 0,
        category: ''
    });

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('admin-extras')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'extras' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        try {
            const [extraRes, catRes] = await Promise.all([
                supabase.from('extras').select('*').order('name'),
                supabase.from('categories').select('slug, name')
            ]);
            if (extraRes.data) setExtras(extraRes.data);
            if (catRes.data) {
                setCategories(catRes.data);
                if (!formData.category && catRes.data.length > 0) {
                    setFormData(prev => ({ ...prev, category: catRes.data[0].slug }));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (extra: Extra | null = null) => {
        if (extra) {
            setEditingExtra(extra);
            setFormData(extra);
        } else {
            setEditingExtra(null);
            setFormData({ name: '', price: 0, category: categories[0]?.slug || '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Remove id and created_at if they exist in formData to avoid errors
            const { id, ...dataToSave } = formData as any;

            if (editingExtra) {
                const { error } = await supabase
                    .from('extras')
                    .update(dataToSave)
                    .eq('id', editingExtra.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('extras')
                    .insert([dataToSave]);
                if (error) throw error;
            }
            setIsModalOpen(false);
        } catch (err: any) {
            console.error("Error saving extra:", err);
            alert(`Erro ao salvar adicional: ${err.message || 'Erro desconhecido'}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este adicional?')) return;
        await supabase.from('extras').delete().eq('id', id);
        // fetchData(); // Handled by real-time subscription
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black italic">Adicionais</h2>
                        <p className="text-gray-400">Turbine os lanches dos seus clientes.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="bg-primary px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-primary/20">
                        <Icon name="add" /> Novo Adicional
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="animate-pulse h-24 bg-surface-dark rounded-3xl col-span-full"></div>
                    ) : (
                        extras.map(extra => (
                            <div key={extra.id} className="bg-surface-dark border border-border-dark p-6 rounded-3xl flex items-center justify-between group hover:border-primary/40 transition-all">
                                <div>
                                    <h3 className="font-black text-lg">{extra.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-primary font-black">R$ {extra.price.toFixed(2)}</span>
                                        <span className="text-gray-600">•</span>
                                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{categories.find(c => c.slug === extra.category)?.name || extra.category}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleOpenModal(extra)} className="p-3 bg-background-dark border border-border-dark rounded-xl hover:text-primary transition-all"><Icon name="edit" /></button>
                                    <button onClick={() => handleDelete(extra.id)} className="p-3 bg-background-dark border border-border-dark rounded-xl hover:text-red-500 transition-all"><Icon name="delete" /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-surface-dark w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
                        <header className="p-6 border-b border-border-dark flex justify-between items-center">
                            <h3 className="text-xl font-black">{editingExtra ? 'Editar Adicional' : 'Novo Adicional'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><Icon name="close" /></button>
                        </header>
                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-6">
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-400">Nome</span>
                                <input type="text" required className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-400">Preço (BRL)</span>
                                <input type="number" step="0.01" required className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-400">Categoria Aplicável</span>
                                <select required className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    {categories.map(cat => (
                                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="flex gap-4 mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-border-dark font-black">Cancelar</button>
                                <button type="submit" className="flex-1 py-4 rounded-2xl bg-primary font-black shadow-lg shadow-primary/20">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminExtras;
