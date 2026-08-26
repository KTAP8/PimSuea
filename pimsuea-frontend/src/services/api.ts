import axios from 'axios';
import { supabase } from '@/lib/supabase';
import type {
    Category,
    DashboardData,
    Product,
    Order,
    Transaction,
    News,
    ProductTemplate,
    PriceInput,
    PriceBreakdown,
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

export const getPrice = async (input: PriceInput): Promise<PriceBreakdown> => {
    const response = await api.post<PriceBreakdown>('/pricing', input);
    return response.data;
};

export const createOrder = async (orderData: any): Promise<any> => {
    const response = await api.post('/orders', orderData);
    return response.data;
};

export interface CheckoutSessionResponse {
    url: string;
    sessionId: string;
}

export interface CheckoutSessionStatus {
    status: 'paid' | 'pending' | 'expired';
    orderId?: string;
}

export const createCheckoutSession = async (orderData: {
    items: unknown[];
    shipping: unknown;
    coupon_code?: string | null;
}): Promise<CheckoutSessionResponse> => {
    const response = await api.post<CheckoutSessionResponse>('/payments/checkout-session', orderData);
    return response.data;
};

export const getCheckoutSessionStatus = async (sessionId: string): Promise<CheckoutSessionStatus> => {
    const response = await api.get<CheckoutSessionStatus>(`/payments/session/${sessionId}`);
    return response.data;
};

export const recordTermsAcceptance = async (): Promise<void> => {
    await api.post('/terms/accept');
};

export const updateOrder = async (id: number | string, data: any): Promise<any> => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
};

export interface PrintComposeLayer {
    src: string;
    relX: number;
    relY: number;
    relW: number;
    relH: number;
    rotation?: number;
}

export interface PrintComposeSide {
    physical_w_cm?: number;
    physical_h_cm?: number;
    layers: PrintComposeLayer[];
}

/** Server-side LANCZOS print compose from original R2 assets (300 DPI PNG). */
export const composePrintFiles = async (
    sides: Record<string, PrintComposeSide>,
): Promise<Record<string, string>> => {
    const response = await api.post<{ urls: Record<string, string> }>('/print/compose', { sides });
    return response.data.urls;
};

export const uploadFile = async (file: Blob | File, type: 'preview' | 'print' | 'asset', fileName?: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (fileName) {
        formData.append('fileName', fileName);
    }

    const response = await api.post('/uploads', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data.url;
};

// Cart API
export const getCartFromDB = async (): Promise<any[]> => {
    const response = await api.get('/cart');
    return response.data;
};

export const upsertCartItemToDB = async (item: any): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { design_json, price, priceBreakdown, availableSizes, availableColors, sizeGuide, ...rest } = item;
    await api.post('/cart/items', rest);
};

export const updateCartItemInDB = async (id: string, updates: Record<string, any>): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { design_json, price, priceBreakdown, availableSizes, availableColors, sizeGuide, ...rest } = updates;
    await api.put(`/cart/items/${id}`, rest);
};

export const removeCartItemFromDB = async (id: string): Promise<void> => {
    await api.delete(`/cart/items/${id}`);
};

export const clearCartInDB = async (): Promise<void> => {
    await api.delete('/cart');
};

// Public endpoint — no auth token needed
const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api';

/**
 * Routes Cloudflare R2 URLs through the backend proxy so canvas/mockup code can load
 * them with crossOrigin: 'anonymous' without browser CORS errors.
 * Handles both r2.dev public domains and *.r2.cloudflarestorage.com bucket URLs.
 */
export function r2ProxyUrl(url: string): string {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return url;
  const isR2 =
    url.includes('.r2.dev/') ||
    url.includes('.r2.cloudflarestorage.com/');
  if (!isR2) return url;
  return `${API_BASE}/uploads/proxy?url=${encodeURIComponent(url)}`;
}
// Public endpoint — no auth required
export const fetchDeliveryFee = async (qty: number): Promise<{ fee: number; label: string }> => {
    const response = await axios.get<{ fee: number; label: string }>(`${API_BASE}/delivery-fee?qty=${qty}`);
    return response.data;
};

export const fetchAddons = async (): Promise<import('@/types/gift').AddonPricing[]> => {
    const response = await axios.get<import('@/types/gift').AddonPricing[]>(`${API_BASE}/addons`);
    return response.data;
};

export interface CouponValidationResult {
    valid: boolean;
    reason?: string;
    code?: string;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    max_discount_thb?: number | null;
    max_qty?: number | null;
    allowed_printing_types?: string[] | null;
}

export const validateCoupon = async (code: string): Promise<CouponValidationResult> => {
    const response = await api.get<CouponValidationResult>(`/coupons/validate?code=${encodeURIComponent(code)}`);
    return response.data;
};

export const joinWaitlist = async (payload: { name: string; email: string; reason: string }): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>(`${API_BASE}/waitlist`, payload);
    return response.data;
};

export interface PriceEstimate {
  shirt_per_unit: number;
  front_print_per_unit: number;
  back_print_per_unit: number;
  total_per_unit: number;
  total: number;
  quantity: number;
}

export const estimatePrice = async (params: {
  productId: string;
  colorName: 'White' | 'Black';
  size: string;
  quantity: number;
  printingType: string;
  frontTier?: string;
  backTier?: string;
}): Promise<PriceEstimate> => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
  const { data } = await api.get<PriceEstimate>(`/pricing/estimate?${qs}`);
  return data;
};

export default api;
