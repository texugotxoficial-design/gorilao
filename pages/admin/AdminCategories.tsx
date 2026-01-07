
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Icon from '../../components/Icon';
import { supabase } from '../../lib/supabaseClient';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
    display_order: number;
}

const AdminCategories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<Partial<Category>>({
        name: '',
        slug: '',
        icon: 'star',
        display_order: 0
    });

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('admin-categories')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        try {
            const { data } = await supabase.from('categories').select('*').order('display_order');
            if (data) setCategories(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (cat: Category | null = null) => {
        if (cat) {
            setEditingCategory(cat);
            setFormData(cat);
        } else {
            setEditingCategory(null);
            setFormData({ name: '', slug: '', icon: 'star', display_order: categories.length });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await supabase.from('categories').update(formData).eq('id', editingCategory.id);
            } else {
                await supabase.from('categories').insert([formData]);
            }
            setIsModalOpen(false);
            // fetchData(); // Handled by real-time subscription
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar categoria.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta categoria? Isso pode afetar os produtos vinculados.')) return;
        await supabase.from('categories').delete().eq('id', id);
        // fetchData(); // Handled by real-time subscription
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black italic">Categorias</h2>
                        <p className="text-gray-400">Organize os setores do seu cardápio.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="bg-primary px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-primary/20">
                        <Icon name="add" /> Nova Categoria
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="animate-pulse h-32 bg-surface-dark rounded-3xl col-span-full"></div>
                    ) : (
                        categories.map(cat => (
                            <div key={cat.id} className="bg-surface-dark border border-border-dark p-6 rounded-3xl flex items-center justify-between group hover:border-primary/40 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="size-14 bg-background-dark rounded-2xl flex items-center justify-center text-primary border border-border-dark group-hover:scale-110 transition-transform">
                                        <Icon name={cat.icon || 'star'} className="text-2xl" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg">{cat.name}</h3>
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">slug: {cat.slug}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleOpenModal(cat)} className="p-3 bg-background-dark border border-border-dark rounded-xl hover:text-primary transition-all"><Icon name="edit" /></button>
                                    <button onClick={() => handleDelete(cat.id)} className="p-3 bg-background-dark border border-border-dark rounded-xl hover:text-red-500 transition-all"><Icon name="delete" /></button>
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
                            <h3 className="text-xl font-black">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><Icon name="close" /></button>
                        </header>
                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-gray-400">Nome</span>
                                    <input type="text" required className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-gray-400">Slug (URL)</span>
                                    <input type="text" required className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-gray-400">Ícone (Material Icon)</span>
                                    <input type="text" required className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-gray-400">Ordem de Exibição</span>
                                    <input type="number" required className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none" value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: Number(e.target.value) })} />
                                </label>
                            </div>
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

export default AdminCategories;
