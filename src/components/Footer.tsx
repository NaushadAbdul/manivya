import React from 'react';
import { useStore } from '../context/StoreContext';
import { ManivyaLogo } from './ManivyaLogo';
import { 
  MapPin, 
  PhoneCall, 
  Mail, 
  Star, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Heart,
  ExternalLink 
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { businessInfo, setSelectedCategory, setIsAIAssistantOpen, setIsAdminModalOpen } = useStore();

  return (
    <footer className="bg-[#4A3060] text-zinc-400 border-t border-purple-900/40 transition-colors pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-16 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Top Badges Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-8 border-b border-zinc-900">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100 uppercase font-mono">10-15 Min Express</p>
              <p className="text-[11px] text-zinc-500">Gajuwaka & Pedagantyada Hubs</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100 uppercase font-mono">100% Amul Authorized</p>
              <p className="text-[11px] text-zinc-500">Fresh Cold Chain Guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100 uppercase font-mono">5.0 Star Rating ★★★★★</p>
              <p className="text-[11px] text-zinc-500">1,280+ Verified Customers</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100 uppercase font-mono">Open Daily 6 AM - 11 PM</p>
              <p className="text-[11px] text-zinc-500">Instant Online Delivery</p>
            </div>
          </div>
        </div>

        {/* Middle Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          
          {/* Business Info Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="space-y-1">
              <ManivyaLogo className="w-11 h-11" showSubtext={true} />
            </div>

            <p className="text-zinc-400 text-xs leading-relaxed">
              Visakhapatnam’s premier multi-enterprise quick commerce store delivering Amul dairy, ice creams, Classmate stationery, custom t-shirts, magic mugs, bottles & memory foam pillows.
            </p>

            <div className="pt-2 space-y-1.5 text-zinc-300 font-mono">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{businessInfo.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${businessInfo.phone}`} className="hover:text-white transition-colors font-bold">
                  +91 {businessInfo.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              Multi Enterprises
            </p>
            <ul className="space-y-2 text-zinc-400 font-medium">
              <li>
                <button onClick={() => setSelectedCategory('dairy')} className="hover:text-white transition-colors">
                  Amul Fresh Dairy & Milk
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory('ice-creams')} className="hover:text-white transition-colors">
                  Amul Real Milk Ice Creams
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory('stationery')} className="hover:text-white transition-colors">
                  Notebooks & Classmate Stationery
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory('apparel-caps')} className="hover:text-white transition-colors">
                  MANIVYA Cotton Tees & Caps
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory('mugs-drinkware')} className="hover:text-white transition-colors">
                  Magic Heat-Sensitive Coffee Mugs
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory('bottles-keychains')} className="hover:text-white transition-colors">
                  Thermal Water Bottles & Keychains
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory('pillows-home')} className="hover:text-white transition-colors">
                  Orthopedic Sleeping Pillows
                </button>
              </li>
            </ul>
          </div>

          {/* Serviceable Visakhapatnam Hubs */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              Express Delivery Hubs
            </p>
            <ul className="space-y-2 text-zinc-400 font-mono text-[11px]">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Gajuwaka Bypass Road (530026)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Durgavanipalem, Pedagantyada</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Sheela Nagar Bypass Colony</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Kurmannapalem Steel Plant Twp</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Visakhapatnam Central Hub</span>
              </li>
            </ul>
          </div>

          {/* AI Assistance */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              Customer Support
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setIsAIAssistantOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-bold flex items-center justify-between transition-all"
              >
                <span>Launch Gemini AI Assistant</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-500 text-xs font-mono">
          <p>© 2026 Manojavam Multi Enterprises (MANIVYA). All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Crafted for Visakhapatnam</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          </p>
        </div>

      </div>
    </footer>
  );
};
