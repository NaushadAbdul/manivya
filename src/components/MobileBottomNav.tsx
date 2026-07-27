import React from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Home, 
  Search, 
  LayoutGrid, 
  PackageCheck, 
  ShoppingBag, 
  Sparkles,
  User as UserIcon
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { 
    setIsSearchOpen,
    setIsCartOpen,
    setIsOrdersModalOpen,
    setIsAIAssistantOpen,
    setIsAuthModalOpen,
    setSelectedCategory,
    cartCount,
    cartItemTotal,
    currentUser
  } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#351E48]/95 backdrop-blur-md border-t border-purple-900/60 py-1.5 px-3 md:hidden shadow-2xl transition-all">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Home / Catalog */}
        <button
          onClick={() => {
            setSelectedCategory('all');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-zinc-300 hover:text-white transition-colors group"
        >
          <Home className="w-5 h-5 group-hover:scale-110 transition-transform text-zinc-200" />
          <span className="text-[10px] font-medium mt-0.5 font-mono">Shop</span>
        </button>

        {/* Search */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-zinc-300 hover:text-white transition-colors group"
        >
          <Search className="w-5 h-5 group-hover:scale-110 transition-transform text-zinc-200" />
          <span className="text-[10px] font-medium mt-0.5 font-mono">Search</span>
        </button>

        {/* AI Assistant */}
        <button
          onClick={() => setIsAIAssistantOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-amber-300 hover:text-amber-200 transition-colors group relative"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform text-amber-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 font-mono text-amber-300">AI Assist</span>
        </button>

        {/* Orders */}
        <button
          onClick={() => setIsOrdersModalOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-zinc-300 hover:text-white transition-colors group"
        >
          <PackageCheck className="w-5 h-5 group-hover:scale-110 transition-transform text-emerald-400" />
          <span className="text-[10px] font-medium mt-0.5 font-mono">Orders</span>
        </button>

        {/* Cart */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 text-zinc-100 hover:text-white transition-colors group relative"
        >
          <div className="relative p-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
            <ShoppingBag className="w-4 h-4 text-emerald-300" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1 min-w-[16px] h-4 bg-emerald-400 text-black font-mono text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5 font-mono text-emerald-300">
            {cartCount > 0 ? `₹${cartItemTotal}` : 'Cart'}
          </span>
        </button>

        {/* User Account */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 text-zinc-300 hover:text-white transition-colors group"
        >
          <UserIcon className="w-5 h-5 group-hover:scale-110 transition-transform text-zinc-200" />
          <span className="text-[10px] font-medium mt-0.5 font-mono max-w-[48px] truncate">
            {currentUser ? currentUser.name.split(' ')[0] : 'Account'}
          </span>
        </button>

      </div>
    </nav>
  );
};
