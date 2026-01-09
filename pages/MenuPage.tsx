
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../contexts/CartContext';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
}

interface Extra {
    id: string;
    name: string;
    price: number;
    category: string;
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
    is_promotion?: boolean;
}

const MenuPage: React.FC = () => {
    const { addToCart, subtotal, cartItems } = useCart();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [extras, setExtras] = useState<Extra[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
    const [addedToast, setAddedToast] = useState<string | null>(null);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('public-menu')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'extras' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        try {
            const [catRes, prodRes, extraRes] = await Promise.all([
                supabase.from('categories').select('*').order('display_order'),
                supabase.from('products').select('*'),
                supabase.from('extras').select('*')
            ]);

            if (catRes.data) setCategories(catRes.data);
            if (prodRes.data) setProducts(prodRes.data);
            if (extraRes.data) setExtras(extraRes.data);
        } catch (err) {
            console.error("Error fetching menu data:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const isAvailable = product.is_available !== false;
        const matchesCategory = selectedCategory ? product.category_id === selectedCategory : true;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase());
        return isAvailable && matchesCategory && matchesSearch;
    });

    const handleSelectProduct = (product: Product) => {
        const productCategory = categories.find(c => c.id === product.category_id);
        const categoryName = productCategory?.name.toLowerCase() || '';
        const categorySlug = productCategory?.slug.toLowerCase() || '';
        const isDrink = categoryName.includes('bebida') || categorySlug.includes('bebida') || categorySlug.includes('drink');
        const hasExtras = extras.some(e => e.category === productCategory?.slug);

        if (isDrink || !hasExtras) {
            addToCart(product, []);
            showAddedToast(product.name);
        } else {
            setSelectedProduct(product);
        }
    };

    const showAddedToast = (name: string) => {
        setAddedToast(name);
        setTimeout(() => setAddedToast(null), 2000);
    };

    const handleAddToCart = (product: Product) => {
        const selectedExtrasObjects = extras.filter(e => selectedExtras.includes(e.id));
        addToCart(product, selectedExtrasObjects);
        setSelectedProduct(null);
        setSelectedExtras([]);
        showAddedToast(product.name);
    };

    const toggleExtra = (extraId: string) => {
        setSelectedExtras(prev =>
            prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]
        );
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark pb-10">
            {/* Added Toast */}
            {addedToast && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-3 rounded-2xl font-black shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    {addedToast} adicionado! 🦍🔥
                </div>
            )}

            {/* Sticky Category Bar - Mobile Optimized */}
            <div className="sticky top-[60px] lg:top-[64px] z-[80] bg-background-dark/95 backdrop-blur-md border-b border-border-dark py-3 px-4 overflow-x-auto no-scrollbar flex items-center gap-2">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap font-bold text-xs transition-all ${selectedCategory === null ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-dark text-gray-400'}`}
                >
                    <Icon name="grid_view" className="text-base" />
                    Todos
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap font-bold text-xs transition-all ${selectedCategory === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-dark text-gray-400'}`}
                    >
                        <Icon name={cat.icon || 'star'} className="text-base" />
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <main className="flex-1 px-4 py-4 max-w-5xl mx-auto w-full">
                {/* Search Bar - Visible on Mobile */}
                <div className="mb-6 lg:hidden">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                            <Icon name="search" className="text-lg" />
                        </div>
                        <input
                            className="block w-full pl-10 pr-4 py-3 bg-surface-dark border-none rounded-2xl text-white placeholder-gray-500 focus:ring-2 focus:ring-primary text-sm shadow-xl"
                            placeholder="O que você quer comer hoje?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-surface-dark rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => handleSelectProduct(product)}
                                className="bg-surface-dark rounded-[24px] border border-border-dark overflow-hidden flex flex-row h-32 hover:border-primary/50 transition-all active:scale-[0.98] cursor-pointer group shadow-lg relative"
                            >
                                <div className="w-32 h-full relative overflow-hidden shrink-0">
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    {product.is_featured && (
                                        <div className="absolute top-0 left-0 bg-yellow-500 text-black text-[8px] font-black px-2 py-0.5 rounded-br-lg uppercase tracking-tighter">
                                            Destaque
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow p-3 flex flex-col justify-between overflow-hidden">
                                    <div>
                                        <h3 className="font-bold text-sm leading-none truncate mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                                        <p className="text-gray-400 text-[10px] line-clamp-2 leading-tight">{product.description}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            {product.is_promotion && product.promo_price ? (
                                                <>
                                                    <span className="text-[10px] text-gray-500 line-through leading-none">{formatPrice(product.price)}</span>
                                                    <span className="font-black text-primary text-base">{formatPrice(product.promo_price)}</span>
                                                </>
                                            ) : (
                                                <span className="font-black text-primary text-base">{formatPrice(product.price)}</span>
                                            )}
                                        </div>
                                        <div className="bg-primary/10 text-primary p-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                                            <Icon name="add" className="text-xl" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Icon name="search_off" className="text-5xl text-gray-600 mb-4" />
                        <h3 className="font-bold text-lg mb-1">Nada encontrado</h3>
                        <p className="text-gray-500 text-sm">Tente outro filtro ou busca.</p>
                    </div>
                )}
            </main>

            {/* Extras Sheet (Modal) */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}></div>
                    <div className="relative bg-surface-dark w-full max-w-lg rounded-t-[32px] sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="p-1 text-center sm:hidden">
                            <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto my-2"></div>
                        </div>
                        <div className="h-40 relative">
                            <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full">
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
                            <div>
                                <h2 className="text-2xl font-black italic">{selectedProduct.name}</h2>
                                <p className="text-gray-400 text-sm">{selectedProduct.description}</p>
                            </div>

                            <div className="flex flex-col gap-3 pb-20">
                                <h3 className="font-bold text-primary flex items-center gap-2 text-sm uppercase tracking-widest">
                                    <Icon name="add_circle" className="text-lg" />
                                    Adicionais
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {extras
                                        .filter(extra => {
                                            const productCategory = categories.find(c => c.id === selectedProduct.category_id);
                                            return extra.category === productCategory?.slug;
                                        })
                                        .map(extra => (
                                            <button
                                                key={extra.id}
                                                onClick={() => toggleExtra(extra.id)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedExtras.includes(extra.id) ? 'bg-primary/10 border-primary text-white' : 'bg-background-dark/50 border-border-dark text-gray-400'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-6 rounded-lg flex items-center justify-center border ${selectedExtras.includes(extra.id) ? 'bg-primary border-primary text-white' : 'border-gray-600'}`}>
                                                        {selectedExtras.includes(extra.id) && <Icon name="check" className="text-base" />}
                                                    </div>
                                                    <span className="font-bold text-sm tracking-tight">{extra.name}</span>
                                                </div>
                                                <span className="font-black text-xs">+{formatPrice(extra.price)}</span>
                                            </button>
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Action Button at bottom of modal */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-surface-dark/95 backdrop-blur-md border-t border-border-dark">
                            <button
                                onClick={() => handleAddToCart(selectedProduct)}
                                className="w-full flex items-center justify-between px-6 rounded-2xl h-14 bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-95"
                            >
                                <span>Adicionar</span>
                                <span>{formatPrice((selectedProduct.is_promotion && selectedProduct.promo_price ? selectedProduct.promo_price : selectedProduct.price) + extras.filter(e => selectedExtras.includes(e.id)).reduce((acc, curr) => acc + Number(curr.price), 0))}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Cart (Smaller on mobile) */}
            {cartItems.length > 0 && !selectedProduct && (
                <div className="fixed bottom-20 left-4 right-4 z-[90] animate-in slide-in-from-bottom-5 duration-500 lg:bottom-10 lg:left-auto lg:right-10">
                    <Link to="/cart" className="flex items-center justify-between bg-primary text-white rounded-2xl px-6 py-4 shadow-2xl shadow-primary/30 h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Icon name="shopping_cart" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}</span>
                                <span className="text-lg font-black">{formatPrice(subtotal)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 font-black text-sm uppercase">
                            Ver Carrinho <Icon name="chevron_right" />
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default MenuPage;
