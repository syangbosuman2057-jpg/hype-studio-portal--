import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, CheckCircle, Truck, Clock, Star, MessageCircle, Loader2, ChevronRight, Shield } from 'lucide-react';
import { getOrders } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../store/langStore';
import { formatNPR, getSellerAvatar } from '../lib/images';
import { cn } from '../lib/utils';

type TrackStep = {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  done: boolean;
  active: boolean;
  time?: string;
};

const STATUS_STEPS: Record<string, number> = {
  pending: 0, confirmed: 1, shipped: 2, out_for_delivery: 3, delivered: 4,
};

function getSteps(status: string, orderId: string): TrackStep[] {
  const idx = STATUS_STEPS[status] ?? 0;
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleString('en-NP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return [
    {
      label: 'Order Confirmed',
      sublabel: 'Your order has been received and confirmed',
      icon: <CheckCircle className="w-5 h-5" />,
      done: idx >= 1, active: idx === 0,
      time: idx >= 1 ? fmt(new Date(now.getTime() - 4 * 3600000)) : undefined,
    },
    {
      label: 'Packed & Ready',
      sublabel: 'Seller has packed your items',
      icon: <Package className="w-5 h-5" />,
      done: idx >= 2, active: idx === 1,
      time: idx >= 2 ? fmt(new Date(now.getTime() - 2 * 3600000)) : undefined,
    },
    {
      label: 'Out for Delivery',
      sublabel: 'Your package is on the way!',
      icon: <Truck className="w-5 h-5" />,
      done: idx >= 3, active: idx === 2,
      time: idx >= 3 ? fmt(new Date(now.getTime() - 1 * 3600000)) : undefined,
    },
    {
      label: 'Delivered',
      sublabel: 'Package delivered successfully 🎉',
      icon: <MapPin className="w-5 h-5" />,
      done: idx >= 4, active: idx === 3,
      time: idx >= 4 ? fmt(now) : undefined,
    },
  ];
}

export default function DeliveryTracker() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const { user } = useAuthStore();
  const { t } = useLangStore();

  useEffect(() => {
    getOrders().then(ords => {
      const mine = ords.filter((o: any) => o.fieldValues['/attributes/@ocustomer'] === user?.username);
      setOrders(mine.length > 0 ? mine : ords.slice(0, 3));
      setLoading(false);
    });
  }, [user]);

  const STATUS_COLORS: Record<string, string> = {
    pending:    'bg-yellow-500/20 text-yellow-400',
    confirmed:  'bg-blue-500/20 text-blue-400',
    shipped:    'bg-purple-500/20 text-purple-400',
    delivered:  'bg-green-500/20 text-green-400',
    cancelled:  'bg-red-500/20 text-red-400',
  };

  if (loading) return (
    <div className="flex-1 bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
    </div>
  );

  if (selected) {
    const fv = selected.fieldValues;
    const status   = fv['/attributes/@ostatus'] || 'confirmed';
    const product  = fv['/attributes/@oproduct'] || 'Product';
    const seller   = fv['/attributes/@oseller'] || '';
    const total    = fv['/attributes/@ototal']  || 0;
    const address  = fv['/attributes/@oaddr']   || 'Nepal';
    const steps    = getSteps(status, fv['/text'] || '');
    const isDelivered = status === 'delivered';

    return (
      <div className="flex-1 bg-zinc-950 overflow-y-auto scrollbar-none">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-zinc-900 z-10">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-2 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span className="text-sm">All Orders</span>
          </button>
          <h2 className="text-white font-bold text-lg">{t('trackOrder')}</h2>
          <p className="text-zinc-500 text-xs">{fv['/text'] || 'ORD-000'}</p>
        </div>

        <div className="p-4 space-y-4 pb-8">
          {/* Order summary card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <img src={getSellerAvatar(seller)} className="w-10 h-10 rounded-xl bg-zinc-800" />
              <div>
                <p className="text-white font-semibold text-sm">{product}</p>
                <p className="text-zinc-500 text-xs">@{seller}</p>
              </div>
              <span className={cn('ml-auto text-xs font-bold px-2.5 py-1 rounded-full', STATUS_COLORS[status] || 'bg-zinc-700 text-zinc-300')}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            <div className="border-t border-zinc-800 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total</span>
                <span className="text-red-400 font-bold">{formatNPR(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Deliver to</span>
                <span className="text-white text-right text-xs max-w-40 leading-snug">{address}</span>
              </div>
            </div>
          </div>

          {/* ETA card */}
          {!isDelivered && (
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-sm">{t('estimatedDelivery')}</p>
                <p className="text-blue-300 text-sm font-semibold">
                  {new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-NP', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-zinc-500 text-xs">Standard delivery — 2-5 business days</p>
              </div>
            </div>
          )}

          {/* Tracking timeline */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-white font-bold text-sm mb-5">Tracking Timeline</p>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-zinc-800" />
              <div className="space-y-6">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all',
                      step.done   ? 'bg-green-500 border-green-500 text-white' :
                      step.active ? 'bg-red-500 border-red-500 text-white animate-pulse' :
                                    'bg-zinc-900 border-zinc-700 text-zinc-600'
                    )}>
                      {step.icon}
                    </div>
                    <div className="flex-1 pt-2">
                      <p className={cn('font-semibold text-sm', step.done || step.active ? 'text-white' : 'text-zinc-600')}>
                        {step.label}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">{step.sublabel}</p>
                      {step.time && <p className="text-zinc-600 text-xs mt-1">{step.time}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Review section (if delivered) */}
          {isDelivered && !showReview && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowReview(true)}
              className="w-full bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-3 text-left"
            >
              <Star className="w-6 h-6 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-sm">{t('writeReview')}</p>
                <p className="text-zinc-500 text-xs">Share your experience with @{seller}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 ml-auto" />
            </motion.button>
          )}

          {isDelivered && showReview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-white font-bold text-sm mb-3">{t('writeReview')}</p>
              <div className="flex gap-2 mb-4 justify-center">
                {[1,2,3,4,5].map(r => (
                  <button key={r} onClick={() => setReviewRating(r)}>
                    <Star className={cn('w-8 h-8 transition-all', r <= reviewRating ? 'fill-yellow-400 text-yellow-400 scale-110' : 'text-zinc-700')} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-xl p-3 text-sm outline-none border border-zinc-700 focus:border-red-500 transition-colors resize-none"
              />
              <button
                onClick={() => { setShowReview(false); }}
                className="w-full mt-3 py-3 bg-yellow-500 text-black rounded-2xl font-bold text-sm"
              >
                Submit Review ⭐
              </button>
            </motion.div>
          )}

          {/* Contact seller */}
          <div className="flex gap-3">
            <button className="flex-1 py-3 border border-zinc-700 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" /> Message Seller
            </button>
            <button className="flex-1 py-3 border border-zinc-700 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" /> Buyer Protection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-zinc-900">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <Truck className="w-5 h-5 text-red-400" /> {t('trackOrder')}
        </h1>
        <p className="text-zinc-500 text-xs mt-0.5">Real-time delivery tracking</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No orders to track</p>
          </div>
        ) : orders.map((order, i) => {
          const fv     = order.fieldValues;
          const status = fv['/attributes/@ostatus'] || 'pending';
          const prod   = fv['/attributes/@oproduct'] || 'Product';
          const total  = fv['/attributes/@ototal']  || 0;
          const seller = fv['/attributes/@oseller'] || '';
          const progress = (STATUS_STEPS[status] ?? 0) / 4;

          return (
            <motion.button
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setSelected(order)}
              className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 transition-all active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-sm">{fv['/text'] || 'ORD-000'}</p>
                  <p className="text-zinc-500 text-xs mt-0.5 truncate max-w-48">{prod}</p>
                </div>
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', STATUS_COLORS[status] || 'bg-zinc-700 text-zinc-300')}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.07 }}
                  className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={getSellerAvatar(seller)} className="w-5 h-5 rounded-full bg-zinc-700" />
                  <span className="text-zinc-500 text-xs">@{seller}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-400 font-bold text-sm">{formatNPR(total)}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
