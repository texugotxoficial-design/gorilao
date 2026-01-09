
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    id: string;
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
    extras: { name: string, price: number }[];
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: any, extras: any[]) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, delta: number) => void;
    clearCart: () => void;
    subtotal: number;
    total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product: any, selectedExtras: any[]) => {
        const extras = selectedExtras.map((e: any) => ({ name: e.name, price: Number(e.price) }));
        const extrasTotal = extras.reduce((acc: number, curr: any) => acc + curr.price, 0);

        // Use promo_price if on promotion, otherwise use regular price
        const basePrice = (product.is_promotion && product.promo_price)
            ? Number(product.promo_price)
            : Number(product.price);

        // Create a unique key for the item based on ID and extras
        const extrasKey = extras.map((e: any) => e.name).sort().join('|');
        const itemId = `${product.id}-${extrasKey}`;

        setCartItems(prev => {
            const existing = prev.find(item => item.id === itemId);
            if (existing) {
                return prev.map(item =>
                    item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, {
                id: itemId,
                product_id: product.id,
                name: product.name,
                price: basePrice + extrasTotal,
                quantity: 1,
                image_url: product.image_url,
                extras
            }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCartItems(prev => prev.filter(item => item.id !== itemId));
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCartItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        ));
    };

    const clearCart = () => setCartItems([]);

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const total = subtotal + 5.00; // Fixed delivery fee for now

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        total
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
