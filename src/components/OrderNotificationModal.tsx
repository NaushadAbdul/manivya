import React from 'react';
import { Order } from '../types';
import { DeliveryMapTracker } from './DeliveryMapTracker';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Truck, 
  X, 
  ShieldCheck, 
  Package, 
  Receipt,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'placed' | 'cancelled';
  order: Partial<Order> & {
    id: string;
    grandTotal?: number;
    userPhone?: string;
    userName?: string;
    deliveryAddress?: any;
    cancellationReason?: string;
  };
  onOpenTracking?: () => void;
}

export const OrderNotificationModal: React.FC<OrderNotificationModalProps> = ({
  isOpen,
  onClose,
  type,
  order,
  onOpenTracking
}) => {
  if (!isOpen) return null;

  const isPlaced = type === 'placed';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 p-6 overflow-hidden my-6 text-white"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Header */}
          <div className="text-center space-y-3">
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-xl border ${
                isPlaced
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}
            >
              {isPlaced ? (
                <CheckCircle2 className="w-9 h-9" />
              ) : (
                <XCircle className="w-9 h-9" />
              )}
            </div>

            <div>
              <span
                className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5 ${
                  isPlaced
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {isPlaced ? 'Order Confirmed - Pop-Up Reminder' : 'Order Cancelled - Pop-Up Reminder'}
              </span>
              <h2 className="text-xl font-black text-white">
                {isPlaced ? 'Thank You for Your Order!' : 'Order Cancellation Confirmed'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Order ID: #{order.id}
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="mt-5 space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs">
            {isPlaced ? (
              <>
                {/* Warm Greeting Message Banner */}
                <div className="p-3 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-emerald-500/40 rounded-xl text-center space-y-1">
                  <p className="text-sm font-black text-emerald-300">
                    Order placed thank you , Visit again 😊🙏🏻
                  </p>
                  <p className="text-[11px] text-zinc-300">
                    Your fresh daily essentials & dairy order is confirmed and being packed!
                  </p>
                </div>

                {/* Delivery Progress Steps */}
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">
                    Delivery Updates Tracker
                  </span>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]">
                      1. Placed
                    </div>
                    <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold text-[10px] animate-pulse">
                      2. Packing
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-500 text-[10px]">
                      3. Transit
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-500 text-[10px]">
                      4. Delivered
                    </div>
                  </div>
                </div>

                {/* User Personal Details */}
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800/80 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">
                    Customer & Address Details
                  </span>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-mono">Mobile Contact:</span>
                    <span className="font-bold text-white font-mono flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> +91 {order.userPhone || '7207554777'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <span className="text-zinc-400 font-mono shrink-0 mr-2">Home Address:</span>
                    <span className="font-semibold text-zinc-200 text-right text-[11px] leading-tight">
                      {order.deliveryAddress?.fullAddress || 'Door No. 25-1-13, Gajuwaka Bypass Road, Visakhapatnam'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                    <span className="text-zinc-400 font-mono">Payment Mode:</span>
                    <span className="font-bold text-blue-400 uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                      {order.paymentMethod || 'UPI'}
                    </span>
                  </div>
                </div>

                {/* Ordered Items Summary */}
                {order.items && order.items.length > 0 && (
                  <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800/80 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">
                      Ordered Products ({order.items.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0)})
                    </span>
                    <div className="max-h-36 overflow-y-auto divide-y divide-zinc-800/60 pr-1">
                      {order.items.map((item: any, idx: number) => (
                        <div key={`modal-item-${idx}`} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {item.image && (
                              <img src={item.image} alt={item.productName} className="w-8 h-8 rounded-lg object-cover bg-zinc-800 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-white text-[11px] truncate">{item.productName}</p>
                              <p className="text-[10px] text-zinc-400 font-mono">{item.quantity} x ₹{item.price}</p>
                            </div>
                          </div>
                          <span className="font-bold text-emerald-400 text-xs shrink-0 font-mono">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 font-mono">
                  <span className="text-zinc-400 font-mono">Grand Total Paid:</span>
                  <span className="font-black text-emerald-400 font-mono text-base">₹{order.grandTotal || 0}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400 font-mono">Cancellation Status:</span>
                  <span className="font-bold text-red-400">Successfully Cancelled</span>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400 font-mono">Refund Notice:</span>
                  <span className="font-bold text-emerald-400 font-mono">100% Instant Refund</span>
                </div>

                <p className="text-zinc-400 text-[11px] leading-relaxed pt-1">
                  Your payment of <strong className="text-white">₹{order.grandTotal || 0}</strong> will be refunded to your original payment method within 5 minutes.
                </p>
              </>
            )}
          </div>

          {/* Rider / Support Banner */}
          <div className="mt-3 p-3 bg-blue-950/40 rounded-xl border border-blue-800/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="font-bold text-blue-200">
                  {isPlaced ? 'Ramu K. (MANIVYA Rider)' : 'MANIVYA Store Support'}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {isPlaced ? 'Assigned & Heading to Store' : 'Available 24x7 for queries'}
                </p>
              </div>
            </div>

            <a
              href={`tel:${order.userPhone || '7207554777'}`}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] font-mono shrink-0"
            >
              Call +91 7207554777
            </a>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 space-y-2">
            <button
              onClick={onClose}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors ${
                isPlaced
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-lg'
                  : 'bg-white hover:bg-zinc-200 text-black font-extrabold'
              }`}
            >
              Close Window
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
