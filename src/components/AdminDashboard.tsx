import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase';
import { ManivyaLogo } from './ManivyaLogo';
import { OrderDetailModal } from './OrderDetailModal';
import { api } from '../services/api';
import { Product, CategoryInfo, Coupon, Order, OrderStatus, AdminStats, ProductCategory, LocationArea } from '../types';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { 
  Lock, 
  X, 
  KeyRound, 
  Plus, 
  Trash2, 
  Edit3, 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  Users, 
  Tag, 
  Building, 
  CheckCircle2, 
  Printer, 
  Power,
  RefreshCw,
  Search,
  ChevronRight,
  Image as ImageIcon,
  Link as LinkIcon,
  ImageOff,
  Eye,
  MapPin,
  Navigation,
  Compass,
  Map as MapIcon,
  Phone,
  Database,
  Server,
  HardDrive,
  Mail,
  CreditCard,
  Box,
  Truck,
  XCircle,
  Filter,
  ExternalLink,
  User,
  Clock,
  QrCode
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

// Helper to clean & parse Google Images / Google Drive URLs
function parseImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If it's a Google Images search link with imgurl parameter
  if (trimmed.includes('google.') && trimmed.includes('imgurl=')) {
    try {
      const match = trimmed.match(/imgurl=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch (e) {
      // fallback
    }
  }

  // If it's a Google Drive share link
  if (trimmed.includes('drive.google.com')) {
    const driveIdMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (driveIdMatch && driveIdMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
    }
  }

  return trimmed;
}

const SAMPLE_PRESETS = [
  { name: 'Amul Milk', url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Amul Ice Cream', url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80' },
  { name: 'Classmate Notebook', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' },
  { name: 'Custom Printed Tee', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
  { name: 'Magic Heat Mug', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sleeping Pillow', url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80' }
];

export const AdminDashboard: React.FC = () => {
  const { 
    adminToken, 
    adminLogin, 
    adminLogout, 
    addToast,
    refreshProducts,
    refreshCategories,
    categories,
    products,
    deliveryLocations,
    addDeliveryLocation,
    updateDeliveryLocation,
    deleteDeliveryLocation
  } = useStore();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'categories' | 'orders' | 'locations' | 'coupons' | 'database' | 'settings'>('analytics');
  const [stats, setStats] = useState<AdminStats | null>(null);

  // MongoDB Atlas State
  const [mongoStatus, setMongoStatus] = useState<any>(null);
  const [mongoInputUri, setMongoInputUri] = useState('');
  const [isTestingMongo, setIsTestingMongo] = useState(false);

  // Live Admin Token & Firebase Verification
  useEffect(() => {
    let isMounted = true;
    async function verifySession() {
      if (!adminToken) {
        if (isMounted) {
          setIsVerified(false);
          setIsVerifyingToken(false);
        }
        return;
      }
      try {
        setIsVerifyingToken(true);
        const res = await api.verifyAdminToken(adminToken);
        if (isMounted && res.success) {
          setIsVerified(true);
          fetchAdminData();
          fetchMongoStatus();
        }
      } catch (err) {
        console.warn('Admin token verification failed:', err);
        if (isMounted) {
          adminLogout();
          setIsVerified(false);
          addToast('Admin session expired or unauthorized access.', 'error');
        }
      } finally {
        if (isMounted) {
          setIsVerifyingToken(false);
        }
      }
    }
    verifySession();
    return () => {
      isMounted = false;
    };
  }, [adminToken]);

  const fetchMongoStatus = async () => {
    if (!adminToken) return;
    try {
      const res = await api.getMongoDBStatus(adminToken);
      setMongoStatus(res);
    } catch (e) {
      console.warn('MongoDB status fetch error:', e);
    }
  };

  const handleTestMongoConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingMongo(true);
    try {
      const res = await api.connectMongoDB(mongoInputUri.trim() || undefined, adminToken);
      setMongoStatus(res.status || res);
      if (res.connected) {
        addToast('✅ Successfully connected to MongoDB Atlas Cloud Cluster!', 'success');
        refreshProducts();
      } else {
        addToast(`❌ Connection Failed: ${res.reason || 'Check your MONGODB_URI connection string'}`, 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to connect to MongoDB Atlas', 'error');
    } finally {
      setIsTestingMongo(false);
    }
  };

  // Form states for Owner's Google Maps Delivery Location Creator
  const [locName, setLocName] = useState('');
  const [locArea, setLocArea] = useState('');
  const [locPincode, setLocPincode] = useState('530026');
  const [locEta, setLocEta] = useState('10-15 Mins');
  const [locLat, setLocLat] = useState<number>(17.6888);
  const [locLng, setLocLng] = useState<number>(83.2185);

  // Form states for adding product
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState<ProductCategory>('dairy');
  const [pBrand, setPBrand] = useState('Amul');
  const [pUnit, setPUnit] = useState('500 ml');
  const [pPrice, setPPrice] = useState<number>(30);
  const [pOriginalPrice, setPOriginalPrice] = useState<number>(35);
  const [pStock, setPStock] = useState<number>(100);
  const [pImage, setPImage] = useState('https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80');
  const [pDesc, setPDesc] = useState('');

  // Category management states
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [catName, setCatName] = useState('');
  const [catId, setCatId] = useState('');
  const [catIcon, setCatIcon] = useState('Package');
  const [catDesc, setCatDesc] = useState('');
  const [catImg, setCatImg] = useState('https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80');

  // Category deletion confirmation modal state
  const [deleteCategoryModalTarget, setDeleteCategoryModalTarget] = useState<CategoryInfo | null>(null);
  const [deleteCategoryOption, setDeleteCategoryOption] = useState<'recategorize' | 'remove'>('recategorize');

  // Orders state
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [selectedAdminOrder, setSelectedAdminOrder] = useState<Order | null>(null);
  const [isAdminDetailOpen, setIsAdminDetailOpen] = useState(false);
  const [selectedOrderEmail, setSelectedOrderEmail] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');

  // Coupons state
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [cCode, setCCode] = useState('');
  const [cDiscount, setCDiscount] = useState<number>(10);
  const [cMinOrder, setCMinOrder] = useState<number>(200);

  // Inventory filtering & search in admin
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('all');
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>('');

  // Business info edit state
  const [bPhone, setBPhone] = useState('7207554777');
  const [bAddress, setBAddress] = useState('25-1-13, Gajuwaka Bypass Road, Durgavanipalem, Pedagantyada, Visakhapatnam - 530026');

  useEffect(() => {
    if (adminToken && isVerified) {
      fetchAdminData();
    }
  }, [adminToken, isVerified]);

  const fetchAdminData = async () => {
    if (!adminToken) return;
    try {
      const s = await api.getAdminStats(adminToken);
      setStats(s);
      const ords = await api.getOrders();
      setAllOrders(ords);
      const coups = await api.getCoupons();
      setAllCoupons(coups);
    } catch (err: any) {
      console.error(err);
    }
  };

  const filteredAdminProducts = products.filter(p => {
    if (adminCategoryFilter !== 'all' && p.category !== adminCategoryFilter) return false;
    if (adminSearchTerm.trim()) {
      const q = adminSearchTerm.toLowerCase().trim();
      return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAuth(true);
    try {
      const res = await api.adminLogin({
        email: adminEmail,
        password: adminPassword,
        passcode: passcode || adminPassword
      });
      adminLogin(res.token);
      setIsVerified(true);
      setAdminPassword('');
      setPasscode('');
      addToast('Welcome back, Admin! Token verified.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Invalid admin credentials', 'error');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      addToast('Please enter your name, email, and password.', 'error');
      return;
    }
    setIsSubmittingAuth(true);
    try {
      const res = await api.adminRegister({
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword.trim()
      });
      adminLogin(res.token);
      setIsVerified(true);
      setAdminPassword('');
      addToast(`Admin account created successfully! Welcome, ${res.user?.name || adminName}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to create admin account', 'error');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    try {
      if (editingProductId) {
        await api.updateProduct(editingProductId, {
          name: pName,
          category: pCategory,
          brand: pBrand,
          unit: pUnit,
          price: Number(pPrice),
          originalPrice: Number(pOriginalPrice),
          stockCount: Number(pStock),
          inStock: Number(pStock) > 0,
          image: pImage,
          description: pDesc
        }, adminToken);
        addToast('Product updated successfully', 'success');
      } else {
        await api.addProduct({
          name: pName,
          category: pCategory,
          brand: pBrand,
          unit: pUnit,
          price: Number(pPrice),
          originalPrice: Number(pOriginalPrice),
          stockCount: Number(pStock),
          inStock: Number(pStock) > 0,
          image: pImage,
          description: pDesc || 'Fresh item from MANIVYA Multi Enterprise.'
        }, adminToken);
        addToast('New product added to store', 'success');
      }

      await refreshProducts();
      setShowAddProduct(false);
      setEditingProductId(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to save product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!adminToken) return;
    const targetProduct = products.find(p => p.id === id);
    const productName = targetProduct ? targetProduct.name : 'this item';
    
    if (confirm(`Are you sure you want to PERMANENTLY DELETE "${productName}" from your store inventory?`)) {
      try {
        await api.deleteProduct(id, adminToken);
        await refreshProducts();
        addToast(`Deleted "${productName}" from store`, 'info');
      } catch (err: any) {
        addToast(err.message || 'Failed to delete product', 'error');
      }
    }
  };

  const handleAddOwnerLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim() || !locArea.trim()) {
      addToast('Please enter Hub Name and Area details', 'error');
      return;
    }

    addDeliveryLocation({
      name: locName.trim(),
      area: locArea.trim(),
      pincode: locPincode.trim() || '530026',
      deliveryEta: locEta.trim() || '10-15 Mins',
      isServiceable: true,
      lat: locLat,
      lng: locLng
    });

    setLocName('');
    setLocArea('');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    if (!catName.trim()) {
      addToast('Category name is required', 'error');
      return;
    }

    const generatedSlug = catId.trim() || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newCat: CategoryInfo = {
      id: generatedSlug as any,
      name: catName.trim(),
      iconName: catIcon || 'Package',
      description: catDesc.trim() || `${catName.trim()} products and items`,
      image: parseImageUrl(catImg) || 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80'
    };

    try {
      await api.addCategory(newCat, adminToken);
      await refreshCategories();
      addToast(`Category "${newCat.name}" added successfully`, 'success');
      setShowAddCategory(false);
      setCatName('');
      setCatId('');
      setCatDesc('');
    } catch (err: any) {
      addToast(err.message || 'Failed to add category', 'error');
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!adminToken || !deleteCategoryModalTarget) return;

    const targetCat = deleteCategoryModalTarget;
    const action = deleteCategoryOption;

    try {
      const res = await api.deleteCategory(targetCat.id, action, adminToken);
      await refreshCategories();
      await refreshProducts();

      if (action === 'remove') {
        addToast(`Deleted category "${targetCat.name}" and removed ${res.affectedCount} associated product(s)`, 'info');
      } else {
        addToast(`Deleted category "${targetCat.name}". ${res.affectedCount} product(s) moved to General.`, 'info');
      }
      setDeleteCategoryModalTarget(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to delete category', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!adminToken) return;
    try {
      await api.updateOrderStatus(orderId, newStatus, adminToken);
      const ords = await api.getOrders();
      setAllOrders(ords);
      addToast(`Order #${orderId} status changed to ${newStatus}`, 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !cCode) return;
    try {
      await api.addCoupon({
        code: cCode.toUpperCase(),
        discountPercent: cDiscount,
        minOrderValue: cMinOrder,
        description: `${cDiscount}% OFF on orders above ₹${cMinOrder}`,
        expiresAt: '2026-12-31',
        isActive: true
      }, adminToken);
      setCCode('');
      const coups = await api.getCoupons();
      setAllCoupons(coups);
      addToast(`Coupon ${cCode} created`, 'success');
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ManivyaLogo className="h-7" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-zinc-600">/</span>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
              RESTRICTED ADMIN DASHBOARD
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold font-mono transition-colors flex items-center gap-1.5"
          >
            <span>Storefront</span>
          </Link>

          {adminToken && isVerified && (
            <button
              onClick={() => {
                adminLogout();
                setIsVerified(false);
                addToast('Logged out of Admin Portal', 'info');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold font-mono transition-colors"
            >
              Lock Session
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {isVerifyingToken ? (
          <div className="my-auto py-24 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto animate-pulse">
              <Lock className="w-8 h-8" />
            </div>
            <p className="text-sm font-mono text-zinc-300 font-bold">
              Verifying Administrator Authorization...
            </p>
            <p className="text-xs text-zinc-500 font-mono">
              Live Backend JWT & Firebase Token Validation
            </p>
          </div>
        ) : !adminToken || !isVerified ? (
          /* Dedicated Admin Authentication Portal */
          <div className="my-auto max-w-md w-full mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20 shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-xl font-black text-white tracking-tight">
                {authMode === 'login' ? 'Administrator Access Portal' : 'Create Admin Account'}
              </h1>
              <p className="text-xs text-zinc-400">
                {authMode === 'login' 
                  ? 'Restricted System • Authenticate with email & password.' 
                  : 'Register a new Administrator account with email and password.'}
              </p>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@manivya.com"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Admin Password / Passcode
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-white text-sm outline-none focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 font-mono uppercase tracking-wider"
                >
                  {isSubmittingAuth ? 'Authenticating...' : 'Sign In to Admin Portal'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@manivya.com"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Create Password
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 font-mono uppercase tracking-wider"
                >
                  {isSubmittingAuth ? 'Creating Account...' : 'Create Admin Account'}
                </button>
              </form>
            )}

            <div className="pt-2 text-center space-y-3">
              {authMode === 'login' ? (
                <p className="text-xs text-zinc-400">
                  Need a new admin account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="text-blue-400 font-bold hover:underline"
                  >
                    Create Admin Account
                  </button>
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  Already have an admin account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-blue-400 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              )}

              <div>
                <Link
                  to="/"
                  className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors underline"
                >
                  ← Return to Public Storefront
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Main Owner Panel View */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
              
              {/* Left Sidebar Navigation */}
              <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950 p-2 flex md:flex-col gap-1 overflow-x-auto no-scrollbar shrink-0 font-mono text-xs font-bold">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`p-2.5 rounded-xl flex items-center gap-2 transition-all ${
                    activeTab === 'analytics' ? 'bg-white text-black font-black' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <DollarSign className="w-4 h-4" /> Analytics
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`p-2.5 rounded-xl flex items-center gap-2 transition-all ${
                    activeTab === 'products' ? 'bg-white text-black font-black' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" /> Products ({products.length})
                </button>

                <button
                  onClick={() => setActiveTab('categories')}
                  className={`p-2.5 rounded-xl flex items-center gap-2 transition-all ${
                    activeTab === 'categories' ? 'bg-white text-black font-black' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <Building className="w-4 h-4" /> Categories ({categories.length})
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`p-2.5 rounded-xl flex items-center gap-2 transition-all ${
                    activeTab === 'orders' ? 'bg-white text-black font-black' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" /> Live Orders ({allOrders.length})
                </button>

                <button
                  onClick={() => setActiveTab('locations')}
                  className={`p-2.5 rounded-xl flex items-center gap-2 transition-all ${
                    activeTab === 'locations' ? 'bg-white text-black font-black' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-emerald-400" /> Hubs & Maps ({deliveryLocations.length})
                </button>

                <button
                  onClick={() => setActiveTab('coupons')}
                  className={`p-2.5 rounded-xl flex items-center gap-2 transition-all ${
                    activeTab === 'coupons' ? 'bg-white text-black font-black' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <Tag className="w-4 h-4" /> Coupons
                </button>

                <button
                  onClick={() => {
                    setActiveTab('database');
                    fetchMongoStatus();
                  }}
                  className={`p-2.5 rounded-xl flex items-center gap-2 transition-all ${
                    activeTab === 'database' ? 'bg-emerald-500 text-black font-black' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <Database className="w-4 h-4 text-emerald-400" /> MongoDB Atlas
                  {mongoStatus?.isConnected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  )}
                </button>
              </div>

              {/* Right Content Body */}
              <div className="flex-1 p-5 overflow-y-auto">

                
                {/* TAB 1: Analytics */}
                {activeTab === 'analytics' && (() => {
                  const activeOrders = allOrders.filter(o => o.orderStatus !== 'cancelled');
                  const cancelledOrders = allOrders.filter(o => o.orderStatus === 'cancelled');
                  const calculatedRevenue = activeOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
                  const activeOrdersCount = activeOrders.length;
                  const cancelledProductsCount = cancelledOrders.reduce(
                    (sum, o) => sum + (o.items || []).reduce((iSum, item) => iSum + (item.quantity || 1), 0),
                    0
                  );
                  const cancelledOrdersCount = cancelledOrders.length;
                  const lowStockCount = products.filter(p => p.stockCount <= 10).length;

                  return (
                    <div className="space-y-4">
                      <h3 className="text-sm font-mono font-bold text-zinc-400 uppercase">Live Store Overview</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                          <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Total Revenue</p>
                          <p className="text-2xl font-black font-mono text-white">₹{calculatedRevenue}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Excludes cancelled orders</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                          <p className="text-[10px] font-mono font-bold text-blue-400 uppercase">Total Orders</p>
                          <p className="text-2xl font-black font-mono text-white">{activeOrdersCount}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{allOrders.length} total placed</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                          <p className="text-[10px] font-mono font-bold text-rose-400 uppercase">Total Cancelled Products</p>
                          <p className="text-2xl font-black font-mono text-rose-400">{cancelledProductsCount}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{cancelledOrdersCount} cancelled order(s)</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                          <p className="text-[10px] font-mono font-bold text-amber-400 uppercase">Low Stock Alert</p>
                          <p className="text-2xl font-black font-mono text-white">{lowStockCount}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 2: Products CRUD */}
                {activeTab === 'products' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-mono font-bold text-zinc-300 uppercase">Store Inventory ({products.length})</h3>
                        <p className="text-[11px] text-zinc-500 font-mono">Owner can add, edit, or delete items across all categories.</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowAddProduct(true);
                          setEditingProductId(null);
                          setPName('');
                          setPPrice(50);
                          setPStock(100);
                          setPImage('https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-1 shadow shrink-0"
                      >
                        <Plus className="w-4 h-4" /> Add Product
                      </button>
                    </div>

                    {/* Filter by Category & Search bar in Admin */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 relative">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={adminSearchTerm}
                          onChange={(e) => setAdminSearchTerm(e.target.value)}
                          placeholder="Search product name or brand to edit/delete..."
                          className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-white outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      <select
                        value={adminCategoryFilter}
                        onChange={(e) => setAdminCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300 font-mono outline-none focus:border-blue-500"
                      >
                        <option value="all">All Categories ({products.length})</option>
                        {categories.map((c, cIdx) => (
                          <option key={`opt-cat-${c.id}-${cIdx}`} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {showAddProduct && (
                      <form onSubmit={handleSaveProduct} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                        <h4 className="text-xs font-bold font-mono text-blue-400 uppercase">
                          {editingProductId ? 'Edit Product' : 'Add New Multi-Enterprise Product'}
                        </h4>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="font-mono text-[10px] text-zinc-400">Name</label>
                            <input type="text" value={pName} onChange={e => setPName(e.target.value)} required className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white" />
                          </div>

                          <div>
                            <label className="font-mono text-[10px] text-zinc-400">Category</label>
                            <select value={pCategory} onChange={e => setPCategory(e.target.value as any)} className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white">
                              {categories.map((c, cIdx) => (
                                <option key={`opt2-cat-${c.id}-${cIdx}`} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="font-mono text-[10px] text-zinc-400">Brand</label>
                            <input type="text" value={pBrand} onChange={e => setPBrand(e.target.value)} required className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white" />
                          </div>

                          <div>
                            <label className="font-mono text-[10px] text-zinc-400">Unit Size</label>
                            <input type="text" value={pUnit} onChange={e => setPUnit(e.target.value)} required className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white" />
                          </div>

                          <div>
                            <label className="font-mono text-[10px] text-zinc-400">Selling Price (₹)</label>
                            <input type="number" value={pPrice} onChange={e => setPPrice(Number(e.target.value))} required className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white" />
                          </div>

                          <div>
                            <label className="font-mono text-[10px] text-zinc-400">Stock Count</label>
                            <input type="number" value={pStock} onChange={e => setPStock(Number(e.target.value))} required className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white" />
                          </div>
                        </div>

                        {/* Google URL / Web Image Input Section */}
                        <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2">
                          <div className="flex justify-between items-center text-xs font-mono font-bold text-zinc-300">
                            <span className="flex items-center gap-1.5 text-blue-400">
                              <ImageIcon className="w-4 h-4" /> Product Image (Google Image URL, Drive Share Link, or Web URL)
                            </span>
                            {pImage && (
                              <button
                                type="button"
                                onClick={() => setPImage('')}
                                className="px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] flex items-center gap-1 font-mono transition-colors"
                              >
                                <Trash2 className="w-3 h-3" /> Delete Present Picture
                              </button>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={pImage}
                              onChange={e => {
                                const parsed = parseImageUrl(e.target.value);
                                setPImage(parsed);
                              }}
                              placeholder="Paste Google image link, Google Drive URL, or web picture URL..."
                              className="flex-1 p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono outline-none focus:border-blue-500"
                            />
                            {pImage && (
                              <button
                                type="button"
                                onClick={() => setPImage('')}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {/* Live Image Preview & Sample Presets */}
                          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                            <div className="w-20 h-20 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative group">
                              {pImage ? (
                                <>
                                  <img 
                                    src={pImage} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                      (e.target as any).src = 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80';
                                    }} 
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setPImage('')}
                                    className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] font-mono text-red-400 font-bold transition-opacity"
                                  >
                                    <Trash2 className="w-4 h-4 mb-0.5" />
                                    Delete Picture
                                  </button>
                                </>
                              ) : (
                                <div className="text-center p-1 text-zinc-500">
                                  <ImageOff className="w-5 h-5 mx-auto mb-1 opacity-50" />
                                  <span className="text-[9px] font-mono">No Picture</span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 space-y-1">
                              <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Select Quick Picture Preset:</p>
                              <div className="flex flex-wrap gap-1">
                                {SAMPLE_PRESETS.map((preset, pIdx) => (
                                  <button
                                    key={`preset-${preset.name}-${pIdx}`}
                                    type="button"
                                    onClick={() => setPImage(preset.url)}
                                    className="px-2 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-mono transition-colors"
                                  >
                                    + {preset.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowAddProduct(false)} className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-bold text-zinc-300">Cancel</button>
                          <button type="submit" className="px-4 py-1.5 rounded-lg bg-white text-black font-bold text-xs">Save Product</button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {filteredAdminProducts.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 font-mono text-xs border border-zinc-800 rounded-2xl bg-zinc-950">
                          No products found matching category filter or search term.
                        </div>
                      ) : (
                        filteredAdminProducts.map((p, pIdx) => {
                          const isLowStock = p.stockCount < 5;
                          const isOutOfStock = p.stockCount === 0;

                          return (
                            <div
                              key={`admin-prod-${p.id}-${pIdx}`}
                              className={`flex items-center justify-between p-2.5 rounded-xl border ${
                                isOutOfStock
                                  ? 'border-red-500/30 bg-red-950/10'
                                  : isLowStock
                                  ? 'border-amber-500/30 bg-amber-950/10'
                                  : 'border-zinc-800 bg-zinc-950'
                              } text-xs transition-colors`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative group shrink-0">
                                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-zinc-800" />
                                  {isLowStock && (
                                    <div className={`absolute -bottom-1 -left-1 px-1 rounded text-[8px] font-mono font-bold text-white shadow ${isOutOfStock ? 'bg-red-600' : 'bg-amber-600'}`}>
                                      {isOutOfStock ? '0' : p.stockCount}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(p.id)}
                                    title={`Delete ${p.name}`}
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-[9px] shadow transition-transform group-hover:scale-110"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold truncate text-white">{p.name}</p>
                                    {isOutOfStock ? (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-500/15 text-red-400 border border-red-500/30 font-bold flex items-center gap-1 shrink-0">
                                        <AlertTriangle className="w-2.5 h-2.5" /> Out of Stock
                                      </span>
                                    ) : isLowStock ? (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1 shrink-0">
                                        <AlertTriangle className="w-2.5 h-2.5 text-amber-400" /> Low Stock ({p.stockCount} left)
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="text-zinc-400 font-mono text-[11px] mt-0.5">
                                    {p.category} • {p.unit} • ₹{p.price} • Stock:{' '}
                                    <span className={isOutOfStock ? "text-red-400 font-bold" : isLowStock ? "text-amber-400 font-bold" : "text-zinc-300"}>
                                      {p.stockCount} units
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingProductId(p.id);
                                  setPName(p.name);
                                  setPCategory(p.category);
                                  setPBrand(p.brand);
                                  setPUnit(p.unit);
                                  setPPrice(p.price);
                                  setPStock(p.stockCount);
                                  setPImage(p.image);
                                  setShowAddProduct(true);
                                }}
                                title="Edit product details"
                                className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                title="Delete product permanently"
                                className="px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        );
                      })
                      )}
                    </div>

                  </div>
                )}

                {/* TAB 3: Categories Manager */}
                {activeTab === 'categories' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-mono font-bold text-zinc-300 uppercase flex items-center gap-2">
                          <Building className="w-4 h-4 text-emerald-400" /> Store Categories ({categories.length})
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          Manage store categories or delete existing ones. When deleting, choose whether to re-categorize items to 'General' or remove them.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setShowAddCategory(!showAddCategory);
                          setCatName('');
                          setCatId('');
                          setCatDesc('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1 shadow shrink-0"
                      >
                        <Plus className="w-4 h-4" /> Add Category
                      </button>
                    </div>

                    {/* Add Category Form */}
                    {showAddCategory && (
                      <form onSubmit={handleAddCategory} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                        <h4 className="text-xs font-bold font-mono text-emerald-400 uppercase">
                          Create New Category
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="text-[10px] text-zinc-400 font-mono block mb-1">Category Name *</label>
                            <input
                              type="text"
                              value={catName}
                              onChange={e => setCatName(e.target.value)}
                              placeholder="e.g. Organic Beverages"
                              className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono outline-none focus:border-emerald-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-400 font-mono block mb-1">Category ID Slug (Optional)</label>
                            <input
                              type="text"
                              value={catId}
                              onChange={e => setCatId(e.target.value)}
                              placeholder="e.g. organic-beverages (auto-generated if empty)"
                              className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-400 font-mono block mb-1">Icon Preset</label>
                            <select
                              value={catIcon}
                              onChange={e => setCatIcon(e.target.value)}
                              className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono outline-none focus:border-emerald-500"
                            >
                              <option value="Milk">Milk / Dairy</option>
                              <option value="IceCream">Ice Cream</option>
                              <option value="BookOpen">Books / Stationery</option>
                              <option value="Shirt">Apparel / Tees</option>
                              <option value="Coffee">Mugs / Drinkware</option>
                              <option value="Droplet">Bottles / Liquids</option>
                              <option value="Bed">Pillows / Home</option>
                              <option value="Utensils">Snacks / Food</option>
                              <option value="Sparkles">Sparkles / General</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-400 font-mono block mb-1">Image URL</label>
                            <input
                              type="url"
                              value={catImg}
                              onChange={e => setCatImg(e.target.value)}
                              placeholder="https://..."
                              className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[10px] text-zinc-400 font-mono block mb-1">Description</label>
                            <input
                              type="text"
                              value={catDesc}
                              onChange={e => setCatDesc(e.target.value)}
                              placeholder="Brief summary of items in this category"
                              className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddCategory(false)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
                          >
                            Save Category
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Categories List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {categories.map((cat, catIdx) => {
                        const productCount = products.filter(p => p.category === cat.id).length;
                        const isGeneral = cat.id === 'general';

                        return (
                          <div
                            key={`admin-cat-${cat.id}-${catIdx}`}
                            className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white truncate text-sm">{cat.name}</span>
                                  {isGeneral && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                                      DEFAULT
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-400 font-mono truncate">ID: {cat.id}</p>
                                <p className="text-[11px] text-emerald-400 font-mono font-bold">{productCount} Product(s) in Store</p>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setDeleteCategoryModalTarget(cat);
                                setDeleteCategoryOption('recategorize');
                              }}
                              title={`Delete category "${cat.name}"`}
                              className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 4: Orders Manager */}
                {activeTab === 'orders' && (() => {
                  const uniqueCustomerEmails = Array.from(
                    new Set(allOrders.map(o => (o.userEmail || '').trim().toLowerCase()).filter(Boolean))
                  );

                  const filteredOrders = allOrders.filter(ord => {
                    // Email Filter
                    if (selectedOrderEmail !== 'all') {
                      if ((ord.userEmail || '').trim().toLowerCase() !== selectedOrderEmail) {
                        return false;
                      }
                    }

                    // Status Filter
                    if (orderStatusFilter !== 'all') {
                      if (ord.orderStatus !== orderStatusFilter) {
                        return false;
                      }
                    }

                    // Payment Method Filter
                    if (paymentMethodFilter !== 'all') {
                      if (paymentMethodFilter === 'COD') {
                        if (ord.paymentMethod !== 'COD') return false;
                      } else if (paymentMethodFilter === 'UPI') {
                        if (ord.paymentMethod === 'COD') return false;
                      }
                    }

                    // Search Query
                    if (orderSearchQuery.trim()) {
                      const q = orderSearchQuery.toLowerCase().trim();
                      const matchId = ord.id.toLowerCase().includes(q);
                      const matchName = ord.userName.toLowerCase().includes(q);
                      const matchEmail = (ord.userEmail || '').toLowerCase().includes(q);
                      const matchPhone = ord.userPhone.includes(q);
                      const matchLocation = (ord.deliveryAddress?.fullAddress || '').toLowerCase().includes(q) || (ord.deliveryAddress?.area || '').toLowerCase().includes(q);
                      const matchItems = ord.items.some(i => i.productName.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q));

                      return matchId || matchName || matchEmail || matchPhone || matchLocation || matchItems;
                    }

                    return true;
                  });

                  const selectedEmailOrders = selectedOrderEmail !== 'all' 
                    ? allOrders.filter(o => (o.userEmail || '').trim().toLowerCase() === selectedOrderEmail)
                    : filteredOrders;

                  const totalRevenueAll = allOrders.filter(o => o.orderStatus !== 'cancelled').reduce((acc, o) => acc + o.grandTotal, 0);
                  const totalCancelledAll = allOrders.filter(o => o.orderStatus === 'cancelled').length;
                  const totalActiveAll = allOrders.filter(o => o.orderStatus !== 'cancelled').length;

                  return (
                    <div className="space-y-4">
                      {/* Top Header & Summary Chips */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-blue-400" />
                            <h3 className="text-base font-extrabold text-white">
                              Customer Orders & Database Sync ({filteredOrders.length} / {allOrders.length})
                            </h3>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Real-time orders tracked by individual user login emails, items, payment types, & delivery locations in MongoDB Atlas.
                          </p>
                        </div>

                        <button
                          onClick={fetchAdminData}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Sync Atlas Orders
                        </button>
                      </div>

                      {/* Global Orders Stats Summary Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                          <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Total Orders</p>
                          <p className="text-lg font-black text-white font-mono">{allOrders.length}</p>
                        </div>
                        <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                          <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Active Orders</p>
                          <p className="text-lg font-black text-emerald-400 font-mono">{totalActiveAll}</p>
                        </div>
                        <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                          <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Cancelled Orders</p>
                          <p className="text-lg font-black text-red-400 font-mono">{totalCancelledAll}</p>
                        </div>
                        <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                          <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Total Revenue</p>
                          <p className="text-lg font-black text-amber-400 font-mono">₹{totalRevenueAll.toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      {/* Filter Bar: Individual Email, Status, Payment, Search */}
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 uppercase">
                          <Filter className="w-4 h-4 text-blue-400" />
                          <span>Filter Orders by Individual Email & Specifications</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {/* Filter by Individual Customer Email */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-400 font-bold block uppercase">
                              Filter by Customer Email
                            </label>
                            <select
                              value={selectedOrderEmail}
                              onChange={(e) => setSelectedOrderEmail(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-300 focus:outline-none focus:border-blue-500"
                            >
                              <option value="all">All Customer Emails ({uniqueCustomerEmails.length})</option>
                              {uniqueCustomerEmails.map(email => {
                                const count = allOrders.filter(o => (o.userEmail || '').trim().toLowerCase() === email).length;
                                return (
                                  <option key={`opt-email-${email}`} value={email}>
                                    {email} ({count} orders)
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Filter by Order Status */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-400 font-bold block uppercase">
                              Filter by Order Status
                            </label>
                            <select
                              value={orderStatusFilter}
                              onChange={(e) => setOrderStatusFilter(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-blue-500"
                            >
                              <option value="all">All Statuses</option>
                              <option value="placed">Confirmed / Placed</option>
                              <option value="packing">Packing</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          {/* Filter by Payment Method */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-400 font-bold block uppercase">
                              Payment Type
                            </label>
                            <select
                              value={paymentMethodFilter}
                              onChange={(e) => setPaymentMethodFilter(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-blue-500"
                            >
                              <option value="all">All Payment Types</option>
                              <option value="UPI">UPI / Online Payment</option>
                              <option value="COD">Cash on Delivery (COD)</option>
                            </select>
                          </div>

                          {/* Search Input */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-400 font-bold block uppercase">
                              Search Order / Address / Items
                            </label>
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                              <input
                                type="text"
                                value={orderSearchQuery}
                                onChange={(e) => setOrderSearchQuery(e.target.value)}
                                placeholder="Order ID, Name, Item, Location..."
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-zinc-200 outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Selected Customer Email Summary Banner (if email filter is active) */}
                      {selectedOrderEmail !== 'all' && (
                        <div className="p-4 bg-gradient-to-r from-blue-950/40 via-zinc-950 to-indigo-950/40 border border-blue-500/30 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-blue-400" />
                              <span className="text-xs font-mono font-bold text-blue-300">
                                Analytics for Customer: <span className="text-white font-black underline">{selectedOrderEmail}</span>
                              </span>
                            </div>
                            <button
                              onClick={() => setSelectedOrderEmail('all')}
                              className="text-[10px] font-mono text-zinc-400 hover:text-white underline"
                            >
                              Clear Email Filter
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                              <span className="text-[10px] text-zinc-400 block">Total Orders</span>
                              <span className="font-extrabold text-white">{selectedEmailOrders.length}</span>
                            </div>
                            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                              <span className="text-[10px] text-zinc-400 block">Total Items Purchased</span>
                              <span className="font-extrabold text-emerald-400">
                                {selectedEmailOrders.reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0), 0)} items
                              </span>
                            </div>
                            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                              <span className="text-[10px] text-zinc-400 block">Active vs Cancelled</span>
                              <span className="font-extrabold text-zinc-200">
                                {selectedEmailOrders.filter(o => o.orderStatus !== 'cancelled').length} active / {selectedEmailOrders.filter(o => o.orderStatus === 'cancelled').length} cancelled
                              </span>
                            </div>
                            <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                              <span className="text-[10px] text-zinc-400 block">Total Spend</span>
                              <span className="font-extrabold text-amber-400">
                                ₹{selectedEmailOrders.filter(o => o.orderStatus !== 'cancelled').reduce((sum, o) => sum + o.grandTotal, 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Orders List Display */}
                      {filteredOrders.length === 0 ? (
                        <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 text-zinc-400 space-y-2">
                          <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto" />
                          <p className="text-sm font-bold text-zinc-300">No orders match your filter criteria.</p>
                          <p className="text-xs text-zinc-500">Try clearing your search query or selecting a different email/status filter.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredOrders.map((ord, ordIdx) => {
                            const isCancelled = ord.orderStatus === 'cancelled';
                            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${ord.deliveryAddress?.fullAddress || ''}, ${ord.deliveryAddress?.area || ''} Visakhapatnam ${ord.deliveryAddress?.pincode || ''}`
                            )}`;

                            return (
                              <div
                                key={`admin-ord-${ord.id}-${ordIdx}`}
                                className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-4 ${
                                  isCancelled
                                    ? 'bg-red-950/10 border-red-900/30'
                                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                }`}
                              >
                                {/* Order ID Header & Status Badge */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-extrabold font-mono text-xs">
                                      #{ord.id.replace('MNE-', '')}
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-black text-white font-mono flex items-center gap-2">
                                        ORDER #{ord.id}
                                      </h4>
                                      <p className="text-[11px] text-zinc-400 font-mono">
                                        Placed: {new Date(ord.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Order Status Badge */}
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                                      ord.orderStatus === 'delivered'
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : ord.orderStatus === 'out_for_delivery'
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                        : ord.orderStatus === 'packing'
                                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                        : ord.orderStatus === 'placed'
                                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                                    }`}>
                                      {ord.orderStatus === 'delivered' && '✅ Delivered'}
                                      {ord.orderStatus === 'out_for_delivery' && '🚚 Out for Delivery'}
                                      {ord.orderStatus === 'packing' && '📦 Packing Items'}
                                      {ord.orderStatus === 'placed' && '🕒 Order Confirmed'}
                                      {ord.orderStatus === 'cancelled' && '❌ Cancelled'}
                                    </span>

                                    <span className="text-base font-black text-emerald-400 font-mono">
                                      ₹{ord.grandTotal}
                                    </span>
                                  </div>
                                </div>

                                {/* Who Ordered (Customer Info) & From Where (Location) Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Who Ordered */}
                                  <div className="p-3.5 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-2 text-xs">
                                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-400 uppercase">
                                      <User className="w-3.5 h-3.5 text-blue-400" />
                                      <span>Who Ordered (Customer Details)</span>
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-white text-sm">{ord.userName}</span>
                                      </div>

                                      <div className="flex items-center gap-1.5 pt-1">
                                        <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                        <span className="text-blue-300 font-mono font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-[11px]">
                                          {ord.userEmail || 'No Email Associated'}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1.5 pt-1">
                                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span className="text-zinc-300 font-mono font-bold">
                                          +91 {ord.userPhone}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* From Where He Ordered (User Location) */}
                                  <div className="p-3.5 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-2 text-xs">
                                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400 uppercase">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>From Where He Ordered (User Location)</span>
                                      </div>
                                      <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[10px] lowercase"
                                      >
                                        <ExternalLink className="w-3 h-3" /> maps
                                      </a>
                                    </div>

                                    <div className="space-y-1">
                                      <p className="font-bold text-white text-xs">
                                        {ord.deliveryAddress?.title || 'Delivery Address'} • {ord.deliveryAddress?.pincode}
                                      </p>
                                      <p className="text-zinc-300 font-mono text-[11px] leading-relaxed">
                                        {ord.deliveryAddress?.fullAddress}
                                      </p>
                                      {ord.deliveryAddress?.landmark && (
                                        <p className="text-zinc-400 text-[11px] italic">
                                          Landmark: {ord.deliveryAddress.landmark}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* What Items the User Ordered */}
                                <div className="p-3.5 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-2.5 text-xs">
                                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400 uppercase">
                                    <div className="flex items-center gap-2">
                                      <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Items Ordered ({ord.items.reduce((acc, i) => acc + i.quantity, 0)} Items)</span>
                                    </div>
                                    <span className="text-zinc-400">Subtotal: ₹{ord.itemTotal}</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {ord.items.map((item, itemIdx) => (
                                      <div key={`ord-item-${ord.id}-${itemIdx}`} className="p-2 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <img
                                            src={item.image || "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=200"}
                                            alt={item.productName}
                                            className="w-9 h-9 rounded-lg object-cover shrink-0 border border-zinc-800 bg-zinc-900"
                                          />
                                          <div className="min-w-0">
                                            <p className="font-bold text-white truncate text-xs">
                                              {item.productName}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 font-mono">
                                              {item.brand} • {item.unit}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="text-right shrink-0 font-mono text-xs font-bold text-zinc-200">
                                          <span>{item.quantity}x</span>
                                          <span className="block text-[10px] text-emerald-400">₹{item.price * item.quantity}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Payment Type & Grand Total Breakdown */}
                                <div className="p-3.5 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="w-4 h-4 text-purple-400" />
                                      <span className="text-[11px] font-mono text-zinc-400 uppercase font-bold">Payment Method:</span>
                                    </div>

                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold font-mono border uppercase ${
                                      ord.paymentMethod === 'COD'
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                        : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                    }`}>
                                      {ord.paymentMethod === 'COD' ? '💵 Cash on Delivery (COD)' : `💳 ${ord.paymentMethod}`}
                                    </span>

                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${
                                      ord.paymentStatus === 'paid'
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    }`}>
                                      {ord.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 font-mono">
                                    <span className="text-zinc-400">Grand Total:</span>
                                    <span className="text-base font-black text-emerald-400">₹{ord.grandTotal}</span>
                                  </div>
                                </div>

                                {/* Admin Action Controls */}
                                <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-zinc-400">Change Status:</span>
                                    <select
                                      value={ord.orderStatus}
                                      onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                                      className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl font-bold font-mono text-xs text-blue-400 focus:outline-none focus:border-blue-500"
                                    >
                                      <option value="placed">Order Confirmed</option>
                                      <option value="packing">Packing Items</option>
                                      <option value="out_for_delivery">Out for Delivery</option>
                                      <option value="delivered">Delivered</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {!isCancelled && (
                                      <button
                                        onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                                        className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1 transition-colors"
                                      >
                                        <XCircle className="w-3.5 h-3.5" /> Cancel Order
                                      </button>
                                    )}

                                    <button
                                      onClick={() => {
                                        setSelectedAdminOrder(ord);
                                        setIsAdminDetailOpen(true);
                                      }}
                                      className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> Full Invoice & Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB 4: Delivery Locations & Google Maps Portal */}
                {activeTab === 'locations' && (
                  <div className="space-y-6">
                    {/* Header Banner */}
                    <div className="p-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-emerald-900/40 border border-blue-500/30 rounded-2xl space-y-1">
                      <div className="flex items-center gap-2 text-white font-bold text-base">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        <span>Owner Google Maps & Express Delivery Hub Portal</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        As the Owner, you can view user order drop-off locations on Google Maps, set exact GPS coordinates, and add custom express delivery hubs for Visakhapatnam.
                      </p>
                    </div>

                    {/* Add New Hub Form with Google Maps Access */}
                    <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                        <span className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                          <Plus className="w-4 h-4" /> Add Delivery Location with Google Maps
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">Owner Portal Exclusive</span>
                      </div>

                      <form onSubmit={handleAddOwnerLocation} className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-zinc-400 font-mono mb-1">Hub / Location Name *</label>
                            <input
                              type="text"
                              value={locName}
                              onChange={e => setLocName(e.target.value)}
                              placeholder="e.g. Gajuwaka Bypass Road Hub"
                              className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white font-semibold outline-none focus:border-emerald-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-zinc-400 font-mono mb-1">Area / Landmark *</label>
                            <input
                              type="text"
                              value={locArea}
                              onChange={e => setLocArea(e.target.value)}
                              placeholder="e.g. Durgavanipalem, Pedagantyada"
                              className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white font-semibold outline-none focus:border-emerald-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-zinc-400 font-mono mb-1">Pincode</label>
                            <input
                              type="text"
                              value={locPincode}
                              onChange={e => setLocPincode(e.target.value)}
                              placeholder="530026"
                              className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white font-mono outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-zinc-400 font-mono mb-1">Delivery ETA</label>
                            <input
                              type="text"
                              value={locEta}
                              onChange={e => setLocEta(e.target.value)}
                              placeholder="10-15 Mins"
                              className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white font-mono outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-zinc-400 font-mono mb-1">Latitude (Google Maps)</label>
                            <input
                              type="number"
                              step="any"
                              value={locLat}
                              onChange={e => setLocLat(Number(e.target.value))}
                              className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white font-mono text-xs outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-zinc-400 font-mono mb-1">Longitude (Google Maps)</label>
                            <input
                              type="number"
                              step="any"
                              value={locLng}
                              onChange={e => setLocLng(Number(e.target.value))}
                              className="w-full p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white font-mono text-xs outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Interactive Google Maps Preview Box */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-mono font-bold text-zinc-400 block">
                            🗺️ Google Maps Access - Pin Location Visualizer
                          </span>
                          <div className="h-44 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 relative">
                            <iframe
                              title="Google Maps Location Picker"
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              style={{ border: 0 }}
                              src={`https://maps.google.com/maps?q=${locLat},${locLng}&z=15&output=embed`}
                              allowFullScreen
                            />
                            <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] text-emerald-400 font-mono border border-emerald-500/30 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Pin: {locLat.toFixed(4)}, {locLng.toFixed(4)}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all"
                          >
                            <Plus className="w-4 h-4" /> Save Delivery Location to Store
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Serviceable Delivery Hubs List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase">
                        Current Store Delivery Hubs ({deliveryLocations.length})
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {deliveryLocations.map((loc, lIdx) => (
                          <div
                            key={`owner-loc-${loc.id}-${lIdx}`}
                            className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-2 text-xs flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-0.5">
                                <p className="font-extrabold text-white text-sm flex items-center gap-1.5">
                                  <Building className="w-4 h-4 text-blue-400" />
                                  <span>{loc.name}</span>
                                </p>
                                <p className="text-zinc-400 text-[11px]">{loc.area} (Pincode: {loc.pincode})</p>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                                {loc.deliveryEta}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px] font-mono">
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name + ', ' + loc.area + ' Visakhapatnam')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <MapPin className="w-3.5 h-3.5" /> View Google Maps
                              </a>

                              <button
                                type="button"
                                onClick={() => deleteDeliveryLocation(loc.id)}
                                className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove Hub
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer Live Orders Location Tracker on Google Maps */}
                    <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-blue-400 uppercase flex items-center gap-1.5">
                          <Compass className="w-4 h-4" /> Customer Live Orders Location Radar
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {allOrders.length} Recent Customer Orders
                        </span>
                      </div>

                      {allOrders.length === 0 ? (
                        <p className="text-zinc-500 text-xs italic py-2">No active customer orders placed yet.</p>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                          {allOrders.map((ord, oIdx) => (
                            <div key={`order-loc-${ord.id}-${oIdx}`} className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs space-y-2">
                              <div className="flex items-center justify-between font-mono">
                                <span className="font-extrabold text-white">{ord.id} - {ord.userName}</span>
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> +91 {ord.userPhone || '7207554777'}
                                </span>
                              </div>

                              <div className="text-zinc-300 text-[11px] leading-tight">
                                <strong>Delivery Address:</strong> {ord.deliveryAddress?.fullAddress || 'Visakhapatnam'}
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ord.deliveryAddress?.fullAddress || 'Gajuwaka Visakhapatnam')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1"
                                >
                                  <MapIcon className="w-3 h-3" /> Track Customer on Google Maps
                                </a>

                                <button
                                  type="button"
                                  onClick={() => {
                                    addDeliveryLocation({
                                      name: ord.deliveryAddress?.area || 'Customer Hub',
                                      area: ord.deliveryAddress?.fullAddress || 'Visakhapatnam',
                                      pincode: ord.deliveryAddress?.pincode || '530026',
                                      deliveryEta: '10 Mins',
                                      isServiceable: true,
                                      lat: 17.6888,
                                      lng: 83.2185
                                    });
                                  }}
                                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Location as Delivery Hub
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: Coupons */}
                {activeTab === 'coupons' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-mono font-bold text-zinc-400 uppercase">Discount Coupons</h3>
                    <form onSubmit={handleAddCoupon} className="flex gap-2 text-xs">
                      <input type="text" value={cCode} onChange={e => setCCode(e.target.value)} placeholder="Code (e.g. SUMMER10)" className="p-2 rounded-xl border border-zinc-800 bg-zinc-950 text-white font-mono font-bold uppercase" required />
                      <input type="number" value={cDiscount} onChange={e => setCDiscount(Number(e.target.value))} placeholder="% Off" className="w-20 p-2 rounded-xl border border-zinc-800 bg-zinc-950 text-white font-mono" required />
                      <button type="submit" className="px-4 py-2 bg-white text-black font-bold rounded-xl">Create</button>
                    </form>

                    <div className="space-y-2">
                      {allCoupons.map((c, cIdx) => (
                        <div key={`admin-c-${c.code}-${cIdx}`} className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs flex justify-between font-mono font-bold">
                          <span className="text-white">{c.code} ({c.discountPercent}% OFF above ₹{c.minOrderValue})</span>
                          <span className="text-emerald-400">ACTIVE</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 6: MongoDB Atlas Management */}
                {activeTab === 'database' && (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-400" />
                          MongoDB Atlas Cloud Database Integration
                        </h3>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          Enterprise NoSQL persistence for Manojavam Multi Enterprises store data.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={fetchMongoStatus}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold text-xs flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
                      </button>
                    </div>

                    {/* Status Overview Card */}
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${mongoStatus?.isConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-amber-500'}`} />
                          <span className="font-mono font-extrabold text-sm text-white">
                            {mongoStatus?.isConnected ? 'CONNECTED TO MONGODB ATLAS' : 'DISCONNECTED / IN-MEMORY FALLBACK MODE'}
                          </span>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/20">
                          {mongoStatus?.databaseType || 'MongoDB Atlas'}
                        </span>
                      </div>

                      {/* IP Address & Network Access Whitelist Card */}
                      <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-blue-500/30 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-400 flex items-center gap-1.5 uppercase text-[11px]">
                            <HardDrive className="w-4 h-4 text-blue-400" />
                            MongoDB Atlas Network Access IP Address
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">
                            Whitelisted IP
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 bg-black/60 rounded-lg border border-zinc-800 font-mono">
                          <div>
                            <p className="text-[10px] text-zinc-400 uppercase">IP Address to Add in MongoDB Atlas:</p>
                            <p className="text-sm font-extrabold text-emerald-400 select-all tracking-wider">
                              49.47.248.103/32
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('49.47.248.103/32');
                              addToast('Copied IP 49.47.248.103/32 to clipboard!', 'success');
                            }}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-mono text-[10px] font-bold transition-all shrink-0"
                          >
                            📋 Copy IP Address
                          </button>
                        </div>

                        <p className="text-[11px] text-zinc-300 leading-snug font-sans">
                          Add <code className="bg-zinc-800 text-emerald-300 px-1 py-0.5 rounded font-mono font-bold">49.47.248.103/32</code> under <strong className="text-white">Security &gt; Network Access &gt; + Add IP Address</strong> in your MongoDB Atlas console to allow database connections.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                        <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800">
                          <p className="text-[10px] text-zinc-500 uppercase">Products Synced</p>
                          <p className="text-lg font-bold text-white">{mongoStatus?.collections?.productsCount ?? products.length}</p>
                        </div>

                        <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800">
                          <p className="text-[10px] text-zinc-500 uppercase">Orders Synced</p>
                          <p className="text-lg font-bold text-white">{mongoStatus?.collections?.ordersCount ?? allOrders.length}</p>
                        </div>

                        <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800">
                          <p className="text-[10px] text-zinc-500 uppercase">Categories</p>
                          <p className="text-lg font-bold text-white">{mongoStatus?.collections?.categoriesCount ?? categories.length}</p>
                        </div>

                        <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800">
                          <p className="text-[10px] text-zinc-500 uppercase">Coupons</p>
                          <p className="text-lg font-bold text-white">{mongoStatus?.collections?.couponsCount ?? allCoupons.length}</p>
                        </div>
                      </div>

                      {mongoStatus?.connectionError && (
                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 font-mono text-[11px] space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-300">Database Connection Notice:</p>
                              <p className="text-zinc-300 mt-0.5">{mongoStatus.connectionError}</p>
                            </div>
                          </div>

                          {(mongoStatus.connectionError.includes('IP') || mongoStatus.connectionError.includes('Whitelist') || mongoStatus.connectionError.includes('Blocked')) && (
                            <div className="p-3 bg-zinc-900/80 rounded-lg border border-amber-500/30 text-zinc-300 space-y-1.5 font-sans">
                              <p className="font-bold text-emerald-400 text-xs font-mono">🛠️ How to Fix MongoDB Atlas IP Whitelist (1 Minute):</p>
                              <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-300">
                                <li>Log in to <a href="https://cloud.mongodb.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-mono">MongoDB Atlas Dashboard</a></li>
                                <li>Navigate to <strong className="text-white">Security &gt; Network Access</strong> in the left sidebar</li>
                                <li>Click <strong className="text-white">+ Add IP Address</strong></li>
                                <li>Click <strong className="text-emerald-400">ALLOW ACCESS FROM ANYWHERE</strong> (enters <code className="bg-zinc-800 px-1 py-0.5 rounded font-mono text-emerald-300">0.0.0.0/0</code>)</li>
                                <li>Click <strong className="text-white">Confirm</strong> and wait 1 minute for rules to propagate</li>
                                <li>Click <strong className="text-emerald-400 font-mono">Connect / Verify MongoDB Atlas</strong> below</li>
                              </ol>
                            </div>
                          )}

                          {(mongoStatus.connectionError.toLowerCase().includes('auth') || mongoStatus.connectionError.toLowerCase().includes('password')) && (
                            <div className="p-3 bg-zinc-900/80 rounded-lg border border-amber-500/30 text-zinc-300 space-y-1.5 font-sans">
                              <p className="font-bold text-amber-400 text-xs font-mono">🔑 How to Fix MongoDB Atlas Authentication Failure:</p>
                              <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-300">
                                <li>Log in to <a href="https://cloud.mongodb.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-mono">MongoDB Atlas Dashboard</a></li>
                                <li>Go to <strong className="text-white">Security &gt; Database Access</strong></li>
                                <li>Edit your Database User or create a new user (e.g., <code className="text-emerald-300 bg-zinc-800 px-1 py-0.5 rounded">admin</code>) and set a password</li>
                                <li>Ensure special characters in password are URL-encoded (or use alphanumeric characters)</li>
                                <li>Update your <code className="text-emerald-300 bg-zinc-800 px-1 py-0.5 rounded">MONGODB_URI</code> below with the correct username and password</li>
                                <li>Click <strong className="text-emerald-400 font-mono">Connect / Verify MongoDB Atlas</strong></li>
                              </ol>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* MongoDB Atlas URI Configurator */}
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                      <div className="flex items-center gap-2 text-zinc-300 font-mono font-bold text-xs uppercase">
                        <Server className="w-4 h-4 text-blue-400" />
                        <span>MongoDB Atlas Connection String (`MONGODB_URI`)</span>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                        You can configure <code className="text-emerald-300 font-mono bg-zinc-900 px-1 py-0.5 rounded">MONGODB_URI</code> in your AI Studio project secrets / environment variables, or enter your MongoDB Atlas connection string below to test live cluster connectivity.
                      </p>

                      <form onSubmit={handleTestMongoConnection} className="space-y-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={mongoInputUri}
                            onChange={(e) => setMongoInputUri(e.target.value)}
                            placeholder="mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/manivya?retryWrites=true&w=majority"
                            className="w-full p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-mono text-white outline-none focus:border-emerald-500 placeholder:text-zinc-600"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <p className="text-[10px] text-zinc-500 font-mono">
                            Declared in <code className="text-zinc-400">.env.example</code>: MONGODB_URI
                          </p>

                          <button
                            type="submit"
                            disabled={isTestingMongo}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs font-mono shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            {isTestingMongo ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Testing Connection...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Connect / Verify MongoDB Atlas</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Information Box */}
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-zinc-300 text-[11px] space-y-1">
                      <p className="font-bold text-blue-300 font-mono">⚡ How MongoDB Atlas Works in this App:</p>
                      <ul className="list-disc list-inside space-y-1 text-zinc-400">
                        <li>Automatic Seeding: Initial products, categories, coupons, and orders are seeded automatically when connected for the first time.</li>
                        <li>Real-Time Sync: All order placements, status updates, and stock count deductions automatically write to MongoDB collections in real-time.</li>
                        <li>High Availability: If MongoDB Atlas is offline or unconfigured, the app falls back seamlessly to in-memory state without crashing.</li>
                      </ul>
                    </div>

                  </div>
                )}


              </div>
            </div>
          )}
      </div>

      {/* Modal for Deleting Category */}
      <AnimatePresence>
        {deleteCategoryModalTarget && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-red-400 font-bold font-mono text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
                  <span>Delete Category: {deleteCategoryModalTarget.name}</span>
                </div>
                <button
                  onClick={() => setDeleteCategoryModalTarget(null)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(() => {
                const associatedCount = products.filter(p => p.category === deleteCategoryModalTarget.id).length;
                return (
                  <div className="space-y-3 text-xs">
                    <p className="text-zinc-300 font-mono">
                      This category currently contains <strong className="text-white font-bold">{associatedCount} associated product(s)</strong> in store inventory.
                    </p>

                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 font-mono">
                      <p className="text-[11px] text-zinc-400 font-bold uppercase">Select product handling option:</p>

                      <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors bg-zinc-900/60">
                        <input
                          type="radio"
                          name="deleteCategoryAction"
                          checked={deleteCategoryOption === 'recategorize'}
                          onChange={() => setDeleteCategoryOption('recategorize')}
                          className="mt-0.5 accent-blue-500"
                        />
                        <div>
                          <p className="font-bold text-white text-xs">Re-categorize items to 'General' (Recommended)</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Keep products in your store and automatically assign them to the 'General' category.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-red-500/20 hover:border-red-500/40 cursor-pointer transition-colors bg-red-500/5">
                        <input
                          type="radio"
                          name="deleteCategoryAction"
                          checked={deleteCategoryOption === 'remove'}
                          onChange={() => setDeleteCategoryOption('remove')}
                          className="mt-0.5 accent-red-500"
                        />
                        <div>
                          <p className="font-bold text-red-400 text-xs">Delete All Associated Products</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Permanently remove all {associatedCount} product(s) in this category from store inventory.</p>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setDeleteCategoryModalTarget(null)}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDeleteCategory}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Category
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Order Detail Modal */}
      {selectedAdminOrder && (
        <OrderDetailModal
          order={selectedAdminOrder}
          isOpen={isAdminDetailOpen}
          onClose={() => setIsAdminDetailOpen(false)}
        />
      )}
    </div>
  );
};
