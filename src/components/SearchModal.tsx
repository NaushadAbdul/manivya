import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Search, X, Sparkles, Plus, Check, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

const POPULAR_SEARCHES = [
  "Amul Milk", "Amul Epic Ice Cream", "Classmate Notebook", 
  "Magic Coffee Mug", "MANIVYA T-Shirt", "Orthopedic Pillow", "Water Bottle"
];

export const SearchModal: React.FC = () => {
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    products, 
    addToCart, 
    cart, 
    updateQuantity,
    setQuickViewProduct
  } = useStore();

  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState<Product[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered([]);
      return;
    }
    const q = query.toLowerCase().trim();
    const matches = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
    setFiltered(matches);
  }, [query, products]);

  if (!isSearchOpen) return null;

  const getItemQuantityInCart = (productId: string) => {
    const found = cart.find(i => i.product.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          className="relative w-full max-w-2xl bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Search Header Input */}
          <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
            <Search className="w-5 h-5 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for Amul milk, ice creams, notebooks, t-shirts, mugs..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 text-sm sm:text-base font-medium"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-full text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsSearchOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              ESC
            </button>
          </div>

          {/* Results or Suggestions */}
          <div className="p-4 overflow-y-auto flex-1">
            {!query.trim() ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase text-zinc-400 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Popular Quick Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((term, termIdx) => (
                      <button
                        key={`pop-${term}-${termIdx}`}
                        onClick={() => setQuery(term)}
                        className="px-3 py-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-800 hover:text-white border border-zinc-700/60 text-xs font-medium text-zinc-300 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800">
                  <div className="text-xs font-mono font-semibold uppercase text-zinc-400 mb-2">
                    Trending Products Today
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {products.filter(p => p.isBestSeller || p.isTrending).slice(0, 4).map((p, pIdx) => (
                      <div
                        key={`trending-${p.id}-${pIdx}`}
                        onClick={() => {
                          setQuickViewProduct(p);
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800/80 cursor-pointer border border-transparent hover:border-zinc-700 transition-all"
                      >
                        <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{p.name}</p>
                          <p className="text-[11px] text-zinc-400">{p.unit} • <span className="font-bold text-emerald-400">₹{p.price}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-zinc-400">
                  No products found for "<span className="font-bold text-zinc-200">{query}</span>"
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Try searching for dairy, stationery, t-shirts, mugs, water bottles or pillows.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-mono text-zinc-400 font-semibold">
                  FOUND {filtered.length} MATCHES
                </div>

                {filtered.map((product, fIdx) => {
                  const qty = getItemQuantityInCart(product.id);
                  return (
                    <div
                      key={`search-${product.id}-${fIdx}`}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-zinc-800 hover:border-zinc-600 bg-zinc-950/60 transition-all"
                    >
                      <div 
                        onClick={() => {
                          setQuickViewProduct(product);
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                              ⚡ 10 MINS
                            </span>
                            <span className="text-xs font-semibold text-zinc-400 uppercase">
                              {product.brand}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-zinc-400">
                            {product.unit} • <span className="font-bold text-white">₹{product.price}</span>
                            {product.originalPrice && (
                              <span className="line-through text-zinc-500 ml-1.5 font-mono">₹{product.originalPrice}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Add Button */}
                      <div>
                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(product, 1)}
                            className="px-4 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold text-xs font-mono transition-all active:scale-95 flex items-center gap-1 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> ADD
                          </button>
                        ) : (
                          <div className="flex items-center bg-emerald-500 text-black font-mono font-bold text-xs rounded-xl overflow-hidden shadow-2xs">
                            <button
                              onClick={() => updateQuantity(product.id, -1)}
                              className="px-2.5 py-1.5 hover:bg-emerald-400"
                            >
                              -
                            </button>
                            <span className="px-2 font-black">{qty}</span>
                            <button
                              onClick={() => updateQuantity(product.id, 1)}
                              className="px-2.5 py-1.5 hover:bg-emerald-400"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
