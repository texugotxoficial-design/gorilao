
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
    image_url: string;
    category_id: string;
    is_featured?: boolean;
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
        const matchesCategory = selectedCategory ? product.category_id === selectedCategory : true;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleAddToCart = (product: Product) => {
        const selectedExtrasObjects = extras.filter(e => selectedExtras.includes(e.id));
        addToCart(product, selectedExtrasObjects);
        setSelectedProduct(null);
        setSelectedExtras([]);
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
        <div className="bg-background-dark text-white font-display">
            <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
                <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border-dark bg-background-dark/95 backdrop-blur-md px-4 py-3 md:px-10">
                    <Link to="/home" className="flex items-center gap-3 text-primary group">
                        <div className="size-10 flex items-center justify-center bg-primary rounded-lg text-white">
                            <Icon name="lunch_dining" className="text-2xl" />
                        </div>
                        <h2 className="text-white text-xl md:text-2xl font-black leading-tight tracking-[-0.015em]">Gorilão</h2>
                    </Link>

                    <div className="hidden md:flex flex-1 justify-center max-w-xl mx-8">
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                                <Icon name="search" className="text-[20px]" />
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2 border-none rounded-xl bg-surface-dark text-white placeholder-text-secondary focus:ring-2 focus:ring-primary text-sm sm:text-base transition-all"
                                placeholder="Buscar no cardápio..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/cart" className="flex items-center justify-center rounded-lg h-10 w-10 bg-surface-dark text-white hover:bg-primary transition-colors relative">
                            <Icon name="shopping_cart" className="text-[20px]" />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                                </span>
                            )}
                        </Link>
                        <Link to="/dashboard" className="hidden md:flex items-center justify-center rounded-lg h-10 w-10 bg-surface-dark text-white hover:bg-primary transition-colors">
                            <Icon name="receipt_long" className="text-[20px]" />
                        </Link>
                        <Link to="/profile" className="hidden md:flex items-center justify-center rounded-lg h-10 w-10 bg-surface-dark text-white hover:bg-primary transition-colors">
                            <Icon name="person" className="text-[20px]" />
                        </Link>
                        <button className="md:hidden text-white">
                            <Icon name="menu" className="text-[24px]" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-10 py-6">
                    {/* Categories Filter */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-6 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-sm transition-all ${selectedCategory === null ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-dark text-gray-400 hover:bg-border-dark hover:text-white'}`}
                        >
                            <Icon name="grid_view" className="text-[18px]" />
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-sm transition-all ${selectedCategory === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-dark text-gray-400 hover:bg-border-dark hover:text-white'}`}
                            >
                                <Icon name={cat.icon || 'star'} className="text-[18px]" />
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-48 bg-surface-dark rounded-2xl"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="group bg-surface-dark rounded-2xl overflow-hidden border border-border-dark hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5">
                                    <div className="relative h-48 overflow-hidden">
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                                            {product.is_featured && (
                                                <div className="bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter flex items-center gap-1 shadow-lg">
                                                    <Icon name="star" className="text-[12px]" /> Destaque
                                                </div>
                                            )}
                                            <button className="bg-black/50 backdrop-blur-md text-white p-2 rounded-full hover:bg-primary transition-colors">
                                                <Icon name="favorite" className="text-[20px]" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                                            <span className="font-black text-primary text-lg">{formatPrice(product.price)}</span>
                                        </div>
                                        <p className="text-gray-400 text-sm line-clamp-2 min-h-10">{product.description}</p>
                                        <button
                                            onClick={() => {
                                                const productCategory = categories.find(c => c.id === product.category_id);
                                                const categoryName = productCategory?.name.toLowerCase() || '';
                                                const categorySlug = productCategory?.slug.toLowerCase() || '';

                                                // Bypass modal for drinks or if no extras exist for this category
                                                const isDrink = categoryName.includes('bebida') || categorySlug.includes('bebida') || categorySlug.includes('drink');
                                                const hasExtras = extras.some(e => e.category === productCategory?.slug);

                                                if (isDrink || !hasExtras) {
                                                    addToCart(product, []);
                                                } else {
                                                    setSelectedProduct(product);
                                                }
                                            }}
                                            className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl h-12 bg-border-dark hover:bg-primary text-white font-bold transition-all transform active:scale-95 border border-primary/10"
                                        >
                                            <Icon name="add" className="text-[20px]" />
                                            Adicionar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="size-20 bg-surface-dark rounded-full flex items-center justify-center text-gray-500 mb-4">
                                <Icon name="search_off" className="text-4xl" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Nenhum produto encontrado</h3>
                            <p className="text-gray-400">Tente ajustar sua busca ou filtro.</p>
                        </div>
                    )}
                </main>

                {/* Product/Extras Modal */}
                {selectedProduct && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}></div>
                        <div className="relative bg-surface-dark w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                            <div className="relative h-40">
                                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                <button onClick={() => setSelectedProduct(null)} className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition-colors">
                                    <Icon name="close" />
                                </button>
                            </div>
                            <div className="p-6 flex flex-col gap-6">
                                <div>
                                    <h2 className="text-2xl font-black mb-1">{selectedProduct.name}</h2>
                                    <p className="text-gray-400 text-sm">{selectedProduct.description}</p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <h3 className="font-bold text-primary flex items-center gap-2">
                                        <Icon name="add_circle" className="text-[18px]" />
                                        Turbine seu pedido (Opcional)
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
                                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedExtras.includes(extra.id) ? 'bg-primary/10 border-primary text-white' : 'bg-background-dark/50 border-border-dark text-gray-400 hover:border-gray-600'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`size-5 rounded flex items-center justify-center border ${selectedExtras.includes(extra.id) ? 'bg-primary border-primary text-white' : 'border-gray-600'}`}>
                                                            {selectedExtras.includes(extra.id) && <Icon name="check" className="text-[14px]" />}
                                                        </div>
                                                        <span className="font-medium">{extra.name}</span>
                                                    </div>
                                                    <span className="font-bold text-sm">+{formatPrice(extra.price)}</span>
                                                </button>
                                            ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleAddToCart(selectedProduct)}
                                    className="w-full flex items-center justify-center gap-3 rounded-xl h-14 bg-primary hover:bg-red-700 text-white font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-95"
                                >
                                    Confirmar {formatPrice(selectedProduct.price + extras.filter(e => selectedExtras.includes(e.id)).reduce((acc, curr) => acc + Number(curr.price), 0))}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Cart Placeholder */}
                {cartItems.length > 0 && (
                    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-10 duration-500">
                        <Link to="/cart" className="flex items-center gap-4 bg-primary text-white rounded-full pl-6 pr-2 py-2 shadow-[0_10px_40px_rgba(212,17,33,0.4)] hover:scale-105 transition-all group">
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Meu Carrinho</span>
                                <span className="text-lg font-black">{formatPrice(subtotal)}</span>
                            </div>
                            <div className="bg-white text-primary rounded-full p-3 flex items-center justify-center h-12 w-12 shadow-sm">
                                <Icon name="shopping_cart" className="text-[22px]" />
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuPage;
