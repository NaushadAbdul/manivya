import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCategory } from '../types';
import { 
  Milk, 
  IceCream, 
  BookOpen, 
  Shirt, 
  Coffee, 
  Droplet, 
  Bed, 
  Utensils, 
  Sparkles,
  LayoutGrid
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Milk,
  IceCream,
  BookOpen,
  Shirt,
  Coffee,
  Droplet,
  Bed,
  Utensils,
  Sparkles
};

export const CategoryBar: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory, products } = useStore();

  const getCategoryCount = (catId: ProductCategory) => {
    return products.filter(p => p.category === catId).length;
  };

  return (
    <nav className="bg-[#4A3060]/90 backdrop-blur-md border-b border-purple-900/40 py-2.5 px-3 sm:px-6 overflow-x-auto no-scrollbar sticky top-[82px] sm:top-[88px] z-30 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3 min-w-max">
        
        {/* All Products Tab */}
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-mono transition-all border ${
            selectedCategory === 'all'
              ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm font-bold'
              : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>All Items ({products.length})</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const IconComp = ICON_MAP[cat.iconName] || Sparkles;
          const count = getCategoryCount(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shrink-0 ${
                isSelected
                  ? 'bg-emerald-500 text-black border-emerald-500 font-bold shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-emerald-400'}`} />
              <span>{cat.name}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                isSelected ? 'bg-emerald-600/30 text-emerald-950 font-bold' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}

      </div>
    </nav>
  );
};
