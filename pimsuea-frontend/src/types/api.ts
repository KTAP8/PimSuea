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

export interface ProductTemplate {
    id: string;
    product_id: string; // uuid
    side: string; // 'front', 'back', 'left_sleeve', etc.
    display_name: string; // Thai label
    image_url: string; // URL to blank template
    print_area_config: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    category_id: number;
    is_beginner_friendly: boolean;
    sold_count?: number; // Optional as not all endpoints might return it
    rating?: number;    // Optional
    templates?: ProductTemplate[];
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

export interface Order {
    id: number;
    user_id: string;
    total_amount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    created_at: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
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
