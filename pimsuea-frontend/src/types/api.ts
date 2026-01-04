export interface User {
    id: string;
    email: string;
    // Add other user fields as needed
}

export interface Category {
    id: number;
    name: string;
    icon: string;
}

export interface Color {
    id: string;
    name: string;
    hex_code: string;
}

export interface ProductTemplate {
    id: string;
    product_id: string; // uuid
    side: string; // 'front', 'back', 'left_sleeve', etc.
    image_url: string; // URL to blank template
    print_area_config: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    color_id?: string;
    is_default?: boolean;
    color?: Color;
}

export interface PrintPricingTier {
    print_method_id: string;
    min_quantity: number;
    unit_price: number;
}

export interface PrintMethod {
    id: string; // e.g., 'dtg', 'dtf'
    name: string;
    description: string;
    tiers?: PrintPricingTier[];
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    starting_price?: number; // New calculated field
    image_url?: string;
    category_id: number;
    is_beginner_friendly: boolean;
    sold_count?: number; 
    rating?: number;    
    templates?: ProductTemplate[];
    print_methods?: PrintMethod[]; // New field
    size_guide?: any;
    print_pricing_tiers?: any[];
}

export interface News {
    id: number;
    title: string;
    description: string; // Summary/Excerpt
    content?: string;    // Full content
    image_url?: string;
    type?: string;       // e.g., 'promotion', 'news', 'update'
    published_at?: string;
    color_class?: string; // For UI styling if needed
    created_at?: string;
}

export interface ShippingInfo {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    province: string;
    district: string;
    postalCode: string;
}

export interface Order {
    id: number;
    user_id: string;
    total_amount: number;
    status: string; // 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'pending_payment'
    created_at: string;
    items?: OrderItem[];
    shipping_address?: ShippingInfo;
    payment_method?: string;
}

export interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    image?: string;
}

export interface Transaction {
    id: number;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'purchase';
    description: string;
    created_at: string;
}

export interface DashboardData {
    news: News[];
    bestSellers: Product[];
}
