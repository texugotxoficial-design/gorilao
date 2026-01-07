
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
        <div className="bg-background-dark font-display text-white antialiased overflow-x-hidden">
            <div className="flex flex-col min-h-screen">
                <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-border-dark">
                    <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-[1280px] mx-auto w-full">
                        <Link to="/home" className="flex items-center gap-3 text-white cursor-pointer group">
                            <div className="size-10 flex items-center justify-center bg-primary rounded-lg text-white">
                                <Icon name="lunch_dining" className="text-2xl" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-black leading-tight tracking-[-0.015em] group-hover:text-primary transition-colors">Gorilão</h2>
                        </Link>
                        <nav className="hidden lg:flex items-center gap-8">
                            <Link to="/menu" className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-2">
                                <Icon name="restaurant" className="text-[20px] text-gray-400" /> Cardápio
                            </Link>
                            <Link to="/menu" className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-2">
                                <Icon name="local_offer" className="text-[20px] text-gray-400" /> Promoções
                            </Link>
                            <Link to="/dashboard" className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-2">
                                <Icon name="receipt_long" className="text-[20px] text-gray-400" /> Pedidos
                            </Link>
                            <Link to="/contact" className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-2">
                                <Icon name="call" className="text-[20px] text-gray-400" /> Contato
                            </Link>
                            <Link to="/profile" className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-2">
                                <Icon name="person" className="text-[20px] text-gray-400" /> Perfil
                            </Link>
                        </nav>
                        <div className="flex gap-3">
                            {user ? (
                                <button
                                    onClick={handleSignOut}
                                    className="hidden md:flex cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-border-dark text-white text-sm font-bold hover:bg-[#4a3537] transition-colors border border-primary/20"
                                >
                                    <Icon name="logout" className="mr-2 text-[20px]" />
                                    <span>Sair</span>
                                </button>
                            ) : (
                                <Link to="/login" className="hidden md:flex cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20">
                                    <Icon name="login" className="mr-2 text-[20px]" />
                                    <span>Entrar</span>
                                </Link>
                            )}
                            <Link to="/cart" className="flex cursor-pointer items-center justify-center rounded-lg h-10 px-3 bg-border-dark text-white text-sm font-bold hover:bg-[#4a3537] transition-colors relative">
                                <Icon name="shopping_cart" className="text-[24px]" />
                                {cartItems.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-background-dark">
                                        {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                                    </span>
                                )}
                            </Link>
                            <button className="lg:hidden flex cursor-pointer items-center justify-center rounded-lg h-10 px-3 text-white hover:bg-border-dark transition-colors">
                                <Icon name="menu" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-grow flex flex-col items-center w-full">
                    <div className="w-full max-w-[1280px] px-4 md:px-10 flex flex-col gap-10 py-6 md:py-10">
                        {loading ? (
                            <div className="w-full h-[500px] bg-surface-dark rounded-2xl animate-pulse"></div>
                        ) : heroProduct && (
                            <div className="w-full rounded-2xl overflow-hidden relative min-h-[400px] md:min-h-[500px] flex items-center group shadow-2xl">
                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${heroProduct.image_url}")` }}></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
                                <div className="relative z-10 p-6 md:p-12 max-w-2xl flex flex-col gap-6">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/50 w-fit backdrop-blur-sm">
                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                        <span className="text-primary font-bold text-xs uppercase tracking-wider">
                                            {heroProduct.is_featured ? 'Destaque da Selva' : 'Recomendado'}
                                        </span>
                                    </span>
                                    <div className="flex flex-col gap-2">
                                        <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-[-0.033em]">{heroProduct.name}</h1>
                                        <p className="text-gray-300 text-lg md:text-xl font-medium max-w-md">
                                            {heroProduct.description}
                                        </p>
                                        <div className="mt-2">
                                            <span className="text-3xl font-black text-primary">{formatPrice(heroProduct.price)}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-2">
                                        <Link to="/menu" className="flex items-center justify-center rounded-xl h-12 md:h-14 px-8 bg-primary text-white text-base font-bold tracking-wide hover:bg-red-700 hover:scale-105 transition-all shadow-lg shadow-red-900/30">
                                            Peça Agora
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 1. Highlights Showcase (Destaques) */}
                        {featuredProducts.length > 0 && (
                            <section className="flex flex-col gap-8 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
                                        <Icon name="star" className="text-yellow-500 text-3xl" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic leading-none">Destaques da Selva</h3>
                                        <p className="text-gray-400 font-medium md:text-lg">Os favoritos que você precisa provar.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {featuredProducts.map(fp => (
                                        <Link key={fp.id} to="/menu" className="bg-surface-dark border border-border-dark rounded-[32px] overflow-hidden hover:border-yellow-500/40 transition-all group relative shadow-2xl">
                                            <div className="h-64 overflow-hidden relative">
                                                <img src={fp.image_url} alt={fp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 font-black" />
                                                <div className="absolute top-4 right-4 bg-yellow-500 text-black text-[12px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter flex items-center gap-1 shadow-xl">
                                                    <Icon name="star" className="text-[14px]" /> Destaque
                                                </div>
                                            </div>
                                            <div className="p-8 flex flex-col gap-4">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-black text-2xl group-hover:text-yellow-500 transition-colors leading-tight">{fp.name}</h4>
                                                    <span className="text-yellow-500 font-black text-2xl">{formatPrice(fp.price)}</span>
                                                </div>
                                                <p className="text-gray-400 text-sm md:text-base line-clamp-2 leading-relaxed">{fp.description}</p>
                                                <div className="w-full bg-background-dark/50 py-4 rounded-2xl flex items-center justify-center font-black text-lg group-hover:bg-yellow-500 group-hover:text-black transition-all">
                                                    Experimentar agora!
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 2. Promotions Section (Promoções) */}
                        {products.filter(p => p.is_promotion).length > 0 && (
                            <section className="flex flex-col gap-8 py-10 bg-primary/5 -mx-4 md:-mx-10 px-4 md:px-10 rounded-[48px] border border-primary/10">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <Icon name="local_offer" className="text-primary text-3xl" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic leading-none">Promoções Insanas</h3>
                                        <p className="text-gray-400 font-medium md:text-lg">Preços que vão te deixar louco!</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {products.filter(p => p.is_promotion).map(promo => (
                                        <Link key={promo.id} to="/menu" className="bg-surface-dark border border-border-dark rounded-3xl overflow-hidden hover:border-primary/50 transition-all group shadow-xl">
                                            <div className="h-48 overflow-hidden relative">
                                                <img src={promo.image_url} alt={promo.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                                <div className="absolute bottom-3 left-3 flex flex-col gap-1">
                                                    <span className="text-white font-black text-lg leading-tight truncate">{promo.name}</span>
                                                    <span className="text-primary font-black text-xl">{formatPrice(promo.price)}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 3. New Items (Novidades) */}
                        <section className="flex flex-col gap-8 py-4">
                            <div className="flex items-center gap-4">
                                <div className="size-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                                    <Icon name="new_releases" className="text-indigo-400 text-3xl" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic leading-none">Novidades na Selva</h3>
                                    <p className="text-gray-400 font-medium md:text-lg">Acabaram de sair do fogo!</p>
                                </div>
                            </div>
                            <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
                                {products.slice(0, 8).map(newItem => (
                                    <Link key={newItem.id} to="/menu" className="min-w-[280px] md:min-w-[320px] bg-surface-dark/50 border border-border-dark rounded-3xl p-5 flex flex-col gap-4 hover:border-indigo-400/30 transition-all group snap-start shadow-lg">
                                        <div className="h-44 rounded-2xl overflow-hidden relative">
                                            <img src={newItem.image_url} alt={newItem.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute top-3 right-3 bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">
                                                Novo
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <h4 className="font-bold text-xl leading-tight truncate">{newItem.name}</h4>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-indigo-400 font-black text-lg">{formatPrice(newItem.price)}</span>
                                                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">{categories.find(c => c.id === newItem.category_id)?.name}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* 4. Drinks Section (Bebidas) */}
                        {drinksProducts.length > 0 && (
                            <section className="flex flex-col gap-8 py-10 bg-blue-500/5 -mx-4 md:-mx-10 px-4 md:px-10 rounded-[48px] border border-blue-500/10">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 bg-blue-400/10 rounded-2xl flex items-center justify-center">
                                        <Icon name="local_bar" className="text-blue-400 text-3xl" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic leading-none text-blue-400">Gela Goela</h3>
                                        <p className="text-gray-400 font-medium md:text-lg">Lata trincando de gelada!</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {drinksProducts.map(drink => (
                                        <Link key={drink.id} to="/menu" className="bg-surface-dark/30 border border-border-dark rounded-2xl p-3 flex flex-col gap-3 hover:border-blue-400/40 transition-all group shadow-md">
                                            <div className="aspect-square rounded-xl overflow-hidden relative">
                                                <img src={drink.image_url} alt={drink.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <h4 className="font-bold text-sm truncate">{drink.name}</h4>
                                                <span className="text-blue-400 font-black text-base">{formatPrice(drink.price)}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Big CTA for Full Menu */}
                        <section className="py-20 flex flex-col items-center">
                            <div className="max-w-4xl w-full bg-gradient-to-br from-primary via-[#b91c1c] to-red-950 rounded-[48px] p-10 md:p-20 flex flex-col md:flex-row items-center justify-between gap-10 shadow-3xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-3xl -ml-32 -mb-32"></div>

                                <div className="flex flex-col gap-6 relative z-10 text-center md:text-left">
                                    <h3 className="text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tighter italic">
                                        Ficou na dúvida? <br />
                                        <span className="text-red-200">Veja tudo!</span>
                                    </h3>
                                    <p className="text-white/80 font-medium text-lg md:text-xl max-w-md">
                                        Temos mais de 30 opções de lanches, porções e bebidas esperando por você.
                                    </p>
                                </div>

                                <Link
                                    to="/menu"
                                    className="bg-white text-primary px-10 py-6 rounded-3xl font-black text-2xl shadow-2xl hover:bg-gray-100 hover:scale-105 transition-all group-hover:rotate-1 relative z-10 whitespace-nowrap"
                                >
                                    Abrir Cardápio
                                </Link>
                            </div>
                        </section>

                    </div>
                </main>
                <footer className="bg-border-dark/30 border-t border-border-dark py-12">
                    <div className="max-w-[1280px] mx-auto px-4 md:px-10">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                            <div className="flex flex-col gap-4">
                                <Link to="/home" className="flex items-center gap-3 text-white cursor-pointer group">
                                    <div className="size-8 flex items-center justify-center bg-primary rounded text-white">
                                        <Icon name="lunch_dining" className="text-xl" />
                                    </div>
                                    <h2 className="text-xl font-black tracking-tighter">Gorilão</h2>
                                </Link>
                                <p className="text-gray-500 text-sm max-w-xs">O verdadeiro hambúrguer artesanal para quem tem fome de verdade.</p>
                            </div>
                            <div className="flex gap-8">
                                <div className="flex flex-col gap-4">
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-white">Navegação</h4>
                                    <Link to="/menu" className="text-gray-500 hover:text-primary text-sm transition-colors">Cardápio</Link>
                                    <Link to="/dashboard" className="text-gray-500 hover:text-primary text-sm transition-colors">Meus Pedidos</Link>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <h4 className="font-bold text-sm uppercase tracking-widest text-white">Contato</h4>
                                    <p className="text-gray-500 text-sm">Ribeirão Preto, SP</p>
                                    <p className="text-gray-500 text-sm">(16) 99112-2177</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-white/5 text-center">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">© 2024 Gorilão Lanches. Todos os direitos reservados.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default HomePage;
