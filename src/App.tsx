import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { ToastContainer } from './components/ToastContainer';
import { Navbar } from './components/Navbar';
import { ManivyaLogo } from './components/ManivyaLogo';
import { LocationModal } from './components/LocationModal';
import { SearchModal } from './components/SearchModal';
import { CategoryBar } from './components/CategoryBar';
import { HeroBanners } from './components/HeroBanners';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { OrdersModal } from './components/OrdersModal';
import { AuthModal } from './components/AuthModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { 
  Sparkles, 
  TrendingUp, 
  Flame, 
  Star, 
  ArrowUpDown, 
  Filter,
  Zap,
  ShoppingBag
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { 
    products, 
    categories, 
    selectedCategory, 
    setSelectedCategory,
    setIsAIAssistantOpen,
    setIsCartOpen,
    setIsAdminModalOpen,
    cartCount
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdminModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsAdminModalOpen]);

  const [filterType, setFilterType] = useState<'all' | 'bestsellers' | 'deals' | 'trending'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'rating'>('default');

  // Filter products based on selected category and filter tab
  let displayProducts = products.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (filterType === 'bestsellers' && !p.isBestSeller) return false;
    if (filterType === 'deals' && (!p.originalPrice || p.originalPrice <= p.price)) return false;
    if (filterType === 'trending' && !p.isTrending) return false;
    return true;
  });

  // Sort products
  if (sortBy === 'price-low') {
    displayProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    displayProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    displayProducts.sort((a, b) => b.rating - a.rating);
  }

  const currentCategoryObj = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Category Bar */}
      <CategoryBar />

      {/* Hero Banner Slider */}
      {selectedCategory === 'all' && <HeroBanners />}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Category Header Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <ManivyaLogo className="h-5" />
              <span className="text-xs font-mono font-bold uppercase text-blue-400">
                ENTERPRISE STORE
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs font-mono text-zinc-500">
                COLD-CHAIN EXPRESS
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {selectedCategory === 'all' 
                ? 'All Products Catalog' 
                : currentCategoryObj?.name || selectedCategory}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {currentCategoryObj?.description || 'Browse Amul dairy, ice creams, Classmate notebooks, t-shirts, magic mugs, bottles & pillows.'}
            </p>
          </div>

          {/* Filters & Sorting Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filter Tabs */}
            <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs font-mono font-bold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterType === 'all'
                    ? 'bg-zinc-100 text-zinc-950 font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('bestsellers')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  filterType === 'bestsellers'
                    ? 'bg-zinc-100 text-amber-600 font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Best Sellers
              </button>
              <button
                onClick={() => setFilterType('deals')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterType === 'deals'
                    ? 'bg-zinc-100 text-blue-600 font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Flash Deals
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent outline-none cursor-pointer text-zinc-200"
              >
                <option value="default" className="bg-zinc-900 text-white">Popularity</option>
                <option value="price-low" className="bg-zinc-900 text-white">Price: Low to High</option>
                <option value="price-high" className="bg-zinc-900 text-white">Price: High to Low</option>
                <option value="rating" className="bg-zinc-900 text-white">Top Rated ★</option>
              </select>
            </div>

          </div>
        </div>

        {/* Product Grid */}
        {displayProducts.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 rounded-3xl border border-zinc-800 p-8">
            <p className="text-base font-bold text-zinc-200">
              No products found in this filter selection.
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Try switching back to 'All Items' or clearing your filter tab.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setFilterType('all');
              }}
              className="mt-4 px-5 py-2 rounded-xl bg-white text-black font-bold text-xs uppercase"
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {displayProducts.map((product, idx) => (
              <ProductCard key={`grid-${product.id}-${idx}`} product={product} />
            ))}
          </div>
        )}

        {/* Floating Chatbot Trigger at Bottom-Left with Time Greeting */}
        <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-1.5 group">
          <div className="px-3 py-1 rounded-full bg-zinc-900/90 text-blue-300 border border-blue-500/40 text-[11px] font-mono font-bold shadow-2xl backdrop-blur-md flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {(() => {
              const hour = new Date().getHours();
              if (hour >= 5 && hour < 12) return 'Good morning! 🌅';
              if (hour >= 12 && hour < 17) return 'Good afternoon! ☀️';
              return 'Good evening! 🌙';
            })()}
          </div>

          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-2xl border border-blue-400/40 active:scale-95 transition-all group-hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>MANIVYA AI Chatbot</span>
          </button>
        </div>

        {/* Floating Quick Cart Trigger for Mobile */}
        <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-2.5 sm:hidden">
          {cartCount > 0 && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-3 rounded-full bg-zinc-900 text-zinc-100 font-mono font-bold text-xs flex items-center gap-2 shadow-2xl border border-zinc-700 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>{cartCount} Items</span>
            </button>
          )}
        </div>

      </main>

      {/* Floating Modals */}
      <LocationModal />
      <SearchModal />
      <ProductDetailModal />
      <CartDrawer />
      <OrdersModal />
      <AuthModal />
      <AIAssistantModal />
      <AdminDashboard />

      {/* Footer */}
      <Footer />

    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <ToastContainer />
      <MainContent />
    </StoreProvider>
  );
}
