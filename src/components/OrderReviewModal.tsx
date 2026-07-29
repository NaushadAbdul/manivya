import React, { useState } from 'react';
import { OrderStatus } from '../types';
import { 
  X, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  User, 
  ShoppingBag, 
  CreditCard, 
  QrCode, 
  Banknote, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  Tag,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmOrder: (paymentMethod: 'UPI' | 'Razorpay' | 'Card' | 'COD') => void;
  isProcessing: boolean;
  cartItems: any[];
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    doorNo?: string;
    street?: string;
    area: string;
    pincode: string;
    fullAddress: string;
  };
  cartItemTotal: number;
  deliveryFee: number;
  handlingFee: number;
  driverTip: number;
  discountAmount: number;
  couponCode?: string | null;
  grandTotal: number;
  initialPaymentMethod: 'UPI' | 'Razorpay' | 'Card' | 'COD';
}

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({
  isOpen,
  onClose,
  onConfirmOrder,
  isProcessing,
  cartItems,
  customerName,
  customerPhone,
  deliveryAddress,
  cartItemTotal,
  deliveryFee,
  handlingFee,
  driverTip,
  discountAmount,
  couponCode,
  grandTotal,
  initialPaymentMethod
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'Razorpay' | 'Card' | 'COD'>(initialPaymentMethod);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-zinc-900 p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-500/30">
                  Step 2 of 2: Pending Confirmation
                </span>
                <h3 className="font-extrabold text-white text-base sm:text-lg">Review Order Details</h3>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            
            {/* Status Notice Banner */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-zinc-300 space-y-0.5">
                <p className="font-bold text-amber-200">Order Status: Pending Review</p>
                <p className="text-[11px] text-zinc-400">
                  Please confirm your delivery address and payment choice below. No order will be created until you finalize this checkout.
                </p>
              </div>
            </div>

            {/* Customer & Address Details */}
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-500 uppercase border-b border-zinc-800/80 pb-1.5">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-400" /> Delivery Information</span>
                <span className="text-emerald-400">Validated</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-2 text-zinc-200">
                  <User className="w-4 h-4 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-zinc-500">Customer Name</p>
                    <p className="font-bold text-white">{customerName || 'Valued Customer'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-zinc-200">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-zinc-500">Rider Contact Mobile</p>
                    <p className="font-bold font-mono text-emerald-300">+91 {customerPhone}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/80">
                <p className="text-[10px] text-zinc-500">Delivery Address</p>
                <p className="font-semibold text-zinc-200 mt-0.5 leading-relaxed">
                  {deliveryAddress.fullAddress}
                </p>
              </div>
            </div>

            {/* Items Summary */}
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-500 uppercase border-b border-zinc-800/80 pb-1.5">
                <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3 text-blue-400" /> Order Items ({cartItems.length})</span>
                <span className="font-mono text-zinc-400">Subtotal: ₹{cartItemTotal}</span>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {cartItems.map((item, idx) => (
                  <div key={`rev-item-${item.product.id}-${idx}`} className="flex items-center justify-between gap-2 bg-zinc-900/60 p-2 rounded-xl">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-10 h-10 object-cover rounded-lg border border-zinc-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate text-xs">{item.product.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          ₹{item.product.price} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-white shrink-0 text-xs">
                      ₹{item.product.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                Choose Payment Method
              </p>
              <div className="grid grid-cols-2 gap-2 font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('UPI')}
                  disabled={isProcessing}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                    selectedPaymentMethod === 'UPI'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>UPI / GPay / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('Razorpay')}
                  disabled={isProcessing}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                    selectedPaymentMethod === 'Razorpay'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Cards / Razorpay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('COD')}
                  disabled={isProcessing}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 col-span-2 transition-all ${
                    selectedPaymentMethod === 'COD'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cash on Delivery (Pay at Doorstep)</span>
                </button>
              </div>
            </div>

            {/* Bill Calculation Summary */}
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Items Subtotal</span>
                <span>₹{cartItemTotal}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Express Delivery Fee</span>
                <span>{deliveryFee === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Handling & Packaging</span>
                <span>₹{handlingFee}</span>
              </div>
              {driverTip > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Delivery Tip</span>
                  <span>₹{driverTip}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Coupon Discount ({couponCode})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-extrabold text-white">
                <span>Grand Total</span>
                <span className="text-emerald-400 text-base">₹{grandTotal}</span>
              </div>
            </div>

          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs sm:text-sm transition-all disabled:opacity-50"
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => onConfirmOrder(selectedPaymentMethod)}
              disabled={isProcessing}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-98 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {selectedPaymentMethod === 'COD' 
                      ? `CONFIRM ORDER (COD ₹${grandTotal})` 
                      : `CONFIRM & PAY ₹${grandTotal}`}
                  </span>
                </>
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
