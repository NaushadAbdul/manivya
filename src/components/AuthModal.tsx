import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { User } from '../types';
import { api } from '../services/api';
import { X, User as UserIcon, Lock, Phone, MapPin, CheckCircle2, LogOut, KeyRound, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StoredAccount {
  username: string;
  password: string;
  user: User;
}

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, currentUser, loginUser, loginWithGoogle, logoutUser, addToast } = useStore();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || !password) {
      addToast('Please enter both username/email and password', 'error');
      return;
    }

    if (isSignup) {
      try {
        const userEmail = email.trim() || (cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@manivya.com`);
        const res = await api.userRegister({
          name: name.trim() || cleanUsername,
          email: userEmail,
          password: password,
          phone: phone.trim() || '7207554777'
        });

        const registeredUser: User = {
          ...res.user,
          addresses: [
            {
              id: `addr-${Date.now()}`,
              title: 'Home',
              fullAddress: address.trim() || '25-1-13, Gajuwaka Bypass Road, Pedagantyada',
              area: 'Visakhapatnam',
              pincode: pincode.trim() || '530026',
              isDefault: true
            }
          ]
        };

        loginUser(registeredUser);
        addToast(`Account created & authenticated successfully! 🎉`, 'success');
        setIsAuthModalOpen(false);
        return;
      } catch (err: any) {
        // Fallback to local accounts if needed
        console.warn('Backend register attempt:', err.message);
      }

      const accounts = getStoredAccounts();
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
      // Login mode - try API first
      try {
        const userEmail = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@manivya.com`;
        const res = await api.userLogin(userEmail, password);
        if (res.user) {
          loginUser(res.user);
          addToast(`Logged in successfully! 👋`, 'success');
          setIsAuthModalOpen(false);
          return;
        }
      } catch (err: any) {
        console.warn('Backend login attempt:', err.message);
      }

      // Fallback local accounts check
      const accounts = getStoredAccounts();
      const account = accounts.find(
        a => (a.username.toLowerCase() === cleanUsername || (a.user.email && a.user.email.toLowerCase() === cleanUsername)) && a.password === password
      );

      if (account) {
        loginUser(account.user);
        addToast(`Logged in as @${account.username}! 👋`, 'success');
        setIsAuthModalOpen(false);
      } else {
        addToast('Invalid credentials. Please check your username/email and password.', 'error');
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
                    ? 'Register with a unique username or sign in with Google to place orders' 
                    : 'Sign in with Google or your username & password to track delivery'}
                </p>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm shadow-md flex items-center justify-center gap-3 transition-all border border-zinc-200"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google (Firebase)
              </button>

              <div className="flex items-center my-2">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="shrink-0 mx-3 text-[10px] font-mono font-bold text-zinc-500 uppercase">OR WITH USERNAME</span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>



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
