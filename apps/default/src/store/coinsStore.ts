import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BadgeId =
  | 'first_purchase' | 'video_watcher' | 'social_butterfly' | 'top_spender'
  | 'loyal_customer' | 'early_adopter' | 'review_master' | 'streak_7'
  | 'streak_30' | 'big_shopper' | 'referral_king' | 'seller_star';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
}

export interface Transaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  timestamp: string;
}

export interface CoinsState {
  balance: number;
  totalEarned: number;
  streak: number;
  lastLoginDate: string;
  badges: Badge[];
  transactions: Transaction[];
  addCoins: (amount: number, reason: string) => void;
  spendCoins: (amount: number, reason: string) => boolean;
  checkDailyStreak: () => void;
  unlockBadge: (badge: Badge) => void;
  hasBadge: (id: BadgeId) => boolean;
}

export const ALL_BADGES: Badge[] = [
  { id: 'early_adopter',     name: 'Early Adopter',     emoji: '🌟', rarity: 'legendary', description: 'Joined Nepalese Hype in its early days' },
  { id: 'first_purchase',    name: 'First Purchase',    emoji: '🛍️', rarity: 'common',    description: 'Made your first purchase' },
  { id: 'video_watcher',     name: 'Video Fanatic',     emoji: '📺', rarity: 'common',    description: 'Watched 50+ videos' },
  { id: 'social_butterfly',  name: 'Social Butterfly',  emoji: '🦋', rarity: 'rare',      description: 'Followed 20+ sellers' },
  { id: 'top_spender',       name: 'Top Spender',       emoji: '💎', rarity: 'epic',      description: 'Spent over रू 10,000' },
  { id: 'loyal_customer',    name: 'Loyal Customer',    emoji: '❤️', rarity: 'rare',      description: '30-day login streak' },
  { id: 'review_master',     name: 'Review Master',     emoji: '⭐', rarity: 'rare',      description: 'Left 10+ reviews' },
  { id: 'streak_7',          name: 'Weekly Warrior',    emoji: '🔥', rarity: 'common',    description: '7-day login streak' },
  { id: 'streak_30',         name: 'Monthly Legend',    emoji: '⚡', rarity: 'epic',      description: '30-day login streak' },
  { id: 'big_shopper',       name: 'Big Shopper',       emoji: '🏆', rarity: 'epic',      description: 'Made 10+ purchases' },
  { id: 'referral_king',     name: 'Referral King',     emoji: '👑', rarity: 'legendary', description: 'Referred 5+ friends' },
  { id: 'seller_star',       name: 'Seller Star',       emoji: '🌠', rarity: 'legendary', description: 'Reached 10K followers as seller' },
];

export const useCoinsStore = create<CoinsState>()(
  persist(
    (set, get) => ({
      balance: 250,
      totalEarned: 250,
      streak: 3,
      lastLoginDate: new Date().toDateString(),
      badges: [ALL_BADGES[0], ALL_BADGES[6]], // early adopter + streak_7 by default
      transactions: [
        { id: '1', type: 'earn', amount: 100, reason: 'Welcome bonus 🎉', timestamp: new Date().toISOString() },
        { id: '2', type: 'earn', amount: 50,  reason: 'Daily login streak x3 🔥', timestamp: new Date().toISOString() },
        { id: '3', type: 'earn', amount: 100, reason: 'First profile setup ✅', timestamp: new Date().toISOString() },
      ],

      addCoins: (amount, reason) => {
        const id = `txn-${Date.now()}`;
        set(s => ({
          balance: s.balance + amount,
          totalEarned: s.totalEarned + amount,
          transactions: [
            { id, type: 'earn', amount, reason, timestamp: new Date().toISOString() },
            ...s.transactions,
          ].slice(0, 50),
        }));
      },

      spendCoins: (amount, reason) => {
        const { balance } = get();
        if (balance < amount) return false;
        const id = `txn-${Date.now()}`;
        set(s => ({
          balance: s.balance - amount,
          transactions: [
            { id, type: 'spend', amount, reason, timestamp: new Date().toISOString() },
            ...s.transactions,
          ].slice(0, 50),
        }));
        return true;
      },

      checkDailyStreak: () => {
        const today = new Date().toDateString();
        const { lastLoginDate, streak, addCoins } = get();
        if (lastLoginDate === today) return;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = lastLoginDate === yesterday ? streak + 1 : 1;
        const bonus = Math.min(newStreak * 10, 100);
        set({ streak: newStreak, lastLoginDate: today });
        addCoins(bonus, `Daily streak bonus x${newStreak} 🔥`);
        if (newStreak === 7)  get().unlockBadge(ALL_BADGES.find(b => b.id === 'streak_7')!);
        if (newStreak === 30) get().unlockBadge(ALL_BADGES.find(b => b.id === 'streak_30')!);
      },

      unlockBadge: (badge) => {
        if (get().hasBadge(badge.id)) return;
        set(s => ({
          badges: [...s.badges, { ...badge, unlockedAt: new Date().toISOString() }],
        }));
      },

      hasBadge: (id) => get().badges.some(b => b.id === id),
    }),
    { name: 'nepalese-hype-coins' }
  )
);
