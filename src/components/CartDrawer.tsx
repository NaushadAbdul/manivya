import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
import { OrderNotificationModal } from './OrderNotificationModal';
import confetti from 'canvas-confetti';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  MapPin, 
  Tag, 
  CreditCard, 
  QrCode, 
  Banknote, 
  ChevronRight, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Heart,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CartDrawer: React.FC = () => {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    cartItemTotal,
    selectedLocation,
    currentUser,
    addToast,
    setIsOrdersModalOpen,
    refreshOrders
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>('WELCOME50');
  const [driverTip, setDriverTip] = useState<number>(10);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Razorpay' | 'Card' | 'COD'>('UPI');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // User Mobile Contact Number for delivery rider contact
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '7207554777');

  // Order Confirmation Pop-Up Reminder Modal State
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.phone) {
      setContactPhone(currentUser.phone);
    }
  }, [currentUser]);

  if (!isCartOpen && !isNotificationOpen) return null;

  // Calculate bill breakdown
  const freeShippingThreshold = 299;
  const deliveryFee = cartItemTotal >= freeShippingThreshold ? 0 : 15;
  const handlingFee = 5;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartItemTotal);

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon === 'WELCOME50' && cartItemTotal >= 299) discountAmount = 50;
  else if (appliedCoupon === 'MANIVYA10' && cartItemTotal >= 200) discountAmount = Math.round(cartItemTotal * 0.1);
  else if (appliedCoupon === 'AMUL20' && cartItemTotal >= 150) discountAmount = 20;

  const grandTotal = Math.max(0, cartItemTotal + deliveryFee + handlingFee + driverTip - discountAmount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (code === 'MANIVYA10' || code === 'AMUL20' || code === 'WELCOME50') {
      setAppliedCoupon(code);
      addToast(`Coupon ${code} applied successfully! 🎉`, 'success');
    } else {
      addToast('Invalid or expired coupon code', 'error');
    }
    setCouponInput('');
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsPlacingOrder(true);

    const finalPhone = contactPhone.trim() || currentUser?.phone || '7207554777';

    try {
      const newOrder = await api.createOrder({
        userId: currentUser?.id,
        userName: currentUser?.name || 'Valued Customer',
        userPhone: finalPhone,
        userEmail: currentUser?.email || '',
        items: cart.map(i => ({
          productId: i.product.id,
          productName: i.product.name,
          brand: i.product.brand,
          unit: i.product.unit,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.image
        })),
        deliveryAddress: currentUser?.addresses[0] || {
          id: 'addr-default',
          title: 'Home',
          fullAddress: `25-1-13, Gajuwaka Bypass Road, ${selectedLocation.name}`,
          area: selectedLocation.area,
          pincode: selectedLocation.pincode
        },
        paymentMethod,
        couponCodeApplied: appliedCoupon || undefined
      });

      // Fire celebratory confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      clearCart();
      setIsCartOpen(false);
      
      // Trigger Pop-Up Reminder Modal
      setConfirmedOrder(newOrder);
      setIsNotificationOpen(true);

      addToast(`🛍️ Order #${newOrder.id} placed successfully! Total ₹${newOrder.grandTotal}. Arriving in 10 mins ⚡`, 'success');
      await refreshOrders();
    } catch (err: any) {
      addToast(err.message || 'Order placement failed', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-zinc-900 h-full shadow-2xl flex flex-col justify-between border-l border-zinc-800"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-400 uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>Delivery in {selectedLocation.deliveryEta}</span>
              </div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>My Cart ({cart.length})</span>
              </h2>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {cart.length === 0 ? (
            /* Empty Cart State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-white">Your Cart is Empty</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Explore Amul milk, ice creams, stationery, custom t-shirts & mugs delivered in 10 minutes.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-6 px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider shadow-md hover:bg-zinc-200 transition-all"
              >
                Browse Enterprise Store
              </button>
            </div>
          ) : (
            /* Cart Items Scroll Container */
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Free Shipping Meter */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div className="flex justify-between items-center text-xs font-semibold text-zinc-300 mb-1.5">
                  <span>
                    {amountToFreeShipping > 0 
                      ? `Add ₹${amountToFreeShipping} more for FREE Delivery` 
                      : '🎉 You unlocked FREE Express Delivery!'}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-emerald-400">
                    ₹{cartItemTotal} / ₹{freeShippingThreshold}
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300" 
                    style={{ width: `${Math.min(100, (cartItemTotal / freeShippingThreshold) * 100)}%` }} 
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {cart.map(({ product, quantity }, cartIdx) => (
                  <div
                    key={`cart-item-${product.id}-${cartIdx}`}
                    className="flex items-center justify-between gap-3 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800 relative group"
                  >
                    <img src={product.image} alt={product.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        {product.unit} • ₹{product.price}
                      </p>
                      <p className="text-xs font-extrabold text-white font-mono mt-0.5">
                        ₹{product.price * quantity}
                      </p>
                    </div>

                    {/* Delete Item Button */}
                    <button
                      onClick={() => {
                        removeFromCart(product.id);
                        addToast(`Removed ${product.name} from cart`, 'info');
                      }}
                      title="Delete item from cart"
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Quantity Selector */}
                    <div className="flex items-center bg-emerald-500 text-black font-mono font-bold text-xs rounded-xl overflow-hidden shadow-2xs">
                      <button
                        onClick={() => {
                          if (quantity <= 1) {
                            removeFromCart(product.id);
                            addToast(`Removed ${product.name} from cart`, 'info');
                          } else {
                            updateQuantity(product.id, -1);
                          }
                        }}
                        className="px-2 py-1.5 hover:bg-emerald-400"
                        title={quantity <= 1 ? "Remove item" : "Decrease quantity"}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-black">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="px-2 py-1.5 hover:bg-emerald-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Box */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 uppercase">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  <span>Coupons & Offers</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code (e.g. WELCOME50)"
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono font-bold text-white uppercase outline-none"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Apply
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs text-blue-400 font-mono font-bold bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                    <span>Applied: {appliedCoupon}</span>
                    <button onClick={() => setAppliedCoupon(null)} className="text-zinc-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Rider Tip */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-zinc-300">
                  <span>Support Delivery Rider Tip</span>
                  <span className="font-mono font-bold text-emerald-400">₹{driverTip}</span>
                </div>
                <div className="flex gap-2">
                  {[0, 10, 20, 30, 50].map(tip => (
                    <button
                      key={tip}
                      onClick={() => setDriverTip(tip)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                        driverTip === tip
                          ? 'border-blue-500 bg-blue-500 text-black font-extrabold'
                          : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {tip === 0 ? 'None' : `₹${tip}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bill Summary Breakdown */}
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <div className="font-mono font-bold text-zinc-500 uppercase text-[10px]">
                  Bill Details
                </div>
                
                <div className="flex justify-between text-zinc-300">
                  <span>Items Subtotal</span>
                  <span className="font-mono font-bold text-white">₹{cartItemTotal}</span>
                </div>

                <div className="flex justify-between text-zinc-300">
                  <span>Express Delivery</span>
                  <span className="font-mono font-bold">
                    {deliveryFee === 0 ? <span className="text-emerald-400">FREE</span> : `₹${deliveryFee}`}
                  </span>
                </div>

                <div className="flex justify-between text-zinc-300">
                  <span>Handling & Packaging</span>
                  <span className="font-mono font-bold text-white">₹{handlingFee}</span>
                </div>

                {driverTip > 0 && (
                  <div className="flex justify-between text-zinc-300">
                    <span>Delivery Tip</span>
                    <span className="font-mono font-bold text-white">₹{driverTip}</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Coupon Savings</span>
                    <span className="font-mono">-₹{discountAmount}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-extrabold text-white">
                  <span>To Pay</span>
                  <span className="font-mono text-base text-white">₹{grandTotal}</span>
                </div>
              </div>

              {/* Rider Contact Phone Input */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400 uppercase">
                  <span>Delivery Rider Contact Mobile *</span>
                  <span className="text-emerald-400">Rider will call on arrival</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800 focus-within:border-blue-500">
                  <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-mono font-bold text-zinc-400">+91</span>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="7207554777"
                    className="flex-1 bg-transparent text-xs font-mono font-bold text-white outline-none"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                  Select Payment Option
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                      paymentMethod === 'UPI'
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 font-bold'
                        : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-blue-400" />
                    <span>UPI / GPay / QR</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('Razorpay')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                      paymentMethod === 'Razorpay'
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 font-bold'
                        : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span>Razorpay / Cards</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 col-span-2 transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 font-bold'
                        : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <span>Cash on Delivery (Pay at Doorstep)</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Footer Checkout Bar */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 shadow-xl">
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm sm:text-base flex items-center justify-between shadow-xl transition-all active:scale-98 disabled:opacity-50"
              >
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-mono font-bold opacity-70">GRAND TOTAL</span>
                  <span className="font-mono text-lg leading-tight">₹{grandTotal}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span>{isPlacingOrder ? 'PLACING...' : 'PLACE ORDER'}</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}

        </motion.div>
      </div>

      {/* Pop-Up Reminder Modal on Order Placement */}
      {confirmedOrder && (
        <OrderNotificationModal
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          type="placed"
          order={confirmedOrder}
          onOpenTracking={() => {
            setIsOrdersModalOpen(true);
          }}
        />
      )}
    </AnimatePresence>
  );
};
