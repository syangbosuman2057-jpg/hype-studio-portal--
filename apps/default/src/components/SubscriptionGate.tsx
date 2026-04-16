import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Lock, AlertTriangle, ArrowRight, Calendar } from 'lucide-react';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { cn } from '../lib/utils';

interface Props {
  children: React.ReactNode;
  onSubscribe: () => void;
}

export default function SubscriptionGate({ children, onSubscribe }: Props) {
  const { isActive, getStatus, getDaysRemaining, current } = useSubscriptionStore();

  const status    = getStatus();
  const active    = isActive();
  const daysLeft  = getDaysRemaining();

  if (active) return <>{children}</>;

  // Expired or no plan — show gate
  const isExpired = status === 'expired';

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      {/* Animated lock */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        className={cn(
          'w-24 h-24 rounded-3xl flex items-center justify-center mb-6 border-2',
          isExpired
            ? 'bg-red-950/50 border-red-500/40'
            : 'bg-zinc-900 border-zinc-700'
        )}
      >
        {isExpired
          ? <AlertTriangle className="w-12 h-12 text-red-400" />
          : <Lock className="w-12 h-12 text-zinc-500" />
        }
      </motion.div>

      <h2 className="text-white font-black text-2xl mb-2">
        {isExpired ? 'Subscription Expired' : 'No Active Plan'}
      </h2>

      <p className="text-zinc-400 text-sm leading-relaxed mb-2 max-w-xs">
        {isExpired
          ? `Your seller subscription expired on ${current ? new Date(current.expiryDate).toLocaleDateString('en-NP', { day: 'numeric', month: 'long', year: 'numeric' }) : 'recently'}.`
          : 'You need an active subscription to upload products, post videos, and sell on Nepalese Hype.'
        }
      </p>

      <p className="text-red-400 text-sm font-semibold mb-8">
        {isExpired
          ? 'Renew your plan to resume selling.'
          : 'Subscribe now to unlock all seller features.'
        }
      </p>

      {/* Plans preview */}
      <div className="w-full grid grid-cols-2 gap-3 mb-6">
        {[
          { label: '1 Month',   price: 'रू 2,000', id: '1m' },
          { label: '3 Months',  price: 'रू 5,500', id: '3m', badge: 'Popular' },
          { label: '6 Months',  price: 'रू 10,000', id: '6m', badge: 'Best Value' },
          { label: '12 Months', price: 'रू 18,000', id: '12m', badge: '🏆 Premium' },
        ].map(p => (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-left relative">
            {p.badge && (
              <span className="absolute -top-2 left-3 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{p.badge}</span>
            )}
            <p className="text-zinc-400 text-xs mt-1">{p.label}</p>
            <p className="text-white font-black text-sm">{p.price}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onSubscribe}
        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30 active:scale-[0.98] transition-transform"
      >
        <Crown className="w-5 h-5" />
        {isExpired ? 'Renew Subscription' : 'View Plans & Subscribe'}
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
