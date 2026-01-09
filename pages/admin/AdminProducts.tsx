
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Icon from '../../components/Icon';
import { supabase } from '../../lib/supabaseClient';

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    promo_price?: number | null;
    image_url: string;
    category_id: string;
    is_available?: boolean;
    is_featured?: boolean;
    is_showcase?: boolean;
    is_promotion?: boolean;
}

const AdminProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        description: '',
        price: 0,
        promo_price: null,
        image_url: '',
        category_id: '',
        is_available: true,
        is_featured: false,
        is_showcase: false,
        is_promotion: false
    });
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        fetchData();

        // Realtime subscriptions
        const productsChannel = supabase
            .channel('admin-products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(productsChannel);
        };
    }, []);

    const fetchData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                supabase.from('products').select('*').order('created_at', { ascending: false }),
                supabase.from('categories').select('id, name')
            ]);

            if (prodRes.data) setProducts(prodRes.data);
            if (catRes.data) setCategories(catRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product: Product | null = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: 0,
                promo_price: null,
                image_url: '',
                category_id: categories[0]?.id || '',
                is_available: true,
                is_featured: false,
                is_showcase: false,
                is_promotion: false
            });
        }
        setImagePreview(product?.image_url || null);
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let currentImageUrl = formData.image_url;

            if (imageFile) {
                currentImageUrl = await uploadImage(imageFile);
            }

            const productData = { ...formData, image_url: currentImageUrl };

            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            setImageFile(null);
            setImagePreview(null);
        } catch (err: any) {
            console.error("Error saving product:", err);
            const errorMessage = err.message || "Erro desconhecido";
            alert(`Erro ao salvar produto: ${errorMessage}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            // fetchData(); // Handled by real-time subscription
        } catch (err) {
            console.error("Error deleting product:", err);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-black italic">Produtos</h2>
                        <p className="text-gray-400">Gerencie o cardápio da sua selva.</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Icon name="add" /> Novo Produto
                    </button>
                </header>

                <div className="bg-surface-dark border border-border-dark rounded-3xl p-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar produtos..."
                            className="w-full bg-background-dark border border-border-dark rounded-xl py-3 pl-12 pr-4 focus:border-primary transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-background-dark border border-border-dark rounded-xl py-3 px-4 focus:border-primary transition-all text-sm outline-none"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">Todas as Categorias</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-surface-dark rounded-3xl"></div>)}
                        </div>
                    ) : (
                        filteredProducts.map(product => (
                            <div key={product.id} className="bg-surface-dark border border-border-dark p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/40 transition-all group">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="size-20 bg-background-dark rounded-2xl overflow-hidden border border-border-dark shrink-0">
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-black text-lg">{product.name}</h3>
                                            {product.is_featured && (
                                                <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-black px-2 py-0.5 rounded uppercase">Hero</span>
                                            )}
                                            {product.is_promotion && (
                                                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase">Promo</span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-xs line-clamp-1 max-w-sm">{product.description}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-primary font-black">{formatPrice(product.price)}</span>
                                            <span className="text-gray-600">•</span>
                                            <span className="text-xs text-gray-400">{categories.find(c => c.id === product.category_id)?.name}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto justify-end border-t md:border-t-0 border-border-dark pt-4 md:pt-0">
                                    <div className="flex items-center gap-2 mr-4">
                                        <span className={`size-2 rounded-full ${product.is_available !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                            {product.is_available !== false ? 'Disponível' : 'Indisponível'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleOpenModal(product)}
                                        className="p-3 bg-background-dark border border-border-dark rounded-xl hover:text-primary hover:border-primary/50 transition-all"
                                    >
                                        <Icon name="edit" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="p-3 bg-background-dark border border-border-dark rounded-xl hover:text-red-500 hover:border-red-500/50 transition-all"
                                    >
                                        <Icon name="delete" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-surface-dark w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <header className="p-6 border-b border-border-dark flex justify-between items-center">
                            <h3 className="text-xl font-black">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><Icon name="close" /></button>
                        </header>

                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-gray-400">Nome do Produto</span>
                                    <input
                                        type="text" required
                                        className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-gray-400">Preço (BRL)</span>
                                    <input
                                        type="text" required
                                        placeholder="Ex: 26,99"
                                        className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none"
                                        value={formData.price !== undefined ? String(formData.price).replace('.', ',') : ''}
                                        onChange={e => {
                                            const val = e.target.value.replace(',', '.');
                                            if (val === '' || !isNaN(Number(val))) {
                                                setFormData({ ...formData, price: val === '' ? 0 : Number(val) });
                                            }
                                        }}
                                    />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-gray-400">Preço Promocional (Opcional)</span>
                                    <input
                                        type="text"
                                        placeholder="Ex: 19,90"
                                        className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none"
                                        value={formData.promo_price !== null && formData.promo_price !== undefined ? String(formData.promo_price).replace('.', ',') : ''}
                                        onChange={e => {
                                            const val = e.target.value.replace(',', '.');
                                            if (val === '' || !isNaN(Number(val))) {
                                                setFormData({ ...formData, promo_price: val === '' ? null : Number(val) });
                                            }
                                        }}
                                    />
                                </label>
                            </div>

                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-400">Descrição</span>
                                <textarea
                                    required rows={3}
                                    className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-gray-400">Categoria</span>
                                    <select
                                        required
                                        className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none"
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-bold text-gray-400">Imagem do Produto</span>
                                    <div className="flex items-center gap-4">
                                        <div className="size-24 rounded-2xl bg-background-dark border border-border-dark overflow-hidden shrink-0 flex items-center justify-center relative group shadow-inner">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                                            ) : (
                                                <Icon name="image" className="text-gray-600 text-3xl" />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                <Icon name="cloud_upload" className="text-white text-2xl" />
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="relative">
                                                <button type="button" className="w-full py-4 px-6 bg-background-dark border-2 border-dashed border-border-dark rounded-2xl text-gray-500 font-bold flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all relative">
                                                    <Icon name="cloud_upload" />
                                                    {imageFile ? imageFile.name : 'Selecionar Foto'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={handleFileChange}
                                                    />
                                                </button>
                                                <p className="mt-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">JPG, PNG ou WebP</p>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="flex flex-wrap gap-x-10 gap-y-4 mt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => setFormData({ ...formData, is_available: !formData.is_available })}
                                        className={`size-6 rounded-md border flex items-center justify-center transition-all ${formData.is_available ? 'bg-primary border-primary' : 'border-border-dark bg-background-dark'}`}
                                    >
                                        {formData.is_available && <Icon name="check" className="text-white text-xs" />}
                                    </div>
                                    <span className="text-sm font-bold text-gray-300">Disponível</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                                        className={`size-6 rounded-md border flex items-center justify-center transition-all ${formData.is_featured ? 'bg-yellow-500 border-yellow-500' : 'border-border-dark bg-background-dark'}`}
                                    >
                                        {formData.is_featured && <Icon name="star" className="text-white text-xs" />}
                                    </div>
                                    <span className="text-sm font-bold text-gray-300">Destaque Hero</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => setFormData({ ...formData, is_showcase: !formData.is_showcase })}
                                        className={`size-6 rounded-md border flex items-center justify-center transition-all ${formData.is_showcase ? 'bg-orange-500 border-orange-500' : 'border-border-dark bg-background-dark'}`}
                                    >
                                        {formData.is_showcase && <Icon name="collections" className="text-white text-xs" />}
                                    </div>
                                    <span className="text-sm font-bold text-gray-300">Vitrine</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => setFormData({ ...formData, is_promotion: !formData.is_promotion })}
                                        className={`size-6 rounded-md border flex items-center justify-center transition-all ${formData.is_promotion ? 'bg-indigo-500 border-indigo-500' : 'border-border-dark bg-background-dark'}`}
                                    >
                                        {formData.is_promotion && <Icon name="local_offer" className="text-white text-xs" />}
                                    </div>
                                    <span className="text-sm font-bold text-gray-300">Promoção</span>
                                </label>
                            </div>

                            <div className="flex gap-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-border-dark font-black hover:bg-gray-700 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-primary font-black hover:bg-red-700 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="size-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            Salvando...
                                        </>
                                    ) : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminProducts;
