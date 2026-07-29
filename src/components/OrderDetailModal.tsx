import React from 'react';
import { Order, OrderStatus } from '../types';
import { ManivyaLogo } from './ManivyaLogo';
import { 
  X, 
  PackageCheck, 
  Clock, 
  MapPin, 
  Printer, 
  RotateCcw, 
  PhoneCall, 
  CheckCircle2, 
  Truck, 
  Box, 
  XCircle,
  Receipt,
  CreditCard,
  User,
  ShoppingBag,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onReorder?: (order: Order) => void;
  onCancelOrder?: (order: Order) => void;
}

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'placed', label: 'Order Confirmed', desc: 'Received at MANIVYA Enterprise Hub' },
  { status: 'packing', label: 'Packing Items', desc: 'Cold chain & safety checked' },
  { status: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider is on the way' },
  { status: 'delivered', label: 'Delivered', desc: 'Handed over safely at doorstep' }
];

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onReorder,
  onCancelOrder
}) => {
  if (!isOpen || !order) return null;

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return 0;
      case 'packing': return 1;
      case 'out_for_delivery': return 2;
      case 'delivered': return 3;
      default: return -1;
    }
  };

  const currentStep = getStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Order Delivered
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-1.5 animate-pulse">
            <Truck className="w-3.5 h-3.5" /> Out for Delivery
          </span>
        );
      case 'packing':
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5" /> Packing Items
          </span>
        );
      case 'placed':
        return (
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Order Placed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden my-6 max-h-[90vh] flex flex-col text-zinc-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-white font-mono">
                    ORDER #{order.id}
                  </h2>
                  {getStatusBadge(order.orderStatus)}
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* Warm Greeting Message Banner */}
            {!isCancelled && (
              <div className="p-3.5 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-emerald-500/40 rounded-2xl text-center space-y-1">
                <p className="text-base font-black text-emerald-300">
                  Order placed thank you , Visit again 😊🙏🏻
                </p>
                <p className="text-xs text-zinc-300">
                  We are packing your ordered fresh items with maximum safety & care!
                </p>
              </div>
            )}

            {/* Delivery Progress & Live Status */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wide">
                    Delivery Status & Tracking
                  </span>
                </div>
                {!isCancelled && (
                  <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    Direct Express Delivery
                  </span>
                )}
              </div>

              {!isCancelled ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div 
                        key={`step-detail-${step.status}-${idx}`} 
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-blue-500/10 border-blue-500/40 text-white'
                            : isCompleted
                            ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300'
                            : 'bg-zinc-950/40 border-zinc-900 text-zinc-600'
                        }`}
                      >
                        <div className="flex justify-center mb-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                            isCompleted
                              ? 'bg-blue-500 text-black font-bold'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                        </div>
                        <p className={`text-xs font-bold ${isCompleted ? 'text-white' : 'text-zinc-500'}`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300 text-xs">
                  <XCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <div>
                    <p className="font-bold">This order was cancelled.</p>
                    <p className="text-[11px] text-red-400/80">Any debited payment will be refunded to your original payment method within 2-3 business days.</p>
                  </div>
                </div>
              )}

              {/* Rider Details if out for delivery or delivered */}
              {!isCancelled && (order.orderStatus === 'out_for_delivery' || order.orderStatus === 'delivered' || order.orderStatus === 'packing') && (
                <div className="mt-3 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-blue-400 font-bold border border-zinc-700">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-200">{order.driverName || 'Ramu K. (MANIVYA Rider)'}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">Express Delivery Specialist</p>
                    </div>
                  </div>

                  {order.driverPhone && (
                    <a
                      href={`tel:${order.driverPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Call Rider ({order.driverPhone})
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Address Details */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 uppercase">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Delivery Address & Customer Info</span>
              </div>

              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    {order.deliveryAddress.title || 'Delivery Address'} • {order.userName}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {order.deliveryAddress.pincode}
                  </span>
                </div>
                <p className="text-zinc-300 font-mono text-[11px] leading-relaxed">
                  {order.deliveryAddress.fullAddress}
                </p>
                {order.deliveryAddress.landmark && (
                  <p className="text-zinc-400 text-[11px] italic">
                    Landmark: {order.deliveryAddress.landmark}
                  </p>
                )}
                <p className="text-zinc-400 text-[11px] font-mono pt-1 border-t border-zinc-800/40">
                  Contact: <span className="text-zinc-200 font-bold">{order.userPhone}</span>
                  {order.userEmail && <span className="ml-2 text-zinc-400">({order.userEmail})</span>}
                </p>
              </div>
            </div>

            {/* Specific Items List */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400 uppercase">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>Specific Items Ordered ({order.items.reduce((acc, i) => acc + i.quantity, 0)})</span>
                </div>
              </div>

              <div className="divide-y divide-zinc-800/60">
                {order.items.map((item, idx) => (
                  <div key={`item-detail-${item.productId || idx}-${idx}`} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={item.image || "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=200"} 
                        alt={item.productName} 
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-800 bg-zinc-900"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate text-xs sm:text-sm">
                          {item.productName}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                          <span>{item.brand}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">{item.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <div className="font-bold text-white text-xs sm:text-sm">
                        ₹{item.price * item.quantity}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {item.quantity} x ₹{item.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Price Breakdown */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 uppercase">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>Payment & Total Prices</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold font-mono uppercase">
                    {order.paymentMethod}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Items Subtotal</span>
                  <span className="text-zinc-200 font-bold">₹{order.itemTotal}</span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <span>Delivery Charge</span>
                  <span className={order.deliveryFee === 0 ? "text-emerald-400 font-bold" : "text-zinc-200 font-bold"}>
                    {order.deliveryFee === 0 ? 'FREE Delivery' : `₹${order.deliveryFee}`}
                  </span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <span>Handling & Packaging</span>
                  <span className={order.handlingFee === 0 ? "text-emerald-400 font-bold" : "text-zinc-200 font-bold"}>
                    {order.handlingFee === 0 ? 'FREE' : `₹${order.handlingFee}`}
                  </span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-zinc-800/40">
                    <span className="flex items-center gap-1">
                      Coupon Savings {order.couponCodeApplied && `(${order.couponCodeApplied})`}
                    </span>
                    <span>-₹{order.discountAmount}</span>
                  </div>
                )}

                <div className="pt-2.5 border-t border-zinc-800 flex justify-between items-center text-sm font-extrabold">
                  <span className="text-white">Grand Total Paid</span>
                  <span className="text-base text-emerald-400 font-black">₹{order.grandTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {/* Cancel Button */}
              {!isCancelled && order.orderStatus !== 'delivered' && onCancelOrder && (
                <button
                  onClick={() => {
                    onCancelOrder(order);
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Cancel Order
                </button>
              )}

              {/* Invoice Download Link */}
              <a
                href={`/api/orders/${order.id}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors text-zinc-200"
              >
                <Printer className="w-4 h-4" /> Tax Invoice
              </a>
            </div>

            <div className="flex items-center gap-2">
              {/* Reorder Button */}
              {onReorder && !isCancelled && (
                <button
                  onClick={() => {
                    onReorder(order);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/20"
                >
                  <RotateCcw className="w-4 h-4" /> Reorder Items
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
