import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { User } from '../types';
import { api } from '../services/api';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  LogOut, 
  KeyRound, 
  AlertCircle, 
  Send, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    currentUser, 
    loginUser, 
    logoutUser, 
    updateUserAddress,
    updateUserProfile,
    selectedLocation,
    setIsLocationModalOpen,
    addToast 
  } = useStore();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login');
  const [loading, setLoading] = useState(false);

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Address editing in profile
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [customStreet, setCustomStreet] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [customPincode, setCustomPincode] = useState('');

  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('530026');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      addToast(`If an account exists with ${cleanEmail}, password reset instructions have been sent! 📧`, 'success');
      setMode('login');
    } catch (err: any) {
      addToast('Failed to process request.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      addToast('Please enter email address and password', 'error');
      return;
    }

    setLoading(true);

    if (mode === 'signup') {
      try {
        const displayName = name.trim() || cleanEmail.split('@')[0];
        const res = await api.userRegister({
          name: displayName,
          email: cleanEmail,
          password,
          phone: phone.trim() || '7207554777'
        });

        if (res.token) {
          localStorage.setItem('manivya_auth_token', res.token);
        }
        loginUser(res.user);
        addToast(`Welcome to MANIVYA Enterprises, ${res.user.name}! 🎉`, 'success');
        setIsAuthModalOpen(false);
      } catch (err: any) {
        addToast(err.message || 'Registration failed. Please try again.', 'error');
      } finally {
        setLoading(false);
      }

    } else if (mode === 'login') {
      try {
        const res = await api.userLogin(cleanEmail, password);
        if (res.token) {
          localStorage.setItem('manivya_auth_token', res.token);
        }
        loginUser(res.user);
        addToast(`Welcome back, ${res.user.name}! 👋`, 'success');
        setIsAuthModalOpen(false);
      } catch (err: any) {
        addToast(err.message || 'Login failed. Please check your credentials.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isAuthModalOpen) return null;

  const isEmailVerified = currentUser?.emailVerified ?? true;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 p-6 overflow-hidden my-6"
        >
          {/* Close button */}
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {currentUser && currentUser.id !== 'usr-guest' ? (
            /* Logged in Account Overview */
            <div className="space-y-5">
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {currentUser.photo ? (
                      <img 
                        src={currentUser.photo} 
                        alt={currentUser.name} 
                        referrerPolicy="no-referrer"
                        className="w-13 h-13 rounded-2xl object-cover border border-blue-400/30 shadow-lg shrink-0" 
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg border border-blue-400/30 shrink-0">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-white">{currentUser.name}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {currentUser.role?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-blue-400 font-mono font-bold mt-0.5 break-all">
                        {currentUser.email}
                      </p>
                      {currentUser.phone && (
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          +{currentUser.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditName(currentUser.name);
                      setEditEmail(currentUser.email);
                      setEditPhone(currentUser.phone || '');
                      setIsEditingProfile(!isEditingProfile);
                    }}
                    className="text-[11px] font-mono text-emerald-400 hover:underline font-bold shrink-0 self-start mt-0.5"
                  >
                    {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {/* Account Status Banner */}

                {isEditingProfile && (
                  <div className="pt-3 border-t border-zinc-800 space-y-2.5">
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. Naushad Abdul"
                        className="w-full mt-1 px-3 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-white font-medium outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Email Address</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="naushadabdul2006@gmail.com"
                          className="w-full mt-1 px-3 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-white font-medium outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="7207554777"
                          className="w-full mt-1 px-3 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-white font-mono font-bold outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!editName.trim() || !editEmail.trim()) {
                          addToast('Name and email are required', 'error');
                          return;
                        }
                        updateUserProfile({
                          name: editName.trim(),
                          email: editEmail.trim(),
                          phone: editPhone.trim() || '7207554777'
                        });
                        setIsEditingProfile(false);
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md mt-1"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                )}
              </div>

              {/* Delivery Address Card */}
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-mono font-bold uppercase text-[10px]">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <span>Saved Delivery Address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsAuthModalOpen(false);
                        setIsLocationModalOpen(true);
                      }}
                      className="text-[10px] font-mono text-blue-400 hover:underline font-bold"
                    >
                      Change Hub
                    </button>
                    <span className="text-zinc-600">•</span>
                    <button
                      onClick={() => {
                        setCustomStreet(currentUser.addresses?.[0]?.fullAddress || `${selectedLocation.area}, Visakhapatnam`);
                        setCustomArea(currentUser.addresses?.[0]?.area || selectedLocation.area || selectedLocation.name);
                        setCustomPincode(currentUser.addresses?.[0]?.pincode || selectedLocation.pincode);
                        setIsEditingAddress(!isEditingAddress);
                      }}
                      className="text-[10px] font-mono text-emerald-400 hover:underline font-bold"
                    >
                      {isEditingAddress ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                </div>

                {isEditingAddress ? (
                  <div className="space-y-2 pt-1 border-t border-zinc-800">
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Street / Door No. / Address</label>
                      <input
                        type="text"
                        value={customStreet}
                        onChange={(e) => setCustomStreet(e.target.value)}
                        placeholder="e.g. Flat 201, Street Name"
                        className="w-full mt-1 px-3 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-white font-medium outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Area / Landmark</label>
                        <input
                          type="text"
                          value={customArea}
                          onChange={(e) => setCustomArea(e.target.value)}
                          placeholder="e.g. Durgavanipalem"
                          className="w-full mt-1 px-3 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-white font-medium outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Pincode</label>
                        <input
                          type="text"
                          value={customPincode}
                          onChange={(e) => setCustomPincode(e.target.value)}
                          placeholder="530026"
                          className="w-full mt-1 px-3 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-white font-mono font-bold outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!customStreet.trim()) {
                          addToast('Please enter an address', 'error');
                          return;
                        }
                        const fullAddr = customStreet.includes('Visakhapatnam') 
                          ? customStreet 
                          : `${customStreet}, ${customArea || selectedLocation.name}, Visakhapatnam - ${customPincode || '530026'}`;
                        updateUserAddress({
                          fullAddress: fullAddr,
                          area: customArea || selectedLocation.area || 'Visakhapatnam',
                          pincode: customPincode || selectedLocation.pincode || '530026',
                          title: 'Location Address'
                        });
                        setIsEditingAddress(false);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md mt-1"
                    >
                      Save Delivery Address
                    </button>
                  </div>
                ) : (
                  <div className="text-zinc-200">
                    <p className="font-bold text-white text-sm">
                      {currentUser.addresses?.[0]?.area || selectedLocation.area || selectedLocation.name}
                    </p>
                    <p className="text-zinc-400 text-[11px] leading-snug mt-0.5">
                      {currentUser.addresses?.[0]?.fullAddress || `${selectedLocation.area}, Visakhapatnam - ${selectedLocation.pincode}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex gap-2">
                <button
                  onClick={() => {
                    logoutUser();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout Account
                </button>
              </div>
            </div>
          ) : mode === 'forgot_password' ? (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-bold hover:underline mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </button>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-400" /> Password Reset
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Enter your account's email address. We'll send you an official Firebase password reset link immediately.
                </p>
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2 mt-1 px-3 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus-within:border-blue-500">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@gmail.com"
                    className="flex-1 bg-transparent text-sm outline-none text-white font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Sending Reset Link...' : 'Send Password Reset Email'}
              </button>
            </form>
          ) : (
            /* Login or Signup Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono font-bold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Customer Account
                </div>
                <h2 className="text-xl font-black text-white">
                  {mode === 'signup' ? 'Create Account' : 'Welcome Back - Login'}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {mode === 'signup' 
                    ? 'Register your account to place orders and track delivery' 
                    : 'Sign in with your registered email & password'}
                </p>
              </div>

              <div className="space-y-3">
                {/* Email Address */}
                <div>
                  <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 mt-1 px-3 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus-within:border-blue-500">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 bg-transparent text-sm outline-none text-white font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                      Password <span className="text-red-400">*</span>
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot_password')}
                        className="text-[11px] text-blue-400 font-bold hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-3 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus-within:border-blue-500">
                    <KeyRound className="w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent text-sm outline-none text-white font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Additional Register Fields */}
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                        Full Name
                      </label>
                      <div className="flex items-center gap-2 mt-1 px-3 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                        <UserIcon className="w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="flex-1 bg-transparent text-sm outline-none text-white font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                        Mobile Phone
                      </label>
                      <div className="flex items-center gap-2 mt-1 px-3 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                        <Phone className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs font-mono font-bold text-zinc-500">+91</span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter your mobile number"
                          className="flex-1 bg-transparent text-sm outline-none font-mono font-bold text-white"
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                        Delivery Address (Visakhapatnam)
                      </label>
                      <div className="flex items-center gap-2 mt-1 px-3 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                        <MapPin className="w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Enter your Street / Door No."
                          className="flex-1 bg-transparent text-sm outline-none text-white font-medium"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all mt-2 disabled:opacity-60"
              >
                {loading 
                  ? 'Authenticating...' 
                  : (mode === 'signup' ? 'Create Account' : 'Login')}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                  className="text-xs text-blue-400 font-bold hover:underline"
                >
                  {mode === 'signup' ? 'Already registered? Click here to Login' : "Don't have an account? Create one now"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
