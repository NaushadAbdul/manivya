import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { 
  CheckCircle2, 
  Info, 
  AlertCircle, 
  X, 
  ShoppingBag, 
  XCircle, 
  Truck, 
  PackageCheck
} from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  const getToastStyleAndIcon = (toast: { message: string; type?: 'success' | 'info' | 'error' }) => {
    const msgLower = toast.message.toLowerCase();
    const isOrderAlert = msgLower.includes('order') || msgLower.includes('real-time');
    const isCancelled = msgLower.includes('cancel');
    const isPlaced = msgLower.includes('placed') || msgLower.includes('new order');

    if (isOrderAlert || isCancelled || isPlaced) {
      if (isCancelled) {
        return {
          cardBg: 'bg-zinc-950/95 border-red-500/50 text-white shadow-red-950/50 shadow-2xl',
          badgeBg: 'bg-red-500/15 text-red-400 border-red-500/30',
          badgeText: 'ORDER CANCELLED',
          Icon: XCircle,
          iconColor: 'text-red-400',
          pingBg: 'bg-red-400'
        };
      }
      if (isPlaced) {
        return {
          cardBg: 'bg-zinc-950/95 border-emerald-500/50 text-white shadow-emerald-950/50 shadow-2xl',
          badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          badgeText: 'ORDER PLACED',
          Icon: ShoppingBag,
          iconColor: 'text-emerald-400',
          pingBg: 'bg-emerald-400'
        };
      }
      return {
        cardBg: 'bg-zinc-950/95 border-blue-500/50 text-white shadow-blue-950/50 shadow-2xl',
        badgeBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        badgeText: 'STATUS UPDATE',
        Icon: Truck,
        iconColor: 'text-blue-400',
        pingBg: 'bg-blue-400'
      };
    }

    // Default notifications
    if (toast.type === 'error') {
      return {
        cardBg: 'bg-zinc-900/95 border-red-500/30 text-white shadow-xl',
        badgeBg: null,
        badgeText: null,
        Icon: AlertCircle,
        iconColor: 'text-red-400',
        pingBg: null
      };
    }
    if (toast.type === 'info') {
      return {
        cardBg: 'bg-zinc-900/95 border-blue-500/30 text-white shadow-xl',
        badgeBg: null,
        badgeText: null,
        Icon: Info,
        iconColor: 'text-blue-400',
        pingBg: null
      };
    }
    return {
      cardBg: 'bg-zinc-900/95 border-emerald-500/30 text-white shadow-xl',
      badgeBg: null,
      badgeText: null,
      Icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      pingBg: null
    };
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          const { cardBg, badgeBg, badgeText, Icon, iconColor, pingBg } = getToastStyleAndIcon(toast);

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -25, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, x: 60, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 backdrop-blur-xl rounded-2xl border text-xs font-medium ${cardBg}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`p-2 rounded-xl bg-zinc-900 border border-zinc-800 ${iconColor} shrink-0 mt-0.5 shadow-inner`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 space-y-1">
                  {badgeText && (
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black border uppercase tracking-wider ${badgeBg}`}>
                        {badgeText}
                      </span>
                      {pingBg && (
                        <span className="flex h-2 w-2 relative">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingBg} opacity-75`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${pingBg}`}></span>
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-zinc-100 font-semibold leading-snug break-words">
                    {toast.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
