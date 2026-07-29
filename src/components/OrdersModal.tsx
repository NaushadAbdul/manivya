import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ManivyaLogo } from './ManivyaLogo';
import { OrderNotificationModal } from './OrderNotificationModal';
import { OrderDetailModal } from './OrderDetailModal';
import { api } from '../services/api';
import { Order, OrderStatus } from '../types';
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
  ChevronDown,
  XCircle,
  Eye,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'placed', label: 'Order Confirmed', desc: 'Received at MANIVYA Enterprise Hub' },
  { status: 'packing', label: 'Packing Items', desc: 'Cold chain & safety checked at Gajuwaka' },
  { status: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider is on the way to your location' },
  { status: 'delivered', label: 'Delivered', desc: 'Handed over safely at doorstep' }
];

export const OrdersModal: React.FC = () => {
  const { isOrdersModalOpen, setIsOrdersModalOpen, currentUser, addToCart, products, addToast } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cancellation Confirmation Dialog State
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Cancellation Pop-Up State
  const [cancelledOrder, setCancelledOrder] = useState<Order | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Detailed Order View Modal State
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (isOrdersModalOpen) {
      fetchOrders();
    }
  }, [isOrdersModalOpen, currentUser]);

  const fetchOrders = () => {
    setIsLoading(true);
    api.getOrders(currentUser?.id)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const handleCancelOrder = (order: Order) => {
    setOrderToCancel(order);
  };

  const executeCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);

    try {
      await api.cancelOrder(orderToCancel.id, 'Cancelled by customer');
      
      // Update order status locally to cancelled
      const updatedOrder = { ...orderToCancel, orderStatus: 'cancelled' as OrderStatus };
      setOrders(prev => prev.map(o => o.id === orderToCancel.id ? updatedOrder : o));
      
      if (selectedDetailOrder?.id === orderToCancel.id) {
        setSelectedDetailOrder(updatedOrder);
      }
      
      setCancelledOrder(updatedOrder);
      setIsCancelModalOpen(true);
      addToast(`🚨 Order #${orderToCancel.id} was CANCELLED successfully`, 'error');
      fetchOrders();
    } catch (err: any) {
      addToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setIsCancelling(false);
      setOrderToCancel(null);
    }
  };

  if (!isOrdersModalOpen) return null;

  const handleReorder = (order: Order) => {
    order.items.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) addToCart(p, item.quantity);
    });
    addToast('Order items added back to cart! 🛒', 'success');
    setIsOrdersModalOpen(false);
  };

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return 0;
      case 'packing': return 1;
      case 'out_for_delivery': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden my-8 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white">
                  My Orders
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                  <ManivyaLogo className="h-4" />
                  <span>Multi Enterprise Orders</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOrdersModalOpen(false)}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-zinc-500 font-mono text-sm">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm font-bold text-zinc-300">No orders placed yet!</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Place an order for Amul milk, ice creams, stationery or merch to see your order history.
                </p>
              </div>
            ) : (
              orders.map((order, orderIdx) => {
                const currentStep = getStepIndex(order.orderStatus);
                const isCancelled = order.orderStatus === 'cancelled';

                return (
                  <div
                    key={`order-${order.id}-${orderIdx}`}
                    className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4 shadow-xs"
                  >
                    {/* Top Order Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-extrabold text-white">ORDER #{order.id}</span>
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] border ${
                            isCancelled 
                              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}>
                            {isCancelled ? 'CANCELLED' : `${order.paymentStatus} (${order.paymentMethod})`}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          Placed on: {new Date(order.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* View Details Button */}
                        <button
                          onClick={() => {
                            setSelectedDetailOrder(order);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shadow-blue-500/20 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>

                        {/* Cancel Order Button (Any active non-delivered/non-cancelled order) */}
                        {!isCancelled && order.orderStatus !== 'delivered' && (
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel Order
                          </button>
                        )}

                        {/* Print Invoice Button */}
                        <a
                          href={`/api/orders/${order.id}/invoice`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors text-zinc-200"
                        >
                          <Printer className="w-3.5 h-3.5" /> Tax Invoice
                        </a>

                        {/* Reorder Button */}
                        <button
                          onClick={() => handleReorder(order)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reorder
                        </button>
                      </div>
                    </div>

                    {/* Order Status Progress or Cancelled Banner */}
                    {!isCancelled ? (
                      <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                        <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase mb-2">
                          Order Progress
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {STATUS_STEPS.map((step, idx) => {
                            const isCompleted = idx <= currentStep;
                            const isCurrent = idx === currentStep;

                            return (
                              <div key={`step-${step.status}-${idx}`} className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                                  isCompleted
                                    ? 'bg-blue-500 text-black font-bold shadow-sm'
                                    : 'bg-zinc-800 text-zinc-500'
                                } ${isCurrent ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-900' : ''}`}>
                                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                </div>
                                <span className={`text-[11px] font-bold mt-1 ${isCompleted ? 'text-white' : 'text-zinc-500'}`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-red-300 text-xs font-mono">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Order was cancelled by customer.</span>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="space-y-1.5">
                      {order.items.map((item, i) => (
                        <div key={`ord-item-${order.id}-${item.productId || i}-${i}`} className="flex items-center justify-between text-xs font-mono text-zinc-300">
                          <span className="truncate max-w-[280px]">
                            {item.quantity}x {item.productName} ({item.unit})
                          </span>
                          <span className="font-bold text-white">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="pt-2 border-t border-zinc-800 flex justify-between text-xs font-extrabold font-mono">
                      <span>Total Paid</span>
                      <span className="text-white text-sm">₹{order.grandTotal}</span>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Cancellation Pop-Up Reminder Modal */}
      {cancelledOrder && (
        <OrderNotificationModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          type="cancelled"
          order={cancelledOrder}
        />
      )}

      {/* Order Detail View Modal */}
      {selectedDetailOrder && (
        <OrderDetailModal
          order={selectedDetailOrder}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onReorder={handleReorder}
          onCancelOrder={handleCancelOrder}
        />
      )}

      {/* Confirmation Modal before canceling order */}
      {orderToCancel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-mono">Cancel Order #{orderToCancel.id}?</h3>
              <p className="text-xs text-zinc-400 mt-1.5">
                Are you sure you want to cancel this order for <span className="font-bold text-emerald-400 font-mono">₹{orderToCancel.grandTotal}</span>?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                disabled={isCancelling}
                onClick={() => setOrderToCancel(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                Keep Order
              </button>
              <button
                disabled={isCancelling}
                onClick={executeCancelOrder}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Yes, Cancel</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
