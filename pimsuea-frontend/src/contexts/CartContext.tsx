import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    getCartFromDB,
    upsertCartItemToDB,
    updateCartItemInDB,
    removeCartItemFromDB,
    clearCartInDB,
} from '@/services/api';
import { useAuth } from './AuthContext';

// Define the shape of a Cart Item
export interface CartItem {
    id: string; // Unique ID for the cart entry (e.g. uuid)
    product_id: string | number;
    color_id: string;
    size: string;
    quantity: number;
    design_id?: string; // Link to saved design
    print_file_url: string; // High-Res URL
    design_json: object; // Editable design (not persisted to DB)
    preview_url?: string; // For UI display
    price?: number; // Optional, recalculated at checkout
    design_name?: string;
    is_gift?: boolean;
    gift_message?: string | null;
    gift_recipient?: import('@/types/gift').GiftRecipientInfo | null;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: Omit<CartItem, 'id'>) => string;
    removeFromCart: (id: string) => void;
    updateCartItem: (id: string, updates: Partial<CartItem>) => void;
    clearCart: () => void;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const { user } = useAuth();

    // Load from DB when user is authenticated; clear on logout
    useEffect(() => {
        setCartItems([]);
        if (!user) return;

        const loadCart = async () => {
            try {
                const items = await getCartFromDB();
                if (items.length > 0) {
                    setCartItems(items as CartItem[]);
                } else {
                    // One-time migration from localStorage
                    const stored = localStorage.getItem('pim_suea_cart');
                    if (stored) {
                        try {
                            const local: CartItem[] = JSON.parse(stored);
                            if (local.length > 0) {
                                setCartItems(local);
                                local.forEach(item => upsertCartItemToDB(item).catch(() => {}));
                            }
                        } catch { /* malformed localStorage data — ignore */ }
                        localStorage.removeItem('pim_suea_cart');
                    }
                }
            } catch {
                // Offline fallback: use localStorage
                const stored = localStorage.getItem('pim_suea_cart');
                if (stored) {
                    try { setCartItems(JSON.parse(stored)); } catch { /* ignore */ }
                }
            }
        };
        loadCart();
    }, [user?.id]); // Re-run when user changes; fires after auth resolves

    const addToCart = (item: Omit<CartItem, 'id'>): string => {
        const id = crypto.randomUUID();
        const newItem = { ...item, id };
        setCartItems(prev => [...prev, newItem]);
        upsertCartItemToDB(newItem).catch(console.error);
        return id;
    };

    const removeFromCart = (id: string) => {
        setCartItems(prev => prev.filter(i => i.id !== id));
        removeCartItemFromDB(id).catch(console.error);
    };

    const updateCartItem = (id: string, updates: Partial<CartItem>) => {
        setCartItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
        updateCartItemInDB(id, updates).catch(console.error);
    };

    const clearCart = () => {
        setCartItems([]);
        clearCartInDB().catch(console.error);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateCartItem,
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
