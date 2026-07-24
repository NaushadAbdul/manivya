import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ManivyaLogo } from './ManivyaLogo';
import { OrderDetailModal } from './OrderDetailModal';
import { api } from '../services/api';
import { Product, CategoryInfo, Coupon, Order, OrderStatus, AdminStats, ProductCategory } from '../types';
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
  Eye
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
    isAdminModalOpen, 
    setIsAdminModalOpen, 
    adminToken, 
    adminLogin, 
    adminLogout, 
    addToast,
    refreshProducts,
    refreshCategories,
    categories,
    products
  } = useStore();

  const [passcode, setPasscode] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'categories' | 'orders' | 'coupons' | 'settings'>('analytics');
  const [stats, setStats] = useState<AdminStats | null>(null);

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
    if (adminToken && isAdminModalOpen) {
      fetchAdminData();
    }
  }, [adminToken, isAdminModalOpen]);

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

  if (!isAdminModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.adminLogin(passcode);
      adminLogin(res.token);
      setPasscode('');
    } catch (err: any) {
      addToast(err.message || 'Invalid passcode', 'error');
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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden my-8 max-h-[88vh] flex flex-col text-zinc-100"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <ManivyaLogo className="h-6" />
                  <span className="text-xs font-mono font-bold text-zinc-300">
                    Owner Management Panel
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Owner Security Passcode Protected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {adminToken && (
                <button
                  onClick={adminLogout}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold font-mono transition-colors"
                >
                  Lock
                </button>
              )}
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!adminToken ? (
            /* Passcode Unlock Form */
            <div className="p-8 max-w-sm mx-auto my-auto text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
                <KeyRound className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Owner Security Verification</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Enter your owner passcode (Default: <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-blue-400 font-mono">owner123</code>)
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter Security Passcode"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono font-bold text-center text-white text-sm outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-sm shadow-md transition-all"
                >
                  Unlock Owner Dashboard
                </button>
              </form>
            </div>
          ) : (
            /* Main Owner Panel View */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Sidebar Navigation */}
              <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950 p-2 flex md:flex-col gap-1 overflow-x-auto shrink-0 font-mono text-xs font-bold">
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
                  onClick={() => setActiveTab('coupons')}
                  className={`p-2.5 rounded-xl flex items-center gap-2 transition-all ${
                    activeTab === 'coupons' ? 'bg-white text-black font-black' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <Tag className="w-4 h-4" /> Coupons
                </button>
              </div>

              {/* Right Content Body */}
              <div className="flex-1 p-5 overflow-y-auto">
                
                {/* TAB 1: Analytics */}
                {activeTab === 'analytics' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-mono font-bold text-zinc-400 uppercase">Live Store Overview</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                        <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Total Revenue</p>
                        <p className="text-2xl font-black font-mono text-white">₹{stats?.totalRevenue || 249}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                        <p className="text-[10px] font-mono font-bold text-blue-400 uppercase">Total Orders</p>
                        <p className="text-2xl font-black font-mono text-white">{stats?.todayOrdersCount || 1}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                        <p className="text-[10px] font-mono font-bold text-amber-400 uppercase">Low Stock Alert</p>
                        <p className="text-2xl font-black font-mono text-white">{stats?.lowStockProductsCount || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

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
                {activeTab === 'orders' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-mono font-bold text-zinc-400 uppercase">Customer Orders ({allOrders.length})</h3>
                    {allOrders.map((ord, ordIdx) => (
                      <div key={`admin-ord-${ord.id}-${ordIdx}`} className="p-3 rounded-2xl border border-zinc-800 bg-zinc-950 text-xs space-y-2.5">
                        <div className="flex justify-between font-mono font-bold">
                          <span className="text-white">ORDER #{ord.id} • {ord.userName}</span>
                          <span className="text-emerald-400">₹{ord.grandTotal}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 font-mono">Status:</span>
                            <select
                              value={ord.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                              className="bg-zinc-900 border border-zinc-800 p-1 rounded font-bold font-mono text-blue-400"
                            >
                              <option value="placed">Order Confirmed</option>
                              <option value="packing">Packing</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedAdminOrder(ord);
                              setIsAdminDetailOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 4: Coupons */}
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

              </div>

            </div>
          )}

        </motion.div>
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
    </AnimatePresence>
  );
};
