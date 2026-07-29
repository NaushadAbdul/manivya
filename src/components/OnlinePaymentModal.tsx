import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  CreditCard, 
  CheckCircle2, 
  Copy, 
  Check, 
  Smartphone, 
  ShieldCheck, 
  Clock, 
  Lock, 
  ExternalLink,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface OnlinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  amount: number;
  paymentMethod: 'UPI' | 'Razorpay' | 'Card' | 'COD' | string;
  userPhone: string;
  orderId?: string;
  onPaymentSuccess: (transactionRef: string) => Promise<void> | void;
}

export const OnlinePaymentModal: React.FC<OnlinePaymentModalProps> = ({
  isOpen,
  onClose,
  onCancel,
  amount,
  paymentMethod,
  userPhone,
  orderId,
  onPaymentSuccess
}) => {
  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'upi_apps' | 'card'>('qr');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const storeUpiId = "7207554777@sbi";
  const storePhone = "7207554777";
  const storeName = "MANIVYA ENTERPRISES";

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(300);
    setErrorMessage(null);
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancelClick = () => {
    if (isVerifying) return;
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleConfirmPayment = async () => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const ref = utrNumber.trim() || `UPI${Date.now()}`;
      await onPaymentSuccess(ref);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR Code for UPI string with pa=7207554777@sbi
  const upiString = `upi://pay?pa=${storeUpiId}&pn=${encodeURIComponent(storeName)}&am=${amount}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiString)}&color=000000&bgcolor=ffffff`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
        >
          {/* Top Bar Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                  <span>Pay ₹{amount}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                    256-Bit SSL
                  </span>
                </h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-amber-300" /> Session: {formatTime(timeLeft)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelClick}
              disabled={isVerifying}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors disabled:opacity-50"
              title="Cancel & Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 space-y-4">
            
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-ping" />
                <span>{errorMessage}</span>
              </div>
            )}
            
            {/* Store Account Header */}
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Merchant Payee</p>
                <p className="font-bold text-white text-sm">{storeName}</p>
                <p className="text-[11px] font-mono text-zinc-400">Visakhapatnam Store • +91 {storePhone}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Amount Due</p>
                <p className="font-black text-emerald-400 font-mono text-base">₹{amount}</p>
              </div>
            </div>

            {/* Scan QR Code Section */}
            <div className="space-y-3 text-center">
              <div className="p-4 bg-white rounded-2xl inline-block shadow-xl border-4 border-blue-500/30">
                <img
                  src={qrCodeUrl}
                  alt="Scan UPI QR Code to Pay"
                  className="w-48 h-48 object-contain mx-auto"
                />
                <p className="text-[11px] font-mono font-bold text-zinc-900 mt-2">
                  Scan with PhonePe, GPay, Paytm, BHIM or YONO
                </p>
              </div>

              {/* UPI ID / VPA Section */}
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between text-xs">
                <div className="text-left">
                  <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">UPI ID / VPA</p>
                  <p className="font-mono font-extrabold text-white text-sm sm:text-base tracking-wide text-emerald-400">
                    {storeUpiId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>
            </div>

            {/* Optional UTR / Reference Number Input */}
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
              <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase">
                12-DIGIT UTR / TRANSACTION REF NO. (OPTIONAL)
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 329184920192"
                className="w-full px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-mono font-bold text-white outline-none focus:border-emerald-500"
                maxLength={12}
              />
            </div>

            {/* Payment Confirmation Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isVerifying}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-98 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Online Payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>I HAVE PAID ₹{amount} • CONFIRM ORDER</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-[11px] text-zinc-400 font-mono">
              After scanning and making payment to <strong className="text-white">{storeUpiId}</strong>, click button above to place order.
            </p>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
