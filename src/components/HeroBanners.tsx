import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Zap, ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const BANNERS = [
  {
    id: 'b-1',
    badge: 'MANIVYA EXPRESS ⚡ 10-MIN HUB',
    title: 'Fresh Amul Dairy & Real Milk Ice Creams',
    subtitle: 'Amul Taaza Milk, Butter, Paneer & Epic Almond Chocobar delivered directly to your doorstep in 10 minutes!',
    cta: 'Order Amul Fresh',
    category: 'dairy',
    bgColor: 'from-emerald-950 via-neutral-900 to-black',
    accentColor: 'text-emerald-400',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'b-2',
    badge: 'ENTERPRISE MERCH & DRINKWARE',
    title: 'Custom T-Shirts, Embroidered Caps & Magic Mugs',
    subtitle: 'Heavyweight 220 GSM Cotton Tees, Adjustable Caps & Heat-Sensitive Color Reveal Mugs for gifts & daily style.',
    cta: 'Explore Apparel & Mugs',
    category: 'apparel-caps',
    bgColor: 'from-neutral-900 via-indigo-950 to-neutral-950',
    accentColor: 'text-cyan-400',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'b-3',
    badge: 'STUDY & ESSENTIALS',
    title: 'Classmate Notebooks, Stationery & Memory Foam Pillows',
    subtitle: 'Classmate 200-page notebooks, gel pens, stainless steel bottles & neck contour sleeping pillows.',
    cta: 'Shop Stationery & Comfort',
    category: 'stationery',
    bgColor: 'from-amber-950 via-neutral-900 to-neutral-950',
    accentColor: 'text-amber-400',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
  }
];

export const HeroBanners: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const { setSelectedCategory, setIsAIAssistantOpen } = useStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % BANNERS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[current];

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="relative rounded-3xl overflow-hidden bg-zinc-900 text-white shadow-xl min-h-[260px] sm:min-h-[300px] flex items-center border border-zinc-800">
        
        {/* Background Image Overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 opacity-25 bg-cover bg-center mix-blend-luminosity" style={{ backgroundImage: `url(${banner.image})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-950/95 to-transparent" />

        {/* Banner Content */}
        <div className="relative z-10 p-6 sm:p-10 max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-[11px] font-mono font-bold tracking-wider uppercase text-blue-400">
                <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>{banner.badge}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight font-sans">
                {banner.title}
              </h1>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                {banner.subtitle}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setSelectedCategory(banner.category as any)}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <span>{banner.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsAIAssistantOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs sm:text-sm border border-zinc-700/80 backdrop-blur-md flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>AI Bundle Recommendation</span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => setCurrent(prev => (prev === 0 ? BANNERS.length - 1 : prev - 1))}
            className="p-2 rounded-full bg-black/60 hover:bg-zinc-800 border border-zinc-800 text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1.5 font-mono text-xs px-2.5 py-1 rounded-full bg-black/60 text-zinc-400 border border-zinc-800">
            <span className="text-white font-bold">{current + 1}</span>
            <span>/</span>
            <span>{BANNERS.length}</span>
          </div>
          <button
            onClick={() => setCurrent(prev => (prev + 1) % BANNERS.length)}
            className="p-2 rounded-full bg-black/60 hover:bg-zinc-800 border border-zinc-800 text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
