import { 
  Product, 
  CategoryInfo, 
  Coupon, 
  BusinessInfo, 
  Order, 
  OrderStatus, 
  AdminStats,
  AIRecommendationResponse 
} from '../types';

export const api = {
  // Business Info
  async getBusinessInfo(): Promise<BusinessInfo> {
    try {
      const res = await fetch('/api/business');
      if (!res.ok) throw new Error('Failed to fetch business info');
      return await res.json();
    } catch (e) {
      console.warn('API getBusinessInfo fallback', e);
      const { INITIAL_BUSINESS_INFO } = await import('../data/initialData');
      return INITIAL_BUSINESS_INFO;
    }
  },

  async updateBusinessInfo(info: Partial<BusinessInfo>, token: string): Promise<BusinessInfo> {
    const res = await fetch('/api/business', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(info)
    });
    if (!res.ok) throw new Error('Failed to update business info');
    return await res.json();
  },

  // Categories
  async getCategories(): Promise<CategoryInfo[]> {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    } catch (e) {
      const { INITIAL_CATEGORIES } = await import('../data/initialData');
      return INITIAL_CATEGORIES;
    }
  },

  async addCategory(cat: CategoryInfo, token: string): Promise<CategoryInfo> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(cat)
    });
    if (!res.ok) throw new Error('Failed to add category');
    return await res.json();
  },

  async deleteCategory(id: string, action: 'recategorize' | 'remove', token: string): Promise<{ success: boolean; affectedCount: number }> {
    const res = await fetch(`/api/categories/${id}?action=${action}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to delete category');
    return await res.json();
  },

  // Products
  async getProducts(params?: { category?: string; search?: string; isBestSeller?: boolean }): Promise<Product[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.append('category', params.category);
      if (params?.search) query.append('search', params.search);
      if (params?.isBestSeller) query.append('isBestSeller', 'true');

      const res = await fetch(`/api/products?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return await res.json();
    } catch (e) {
      const { INITIAL_PRODUCTS } = await import('../data/initialData');
      let items = INITIAL_PRODUCTS;
      if (params?.category) items = items.filter(p => p.category === params.category);
      if (params?.search) {
        const q = params.search.toLowerCase();
        items = items.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
      }
      return items;
    }
  },

  async addProduct(product: Partial<Product>, token: string): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Failed to add product');
    return await res.json();
  },

  async updateProduct(id: string, product: Partial<Product>, token: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Failed to update product');
    return await res.json();
  },

  async deleteProduct(id: string, token: string): Promise<boolean> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return true;
  },

  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    try {
      const res = await fetch('/api/coupons');
      if (!res.ok) throw new Error('Failed to fetch coupons');
      return await res.json();
    } catch (e) {
      const { INITIAL_COUPONS } = await import('../data/initialData');
      return INITIAL_COUPONS;
    }
  },

  async addCoupon(coupon: Coupon, token: string): Promise<Coupon> {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(coupon)
    });
    if (!res.ok) throw new Error('Failed to create coupon');
    return await res.json();
  },

  // Orders
  async getOrders(userId?: string): Promise<Order[]> {
    try {
      const url = userId ? `/api/orders?userId=${userId}` : '/api/orders';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return await res.json();
    } catch (e) {
      const { SAMPLE_ORDERS } = await import('../data/initialData');
      return SAMPLE_ORDERS;
    }
  },

  async createOrder(orderData: any): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to place order');
    }
    return await res.json();
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, token?: string): Promise<Order> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return await res.json();
  },

  // Owner Auth & Stats
  async adminLogin(passcode: string): Promise<{ success: boolean; token: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    });
    if (!res.ok) {
      throw new Error('Invalid owner security passcode');
    }
    return await res.json();
  },

  async getAdminStats(token: string): Promise<AdminStats> {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return await res.json();
  },

  // AI Shopping Assistant
  async getAIRecommendation(prompt: string, budget?: number): Promise<AIRecommendationResponse> {
    const res = await fetch('/api/ai/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt: prompt, budget })
    });
    if (!res.ok) throw new Error('Failed to get AI recommendation');
    return await res.json();
  }
};
