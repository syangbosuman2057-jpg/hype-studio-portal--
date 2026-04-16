import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, ShoppingBag, User, Upload, Compass,
  BarChart2, Inbox, MessageCircle,
} from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { useNotifStore } from './store/notifStore';
import { useCoinsStore } from './store/coinsStore';
import { useSubscriptionStore } from './store/subscriptionStore';
import { usePaymentStore } from './store/paymentStore';
import { useChatStore } from './store/chatStore';

import AuthScreen          from './components/AuthScreen';
import VideoFeed           from './components/VideoFeed';
import ShopScreen          from './components/ShopScreen';
import CartScreen          from './components/CartScreen';
import ChatScreen          from './components/ChatScreen';
import MapScreen           from './components/MapScreen';
import ProfileScreen       from './components/ProfileScreen';
import UploadScreen        from './components/UploadScreen';
import DiscoverScreen      from './components/DiscoverScreen';
import RewardsScreen       from './components/RewardsScreen';
import AnalyticsDashboard  from './components/AnalyticsDashboard';
import LiveStreamScreen    from './components/LiveStreamScreen';
import SmartSearchScreen   from './components/SmartSearchScreen';
import DeliveryTracker     from './components/DeliveryTracker';
import NotificationsScreen from './components/NotificationsScreen';
import SubscriptionScreen  from './components/SubscriptionScreen';
import SellerPaymentSetup  from './components/SellerPaymentSetup';
import ReceiptInbox        from './components/ReceiptInbox';
import SubscriptionGate    from './components/SubscriptionGate';
import AIAssistant         from './components/AIAssistant';
import { cn } from './lib/utils';

// ─── All possible screens ──────────────────────────────────────────────────────
export type Tab =
  | 'feed' | 'discover' | 'shop' | 'cart' | 'chat' | 'map'
  | 'profile' | 'upload' | 'rewards' | 'analytics' | 'live'
  | 'search' | 'delivery' | 'notifications'
  | 'subscription' | 'payment_setup' | 'receipt_inbox';

// ─── Only 5 tabs — the TikTok way ─────────────────────────────────────────────
const CUSTOMER_TABS = [
  { id: 'feed'    as Tab, icon: Home,           label: 'Home'    },
  { id: 'discover'as Tab, icon: Compass,        label: 'Discover'},
  { id: 'shop'    as Tab, icon: ShoppingBag,    label: 'Shop'    },
  { id: 'chat'    as Tab, icon: MessageCircle,  label: 'Chat'    },
  { id: 'profile' as Tab, icon: User,           label: 'Profile' },
];

const SELLER_TABS = [
  { id: 'feed'         as Tab, icon: Home,     label: 'Home'    },
  { id: 'upload'       as Tab, icon: Upload,   label: 'Upload'  },
  { id: 'analytics'   as Tab, icon: BarChart2, label: 'Stats'   },
  { id: 'receipt_inbox'as Tab, icon: Inbox,    label: 'Receipts'},
  { id: 'profile'      as Tab, icon: User,     label: 'Profile' },
];

// ─── Whether a tab should be transparent over the feed ────────────────────────
const IMMERSIVE_TABS: Tab[] = ['feed', 'live'];

export default function App() {
  const { isAuthenticated, user } = useAuthStore();
  const cartCount         = useCartStore(s => s.count());
  const unreadCount       = useNotifStore(s => s.unreadCount);
  const { checkDailyStreak }  = useCoinsStore();
  const { getPendingCount }   = usePaymentStore();
  const { getUnreadCount }    = useChatStore();
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const chatUnread = user ? getUnreadCount(user.username) : 0;

  useEffect(() => { if (isAuthenticated) checkDailyStreak(); }, [isAuthenticated]);

  // ── Auth wall ────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen />
        <Toaster position="top-center" theme="dark" richColors />
      </>
    );
  }

  const isSeller        = user?.role === 'seller';
  const tabs            = isSeller ? SELLER_TABS : CUSTOMER_TABS;
  const pendingReceipts = isSeller ? getPendingCount(user?.username ?? '') : 0;
  const isImmersive     = IMMERSIVE_TABS.includes(activeTab);

  // ── Navigate helper (exported via context in real apps; inline here) ─────────
  function go(tab: Tab) { setActiveTab(tab); }

  // ── Screen renderer ──────────────────────────────────────────────────────────
  function renderScreen() {
    switch (activeTab) {
      case 'feed':          return <VideoFeed />;
      case 'discover':      return <DiscoverScreen />;
      case 'shop':          return <ShopScreen />;
      case 'cart':          return <CartScreen />;
      case 'chat':          return <ChatScreen />;
      case 'map':           return <MapScreen />;
      case 'profile':       return <ProfileScreen />;
      case 'rewards':       return <RewardsScreen />;
      case 'live':          return <LiveStreamScreen />;
      case 'search':        return <SmartSearchScreen />;
      case 'delivery':      return <DeliveryTracker />;
      case 'notifications': return <NotificationsScreen />;
      case 'subscription':  return <SubscriptionScreen />;
      case 'payment_setup': return <SellerPaymentSetup />;
      case 'receipt_inbox': return <ReceiptInbox />;
      case 'upload':
        return (
          <SubscriptionGate onSubscribe={() => go('subscription')}>
            <UploadScreen />
          </SubscriptionGate>
        );
      case 'analytics':
        return (
          <SubscriptionGate onSubscribe={() => go('subscription')}>
            <AnalyticsDashboard />
          </SubscriptionGate>
        );
      default: return <VideoFeed />;
    }
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden max-w-md mx-auto relative select-none">

      {/* ── FULL-SCREEN CONTENT ───────────────────────────────────────────── */}
      {/* Content sits BEHIND the floating nav — fills 100% height */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex flex-col"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── FLOATING OVERLAYS on feed/live only ───────────────────────────── */}
      {isImmersive && (
        <>
          {/* Top-left logo */}
          <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-6
                          bg-gradient-to-b from-black/50 to-transparent
                          flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-black text-xl tracking-tight">N</span>
              <span className="text-red-400 font-black text-xl tracking-tight">Hype</span>
              <span className="text-white/40 mx-1">|</span>
              <button className="pointer-events-auto text-white font-semibold text-sm opacity-80">Following</button>
              <span className="text-white/30 mx-1">·</span>
              <button className="pointer-events-auto text-white font-black text-sm border-b-2 border-white">For You</button>
            </div>
            {/* Notification bell overlay */}
            <button
              onClick={() => go('notifications')}
              className="pointer-events-auto relative w-9 h-9 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </>
      )}

      {/* ── NON-IMMERSIVE TOP BAR (non-feed screens) ──────────────────────── */}
      {!isImmersive && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 flex-shrink-0">
          {/* Status bar row */}
          <div className="flex items-center justify-between px-5 pt-3 pb-0">
            <LiveClock />
            <StatusIcons />
          </div>
          {/* Screen title row */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => go('feed')} className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-90 transition-transform">
                <span className="text-base">🇳🇵</span>
              </button>
              <h1 className="text-white font-black text-lg">
                {screenTitle(activeTab)}
              </h1>
            </div>
            {/* Right icons — contextual */}
            <div className="flex items-center gap-1">
              {/* Cart badge (customer, non-feed) */}
              {!isSeller && activeTab !== 'cart' && (
                <button onClick={() => go('cart')} className="relative w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </button>
              )}
              {/* Notifications bell */}
              {activeTab !== 'notifications' && (
                <button onClick={() => go('notifications')} className="relative w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
              {/* Avatar */}
              <button onClick={() => go('profile')} className="active:scale-90 transition-transform ml-1">
                <img
                  src={user?.avatar || `https://api.dicebear.com/8.x/avataaars/svg?seed=${user?.username}`}
                  className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-700 object-cover"
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING BOTTOM NAV — TikTok style ────────────────────────────── */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 z-30',
        isImmersive
          ? 'bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-safe'
          : 'bg-zinc-950/95 backdrop-blur-xl border-t border-white/[0.06]'
      )}>
        <div className="flex items-end justify-around px-2 pt-2 pb-6">
          {tabs.map((tab) => {
            const Icon     = tab.icon;
            const isActive = activeTab === tab.id;
            const isCenter = tab.id === 'upload' || tab.id === 'live';
            const hasBadge = tab.id === 'receipt_inbox' && pendingReceipts > 0;

            // ── Center upload / live — raised pill ────────────────────────
            if (isCenter) {
              return (
                <button key={tab.id} onClick={() => go(tab.id)}
                  className="flex flex-col items-center gap-1.5 -mt-3">
                  <motion.div
                    whileTap={{ scale: 0.88 }}
                    className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200',
                      tab.id === 'upload'
                        ? isActive
                          ? 'bg-red-500 shadow-xl shadow-red-500/50'
                          : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/40'
                        : isActive
                          ? 'bg-red-500 shadow-xl shadow-red-500/50'
                          : 'bg-zinc-800 shadow-lg'
                    )}>
                    <Icon className="w-6 h-6 text-white" />
                    {tab.id === 'live' && !isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-950 animate-pulse" />
                    )}
                  </motion.div>
                  <span className={cn(
                    'text-[10px] font-bold transition-colors',
                    isImmersive ? 'text-white/80' : isActive ? 'text-red-400' : 'text-zinc-500'
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            }

            // ── Standard tabs ─────────────────────────────────────────────
            return (
              <button key={tab.id} onClick={() => go(tab.id)}
                className="flex flex-col items-center gap-1.5 relative">
                <motion.div whileTap={{ scale: 0.85 }} className="relative">
                  <Icon className={cn(
                    'w-6 h-6 transition-all duration-200',
                    isActive
                      ? isImmersive ? 'text-white scale-110' : 'text-white scale-110'
                      : isImmersive ? 'text-white/60'        : 'text-zinc-500'
                  )} />

                  {/* Badges */}
                  {hasBadge && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full text-black text-[9px] font-black flex items-center justify-center border-2 border-zinc-950">
                      {pendingReceipts > 9 ? '9+' : pendingReceipts}
                    </span>
                  )}
                  {tab.id === 'chat' && chatUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center border-2 border-zinc-950">
                      {chatUnread > 9 ? '9+' : chatUnread}
                    </span>
                  )}
                  {tab.id === 'shop' && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center border-2 border-zinc-950">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </motion.div>

                <span className={cn(
                  'text-[10px] font-semibold transition-colors',
                  isActive
                    ? isImmersive ? 'text-white font-black' : 'text-white font-black'
                    : isImmersive ? 'text-white/60'          : 'text-zinc-500'
                )}>
                  {tab.label}
                </span>

                {/* Active dot indicator */}
                {isActive && !isImmersive && (
                  <motion.div
                    layoutId="active-dot"
                    className="absolute -bottom-2 w-1 h-1 bg-red-400 rounded-full"
                  />
                )}

                {/* White underline when immersive + active */}
                {isActive && isImmersive && (
                  <motion.div
                    layoutId="active-dot"
                    className="absolute -bottom-2 w-4 h-0.5 bg-white rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI assistant — already uses fixed positioning internally */}
      <AIAssistant />

      <Toaster position="top-center" theme="dark" richColors closeButton />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function screenTitle(tab: Tab): string {
  const map: Partial<Record<Tab, string>> = {
    discover: 'Discover',
    shop: 'Shop Nepal 🛍️',
    cart: 'My Cart',
    chat: 'Messages',
    map: 'Nearby Shops',
    profile: 'Profile',
    rewards: 'Rewards',
    search: 'Search',
    delivery: 'My Orders',
    notifications: 'Notifications',
    subscription: 'Subscription',
    payment_setup: 'Payment Setup',
    receipt_inbox: 'Receipts',
    analytics: 'Analytics',
    upload: 'Create',
    live: 'Live',
  };
  return map[tab] ?? 'NHype';
}

function LiveClock() {
  const [time, setTime] = useState(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
    }, 10_000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-white text-xs font-bold tracking-wider">{time}</span>;
}

function StatusIcons() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5 items-end">
        {[6, 9, 12, 9].map((h, i) => (
          <div key={i} className={cn('w-[3px] rounded-sm', i < 3 ? 'bg-white' : 'bg-zinc-600')}
            style={{ height: h }} />
        ))}
      </div>
      <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
        <path d="M7.5 9.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" fill="white"/>
        <path d="M4.5 7C5.5 6 6.4 5.5 7.5 5.5s2 .5 3 1.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M2 4.5C3.7 2.8 5.5 2 7.5 2s3.8.8 5.5 2.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
      <div className="flex items-center">
        <div className="w-6 h-3 border border-white/60 rounded-[3px] p-0.5 flex items-center">
          <div className="h-full bg-green-400 rounded-[1px]" style={{ width: '85%' }} />
        </div>
        <div className="w-[2px] h-1.5 bg-white/50 rounded-r-sm ml-0.5" />
      </div>
    </div>
  );
}
