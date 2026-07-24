import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { User } from '../types';
import { X, User as UserIcon, Lock, Phone, MapPin, CheckCircle2, LogOut, KeyRound, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StoredAccount {
  username: string;
  password: string;
  user: User;
}

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, currentUser, loginUser, logoutUser, addToast } = useStore();
  const [isSignup, setIsSignup] = useState(false);
  
  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Additional Register fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('530026');

  if (!isAuthModalOpen) return null;

  // Helper to load accounts from localStorage
  const getStoredAccounts = (): StoredAccount[] => {
    try {
      const saved = localStorage.getItem('manivya_accounts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default seed account
    return [
      {
        username: 'naushad',
        password: 'user123',
        user: {
          id: 'usr-naushad',
          name: 'Naushad Abdul',
          email: 'naushad@manivya.com',
          phone: '7207554777',
          role: 'customer',
          addresses: [
            {
              id: 'addr-naushad',
              title: 'Home',
              fullAddress: '25-1-13, Gajuwaka Bypass Road, Durgavanipalem, Pedagantyada',
              area: 'Gajuwaka Bypass Road',
              pincode: '530026',
              isDefault: true
            }
          ],
          createdAt: new Date().toISOString()
        }
      },
      {
        username: 'kalyan',
        password: 'user123',
        user: {
          id: 'usr-kalyan',
          name: 'Kalyan Varma',
          email: 'kalyan@manivya.com',
          phone: '9848022338',
          role: 'customer',
          addresses: [
            {
              id: 'addr-kalyan',
              title: 'Office',
              fullAddress: 'VIP Road, Siripuram, Visakhapatnam',
              area: 'Siripuram',
              pincode: '530003',
              isDefault: true
            }
          ],
          createdAt: new Date().toISOString()
        }
      }
    ];
  };

  const handleQuickDemo = (demoUsername: string) => {
    setUsername(demoUsername);
    setPassword('user123');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || !password) {
      addToast('Please enter both username and password', 'error');
      return;
    }

    const accounts = getStoredAccounts();

    if (isSignup) {
      // Check if username already exists
      const existing = accounts.find(a => a.username.toLowerCase() === cleanUsername);
      if (existing) {
        addToast(`Username "${cleanUsername}" is already taken. Please choose another or login.`, 'error');
        return;
      }

      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: name.trim() || cleanUsername,
        email: email.trim() || `${cleanUsername}@manivya.com`,
        phone: phone.trim() || '7207554777',
        role: 'customer',
        addresses: [
          {
            id: `addr-${Date.now()}`,
            title: 'Home',
            fullAddress: address.trim() || '25-1-13, Gajuwaka Bypass Road, Pedagantyada',
            area: 'Visakhapatnam',
            pincode: pincode.trim() || '530026',
            isDefault: true
          }
        ],
        createdAt: new Date().toISOString()
      };

      const newAccount: StoredAccount = {
        username: cleanUsername,
        password,
        user: newUser
      };

      accounts.push(newAccount);
      localStorage.setItem('manivya_accounts', JSON.stringify(accounts));

      loginUser(newUser);
      addToast(`Account "@${cleanUsername}" created successfully! 🎉`, 'success');
      setIsAuthModalOpen(false);

    } else {
      // Login mode
      const account = accounts.find(
        a => a.username.toLowerCase() === cleanUsername && a.password === password
      );

      if (account) {
        loginUser(account.user);
        addToast(`Logged in as @${account.username}! 👋`, 'success');
        setIsAuthModalOpen(false);
      } else {
        addToast('Invalid username or password. Check demo credentials below.', 'error');
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
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
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg border border-blue-400/30">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-white">{currentUser.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </div>
                  <p className="text-xs text-blue-400 font-mono font-bold mt-0.5">
                    +{currentUser.phone} • {currentUser.email}
                  </p>
                </div>
              </div>

              {/* Delivery Address Card */}
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-mono font-bold text-zinc-500 uppercase text-[10px]">Saved Delivery Address</p>
                  <span className="text-[10px] font-mono text-zinc-400 font-bold">Default</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-200">
                  <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">{currentUser.addresses[0]?.title || 'Home'}</p>
                    <p className="text-zinc-400 text-[11px] leading-snug mt-0.5">
                      {currentUser.addresses[0]?.fullAddress}, Visakhapatnam - {currentUser.addresses[0]?.pincode}
                    </p>
                  </div>
                </div>
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
          ) : (
            /* Login or Signup Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono font-bold mb-2">
                  <KeyRound className="w-3.5 h-3.5" /> Account Authentication
                </div>
                <h2 className="text-xl font-black text-white">
                  {isSignup ? 'Create MANIVYA Account' : 'Welcome Back - Login'}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isSignup 
                    ? 'Register with a unique username and password for 10-min delivery' 
                    : 'Sign in with your username & password to place orders & track delivery'}
                </p>
              </div>

              {/* Demo credentials hint */}
              {!isSignup && (
                <div className="p-2.5 bg-blue-950/40 rounded-xl border border-blue-800/40 text-[11px]">
                  <div className="text-blue-300 font-bold flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> Quick Demo Accounts:
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('naushad')}
                      className="px-2 py-1 rounded bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 font-mono font-bold border border-blue-700/50"
                    >
                      @naushad (pass123)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('kalyan')}
                      className="px-2 py-1 rounded bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 font-mono font-bold border border-blue-700/50"
                    >
                      @kalyan (pass123)
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Username */}
                <div>
                  <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 mt-1 px-3 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus-within:border-blue-500">
                    <UserIcon className="w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="flex-1 bg-transparent text-sm outline-none text-white font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                    Password <span className="text-red-400">*</span>
                  </label>
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
                {isSignup && (
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
                          placeholder="Enter your Location"
                          className="flex-1 bg-transparent text-sm outline-none text-white font-medium"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all mt-2"
              >
                {isSignup ? 'Create Account & Login' : 'Login to Account'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-xs text-blue-400 font-bold hover:underline"
                >
                  {isSignup ? 'Already registered? Click here to Login' : "Don't have an account? Create one now"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
