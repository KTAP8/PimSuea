import axios from 'axios';
import { supabase } from '@/lib/supabase';
import type { 
    Category, 
    DashboardData, 
    Product, 
    Order, 
    Transaction,
    News,
    ProductTemplate
} from '@/types/api';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // Fallback for dev
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Supabase Token
api.interceptors.request.use(async (config) => {
    try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error("Error fetching session for API request:", error);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// API Methods
export const getDashboard = async (): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
};

export const getNewsById = async (id: string | number): Promise<News> => {
    // Assuming backend has an endpoint for single article/news
    // If not, we might need to rely on what we have or ask backend to add it.
    // For now, assume standard REST pattern: /articles/:id
    const response = await api.get<News>(`/articles/${id}`); 
    return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/catalog/categories');
    return response.data;
};

export interface GetProductsParams {
    category_id?: number | null;
    is_beginner_friendly?: boolean;
}

export const getProducts = async (params?: GetProductsParams): Promise<Product[]> => {
    const response = await api.get<Product[]>('/catalog/products', { params });
    return response.data;
};

export const getProductById = async (id: string | number): Promise<Product> => {
    const response = await api.get<Product>(`/catalog/products/${id}`);
    return response.data;
};

export const getProductTemplates = async (id: string | number): Promise<ProductTemplate[]> => {
    const response = await api.get<ProductTemplate[]>(`/catalog/products/${id}/templates`);
    return response.data;
};

export const getMyDesigns = async (): Promise<any[]> => { // Type 'any' for now, can refine later
    const response = await api.get('/designs');
    return response.data;
};

export const getDesignById = async (id: string): Promise<any> => {
    const response = await api.get(`/designs/${id}`);
    return response.data;
};

export const updateDesign = async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/designs/${id}`, data);
    return response.data;
};

export const deleteDesign = async (id: string): Promise<any> => {
    const response = await api.delete(`/designs/${id}`);
    return response.data;
};

export const getMyOrders = async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders');
    return response.data;
};

export const getWallet = async (): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/wallet/transactions');
    return response.data;
};

export const createOrder = async (orderData: any): Promise<any> => {
    const response = await api.post('/orders', orderData);
    return response.data;
};

export const updateOrder = async (id: number | string, data: any): Promise<any> => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
};

export default api;
