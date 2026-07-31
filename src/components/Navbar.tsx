import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ManivyaLogo } from './ManivyaLogo';
import { 
  MapPin, 
  Search, 
  ShoppingBag, 
  Sparkles, 
  Heart, 
  PackageCheck, 
  User as UserIcon,
  ChevronDown,
  PhoneCall,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SEARCH_PLACEHOLDERS = [
  "Search 'Amul Taaza Milk'",
  "Search 'Classmate Notebook 200 pgs'",
  "Search 'Magic Heat-Sensitive Mug'",
  "Search 'Amul Epic Choco Almond'",
  "Search 'MANIVYA Custom T-Shirt'",
  "Search 'Orthopedic Memory Foam Pillow'",
  "Search 'Thermal Water Bottle 1L'"
];

export const Navbar: React.FC = () => {
  const { 
    selectedLocation, 
    setIsLocationModalOpen,
    setIsSearchOpen,
    setIsCartOpen,
    setIsAIAssistantOpen,
    setIsOrdersModalOpen,
    setIsAuthModalOpen,
    cartCount,
    cartItemTotal,
    wishlist,
    currentUser,
    businessInfo
  } = useStore();

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const defaultUserAddress = currentUser?.addresses?.find(a => a.isDefault) || currentUser?.addresses?.[0];
  const displayLocationText = defaultUserAddress
    ? (defaultUserAddress.fullAddress || `${defaultUserAddress.area}, Visakhapatnam - ${defaultUserAddress.pincode}`)
    : selectedLocation.name;

  return (
    <header className="sticky top-0 z-40 bg-[#4A3060]/90 backdrop-blur-md border-b border-zinc-800/80 shadow-sm transition-colors">
      {/* Top Notice Bar */}
      <div className="bg-zinc-950 text-zinc-200 border-b border-zinc-900 px-4 py-1.5 text-xs flex justify-between items-center font-mono">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold px-1.5 py-0.5 rounded text-[10px]">
            EXPRESS HUB
          </span>
          <span className="truncate text-zinc-300">{businessInfo.deliveryNotice}</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-zinc-400 shrink-0">
          <a href={`tel:${businessInfo.phone}`} className="flex items-center gap-1 hover:text-white transition-colors">
            <PhoneCall className="w-3 h-3 text-emerald-400" />
            <span>+91 {businessInfo.phone}</span>
          </a>
          <span>•</span>
          <span>Visakhapatnam, AP</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col gap-2">
        
        {/* Row 1: Logo, Desktop Location, Search, Actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
          
          {/* Logo & Location */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 text-left group py-0.5"
            >
              <ManivyaLogo className="w-9 h-9 sm:w-11 sm:h-11" showSubtext={true} />
            </button>

            <div className="hidden lg:block h-8 w-px bg-zinc-800" />

            {/* Desktop Location Trigger */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-zinc-600 bg-zinc-900/80 text-left transition-all"
            >
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              <div className="flex flex-col max-w-[140px] md:max-w-[180px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1">
                  📍 Service Area
                </span>
                <span className="text-xs font-semibold text-zinc-200 truncate">
                  {displayLocationText}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0 ml-1" />
            </button>
          </div>

          {/* Search Trigger Bar (Desktop & Tablet) */}
          <div className="hidden sm:block flex-1 max-w-xl">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-4 py-2 sm:py-2.5 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-500 text-zinc-400 transition-all text-sm group shadow-xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Search className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition-colors shrink-0" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`sp-${placeholderIndex}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="truncate font-normal text-xs sm:text-sm text-zinc-400"
                  >
                    {SEARCH_PLACEHOLDERS[placeholderIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium bg-zinc-800 text-zinc-400 rounded border border-zinc-700/50">
                ⌘K
              </span>
            </button>
          </div>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Wishlist Button */}
            <button
              onClick={() => {
                if (wishlist.length === 0) {
                  useStore().addToast('Your wishlist is empty! Click ❤️ on products to save.', 'info');
                } else {
                  setIsSearchOpen(true);
                }
              }}
              className="relative p-2 sm:p-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 transition-colors"
              title="Wishlist"
            >
              <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center font-mono">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Admin Dashboard Link */}
            <a
              href="/manivya-dashboard"
              className="hidden lg:flex p-2.5 sm:px-3 sm:py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold items-center gap-1.5 transition-colors"
              title="Open Admin Dashboard & MongoDB Control"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin Panel</span>
            </a>

            {/* Orders Modal (Desktop/Tablet) */}
            <button
              onClick={() => setIsOrdersModalOpen(true)}
              className="hidden sm:flex p-2.5 sm:px-3 sm:py-2 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-medium items-center gap-1.5 transition-colors"
              title="My Orders & Live Tracking"
            >
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              <span>Orders</span>
            </button>

            {/* User Profile / Auth */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="p-2 sm:p-2.5 sm:px-3 sm:py-2 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden xl:inline max-w-[80px] truncate">
                {currentUser?.name.split(' ')[0] || 'Login'}
              </span>
            </button>

            {/* Cart Pill Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 shrink-0"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white font-mono text-[10px] font-black rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="font-mono">
                {cartCount > 0 ? `₹${cartItemTotal}` : 'Cart'}
              </span>
            </button>

          </div>

        </div>

        {/* Row 2 on Mobile (<640px): Mobile Search & Compact Location Selector */}
        <div className="flex sm:hidden items-center gap-2 pt-0.5">
          {/* Location Trigger Pill */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 shrink-0 max-w-[130px]"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-bounce" />
            <span className="truncate text-[11px] text-zinc-200 font-semibold">{displayLocationText}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
          </button>

          {/* Mobile Search Bar */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-400 text-xs"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate text-[11px] text-zinc-400 font-normal">
                {SEARCH_PLACEHOLDERS[placeholderIndex]}
              </span>
            </div>
          </button>
        </div>

      </div>
    </header>
  );
};
