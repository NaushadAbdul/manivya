import { db, doc, setDoc, deleteDoc } from '../lib/firebase';
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
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        const createdOrder: Order = await res.json();

        // Sync order to Firestore if not pending
        if (createdOrder.orderStatus !== 'pending') {
          try {
            await setDoc(doc(db, 'orders', createdOrder.id), {
              id: createdOrder.id,
              userId: createdOrder.userId || 'guest',
              customerName: createdOrder.userName,
              phone: createdOrder.userPhone,
              address: createdOrder.deliveryAddress?.fullAddress || '',
              items: createdOrder.items,
              totalAmount: createdOrder.grandTotal,
              paymentMethod: createdOrder.paymentMethod,
              status: createdOrder.orderStatus,
              createdAt: createdOrder.createdAt
            }, { merge: true });
          } catch (e) {
            console.warn('Firestore order sync error:', e);
          }
        }

        return createdOrder;
      } else {
        const err = await res.json().catch(() => ({}));
        if (err && err.error) {
          throw new Error(err.error);
        }
      }
    } catch (err: any) {
      // Re-throw if it was a explicit business validation error (e.g. empty cart, invalid phone)
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('initialize order checkout') && !err.message.includes('Unexpected token')) {
        throw err;
      }
      console.warn('/api/orders endpoint unavailable, using client fallback order creation');
    }

    // Client-side fallback order creation (e.g., when API endpoint is unavailable on static deployments like Vercel)
    const items = orderData.items || [];
    let itemTotal = 0;
    const processedItems = items.map((item: any) => {
      const unitPrice = item.price || 0;
      const qty = Math.max(1, Number(item.quantity) || 1);
      itemTotal += unitPrice * qty;
      return {
        productId: item.productId,
        productName: item.productName || 'Item',
        brand: item.brand || 'MANIVYA',
        unit: item.unit || '1 Pc',
        price: unitPrice,
        quantity: qty,
        image: item.image
      };
    });

    const deliveryFee = itemTotal >= 299 ? 0 : 15;
    const handlingFee = 5;
    const grandTotal = Math.max(0, itemTotal + deliveryFee + handlingFee);
    const orderId = `MNE-${Math.floor(1000 + Math.random() * 9000)}`;

    const fallbackOrder: Order = {
      id: orderId,
      userId: orderData.userId || `usr-${Date.now()}`,
      userName: (orderData.userName || 'Valued Customer').trim(),
      userPhone: (orderData.userPhone || '7207554777').replace(/\D/g, '').slice(-10) || '7207554777',
      userEmail: orderData.userEmail || '',
      idempotencyKey: orderData.idempotencyKey || `chk-${Date.now()}`,
      items: processedItems,
      deliveryAddress: orderData.deliveryAddress || {
        id: `addr-${Date.now()}`,
        title: 'Home',
        fullAddress: '25-1-13, Gajuwaka Bypass Road, Visakhapatnam',
        area: 'Visakhapatnam',
        pincode: '530026'
      },
      itemTotal,
      deliveryFee,
      handlingFee,
      discountAmount: 0,
      couponCodeApplied: orderData.couponCodeApplied,
      grandTotal,
      paymentMethod: orderData.paymentMethod || 'UPI',
      paymentStatus: 'pending',
      orderStatus: orderData.initialStatus || 'pending',
      createdAt: new Date().toISOString(),
      deliveryEtaMinutes: 12,
      driverName: 'Ramu K. (MANIVYA Rider)',
      driverPhone: '7207554777'
    };

    try {
      await setDoc(doc(db, 'orders', fallbackOrder.id), {
        id: fallbackOrder.id,
        userId: fallbackOrder.userId || 'guest',
        customerName: fallbackOrder.userName,
        phone: fallbackOrder.userPhone,
        address: fallbackOrder.deliveryAddress?.fullAddress || '',
        items: fallbackOrder.items,
        totalAmount: fallbackOrder.grandTotal,
        paymentMethod: fallbackOrder.paymentMethod,
        status: fallbackOrder.orderStatus,
        createdAt: fallbackOrder.createdAt
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore fallback order sync warning:', e);
    }

    return fallbackOrder;
  },

  async confirmOrder(orderId: string, details?: { txnRef?: string; paymentStatus?: string; paymentMethod?: string }): Promise<Order> {
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details || {})
      });
      if (res.ok) {
        const confirmedOrder: Order = await res.json();
        try {
          await setDoc(doc(db, 'orders', confirmedOrder.id), {
            id: confirmedOrder.id,
            userId: confirmedOrder.userId || 'guest',
            customerName: confirmedOrder.userName,
            phone: confirmedOrder.userPhone,
            address: confirmedOrder.deliveryAddress?.fullAddress || '',
            items: confirmedOrder.items,
            totalAmount: confirmedOrder.grandTotal,
            paymentMethod: confirmedOrder.paymentMethod,
            status: confirmedOrder.orderStatus,
            createdAt: confirmedOrder.createdAt
          }, { merge: true });
        } catch (e) {
          console.warn('Firestore order sync error:', e);
        }
        return confirmedOrder;
      }
    } catch (e) {
      console.warn('/api/orders/confirm endpoint error, falling back to client order confirmation:', e);
    }

    const fallbackConfirmed: Order = {
      id: orderId,
      userId: 'usr-guest',
      userName: 'Valued Customer',
      userPhone: '7207554777',
      userEmail: '',
      items: [],
      deliveryAddress: {
        id: 'addr-1',
        title: 'Home',
        fullAddress: 'Visakhapatnam',
        area: 'Visakhapatnam',
        pincode: '530026'
      },
      itemTotal: 0,
      deliveryFee: 0,
      handlingFee: 5,
      discountAmount: 0,
      grandTotal: 0,
      paymentMethod: (details?.paymentMethod as any) || 'COD',
      paymentStatus: (details?.paymentStatus as any) || 'pending',
      orderStatus: 'placed',
      createdAt: new Date().toISOString(),
      deliveryEtaMinutes: 10,
      driverName: 'Ramu K. (MANIVYA Rider)',
      driverPhone: '7207554777'
    };

    try {
      await setDoc(doc(db, 'orders', orderId), {
        id: orderId,
        status: 'placed',
        paymentMethod: details?.paymentMethod || 'COD',
        paymentStatus: details?.paymentStatus || 'pending'
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore fallback confirm warning:', e);
    }

    return fallbackConfirmed;
  },

  async cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; order?: Order }> {
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        const data = await res.json();
        try {
          await deleteDoc(doc(db, 'orders', orderId)).catch(() => {});
          await setDoc(doc(db, 'orders', orderId), { status: 'cancelled' }, { merge: true }).catch(() => {});
        } catch (e) {
          console.warn('Firestore cancel sync warning:', e);
        }
        return data;
      }
    } catch (e) {
      console.warn('/api/orders/cancel endpoint unavailable, processing client-side cancellation:', e);
    }

    try {
      await setDoc(doc(db, 'orders', orderId), { status: 'cancelled' }, { merge: true }).catch(() => {});
    } catch (e) {
      console.warn('Firestore fallback cancel error:', e);
    }

    return { success: true };
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      throw new Error('Failed to delete order');
    }
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (e) {
      console.warn('Firestore delete sync error:', e);
    }
    return true;
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

  // Auth & Admin API
  async adminLogin(payload: { email?: string; password?: string; passcode?: string } | string): Promise<{ success: boolean; token: string; user?: any }> {
    const body = typeof payload === 'string' 
      ? { passcode: payload, email: 'admin@manivya.com' } 
      : payload;

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Invalid admin credentials');
    }
    return data;
  },

  async userLogin(email: string, password: string): Promise<{ success: boolean; token: string; user: any }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Login failed');
    }
    return data;
  },

  async userRegister(userData: { name: string; email: string; password: string; phone?: string }): Promise<{ success: boolean; token: string; user: any }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Registration failed');
    }
    return data;
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
  },

  // MongoDB Atlas Diagnostics
  async getMongoDBStatus(): Promise<{
    databaseType: string;
    isConnected: boolean;
    readyState: number;
    connectionError: string | null;
    uriConfigured: boolean;
    collections: {
      productsCount: number;
      ordersCount: number;
      categoriesCount: number;
      couponsCount: number;
    };
  }> {
    const res = await fetch('/api/mongodb/status');
    if (!res.ok) throw new Error('Failed to fetch MongoDB status');
    return await res.json();
  },

  async connectMongoDB(mongoUri?: string): Promise<any> {
    const res = await fetch('/api/mongodb/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mongoUri })
    });
    if (!res.ok) throw new Error('Failed to trigger MongoDB connection');
    return await res.json();
  }
};

