import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the shape of a Cart Item
export interface CartItem {
    id: string; // Unique ID for the cart entry (e.g. uuid)
    product_id: string | number;
    color_id: string;
    size: string;
    quantity: number;
    print_file_url: string; // High-Res URL
    design_json: object; // Editable design
    preview_url?: string; // For UI display
    price?: number; // Optional, can be fetched at checkout
    design_name?: string;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: Omit<CartItem, 'id'>) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // Load from LocalStorage on mount
    useEffect(() => {
        const storedCart = localStorage.getItem('pim_suea_cart');
        if (storedCart) {
            try {
                setCartItems(JSON.parse(storedCart));
            } catch (error) {
                console.error("Failed to parse cart data:", error);
                localStorage.removeItem('pim_suea_cart');
            }
        }
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        localStorage.setItem('pim_suea_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (item: Omit<CartItem, 'id'>) => {
        const newItem = { ...item, id: crypto.randomUUID() };
        setCartItems(prev => [...prev, newItem]);
    };

    const removeFromCart = (id: string) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <CartContext.Provider value={{ 
            cartItems, 
            addToCart, 
            removeFromCart, 
            clearCart,
            cartCount: cartItems.length 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
