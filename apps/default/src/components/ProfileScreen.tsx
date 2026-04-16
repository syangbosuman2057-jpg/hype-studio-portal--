import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, LogOut, ChevronRight, Grid3X3, Heart, Bookmark,
  Users, Crown, Play, Camera, Star,
  MapPin, Edit3, Bell, Lock, HelpCircle, Globe2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useContentStore } from '../store/contentStore';
import { useSubscriptionStore, PLANS } from '../store/subscriptionStore';
import { useCoinsStore } from '../store/coinsStore';
import { useLangStore } from '../store/langStore';
import { getVideoBackground, getSellerAvatar, formatNumber, formatNPR } from '../lib/images';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

type ProfileTab = 'videos' | 'liked' | 'saved' | 'followers';

// Seed followers list
const SEED_FOLLOWERS = [
  { id: 'priya_fashion', name: 'Priya Sharma',   verified: true,  role: 'seller'   },
  { id: 'bikash_foods',  name: 'Bikash Maharjan', verified: true,  role: 'seller'   },
  { id: 'ram_ktm',       name: 'Ram Sharma',      verified: false, role: 'customer' },
  { id: 'sima_pok',      name: 'Sima Poudel',     verified: false, role: 'customer' },
  { id: 'sita_crafts',   name: 'Sita Tamang',     verified: true,  role: 'seller'   },
];

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { getPostsByUser, getFeedPosts, likedPostIds, savedPostIds, followingIds, toggleFollow, isFollowing } = useContentStore();
  const { getStatus, getDaysRemaining, current } = useSubscriptionStore();
  const { balance, streak, badges } = useCoinsStore();
  const { lang, setLang } = useLangStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('videos');
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editBio, setEditBio] = useState(false);
  const [bio, setBio] = useState(user?.bio || 'Shopping & sharing from Nepal 🇳🇵');

  if (!user) return null;

  const isSeller  = user.role === 'seller';
  const subStatus = isSeller ? getStatus() : null;
  const daysLeft  = isSeller ? getDaysRemaining() : 0;

  const myPosts    = getPostsByUser(user.username);
  const allPosts   = getFeedPosts();
  const likedPosts = allPosts.filter(p => likedPostIds.has(p.id));
  const savedPosts = allPosts.filter(p => savedPostIds.has(p.id));
  const following  = SEED_FOLLOWERS.filter(f => followingIds.has(f.id));

  const TABS = [
    { id: 'videos' as ProfileTab,    icon: <Grid3X3 className="w-4 h-4" />,  label: 'Posts',     count: myPosts.length    },
    { id: 'liked' as ProfileTab,     icon: <Heart className="w-4 h-4" />,    label: 'Liked',     count: likedPosts.length },
    { id: 'saved' as ProfileTab,     icon: <Bookmark className="w-4 h-4" />, label: 'Saved',     count: savedPosts.length },
    { id: 'followers' as ProfileTab, icon: <Users className="w-4 h-4" />,    label: 'Following', count: following.length  },
  ];

  function PostGrid({ posts }: { posts: typeof allPosts }) {
    if (posts.length === 0) {
      return (
        <div className="text-center py-16 text-zinc-500">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nothing here yet</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            className="relative aspect-square bg-zinc-900 overflow-hidden">
            <img src={getVideoBackground(post.thumbnailIdx)} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            {post.type === 'video' && (
              <div className="absolute top-1 left-1 bg-black/60 rounded-md p-0.5">
                <Play className="w-3 h-3 text-white fill-white" />
              </div>
            )}
            {post.productPrice && (
              <div className="absolute bottom-1 left-1 bg-red-500/90 text-white text-xs font-black px-1.5 py-0.5 rounded-md">
                रू {post.productPrice.toLocaleString()}
              </div>
            )}
            <div className="absolute bottom-1 right-1 flex items-center gap-0.5">
              <Heart className="w-3 h-3 text-white fill-white" />
              <span className="text-white text-xs font-bold">{formatNumber(post.likes)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-950 overflow-y-auto scrollbar-none pb-28">
      {/* Hero — padded for floating header */}
      <div className="relative bg-gradient-to-b from-red-900/30 via-zinc-950/80 to-zinc-950 px-4 pt-[108px] pb-0">
        {/* Top-right actions */}
        <div className="absolute top-[108px] right-4 flex items-center gap-2 mt-2">
          <button onClick={() => setShowSettings(true)}
            className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all active:scale-90">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded-xl px-3 h-9 transition-all active:scale-90">
            <LogOut className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-xs font-bold">Log Out</span>
          </button>
        </div>

        {/* Avatar + info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <img src={user.avatar || getSellerAvatar(user.username)} className="w-20 h-20 rounded-2xl bg-zinc-800 border-2 border-red-500/40" />
            {user.verified && (
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-blue-500 border-2 border-zinc-950 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-black">✓</span>
              </div>
            )}
            {isSeller && subStatus === 'active' && (
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-yellow-400 border-2 border-zinc-950 rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-black" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-black text-xl">@{user.username}</h2>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('text-xs font-bold px-2.5 py-0.5 rounded-full',
                isSeller ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400')}>
                {isSeller ? '🛒 Seller' : '👤 Customer'}
              </span>
              {user.verified && <span className="text-xs text-blue-400 font-semibold">✓ Verified</span>}
            </div>
            {user.location && (
              <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {user.location}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {!editBio ? (
          <div className="flex items-start gap-2 mb-4">
            <p className="text-zinc-300 text-sm flex-1">{bio}</p>
            <button onClick={() => setEditBio(true)} className="text-zinc-600 hover:text-zinc-300 flex-shrink-0 mt-0.5">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <input value={bio} onChange={e => setBio(e.target.value)} maxLength={120}
              className="w-full bg-zinc-900 border border-red-500/40 text-white rounded-xl px-3 py-2 text-sm outline-none mb-2" />
            <div className="flex gap-2">
              <button onClick={() => setEditBio(false)} className="flex-1 py-1.5 bg-red-500 text-white rounded-xl text-sm font-bold">Save</button>
              <button onClick={() => setEditBio(false)} className="flex-1 py-1.5 border border-zinc-700 text-zinc-400 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Posts',     value: formatNumber(myPosts.length) },
            { label: 'Followers', value: formatNumber(user.followers) },
            { label: 'Following', value: formatNumber(user.following) },
            { label: isSeller ? 'Sales' : 'Coins', value: isSeller ? '127' : String(balance) },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900/60 rounded-xl py-2.5 text-center border border-zinc-800">
              <p className="text-white font-black text-base">{s.value}</p>
              <p className="text-zinc-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Subscription status (seller) */}
        {isSeller && (
          <div className={cn(
            'flex items-center justify-between rounded-2xl p-3 mb-4 border',
            subStatus === 'active'        ? 'bg-green-900/30 border-green-500/30' :
            subStatus === 'expiring_soon' ? 'bg-yellow-900/30 border-yellow-500/30' :
            subStatus === 'expired'       ? 'bg-red-900/30 border-red-500/30' :
                                           'bg-zinc-900 border-zinc-800'
          )}>
            <div className="flex items-center gap-2">
              <Crown className={cn('w-5 h-5',
                subStatus === 'active' ? 'text-green-400' :
                subStatus === 'expiring_soon' ? 'text-yellow-400' :
                subStatus === 'expired' ? 'text-red-400' : 'text-zinc-500'
              )} />
              <div>
                <p className="text-white font-bold text-sm">
                  {subStatus === 'active'        ? `Active — ${daysLeft} days left` :
                   subStatus === 'expiring_soon' ? `Expiring in ${daysLeft} days!` :
                   subStatus === 'expired'       ? 'Subscription Expired' :
                                                  'No Active Plan'}
                </p>
                <p className="text-zinc-500 text-xs">
                  {current ? PLANS.find(p => p.id === current.planId)?.label + ' Plan' : 'Subscribe to sell'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>
        )}

        {/* Coins + streak (customer) */}
        {!isSeller && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-yellow-950/30 border border-yellow-500/20 rounded-2xl p-3 flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <div>
                <p className="text-white font-black">{balance}</p>
                <p className="text-zinc-500 text-xs">Coins</p>
              </div>
            </div>
            <div className="flex-1 bg-orange-950/30 border border-orange-500/20 rounded-2xl p-3 flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-white font-black">{streak}</p>
                <p className="text-zinc-500 text-xs">Day Streak</p>
              </div>
            </div>
            <div className="flex-1 bg-purple-950/30 border border-purple-500/20 rounded-2xl p-3 flex items-center gap-2">
              <span className="text-2xl">🏅</span>
              <div>
                <p className="text-white font-black">{badges.length}</p>
                <p className="text-zinc-500 text-xs">Badges</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex-1 flex flex-col items-center gap-0.5 py-3 transition-all border-b-2 -mb-px',
                activeTab === tab.id ? 'border-red-500 text-white' : 'border-transparent text-zinc-600')}>
              {tab.icon}
              <span className="text-xs font-semibold">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
          {activeTab === 'videos'    && <PostGrid posts={myPosts} />}
          {activeTab === 'liked'     && <PostGrid posts={likedPosts} />}
          {activeTab === 'saved'     && <PostGrid posts={savedPosts} />}
          {activeTab === 'followers' && (
            <div className="px-4 py-4 space-y-3">
              {following.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Not following anyone yet</p>
                </div>
              ) : following.map((f, i) => (
                <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
                  <img src={getSellerAvatar(f.id)} className="w-12 h-12 rounded-xl bg-zinc-800" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-bold text-sm">@{f.id}</p>
                      {f.verified && <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">✓</span>}
                    </div>
                    <p className="text-zinc-500 text-xs">{f.name}</p>
                    <span className={cn('text-xs font-bold', f.role === 'seller' ? 'text-red-400' : 'text-blue-400')}>
                      {f.role === 'seller' ? '🛒 Seller' : '👤 Customer'}
                    </span>
                  </div>
                  <button onClick={() => toggleFollow(f.id)}
                    className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                      isFollowing(f.id) ? 'border-zinc-600 text-zinc-400' : 'bg-red-500 border-red-500 text-white')}>
                    {isFollowing(f.id) ? 'Following' : 'Follow'}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Settings sheet */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end" onClick={() => setShowSettings(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-5 space-y-3"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
              <p className="text-white font-bold text-lg mb-4">Settings</p>
              {[
                { icon: <Edit3 className="w-5 h-5" />,    label: 'Edit Profile',      action: () => setShowSettings(false) },
                { icon: <Bell className="w-5 h-5" />,      label: 'Notifications',     action: () => {} },
                { icon: <Lock className="w-5 h-5" />,      label: 'Privacy & Security', action: () => {} },
                { icon: <Globe2 className="w-5 h-5" />,    label: `Language: ${lang === 'en' ? 'English' : 'नेपाली'}`, action: () => setLang(lang === 'en' ? 'np' : 'en') },
                { icon: <HelpCircle className="w-5 h-5" />, label: 'Help & Support',   action: () => {} },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-center gap-3 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-600 transition-colors text-left">
                  <span className="text-zinc-400">{item.icon}</span>
                  <span className="text-white font-medium text-sm flex-1">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>
              ))}
              <button onClick={() => { setShowSettings(false); setShowLogoutConfirm(true); }}
                className="w-full flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl active:scale-95 transition-all">
                <LogOut className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-bold text-sm">Sign Out</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Logout Confirmation Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-6"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-400" />
              </div>

              {/* Text */}
              <h2 className="text-white font-black text-xl text-center mb-1">Log Out?</h2>
              <p className="text-zinc-400 text-sm text-center mb-6">
                You'll need to sign in again to access your account.
              </p>

              {/* User pill */}
              <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl p-3 mb-6">
                <img
                  src={user.avatar || getSellerAvatar(user.username)}
                  className="w-10 h-10 rounded-xl bg-zinc-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">@{user.username}</p>
                  <p className="text-zinc-500 text-xs">{user.email}</p>
                </div>
                <span className={cn('text-xs font-bold px-2 py-1 rounded-full',
                  isSeller ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400')}>
                  {isSeller ? 'Seller' : 'Customer'}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout();
                    toast.success('Signed out. See you soon! 👋');
                  }}
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-400 text-white font-black rounded-2xl shadow-lg shadow-red-500/30 transition-all active:scale-95"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


