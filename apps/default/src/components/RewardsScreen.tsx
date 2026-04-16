import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Star, Award, Zap, Gift, TrendingUp, ChevronRight, Lock } from 'lucide-react';
import { useCoinsStore, ALL_BADGES, type Badge } from '../store/coinsStore';
import { useLangStore } from '../store/langStore';
import { useNotifStore } from '../store/notifStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const RARITY_STYLES: Record<string, { border: string; bg: string; glow: string; label: string }> = {
  common:    { border: 'border-zinc-600',    bg: 'bg-zinc-800',          glow: '',                             label: 'Common'    },
  rare:      { border: 'border-blue-500/60', bg: 'bg-blue-950/40',       glow: 'shadow-blue-500/20',           label: 'Rare'      },
  epic:      { border: 'border-purple-500/60', bg: 'bg-purple-950/40',   glow: 'shadow-purple-500/20',         label: 'Epic'      },
  legendary: { border: 'border-yellow-400/70', bg: 'bg-yellow-950/30',   glow: 'shadow-yellow-400/30 shadow-lg', label: 'Legendary' },
};

const DAILY_TASKS = [
  { id: 'watch_5',    label: 'Watch 5 videos',       coins: 20,  emoji: '📺', done: true  },
  { id: 'buy_1',      label: 'Make a purchase',       coins: 50,  emoji: '🛍️', done: false },
  { id: 'share_1',    label: 'Share a product',       coins: 15,  emoji: '📤', done: true  },
  { id: 'login',      label: 'Daily login',           coins: 10,  emoji: '✅', done: true  },
  { id: 'follow_1',   label: 'Follow a new seller',   coins: 10,  emoji: '👤', done: false },
  { id: 'review_1',   label: 'Leave a review',        coins: 30,  emoji: '⭐', done: false },
];

const REDEEM_OPTIONS = [
  { id: 'disc_5',   label: '5% Discount',    coins: 100,  emoji: '🎟️', value: '5% off next order' },
  { id: 'disc_10',  label: '10% Discount',   coins: 200,  emoji: '🎫', value: '10% off next order' },
  { id: 'free_del', label: 'Free Delivery',  coins: 150,  emoji: '🚀', value: 'Free delivery on 1 order' },
  { id: 'cashback', label: 'रू 50 Cashback', coins: 250,  emoji: '💵', value: 'रू 50 store credit' },
  { id: 'vip',      label: 'VIP Badge',      coins: 500,  emoji: '👑', value: 'VIP seller access for 7 days' },
];

const TABS = ['Overview', 'Badges', 'Tasks', 'Redeem'] as const;
type Tab = typeof TABS[number];

export default function RewardsScreen() {
  const { balance, streak, badges, transactions, addCoins, spendCoins, checkDailyStreak } = useCoinsStore();
  const { t } = useLangStore();
  const { addNotif } = useNotifStore();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [claimedTasks, setClaimedTasks] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => { checkDailyStreak(); }, []);

  function handleClaimTask(task: typeof DAILY_TASKS[0]) {
    if (claimedTasks.has(task.id) || !task.done) return;
    addCoins(task.coins, `Task: ${task.label}`);
    setClaimedTasks(prev => new Set([...prev, task.id]));
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
    addNotif({ type: 'coin', emoji: '🪙', title: 'Coins Earned!', body: `+${task.coins} coins for: ${task.label}` });
    toast.success(`+${task.coins} coins earned! 🪙`);
  }

  function handleRedeem(option: typeof REDEEM_OPTIONS[0]) {
    const success = spendCoins(option.coins, `Redeemed: ${option.label}`);
    if (success) {
      toast.success(`Redeemed: ${option.value} ✅`);
      addNotif({ type: 'coin', emoji: '🎁', title: 'Reward Redeemed', body: option.value });
    } else {
      toast.error(`Not enough coins! Need ${option.coins - balance} more.`);
    }
  }

  const unlockedBadgeIds = new Set(badges.map(b => b.id));
  const streakTarget = streak >= 30 ? 30 : streak >= 7 ? 30 : 7;
  const streakPct    = Math.min((streak / streakTarget) * 100, 100);

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Confetti burst */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, y: 0, x: 0 }}
                animate={{ opacity: 0, scale: 1, y: (Math.random() - 0.5) * 400, x: (Math.random() - 0.5) * 400 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, delay: i * 0.03 }}
                className="absolute w-3 h-3 rounded-full"
                style={{ background: ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7'][i % 6] }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Header hero */}
      <div className="bg-gradient-to-b from-yellow-900/50 via-zinc-950 to-zinc-950 px-4 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white font-bold text-xl flex items-center gap-2">
              <span>🪙</span> {t('rewards')}
            </h1>
            <p className="text-zinc-500 text-xs mt-0.5">Earn coins. Unlock rewards.</p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl px-4 py-3 text-center shadow-lg shadow-yellow-500/30"
          >
            <p className="text-black font-black text-2xl leading-none">{balance}</p>
            <p className="text-black/70 text-xs font-bold">COINS</p>
          </motion.div>
        </div>

        {/* Streak bar */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-white font-bold">{streak} Day Streak</span>
            </div>
            <span className="text-orange-400 text-sm font-bold">{streak}/{streakTarget} 🔥</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${streakPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"
            />
          </div>
          <p className="text-zinc-500 text-xs mt-2">
            {streakTarget - streak} more days to earn the {streakTarget === 7 ? '🔥 Weekly Warrior' : '⚡ Monthly Legend'} badge!
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 pb-3 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-semibold transition-all',
              activeTab === tab ? 'bg-yellow-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pb-6">
        <AnimatePresence mode="wait">
          {activeTab === 'Overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Balance', value: balance, emoji: '🪙' },
                  { label: 'Streak',  value: streak,  emoji: '🔥' },
                  { label: 'Badges',  value: badges.length, emoji: '🏅' },
                ].map(s => (
                  <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                    <p className="text-2xl mb-1">{s.emoji}</p>
                    <p className="text-white font-black text-xl">{s.value}</p>
                    <p className="text-zinc-500 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Transaction history */}
              <div>
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Recent Activity</p>
                <div className="space-y-2">
                  {transactions.slice(0, 8).map(tx => (
                    <div key={tx.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0',
                        tx.type === 'earn' ? 'bg-green-500/20' : 'bg-red-500/20')}>
                        {tx.type === 'earn' ? '➕' : '➖'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{tx.reason}</p>
                        <p className="text-zinc-600 text-xs">{new Date(tx.timestamp).toLocaleDateString()}</p>
                      </div>
                      <span className={cn('font-bold text-sm', tx.type === 'earn' ? 'text-green-400' : 'text-red-400')}>
                        {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Badges' && (
            <motion.div key="badges" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-zinc-500 text-xs mb-4">{badges.length}/{ALL_BADGES.length} badges unlocked</p>
              <div className="grid grid-cols-2 gap-3">
                {ALL_BADGES.map((badge, i) => {
                  const unlocked = unlockedBadgeIds.has(badge.id);
                  const style = RARITY_STYLES[badge.rarity];
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className={cn(
                        'relative rounded-2xl p-4 border transition-all',
                        unlocked ? cn(style.border, style.bg, style.glow) : 'border-zinc-800 bg-zinc-900/50 opacity-50'
                      )}
                    >
                      {!unlocked && (
                        <div className="absolute top-2 right-2">
                          <Lock className="w-3.5 h-3.5 text-zinc-600" />
                        </div>
                      )}
                      <div className={cn('text-3xl mb-2', !unlocked && 'grayscale')}>{badge.emoji}</div>
                      <p className="text-white font-bold text-sm">{badge.name}</p>
                      <p className="text-zinc-500 text-xs mt-1 leading-snug">{badge.description}</p>
                      <span className={cn(
                        'inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full',
                        badge.rarity === 'legendary' ? 'bg-yellow-400/20 text-yellow-400' :
                        badge.rarity === 'epic'      ? 'bg-purple-400/20 text-purple-400' :
                        badge.rarity === 'rare'      ? 'bg-blue-400/20 text-blue-400' :
                                                       'bg-zinc-700 text-zinc-400'
                      )}>
                        {style.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'Tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-2">
                <p className="text-white font-bold text-sm">Daily Tasks</p>
                <p className="text-zinc-500 text-xs mt-1">Complete tasks to earn coins. Resets daily.</p>
              </div>
              {DAILY_TASKS.map((task, i) => {
                const claimed = claimedTasks.has(task.id);
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
                  >
                    <div className="text-2xl">{task.emoji}</div>
                    <div className="flex-1">
                      <p className={cn('text-sm font-semibold', task.done ? 'text-white' : 'text-zinc-500')}>{task.label}</p>
                      <p className="text-yellow-400 text-xs font-bold mt-0.5">+{task.coins} coins</p>
                    </div>
                    <button
                      onClick={() => handleClaimTask(task)}
                      disabled={!task.done || claimed}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                        claimed ? 'bg-green-500/20 text-green-400 cursor-default' :
                        task.done ? 'bg-yellow-500 text-black hover:bg-yellow-400 active:scale-95' :
                                    'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      )}
                    >
                      {claimed ? '✓ Done' : task.done ? 'Claim' : 'Pending'}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'Redeem' && (
            <motion.div key="redeem" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-2">
                <div>
                  <p className="text-zinc-400 text-xs">Your Balance</p>
                  <p className="text-yellow-400 font-black text-2xl">{balance} <span className="text-sm">coins</span></p>
                </div>
                <span className="text-3xl">🪙</span>
              </div>
              {REDEEM_OPTIONS.map((opt, i) => {
                const canAfford = balance >= opt.coins;
                return (
                  <motion.div
                    key={opt.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      'flex items-center gap-4 rounded-2xl p-4 border transition-all',
                      canAfford ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/50 border-zinc-800 opacity-60'
                    )}
                  >
                    <div className="text-3xl">{opt.emoji}</div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{opt.label}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{opt.value}</p>
                      <p className="text-yellow-400 text-xs font-bold mt-1">{opt.coins} coins</p>
                    </div>
                    <button
                      onClick={() => handleRedeem(opt)}
                      disabled={!canAfford}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95',
                        canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      )}
                    >
                      Redeem
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
