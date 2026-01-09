
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../contexts/CartContext';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
}

interface Banner {
    id: string;
    title: string;
    subtitle: string;
    image_url: string;
    link_url: string;
    is_active: boolean;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    promo_price?: number | null;
    image_url: string;
    category_id: string;
    is_featured: boolean;
    is_showcase: boolean;
    is_promotion: boolean;
    is_available: boolean;
}

const HomePage: React.FC = () => {
    const { user, signOut } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();

    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('public-home')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        try {
            const [catRes, prodRes, bannerRes] = await Promise.all([
                supabase.from('categories').select('*').order('display_order'),
                supabase.from('products').select('*'),
                supabase.from('banners').select('*').eq('is_active', true).order('created_at', { ascending: false })
            ]);

            if (catRes.data) setCategories(catRes.data);
            if (bannerRes.data) setBanners(bannerRes.data);

            if (prodRes.data) {
                const availableProducts = prodRes.data.filter(p => p.is_available !== false);
                setProducts(availableProducts);
            }
        } catch (err) {
            console.error("Error fetching homepage data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    // Filter products for different showcases
    const featuredProducts = products.filter(p => p.is_featured);
    const showcaseProducts = products.filter(p => p.is_showcase);

    const snacksProducts = products.filter(p => {
        const cat = categories.find(c => c.id === p.category_id);
        const name = cat?.name.toLowerCase() || '';
        const slug = cat?.slug || '';
        return slug.includes('lanche') || slug.includes('burger') || name.includes('lanche') || name.includes('hamb') || name.includes('burger');
    });

    const drinksProducts = products.filter(p => {
        const cat = categories.find(c => c.id === p.category_id);
        const name = cat?.name.toLowerCase() || '';
        const slug = cat?.slug || '';
        return slug.includes('bebida') || name.includes('bebida') || name.includes('suco') || name.includes('refrigerante');
    });

    const heroProduct = featuredProducts[0] || snacksProducts[0] || products[0];

    return (
        <div className="flex flex-col gap-6 py-4 px-4 bg-background-dark">
            {loading ? (
                <div className="w-full h-[500px] bg-surface-dark rounded-2xl animate-pulse"></div>
            ) : heroProduct && (
                <div className="w-full rounded-[32px] overflow-hidden relative min-h-[400px] flex items-end group shadow-2xl border border-white/5">
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${heroProduct.image_url}")` }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                    <div className="relative z-10 p-6 flex flex-col gap-4 w-full">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/50 w-fit backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-primary font-black text-[10px] uppercase tracking-wider">
                                {heroProduct.is_featured ? 'Destaque' : 'Favorito'}
                            </span>
                        </span>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-white text-3xl md:text-5xl font-black leading-tight tracking-tighter italic">{heroProduct.name}</h1>
                            <p className="text-gray-300 text-sm md:text-lg font-medium line-clamp-2">
                                {heroProduct.description}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                                <div className="flex flex-col">
                                    {heroProduct.is_promotion && heroProduct.promo_price ? (
                                        <>
                                            <span className="text-sm text-gray-400 line-through leading-none">{formatPrice(heroProduct.price)}</span>
                                            <span className="text-2xl font-black text-primary">{formatPrice(heroProduct.promo_price)}</span>
                                        </>
                                    ) : (
                                        <span className="text-2xl font-black text-primary">{formatPrice(heroProduct.price)}</span>
                                    )}
                                </div>
                                <Link to="/menu" className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                                    <Icon name="add_shopping_cart" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Categories Horizontal Scroll */}
            <section className="flex flex-col gap-4 lg:hidden">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Explorar</h3>
                    <Link to="/menu" className="text-xs font-bold text-primary">Ver todos</Link>
                </div>
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
                    {categories.map(cat => (
                        <Link key={cat.id} to={`/menu?cat=${cat.id}`} className="flex flex-col items-center gap-2 min-w-[80px]">
                            <div className="size-16 bg-surface-dark border border-border-dark rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                                <Icon name={cat.icon || 'lunch_dining'} className="text-2xl" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured Showcase */}
            {featuredProducts.length > 0 && (
                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                            <Icon name="bolt" className="text-yellow-500 text-xl" />
                        </div>
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Sugestões de Hoje</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-4">
                        {featuredProducts.map(fp => (
                            <Link key={fp.id} to="/menu" className="min-w-[280px] bg-surface-dark border border-border-dark rounded-[24px] overflow-hidden group snap-start shadow-xl">
                                <div className="h-44 relative overflow-hidden">
                                    <img src={fp.image_url} alt={fp.name} className="w-full h-full object-cover group-hover:scale-110 transition-duration-700" />
                                    <div className="absolute top-3 right-3 bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">
                                        Destaque
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-lg leading-tight truncate">{fp.name}</h4>
                                        <div className="flex flex-col items-end">
                                            {fp.is_promotion && fp.promo_price ? (
                                                <>
                                                    <span className="text-[10px] text-gray-500 line-through leading-none">{formatPrice(fp.price)}</span>
                                                    <span className="text-primary font-black">{formatPrice(fp.promo_price)}</span>
                                                </>
                                            ) : (
                                                <span className="text-primary font-black">{formatPrice(fp.price)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-xs line-clamp-2">{fp.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Promotions */}
            {products.filter(p => p.is_promotion).length > 0 && (
                <section className="flex flex-col gap-4 bg-primary/5 rounded-[32px] p-6 border border-primary/10">
                    <div className="flex items-center gap-3">
                        <Icon name="local_offer" className="text-primary" />
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Ofertas da Selva</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {products.filter(p => p.is_promotion).slice(0, 4).map(promo => (
                            <Link key={promo.id} to="/menu" className="bg-surface-dark rounded-2xl p-2 flex flex-col gap-2 group transition-all">
                                <div className="aspect-square rounded-xl overflow-hidden relative">
                                    <img src={promo.image_url} alt={promo.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex flex-col px-1 pb-1">
                                    <span className="font-bold text-xs truncate">{promo.name}</span>
                                    <div className="flex flex-col">
                                        {promo.promo_price ? (
                                            <>
                                                <span className="text-[10px] text-gray-500 line-through leading-none">{formatPrice(promo.price)}</span>
                                                <span className="text-primary font-black text-sm">{formatPrice(promo.promo_price)}</span>
                                            </>
                                        ) : (
                                            <span className="text-primary font-black text-sm">{formatPrice(promo.price)}</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Quick Menu Access */}
            <section className="mt-4 mb-4">
                <Link to="/menu" className="w-full bg-gradient-to-r from-primary to-orange-600 p-8 rounded-[32px] flex flex-col gap-3 relative overflow-hidden group shadow-2xl">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">Cardápio Completo</h3>
                    <p className="text-white/80 text-sm font-medium max-w-[200px]">Veja todas as opções e monte seu combo perfeito.</p>
                    <div className="flex items-center gap-2 font-black text-lg mt-2">
                        Explorar <Icon name="arrow_forward" />
                    </div>
                </Link>
            </section>
        </div>
    );
};

export default HomePage;
