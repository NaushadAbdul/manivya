import React from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Star, Heart, Eye, Plus, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { 
    cart, 
    addToCart, 
    updateQuantity, 
    toggleWishlist, 
    isWishlisted,
    setQuickViewProduct 
  } = useStore();

  const cartItem = cart.find(i => i.product.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const wishlisted = isWishlisted(product.id);

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-zinc-900/90 rounded-2xl border border-zinc-800 p-3 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-zinc-500 transition-all overflow-hidden"
    >
      {/* Top Badges & Wishlist */}
      <div className="relative w-full aspect-square bg-zinc-950 rounded-xl overflow-hidden mb-3">
        
        {/* Product Image with Zoom */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />

        {/* Wishlist Floating Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-xs text-zinc-300 hover:text-white hover:scale-110 shadow-sm transition-all"
        >
          <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* ETA & Discount Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="px-2 py-0.5 rounded-md bg-black/80 border border-zinc-800 text-zinc-100 font-mono text-[10px] font-bold flex items-center gap-1 shadow-sm backdrop-blur-xs">
            <Zap className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
            <span>{product.deliveryTimeMinutes} MINS</span>
          </span>

          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-400 font-mono text-[10px] font-bold shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Quick View Button Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={() => setQuickViewProduct(product)}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 text-xs font-bold flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all hover:bg-white"
          >
            <Eye className="w-3.5 h-3.5" /> Quick View
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1 font-mono">
            <span className="font-bold uppercase text-emerald-400 truncate max-w-[100px] tracking-wider">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{product.rating}</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 
            onClick={() => setQuickViewProduct(product)}
            className="text-xs sm:text-sm font-bold text-zinc-100 line-clamp-2 hover:text-emerald-400 cursor-pointer transition-colors"
          >
            {product.name}
          </h3>

          {/* Unit / Pack Size */}
          <p className="text-[11px] text-zinc-500 mt-1 font-mono">
            {product.unit}
          </p>
        </div>

        {/* Price & Add to Cart Morphing Control */}
        <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          
          {/* Pricing */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-extrabold font-mono text-zinc-100">
                ₹{product.price}
              </span>
              {product.originalPrice && (
                <span className="text-[11px] line-through text-zinc-500 font-mono">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Morphing ADD Button */}
          <div>
            {quantity === 0 ? (
              <button
                onClick={() => addToCart(product, 1)}
                disabled={!product.inStock}
                className={`px-3 py-1.5 rounded-xl border font-mono font-bold text-xs flex items-center gap-1 transition-all active:scale-95 shadow-xs ${
                  product.inStock
                    ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 bg-emerald-500/10'
                    : 'border-zinc-800 text-zinc-600 cursor-not-allowed bg-zinc-950'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{product.inStock ? 'ADD' : 'OUT'}</span>
              </button>
            ) : (
              <div className="flex items-center bg-emerald-500 text-black font-mono font-bold text-xs rounded-xl overflow-hidden shadow-xs">
                <button
                  onClick={() => updateQuantity(product.id, -1)}
                  className="px-2.5 py-1.5 hover:bg-emerald-400 transition-colors"
                >
                  -
                </button>
                <span className="px-2 text-black font-extrabold">{quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, 1)}
                  className="px-2.5 py-1.5 hover:bg-emerald-400 transition-colors"
                >
                  +
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
};
