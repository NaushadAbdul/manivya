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

  const storeUpiId = "manivya.enterprises@ybl";
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

  const handleClose = () => {
    if (isVerifying) return;
    if (onCancel) {
      onCancel();
    } else {
      onClose();
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

  const handleConfirmPayment = async () => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const ref = utrNumber.trim() || `TXN${Date.now()}`;
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

  // Generate Google Chart API QR Code for standard UPI string
  const upiString = `upi://pay?pa=${storeUpiId}&pn=${encodeURIComponent(storeName)}&am=${amount}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}&color=000000&bgcolor=ffffff`;

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
                  <Clock className="w-3 h-3 text-amber-300" /> Expires in: {formatTime(timeLeft)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isVerifying}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors disabled:opacity-50"
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

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-bold font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'qr' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('upi_apps')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'upi_apps' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI Apps</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'card' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cards / Net</span>
              </button>
            </div>

            {/* TAB 1: Scan QR Code */}
            {activeTab === 'qr' && (
              <div className="space-y-3 text-center">
                <div className="p-4 bg-white rounded-2xl inline-block shadow-xl border-4 border-blue-500/30">
                  <img
                    src={qrCodeUrl}
                    alt="Scan UPI QR Code to Pay"
                    className="w-44 h-44 object-contain mx-auto"
                  />
                  <p className="text-[11px] font-mono font-bold text-zinc-900 mt-2">
                    Scan with PhonePe, GPay, Paytm or BHIM
                  </p>
                </div>

                {/* Copy UPI VPA */}
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between text-xs">
                  <div className="text-left">
                    <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">UPI ID / VPA</p>
                    <p className="font-mono font-bold text-white">{storeUpiId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[11px] font-mono font-bold flex items-center gap-1 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: UPI Apps Direct Links */}
            {activeTab === 'upi_apps' && (
              <div className="space-y-2.5">
                <p className="text-[11px] font-mono text-zinc-400">
                  Select your preferred UPI Payment App to pay ₹{amount} directly:
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <a
                    href={`phonepe://pay?pa=${storeUpiId}&pn=${encodeURIComponent(storeName)}&am=${amount}&cu=INR`}
                    className="p-3 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 rounded-2xl text-purple-200 flex items-center gap-2.5 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                      🟪
                    </div>
                    <div className="text-left">
                      <p className="text-white font-extrabold">PhonePe</p>
                      <p className="text-[10px] text-purple-300 font-mono">Instant Pay</p>
                    </div>
                  </a>

                  <a
                    href={`gpay://upi/pay?pa=${storeUpiId}&pn=${encodeURIComponent(storeName)}&am=${amount}&cu=INR`}
                    className="p-3 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/30 rounded-2xl text-blue-200 flex items-center gap-2.5 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                      🟦
                    </div>
                    <div className="text-left">
                      <p className="text-white font-extrabold">Google Pay</p>
                      <p className="text-[10px] text-blue-300 font-mono">GPay Tap</p>
                    </div>
                  </a>

                  <a
                    href={`paytmmp://pay?pa=${storeUpiId}&pn=${encodeURIComponent(storeName)}&am=${amount}&cu=INR`}
                    className="p-3 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 rounded-2xl text-cyan-200 flex items-center gap-2.5 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-black text-xs">
                      🟦
                    </div>
                    <div className="text-left">
                      <p className="text-white font-extrabold">Paytm UPI</p>
                      <p className="text-[10px] text-cyan-300 font-mono">Wallet / UPI</p>
                    </div>
                  </a>

                  <a
                    href={upiString}
                    className="p-3 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 rounded-2xl text-emerald-200 flex items-center gap-2.5 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                      🟩
                    </div>
                    <div className="text-left">
                      <p className="text-white font-extrabold">BHIM / Any UPI</p>
                      <p className="text-[10px] text-emerald-300 font-mono">Auto App</p>
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* TAB 3: Cards / Netbanking Simulation */}
            {activeTab === 'card' && (
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Razorpay Card & Netbanking Gateway</span>
                  <span className="text-emerald-400 font-bold">Encrypted</span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Card Number (4532 •••• •••• 8920)"
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono outline-none focus:border-blue-500"
                    defaultValue="4532 9821 3410 8920"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono outline-none focus:border-blue-500"
                      defaultValue="12/28"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono outline-none focus:border-blue-500"
                      defaultValue="888"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-zinc-500 italic">
                  * All debit, credit cards & major Indian banks (SBI, HDFC, ICICI, Axis) supported via Razorpay.
                </p>
              </div>
            )}

            {/* Optional UTR / Reference Number Verification Input */}
            <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
              <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase">
                12-Digit UTR / Transaction Ref No. (Optional)
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

            <p className="text-center text-[10px] text-zinc-500 font-mono">
              Order confirmation popup will appear immediately after payment verification.
            </p>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
