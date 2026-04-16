import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, MapPin, ArrowRight, ShoppingBag, Video,
  Loader2, CheckCircle, Crown, Star, Eye, EyeOff, ChevronLeft,
} from 'lucide-react';
import { useAuthStore, generateAvatar, type UserRole } from '../store/authStore';
import { registerUser } from '../lib/api';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { cn } from '../lib/utils';

type Step = 'welcome' | 'role' | 'signin' | 'signup';

// ─── Welcome / Splash ─────────────────────────────────────────────────────────

function WelcomeSlide({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Hero video-like bg */}
      <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black" />

        <div className="relative text-center px-8 z-10">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
            <span className="text-6xl block mb-4">🇳🇵</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-white font-black text-4xl leading-tight mb-3">
            Nepalese<br /><span className="text-red-400">Hype</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-zinc-300 text-base leading-relaxed">
            Nepal's #1 social commerce platform.<br />Watch. Shop. Sell. All in one place.
          </motion.p>

          {/* Feature badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mt-5">
            {['🎬 Short Videos', '🛍️ Live Shopping', '💬 Real-time Chat', '📍 Local Sellers', '🎵 Music & Filters'].map(f => (
              <span key={f} className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-full border border-white/20">{f}</span>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="bg-black px-6 py-8">
        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          onClick={onStart}
          className="w-full py-4 bg-red-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/40 text-lg active:scale-[0.97] transition-transform">
          Get Started <ArrowRight className="w-5 h-5" />
        </motion.button>
        <p className="text-zinc-600 text-xs text-center mt-4">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}

// ─── Role Selection ────────────────────────────────────────────────────────────

function RoleSelection({ onSelect }: { onSelect: (role: UserRole, mode: 'signin' | 'signup') => void }) {
  return (
    <div className="flex-1 flex flex-col px-6 py-8 bg-zinc-950">
      <div className="text-center mb-8">
        <span className="text-4xl block mb-3">👋</span>
        <h2 className="text-white font-black text-2xl">Join Nepalese Hype</h2>
        <p className="text-zinc-500 text-sm mt-1">How do you want to use the app?</p>
      </div>

      <div className="space-y-4 flex-1">
        {/* Customer — FREE */}
        <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={() => onSelect('customer', 'signup')}
          className="w-full text-left bg-gradient-to-br from-blue-900/40 to-zinc-900 border border-blue-500/30 rounded-3xl p-5 active:scale-[0.97] transition-transform">
          <div className="flex items-start justify-between mb-3">
            <span className="text-4xl">👤</span>
            <span className="bg-green-500/20 text-green-400 text-xs font-black px-3 py-1.5 rounded-full border border-green-500/30">
              ✅ 100% FREE
            </span>
          </div>
          <p className="text-white font-black text-xl mb-1">Customer</p>
          <p className="text-zinc-400 text-sm mb-4">Watch videos, shop products, follow sellers</p>
          <div className="space-y-2">
            {[
              '📺 Watch & like videos',
              '🛍️ Buy products from sellers',
              '📤 Upload your own videos & photos',
              '💬 Chat & follow others',
              '🎵 Use music & filters',
              '📍 Discover nearby shops',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-zinc-300 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </motion.button>

        {/* Seller — PAID */}
        <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          onClick={() => onSelect('seller', 'signup')}
          className="w-full text-left bg-gradient-to-br from-red-900/40 to-zinc-900 border border-red-500/30 rounded-3xl p-5 active:scale-[0.97] transition-transform relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-start justify-between mb-3">
            <span className="text-4xl">🛒</span>
            <span className="bg-yellow-500/20 text-yellow-400 text-xs font-black px-3 py-1.5 rounded-full border border-yellow-500/30 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Subscription Required
            </span>
          </div>
          <p className="text-white font-black text-xl mb-1">Seller</p>
          <p className="text-zinc-400 text-sm mb-4">Sell products, grow your business</p>
          <div className="space-y-2 mb-3">
            {[
              '✅ All Customer features included',
              '💰 Add products with pricing',
              '🏷️ Tag products in videos',
              '📊 Advanced analytics dashboard',
              '🔴 Live stream shopping',
              '🎟️ Featured listing & ads',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-zinc-300 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800">
            <p className="text-zinc-400 text-xs mb-1">Starting from</p>
            <p className="text-white font-black">रू 2,000 <span className="text-zinc-500 font-normal text-xs">/ month</span></p>
          </div>
        </motion.button>
      </div>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        onClick={() => onSelect('customer', 'signin')}
        className="w-full py-3 text-zinc-400 text-sm text-center mt-4">
        Already have an account? <span className="text-red-400 font-semibold">Sign In</span>
      </motion.button>
    </div>
  );
}

// ─── Auth Form ─────────────────────────────────────────────────────────────────

function AuthForm({ role, mode, onBack }: { role: UserRole; mode: 'signin' | 'signup'; onBack: () => void }) {
  const loginFn = useAuthStore(s => s.login);
  const { activateSubscription } = useSubscriptionStore();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', location: '', bio: '' });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const usernameToUse = mode === 'signin' ? (form.email.split('@')[0] || form.username || 'user') : form.username;
      if (mode === 'signup' && (!form.username || !form.email || !form.password)) {
        setError('Please fill in all required fields'); setLoading(false); return;
      }
      if (mode === 'signup') {
        await registerUser({ username: form.username, email: form.email, role, location: form.location }).catch(() => {});
      }
      loginFn({
        id:         `user-${Date.now()}`,
        username:   usernameToUse,
        email:      form.email || `${usernameToUse}@example.com`,
        role,
        bio:        form.bio || (role === 'seller' ? '🛒 Seller on Nepalese Hype 🇳🇵' : '👤 Shopping on Nepalese Hype 🇳🇵'),
        location:   form.location || 'Nepal',
        followers:  role === 'seller' ? Math.floor(Math.random() * 5000) + 200 : Math.floor(Math.random() * 300),
        following:  Math.floor(Math.random() * 50) + 5,
        verified:   false,
        avatar:     generateAvatar(usernameToUse),
      });
      // Give sellers a demo active subscription for trial
      if (role === 'seller' && mode === 'signup') {
        activateSubscription('1m', 'demo_trial', 0);
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isSeller = role === 'seller';

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 overflow-y-auto scrollbar-none">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-5 transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-2xl',
            isSeller ? 'bg-red-500/20' : 'bg-blue-500/20')}>
            {isSeller ? '🛒' : '👤'}
          </div>
          <div>
            <h2 className="text-white font-black text-xl">
              {mode === 'signin' ? 'Sign In' : `Join as ${isSeller ? 'Seller' : 'Customer'}`}
            </h2>
            <p className={cn('text-xs font-semibold', isSeller ? 'text-red-400' : 'text-blue-400')}>
              {isSeller ? '🛒 Seller Account' : '✅ Free Account'}
            </p>
          </div>
        </div>
        {isSeller && mode === 'signup' && (
          <div className="bg-yellow-950/30 border border-yellow-500/20 rounded-xl p-3 mt-3">
            <p className="text-yellow-300 text-xs">
              <Crown className="w-3 h-3 inline mr-1" />
              You'll get a <strong>30-day free trial</strong> to explore seller features. Subscription starts at रू 2,000/month.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-5 pb-8 space-y-4">
        {mode === 'signup' && (
          <AuthField icon={<User className="w-4 h-4" />} name="username" placeholder="Username" value={form.username} onChange={handleChange} />
        )}
        <AuthField icon={<Mail className="w-4 h-4" />} name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} />
        <div className="relative">
          <AuthField icon={<Lock className="w-4 h-4" />} name="password" type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={handleChange} />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {mode === 'signup' && (
          <>
            <AuthField icon={<MapPin className="w-4 h-4" />} name="location" placeholder="City (e.g. Kathmandu)" value={form.location} onChange={handleChange} />
          </>
        )}

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-2">
            {error}
          </motion.p>
        )}

        <button type="submit" disabled={loading}
          className={cn(
            'w-full py-4 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.97] disabled:opacity-50 mt-2 text-lg',
            isSeller ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-blue-500 text-white shadow-blue-500/30'
          )}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-5 h-5" /></>
          )}
        </button>

        {/* Quick demo login */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button type="button" onClick={() => {
            loginFn({ id: 'demo-c', username: 'demo_customer', email: 'customer@demo.com', role: 'customer', bio: 'Demo customer 🛍️', location: 'Kathmandu', followers: 142, following: 38, verified: false, avatar: generateAvatar('demo_customer') });
          }} className="py-2.5 border border-blue-500/30 bg-blue-950/20 text-blue-400 text-xs font-bold rounded-xl">
            👤 Try as Customer
          </button>
          <button type="button" onClick={() => {
            loginFn({ id: 'demo-s', username: 'demo_seller', email: 'seller@demo.com', role: 'seller', bio: 'Demo seller 🛒', location: 'Pokhara', followers: 2840, following: 15, verified: true, avatar: generateAvatar('demo_seller') });
            activateSubscription('3m', 'demo', 5500);
          }} className="py-2.5 border border-red-500/30 bg-red-950/20 text-red-400 text-xs font-bold rounded-xl">
            🛒 Try as Seller
          </button>
        </div>

        <p className="text-zinc-600 text-xs text-center">
          {mode === 'signup'
            ? 'Already have an account? Sign in above'
            : 'Don\'t have an account? Go back and select your role'}
        </p>
      </form>
    </div>
  );
}

function AuthField({ icon, name, type = 'text', placeholder, value, onChange }: {
  icon: React.ReactNode; name: string; type?: string; placeholder: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 focus-within:border-red-500 rounded-2xl px-4 py-3.5 transition-colors">
      <span className="text-zinc-500">{icon}</span>
      <input name={name} type={type} placeholder={placeholder} value={value} onChange={onChange}
        className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm outline-none" />
    </div>
  );
}

// ─── Main AuthScreen ──────────────────────────────────────────────────────────

export default function AuthScreen() {
  const [step, setStep]   = useState<Step>('welcome');
  const [role, setRole]   = useState<UserRole>('customer');
  const [mode, setMode]   = useState<'signin' | 'signup'>('signup');

  function handleRoleSelect(selectedRole: UserRole, selectedMode: 'signin' | 'signup') {
    setRole(selectedRole);
    setMode(selectedMode);
    setStep(selectedMode === 'signin' ? 'signin' : 'signup');
  }

  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden max-w-md mx-auto">
      {/* Status bar */}
      <div className="bg-zinc-950 flex items-center justify-between px-5 pt-3 pb-1 flex-shrink-0">
        <span className="text-white text-xs font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5 items-end">
            <div className="w-1 h-2 bg-white rounded-sm" /><div className="w-1 h-3 bg-white rounded-sm" />
            <div className="w-1 h-4 bg-white rounded-sm" /><div className="w-1 h-3 bg-zinc-600 rounded-sm" />
          </div>
          <span className="text-white text-xs font-semibold ml-1">100%</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div key="welcome" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WelcomeSlide onStart={() => setStep('role')} />
          </motion.div>
        )}
        {step === 'role' && (
          <motion.div key="role" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <RoleSelection onSelect={handleRoleSelect} />
          </motion.div>
        )}
        {(step === 'signin' || step === 'signup') && (
          <motion.div key="form" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <AuthForm role={role} mode={mode} onBack={() => setStep('role')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
