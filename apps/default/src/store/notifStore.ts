import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotifType = 'order' | 'follow' | 'like' | 'coin' | 'badge' | 'live' | 'review' | 'delivery';

export interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  emoji: string;
  read: boolean;
  timestamp: string;
}

interface NotifState {
  notifs: Notif[];
  unreadCount: number;
  addNotif: (n: Omit<Notif, 'id' | 'read' | 'timestamp'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

const SEED_NOTIFS: Notif[] = [
  { id: 'n1', type: 'follow',   emoji: '👤', title: 'New Follower',        body: '@bikash_foods started following you',        read: false, timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: 'n2', type: 'like',     emoji: '❤️', title: 'New Like',            body: 'Your video got 1,200 new likes today!',       read: false, timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 'n3', type: 'coin',     emoji: '🪙', title: 'Coins Earned',        body: 'You earned 50 coins from daily streak!',      read: false, timestamp: new Date(Date.now() - 900000).toISOString() },
  { id: 'n4', type: 'delivery', emoji: '📦', title: 'Order Shipped',       body: 'ORD-2025-002 is out for delivery today',      read: true,  timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'n5', type: 'live',     emoji: '🔴', title: 'Seller Live',         body: '@priya_fashion just went LIVE! Tune in now', read: true,  timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 'n6', type: 'badge',    emoji: '🏆', title: 'Badge Unlocked',      body: 'You unlocked the "Early Adopter" badge! 🌟',  read: true,  timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: 'n7', type: 'review',   emoji: '⭐', title: 'Review Received',     body: 'Someone left a 5-star review on your shop',   read: true,  timestamp: new Date(Date.now() - 172800000).toISOString() },
];

export const useNotifStore = create<NotifState>()(
  persist(
    (set, get) => ({
      notifs: SEED_NOTIFS,
      unreadCount: SEED_NOTIFS.filter(n => !n.read).length,

      addNotif: (n) => {
        const notif: Notif = {
          ...n, id: `n-${Date.now()}`, read: false, timestamp: new Date().toISOString(),
        };
        set(s => ({
          notifs: [notif, ...s.notifs].slice(0, 100),
          unreadCount: s.unreadCount + 1,
        }));
      },

      markRead: (id) => set(s => ({
        notifs: s.notifs.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, s.unreadCount - 1),
      })),

      markAllRead: () => set(s => ({
        notifs: s.notifs.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      })),

      clearAll: () => set({ notifs: [], unreadCount: 0 }),
    }),
    { name: 'nepalese-hype-notifs' }
  )
);
