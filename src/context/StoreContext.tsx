import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  db,
  doc,
  getDoc,
  setDoc,
  formatNameFromEmail
} from '../lib/firebase';
import { 
  Product, 
  CategoryInfo, 
  CartItem, 
  User, 
  LocationArea, 
  BusinessInfo, 
  ProductCategory,
  Order 
} from '../types';
import { api } from '../services/api';
import { INITIAL_LOCATIONS, INITIAL_BUSINESS_INFO } from '../data/initialData';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface StoreContextType {
  products: Product[];
  categories: CategoryInfo[];
  cart: CartItem[];
  wishlist: string[];
  selectedCategory: ProductCategory | 'all';
  searchQuery: string;
  selectedLocation: LocationArea;
  deliveryLocations: LocationArea[];
  businessInfo: BusinessInfo;
  currentUser: User | null;
  adminToken: string | null;
  toasts: Toast[];

  // Modals
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isLocationModalOpen: boolean;
  isAuthModalOpen: boolean;
  isAIAssistantOpen: boolean;
  isAdminModalOpen: boolean;
  isOrdersModalOpen: boolean;
  quickViewProduct: Product | null;

  // Actions
  setSelectedCategory: (cat: ProductCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  setSelectedLocation: (loc: LocationArea) => void;
  addDeliveryLocation: (location: Omit<LocationArea, 'id'>) => void;
  updateDeliveryLocation: (id: string, location: Partial<LocationArea>) => void;
  deleteDeliveryLocation: (id: string) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsLocationModalOpen: (open: boolean) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setIsAIAssistantOpen: (open: boolean) => void;
  setIsAdminModalOpen: (open: boolean) => void;
  setIsOrdersModalOpen: (open: boolean) => void;
  setQuickViewProduct: (product: Product | null) => void;

  // Cart Operations
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartItemTotal: number;

  // Wishlist
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;

  // Auth & Admin
  loginUser: (user: User) => void;
  logoutUser: () => void;
  updateUserAddress: (newAddress: { fullAddress: string; area: string; pincode: string; title?: string }) => void;
  updateUserProfile: (updatedFields: { name?: string; email?: string; phone?: string }) => void;
  adminLogin: (token: string) => void;
  adminLogout: () => void;

  // Data Refresh
  refreshProducts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshOrders: () => Promise<Order[]>;
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('manivya_user');
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    } catch {
      return null;
    }
  });

  const activeUserId = currentUser?.id || 'guest';
  const cartStorageKey = `manivya_cart_${activeUserId}`;
  const wishlistStorageKey = `manivya_wishlist_${activeUserId}`;

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const initUserId = (() => {
        try {
          const u = localStorage.getItem('manivya_user');
          return u ? (JSON.parse(u)?.id || 'guest') : 'guest';
        } catch { return 'guest'; }
      })();
      const saved = localStorage.getItem(`manivya_cart_${initUserId}`) || localStorage.getItem('manivya_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const initUserId = (() => {
        try {
          const u = localStorage.getItem('manivya_user');
          return u ? (JSON.parse(u)?.id || 'guest') : 'guest';
        } catch { return 'guest'; }
      })();
      const saved = localStorage.getItem(`manivya_wishlist_${initUserId}`) || localStorage.getItem('manivya_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Hydrate cart and wishlist whenever user session switches
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(cartStorageKey) || (activeUserId === 'guest' ? localStorage.getItem('manivya_cart') : null);
      setCart(savedCart ? JSON.parse(savedCart) : []);
    } catch {
      setCart([]);
    }

    try {
      const savedWishlist = localStorage.getItem(wishlistStorageKey) || (activeUserId === 'guest' ? localStorage.getItem('manivya_wishlist') : null);
      setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
    } catch {
      setWishlist([]);
    }
  }, [activeUserId]);

  // Sync Cart to per-user LocalStorage
  useEffect(() => {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart, cartStorageKey]);

  // Sync Wishlist to per-user LocalStorage
  useEffect(() => {
    localStorage.setItem(wishlistStorageKey, JSON.stringify(wishlist));
  }, [wishlist, wishlistStorageKey]);

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocationState] = useState<LocationArea>(INITIAL_LOCATIONS[0]);

  // Wrap location selector to automatically update and save the user's active delivery address according to location
  const setSelectedLocation = (loc: LocationArea) => {
    setSelectedLocationState(loc);
    setCurrentUser(prev => {
      if (!prev) return prev;
      const newAddressItem = {
        id: prev.addresses?.[0]?.id || `addr-${Date.now()}`,
        title: loc.name || 'Selected Hub',
        fullAddress: `${loc.area || loc.name}, Visakhapatnam - ${loc.pincode}`,
        area: loc.area || loc.name,
        pincode: loc.pincode,
        isDefault: true
      };
      const updatedAddresses = [newAddressItem, ...(prev.addresses?.slice(1) || [])];
      const updatedUser = { ...prev, addresses: updatedAddresses };
      try {
        localStorage.setItem('manivya_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error(e);
      }
      return updatedUser;
    });
  };

  const [deliveryLocations, setDeliveryLocations] = useState<LocationArea[]>(() => {
    try {
      const saved = localStorage.getItem('manivya_delivery_locations');
      return saved ? JSON.parse(saved) : INITIAL_LOCATIONS;
    } catch {
      return INITIAL_LOCATIONS;
    }
  });
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(INITIAL_BUSINESS_INFO);

  useEffect(() => {
    try {
      localStorage.setItem('manivya_delivery_locations', JSON.stringify(deliveryLocations));
    } catch (e) {
      console.error(e);
    }
  }, [deliveryLocations]);

  const addDeliveryLocation = (loc: Omit<LocationArea, 'id'>) => {
    const newLoc: LocationArea = {
      ...loc,
      id: `loc-${Date.now()}`
    };
    setDeliveryLocations(prev => [newLoc, ...prev]);
    addToast(`New delivery hub "${loc.name}" added successfully by Owner!`, 'success');
  };

  const updateDeliveryLocation = (id: string, updated: Partial<LocationArea>) => {
    setDeliveryLocations(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
    addToast('Delivery location updated!', 'info');
  };

  const deleteDeliveryLocation = (id: string) => {
    setDeliveryLocations(prev => prev.filter(l => l.id !== id));
    addToast('Delivery location removed!', 'info');
  };

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('manivya_admin_token');
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Load initial data
  useEffect(() => {
    refreshProducts();
    refreshCategories();
    api.getBusinessInfo().then(setBusinessInfo).catch(console.error);
  }, []);

  const refreshProducts = async () => {
    try {
      const items = await api.getProducts();
      setProducts(items);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshOrders = async () => {
    try {
      const fetched = await api.getOrders(currentUser?.id);
      fetched.forEach(o => knownOrdersRef.current.set(o.id, o.orderStatus));
      return fetched;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  // Toast Helpers
  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Real-time Order Monitoring System
  const knownOrdersRef = useRef<Map<string, string>>(new Map());
  const initialOrdersLoadedRef = useRef(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const pollOrdersRealtime = async () => {
      try {
        const latestOrders = await api.getOrders(currentUser?.id);

        if (!initialOrdersLoadedRef.current) {
          latestOrders.forEach(o => knownOrdersRef.current.set(o.id, o.orderStatus));
          initialOrdersLoadedRef.current = true;
          return;
        }

        latestOrders.forEach(o => {
          const prevStatus = knownOrdersRef.current.get(o.id);
          if (!prevStatus) {
            // Brand new order detected
            knownOrdersRef.current.set(o.id, o.orderStatus);
            addToast(`🛍️ Real-Time Alert: New Order #${o.id} placed by ${o.userName} (₹${o.grandTotal})!`, 'success');
          } else if (prevStatus !== o.orderStatus) {
            // Order status modified
            knownOrdersRef.current.set(o.id, o.orderStatus);
            if (o.orderStatus === 'cancelled') {
              addToast(`🚨 Real-Time Alert: Order #${o.id} was CANCELLED!`, 'error');
            } else {
              addToast(`🚚 Real-Time Alert: Order #${o.id} status updated to ${o.orderStatus.replace('_', ' ').toUpperCase()}`, 'info');
            }
          }
        });
      } catch (err) {
        // silent error catch in background
      }
    };

    pollOrdersRealtime();
    intervalId = setInterval(pollOrdersRealtime, 4000);

    return () => clearInterval(intervalId);
  }, [currentUser?.id]);

  // Cart Operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    addToast(`Added ${quantity}x "${product.name}" to cart ⚡`, 'success');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    addToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartItemTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Wishlist Operations
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        addToast('Removed from wishlist', 'info');
        return prev.filter(id => id !== productId);
      } else {
        addToast('Saved to wishlist ❤️', 'success');
        return [...prev, productId];
      }
    });
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  // User Session Initialization & MongoDB Profile Sync
  useEffect(() => {
    const storedUserStr = localStorage.getItem('manivya_user');
    if (storedUserStr) {
      try {
        const parsed = JSON.parse(storedUserStr);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('manivya_user');
      }
    }
  }, []);

  // Auth Operations
  const loginUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('manivya_user', JSON.stringify(user));
    addToast(`Welcome back, ${user.name}!`, 'success');
  };

  const updateUserAddress = (newAddr: { fullAddress: string; area: string; pincode: string; title?: string }) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updatedAddr = {
        id: prev.addresses?.[0]?.id || `addr-${Date.now()}`,
        title: newAddr.title || 'Saved Delivery Address',
        fullAddress: newAddr.fullAddress,
        area: newAddr.area,
        pincode: newAddr.pincode,
        isDefault: true
      };
      const updatedAddresses = [updatedAddr, ...(prev.addresses?.slice(1) || [])];
      const updatedUser = { ...prev, addresses: updatedAddresses };
      try {
        localStorage.setItem('manivya_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error(e);
      }
      return updatedUser;
    });
    addToast(`Delivery address updated according to location: ${newAddr.area || newAddr.pincode}`, 'success');
  };

  const updateUserProfile = (updatedFields: { name?: string; email?: string; phone?: string }) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...updatedFields };
      try {
        localStorage.setItem('manivya_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error(e);
      }
      return updatedUser;
    });
    addToast('Profile updated successfully! 🎉', 'success');
  };

  const logoutUser = () => {
    if (currentUser?.uid || currentUser?.id) {
      api.recordLogout(currentUser.uid || currentUser.id).catch(() => {});
    }
    setCurrentUser(null);
    localStorage.removeItem('manivya_user');
    localStorage.removeItem('manivya_auth_token');
    addToast('Logged out successfully', 'info');
  };

  const adminLogin = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('manivya_admin_token', token);
    addToast('Owner Dashboard unlocked 🔑', 'success');
  };

  const adminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('manivya_admin_token');
    addToast('Owner session ended', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        cart,
        wishlist,
        selectedCategory,
        searchQuery,
        selectedLocation,
        deliveryLocations,
        businessInfo,
        currentUser,
        adminToken,
        toasts,

        isCartOpen,
        isSearchOpen,
        isLocationModalOpen,
        isAuthModalOpen,
        isAIAssistantOpen,
        isAdminModalOpen,
        isOrdersModalOpen,
        quickViewProduct,

        setSelectedCategory,
        setSearchQuery,
        setSelectedLocation,
        addDeliveryLocation,
        updateDeliveryLocation,
        deleteDeliveryLocation,
        setIsCartOpen,
        setIsSearchOpen,
        setIsLocationModalOpen,
        setIsAuthModalOpen,
        setIsAIAssistantOpen,
        setIsAdminModalOpen,
        setIsOrdersModalOpen,
        setQuickViewProduct,

        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartItemTotal,

        toggleWishlist,
        isWishlisted,

        loginUser,
        logoutUser,
        updateUserAddress,
        updateUserProfile,
        adminLogin,
        adminLogout,

        refreshProducts,
        refreshCategories,
        refreshOrders,
        addToast,
        removeToast
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};