import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  X, 
  Star, 
  Zap, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Heart,
  CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProductDetailModal: React.FC = () => {
  const { 
    quickViewProduct, 
    setQuickViewProduct, 
    addToCart, 
    cart, 
    updateQuantity, 
    toggleWishlist, 
    isWishlisted,
    products 
  } = useStore();

  const [qty, setQty] = useState(1);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const cartItem = cart.find(i => i.product.id === product.id);
  const wishlisted = isWishlisted(product.id);

  // Frequently bought together items from same category or complementary
  const relatedProducts = products
    .filter(p => p.id !== product.id && (p.category === product.category || p.isBestSeller))
    .slice(0, 3);

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden my-8"
        >
          {/* Close Button */}
          <button
            onClick={() => setQuickViewProduct(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Image Section */}
            <div className="p-6 bg-zinc-950 flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-zinc-800">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-inner bg-black">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-3 right-3 p-2.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-white shadow-md"
                >
                  <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                </button>

                <div className="absolute top-3 left-3 bg-black/80 border border-zinc-800 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 backdrop-blur-xs">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>MANIVYA EXPRESS</span>
                </div>
              </div>

              {/* Delivery Guarantees */}
              <div className="w-full mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-2 text-[11px] text-zinc-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% Genuine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cold Chain Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Product Details */}
            <div className="p-6 flex flex-col justify-between max-h-[80vh] overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold uppercase text-emerald-400">
                    {product.brand}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{product.rating} ({product.ratingCount} ratings)</span>
                  </div>
                </div>

                <h2 className="text-xl font-extrabold text-white leading-tight">
                  {product.name}
                </h2>

                <p className="text-xs text-zinc-400 font-mono mt-1">
                  Pack Size: <span className="font-bold text-zinc-200">{product.unit}</span>
                </p>

                {/* Price Display */}
                <div className="my-4 flex items-baseline gap-3">
                  <span className="text-2xl font-black font-mono text-white">
                    ₹{product.price}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-sm line-through text-zinc-500 font-mono">
                        ₹{product.originalPrice}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold">
                        Save {discountPercent}%
                      </span>
                    </>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                  {product.description}
                </p>

                {/* Technical Specifications */}
                {product.specs && (
                  <div className="mb-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <div className="text-xs font-mono font-bold text-zinc-500 mb-2 uppercase">
                      Specifications
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(product.specs).map(([key, val]) => (
                        <div key={`spec-${key}`} className="flex flex-col">
                          <span className="text-zinc-500 font-medium text-[10px]">{key}</span>
                          <span className="font-semibold text-zinc-200">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add to Cart Actions */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center border border-zinc-800 rounded-xl p-1 bg-zinc-950 font-mono font-bold text-sm">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="px-3 py-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-white">{qty}</span>
                    <button
                      onClick={() => setQty(qty + 1)}
                      className="px-3 py-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(product, qty);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add {qty} to Cart • ₹{product.price * qty}</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* Frequently Bought Together */}
          {relatedProducts.length > 0 && (
            <div className="p-6 bg-zinc-950/90 border-t border-zinc-800">
              <div className="text-xs font-mono font-bold uppercase text-zinc-500 mb-3">
                Frequently Bought Together
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedProducts.map((rel) => (
                  <div key={rel.id} className="flex items-center gap-3 p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                    <img src={rel.image} alt={rel.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-bold text-white truncate">{rel.name}</p>
                      <p className="text-zinc-400 font-mono">₹{rel.price}</p>
                    </div>
                    <button
                      onClick={() => addToCart(rel, 1)}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
