
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Icon from '../../components/Icon';
import { supabase } from '../../lib/supabaseClient';

interface Product {
    id: string;
    name: string;
    price: number;
    promo_price: number | null;
    is_featured: boolean;
    is_showcase: boolean;
    is_promotion: boolean;
    image_url: string;
}

interface Banner {
    id: string;
    title: string;
    subtitle: string;
    image_url: string;
    link_url: string;
    is_active: boolean;
}

const AdminPromotions: React.FC = () => {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [showcaseProducts, setShowcaseProducts] = useState<Product[]>([]);
    const [promotionProducts, setPromotionProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<'none' | 'featured' | 'showcase' | 'promotion' | 'banner'>('none');

    // Banner modal state
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [bannerFormData, setBannerFormData] = useState<Partial<Banner>>({
        title: '',
        subtitle: '',
        image_url: '',
        link_url: '',
        is_active: true
    });
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('admin-promotions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        try {
            const [prodRes, bannerRes] = await Promise.all([
                supabase.from('products').select('id, name, price, promo_price, is_featured, is_showcase, is_promotion, image_url'),
                supabase.from('banners').select('*').order('created_at', { ascending: false })
            ]);

            if (prodRes.data) {
                setAllProducts(prodRes.data);
                setFeaturedProducts(prodRes.data.filter(p => p.is_featured));
                setShowcaseProducts(prodRes.data.filter(p => p.is_showcase));
                setPromotionProducts(prodRes.data.filter(p => p.is_promotion));
            }
            if (bannerRes.data) {
                setBanners(bannerRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleFeatured = async (product: Product) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_featured: !product.is_featured })
                .eq('id', product.id);

            if (error) throw error;
        } catch (err) {
            console.error(err);
            alert("Erro ao atualizar destaque.");
        }
    };

    const toggleShowcase = async (product: Product) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_showcase: !product.is_showcase })
                .eq('id', product.id);

            if (error) throw error;
        } catch (err) {
            console.error(err);
            alert("Erro ao atualizar vitrine.");
        }
    };

    const togglePromotion = async (product: Product) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_promotion: !product.is_promotion })
                .eq('id', product.id);

            if (error) throw error;
        } catch (err) {
            console.error(err);
            alert("Erro ao atualizar promoção.");
        }
    };

    const handleOpenBannerModal = (banner: Banner | null = null) => {
        if (banner) {
            setEditingBanner(banner);
            setBannerFormData(banner);
        } else {
            setEditingBanner(null);
            setBannerFormData({
                title: '',
                subtitle: '',
                image_url: '',
                link_url: '',
                is_active: true
            });
        }
        setImagePreview(banner?.image_url || null);
        setImageFile(null);
        setIsBannerModalOpen(true);
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
        const filePath = `banner-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSaveBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let currentImageUrl = bannerFormData.image_url;

            if (imageFile) {
                currentImageUrl = await uploadImage(imageFile);
            }

            const bannerData = { ...bannerFormData, image_url: currentImageUrl };

            if (editingBanner) {
                const { error } = await supabase
                    .from('banners')
                    .update(bannerData)
                    .eq('id', editingBanner.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('banners')
                    .insert([bannerData]);
                if (error) throw error;
            }
            setIsBannerModalOpen(false);
            setImageFile(null);
            setImagePreview(null);
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar banner.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteBanner = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este banner?')) return;
        try {
            const { error } = await supabase.from('banners').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error(err);
        }
    };

    const toggleBannerStatus = async (banner: Banner) => {
        try {
            const { error } = await supabase
                .from('banners')
                .update({ is_active: !banner.is_active })
                .eq('id', banner.id);
            if (error) throw error;
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-10">
                <header>
                    <h2 className="text-3xl font-black italic">Promoções & Vitrine</h2>
                    <p className="text-gray-400">Controle o que seus clientes veem primeiro.</p>
                </header>

                <section className="bg-surface-dark border border-border-dark rounded-3xl p-8 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold">Vitrine de Lanches</h3>
                            <p className="text-sm text-gray-500">Produtos que aparecem na vitrine principal da Home.</p>
                        </div>
                        <button
                            onClick={() => setActiveModal('showcase')}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black px-5 py-2 rounded-xl font-bold text-sm transition-all"
                        >
                            Gerenciar Vitrine
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {showcaseProducts.length === 0 ? (
                            <div className="col-span-full py-10 text-center border-2 border-dashed border-border-dark rounded-2xl text-gray-500">
                                Nenhum produto na vitrine no momento.
                            </div>
                        ) : (
                            showcaseProducts.map(p => (
                                <div key={p.id} className="bg-background-dark border border-border-dark p-3 rounded-2xl flex items-center gap-4">
                                    <div className="size-12 rounded-lg overflow-hidden shrink-0">
                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-sm truncate">{p.name}</p>
                                        <button
                                            onClick={() => toggleShowcase(p)}
                                            className="text-[10px] font-black uppercase text-yellow-500 hover:text-yellow-400"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                    <Icon name="collections" className="text-yellow-500" />
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="bg-surface-dark border border-border-dark rounded-3xl p-8 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold">Banner Hero (Destaques)</h3>
                            <p className="text-sm text-gray-500">Produtos que aparecem no topo da Home.</p>
                        </div>
                        <button
                            onClick={() => setActiveModal('featured')}
                            className="bg-primary hover:bg-red-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all"
                        >
                            Gerenciar Hero
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {featuredProducts.length === 0 ? (
                            <div className="col-span-full py-10 text-center border-2 border-dashed border-border-dark rounded-2xl text-gray-500">
                                Nenhum produto em destaque no momento.
                            </div>
                        ) : (
                            featuredProducts.map(p => (
                                <div key={p.id} className="bg-background-dark border border-border-dark p-3 rounded-2xl flex items-center gap-4">
                                    <div className="size-12 rounded-lg overflow-hidden shrink-0">
                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-sm truncate">{p.name}</p>
                                        <button
                                            onClick={() => toggleFeatured(p)}
                                            className="text-[10px] font-black uppercase text-red-400 hover:text-red-300"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                    <Icon name="star" className="text-yellow-500" />
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="bg-surface-dark border border-border-dark rounded-3xl p-8 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold">Promoções Ativas</h3>
                            <p className="text-sm text-gray-500">Produtos que aparecem na seção de promoções da Home.</p>
                        </div>
                        <button
                            onClick={() => setActiveModal('promotion')}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all"
                        >
                            Gerenciar Promoções
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {promotionProducts.length === 0 ? (
                            <div className="col-span-full py-10 text-center border-2 border-dashed border-border-dark rounded-2xl text-gray-500">
                                Nenhum produto em promoção no momento.
                            </div>
                        ) : (
                            promotionProducts.map(p => (
                                <div key={p.id} className="bg-background-dark border border-border-dark p-3 rounded-2xl flex items-center gap-4">
                                    <div className="size-12 rounded-lg overflow-hidden shrink-0">
                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-sm truncate">{p.name}</p>
                                        <button
                                            onClick={() => togglePromotion(p)}
                                            className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                    <Icon name="local_offer" className="text-indigo-500" />
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="bg-surface-dark border border-border-dark rounded-3xl p-8 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold">Banners Promocionais</h3>
                            <p className="text-sm text-gray-500">Configure os banners de campanha da página inicial.</p>
                        </div>
                        <button
                            onClick={() => handleOpenBannerModal()}
                            className="bg-primary hover:bg-red-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20"
                        >
                            Novo Banner
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {banners.length === 0 ? (
                            <div className="col-span-full py-10 text-center border-2 border-dashed border-border-dark rounded-2xl text-gray-500">
                                Nenhum banner cadastrado.
                            </div>
                        ) : (
                            banners.map(banner => (
                                <div key={banner.id} className="bg-background-dark border border-border-dark p-4 rounded-2xl flex flex-col gap-4 group">
                                    <div className="h-32 rounded-xl overflow-hidden relative">
                                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <button
                                                onClick={() => handleOpenBannerModal(banner)}
                                                className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-primary transition-all"
                                            >
                                                <Icon name="edit" className="text-sm" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBanner(banner.id)}
                                                className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-red-500 transition-all"
                                            >
                                                <Icon name="delete" className="text-sm" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-2 left-2">
                                            <button
                                                onClick={() => toggleBannerStatus(banner)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all ${banner.is_active ? 'bg-green-500/80 text-white' : 'bg-gray-500/80 text-gray-200'}`}
                                            >
                                                {banner.is_active ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">{banner.title}</h4>
                                        <p className="text-[10px] text-gray-500 truncate">{banner.subtitle}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Product Feature Modal */}
            {activeModal === 'featured' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveModal('none')}></div>
                    <div className="relative bg-surface-dark w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                        <header className="p-6 border-b border-border-dark flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-black">Selecionar Destaques (Hero)</h3>
                            <button onClick={() => setActiveModal('none')}><Icon name="close" /></button>
                        </header>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
                            {allProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => toggleFeatured(p)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${p.is_featured ? 'bg-primary/10 border-primary' : 'bg-background-dark border-border-dark hover:border-gray-600'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-lg overflow-hidden">
                                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className={`font-bold ${p.is_featured ? 'text-white' : 'text-gray-400'}`}>{p.name}</span>
                                    </div>
                                    <div className={`size-6 rounded-full flex items-center justify-center border ${p.is_featured ? 'bg-primary border-primary text-white' : 'border-gray-600 text-transparent'}`}>
                                        <Icon name="check" className="text-xs" />
                                    </div>
                                </button>
                            ))}
                        </div>
                        <footer className="p-6 border-t border-border-dark shrink-0">
                            <button
                                onClick={() => setActiveModal('none')}
                                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20"
                            >
                                Concluir Seleção
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* Showcase Modal */}
            {activeModal === 'showcase' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveModal('none')}></div>
                    <div className="relative bg-surface-dark w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                        <header className="p-6 border-b border-border-dark flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-black">Selecionar Vitrine de Lanches</h3>
                            <button onClick={() => setActiveModal('none')}><Icon name="close" /></button>
                        </header>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
                            {allProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => toggleShowcase(p)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${p.is_showcase ? 'bg-yellow-500/10 border-yellow-500' : 'bg-background-dark border-border-dark hover:border-gray-600'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-lg overflow-hidden">
                                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className={`font-bold ${p.is_showcase ? 'text-white' : 'text-gray-400'}`}>{p.name}</span>
                                    </div>
                                    <div className={`size-6 rounded-full flex items-center justify-center border ${p.is_showcase ? 'bg-yellow-500 border-yellow-500 text-black' : 'border-gray-600 text-transparent'}`}>
                                        <Icon name="check" className="text-xs" />
                                    </div>
                                </button>
                            ))}
                        </div>
                        <footer className="p-6 border-t border-border-dark shrink-0">
                            <button
                                onClick={() => setActiveModal('none')}
                                className="w-full py-4 bg-yellow-500 text-black font-black rounded-2xl shadow-lg shadow-yellow-900/20"
                            >
                                Concluir Seleção
                            </button>
                        </footer>
                    </div>
                </div>
            )}
            {/* Promotion Modal */}
            {activeModal === 'promotion' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveModal('none')}></div>
                    <div className="relative bg-surface-dark w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                        <header className="p-6 border-b border-border-dark flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-black">Selecionar Promoções</h3>
                            <button onClick={() => setActiveModal('none')}><Icon name="close" /></button>
                        </header>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
                            {allProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => togglePromotion(p)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${p.is_promotion ? 'bg-indigo-500/10 border-indigo-500' : 'bg-background-dark border-border-dark hover:border-gray-600'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-lg overflow-hidden">
                                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className={`font-bold ${p.is_promotion ? 'text-white' : 'text-gray-400'}`}>{p.name}</span>
                                    </div>
                                    <div className={`size-6 rounded-full flex items-center justify-center border ${p.is_promotion ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-600 text-transparent'}`}>
                                        <Icon name="check" className="text-xs" />
                                    </div>
                                </button>
                            ))}
                        </div>
                        <footer className="p-6 border-t border-border-dark shrink-0">
                            <button
                                onClick={() => setActiveModal('none')}
                                className="w-full py-4 bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-900/20"
                            >
                                Concluir Seleção
                            </button>
                        </footer>
                    </div>
                </div>
            )}
            {/* Banner Modal */}
            {isBannerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBannerModalOpen(false)}></div>
                    <div className="relative bg-surface-dark w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <header className="p-6 border-b border-border-dark flex justify-between items-center">
                            <h3 className="text-xl font-black">{editingBanner ? 'Editar Banner' : 'Novo Banner'}</h3>
                            <button onClick={() => setIsBannerModalOpen(false)}><Icon name="close" /></button>
                        </header>
                        <form onSubmit={handleSaveBanner} className="p-6 flex flex-col gap-6">
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-400">Título</span>
                                <input
                                    type="text" required
                                    className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none"
                                    value={bannerFormData.title}
                                    onChange={e => setBannerFormData({ ...bannerFormData, title: e.target.value })}
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-400">Subtítulo</span>
                                <textarea
                                    className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none resize-none"
                                    rows={2}
                                    value={bannerFormData.subtitle}
                                    onChange={e => setBannerFormData({ ...bannerFormData, subtitle: e.target.value })}
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-400">Imagem do Banner</span>
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
                                                {imageFile ? imageFile.name : 'Selecionar Banner'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={handleFileChange}
                                                />
                                            </button>
                                            <p className="mt-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">Formato recomendado: 1200x400px</p>
                                        </div>
                                    </div>
                                </div>
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-400">Link URL (Opcional)</span>
                                <input
                                    type="text"
                                    className="bg-background-dark border border-border-dark rounded-xl p-3 focus:border-primary outline-none"
                                    placeholder="/menu ou https://..."
                                    value={bannerFormData.link_url}
                                    onChange={e => setBannerFormData({ ...bannerFormData, link_url: e.target.value })}
                                />
                            </label>

                            <div className="flex gap-4 mt-2">
                                <button type="button" onClick={() => setIsBannerModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-border-dark font-black">Cancelar</button>
                                <button type="submit" className="flex-1 py-4 rounded-2xl bg-primary font-black shadow-lg shadow-primary/20">Salvar Banner</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminPromotions;
