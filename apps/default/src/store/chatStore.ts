import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ─────────────────────────────────────────────────────────────────────
export type MsgType = 'text' | 'image' | 'voice' | 'product' | 'order' | 'emoji';
export type MsgStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  type: MsgType;
  status: MsgStatus;
  timestamp: number;
  reactions: Reaction[];
  replyTo?: string; // message id
  imageUrl?: string;
  voiceDuration?: number;
  deleted?: boolean;
}

export interface Contact {
  username: string;
  displayName: string;
  avatar: string;
  online: boolean;
  lastSeen: number;
  typing: boolean;
  verified: boolean;
  role: 'seller' | 'customer';
  bio: string;
}

// ─── Seed contacts ─────────────────────────────────────────────────────────────
const SEED_CONTACTS: Contact[] = [
  {
    username: 'priya_fashion', displayName: 'Priya Sharma', role: 'seller', verified: true,
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=priya_fashion',
    online: true, lastSeen: Date.now(), typing: false,
    bio: 'Premium Nepali fashion 👗 Pashmina & Dhaka specialists',
  },
  {
    username: 'bikash_foods', displayName: 'Bikash Tamang', role: 'seller', verified: true,
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=bikash_foods',
    online: true, lastSeen: Date.now(), typing: false,
    bio: 'Authentic Newari food & spices 🍛 Since 2018',
  },
  {
    username: 'sita_crafts', displayName: 'Sita Rai', role: 'seller', verified: false,
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=sita_crafts',
    online: false, lastSeen: Date.now() - 25 * 60 * 1000, typing: false,
    bio: 'Handmade Thangka paintings & lokta paper crafts 🎨',
  },
  {
    username: 'ram_jewels', displayName: 'Ram Bahadur', role: 'seller', verified: true,
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=ram_jewels',
    online: false, lastSeen: Date.now() - 2 * 60 * 60 * 1000, typing: false,
    bio: 'Sterling silver jewellery from Patan 💍',
  },
  {
    username: 'pokhara_crafts', displayName: 'Pokhara Crafts', role: 'seller', verified: false,
    avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=pokhara_crafts',
    online: true, lastSeen: Date.now(), typing: false,
    bio: 'Handmade lokta paper goods & Pokhara souvenirs',
  },
];

// ─── Seed messages ─────────────────────────────────────────────────────────────
function makeSeedMessages(myUser: string): ChatMessage[] {
  const now = Date.now();
  return [
    {
      id: 'msg-1', from: 'priya_fashion', to: myUser,
      text: 'Namaste! 🙏 Thank you for following our shop. We have new Pashmina stock just arrived from Mustang!',
      type: 'text', status: 'read', timestamp: now - 3600000, reactions: [],
    },
    {
      id: 'msg-2', from: myUser, to: 'priya_fashion',
      text: 'That sounds amazing! Do you have red and blue colours?',
      type: 'text', status: 'read', timestamp: now - 3500000, reactions: [],
    },
    {
      id: 'msg-3', from: 'priya_fashion', to: myUser,
      text: 'Yes! We have 12 colours including crimson red and royal blue 🎨 Free delivery for orders above रू 2,000!',
      type: 'text', status: 'read', timestamp: now - 3400000, reactions: [{ emoji: '❤️', userId: myUser }],
    },
    {
      id: 'msg-4', from: 'bikash_foods', to: myUser,
      text: 'Hello! Your momo masala order has been shipped 📦 Expected delivery: 2-3 days',
      type: 'order', status: 'read', timestamp: now - 7200000, reactions: [],
    },
    {
      id: 'msg-5', from: myUser, to: 'bikash_foods',
      text: 'Great! Thanks for the update 🙏',
      type: 'text', status: 'read', timestamp: now - 7100000, reactions: [],
    },
    {
      id: 'msg-6', from: 'bikash_foods', to: myUser,
      text: 'Our new Sel Roti masala just dropped! Want to try? 🍩',
      type: 'text', status: 'delivered', timestamp: now - 1800000, reactions: [],
    },
    {
      id: 'msg-7', from: 'sita_crafts', to: myUser,
      text: 'Hi! Checking if you received your Thangka painting safely?',
      type: 'text', status: 'read', timestamp: now - 86400000, reactions: [],
    },
    {
      id: 'msg-8', from: myUser, to: 'sita_crafts',
      text: 'Yes! It\'s absolutely beautiful 😍 Perfect quality!',
      type: 'text', status: 'read', timestamp: now - 86000000, reactions: [{ emoji: '🙏', userId: 'sita_crafts' }],
    },
  ];
}

// ─── Auto-reply bots ────────────────────────────────────────────────────────────
const AUTO_REPLIES: Record<string, string[]> = {
  priya_fashion: [
    'Thank you for your message! 🙏 We\'ll get back to you shortly.',
    'Our Pashmina shawls are handwoven with 100% pure wool from Mustang 🏔️',
    'We offer free delivery for orders above रू 2,000! 🚚',
    'You can pay via eSewa or bank transfer. Very easy! 😊',
    'We\'ll ship within 24 hours of payment confirmation ✅',
  ],
  bikash_foods: [
    'Namaste! How can I help you? 🙏',
    'All our spices are 100% organic and sourced directly from Nepali farmers 🌿',
    'Momo masala pack — best seller! 3 packs for just रू 450 😋',
    'We deliver all over Nepal. COD available in Kathmandu valley!',
    'Fresh batch arrives every Monday. Limited stock! 🔥',
  ],
  sita_crafts: [
    'Hello! Each Thangka is hand-painted and takes 2-4 weeks to complete 🎨',
    'We use traditional pigments and gold leaf for authentic look ✨',
    'Custom orders welcome! Please share your design preference.',
  ],
  ram_jewels: [
    'Namaste! Our silver jewellery is hallmarked 925 sterling silver 💍',
    'All pieces are handcrafted in Patan, supporting local artisans 🏺',
    'We do custom engraving and sizing at no extra cost!',
  ],
  pokhara_crafts: [
    'Hi! Our lokta paper products are eco-friendly and handmade 📄',
    'Great gift idea for friends and family abroad! We ship internationally 🌍',
  ],
};

// ─── Store ─────────────────────────────────────────────────────────────────────
interface ChatState {
  messages: ChatMessage[];
  contacts: Contact[];
  typingUsers: Record<string, boolean>;
  initialized: boolean;

  initForUser: (username: string) => void;
  sendMessage: (from: string, to: string, text: string, type?: MsgType) => string;
  addReaction: (msgId: string, emoji: string, userId: string) => void;
  removeReaction: (msgId: string, userId: string) => void;
  markRead: (from: string, to: string) => void;
  deleteMessage: (msgId: string) => void;
  setTyping: (username: string, typing: boolean) => void;
  getConversation: (user1: string, user2: string) => ChatMessage[];
  getContacts: () => Contact[];
  getUnreadCount: (myUser: string) => number;
  getLastMessage: (user1: string, user2: string) => ChatMessage | null;
  simulateReply: (from: string, to: string, delay?: number) => void;
  updateOnlineStatus: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      contacts: SEED_CONTACTS,
      typingUsers: {},
      initialized: false,

      initForUser: (username) => {
        const { initialized } = get();
        if (initialized) return;
        const seeded = makeSeedMessages(username);
        set({ messages: seeded, initialized: true });
      },

      sendMessage: (from, to, text, type = 'text') => {
        const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const msg: ChatMessage = {
          id, from, to, text, type,
          status: 'sending',
          timestamp: Date.now(),
          reactions: [],
        };
        set(s => ({ messages: [...s.messages, msg] }));

        // Simulate sent → delivered progression
        setTimeout(() => {
          set(s => ({
            messages: s.messages.map(m => m.id === id ? { ...m, status: 'sent' } : m),
          }));
        }, 300);
        setTimeout(() => {
          set(s => ({
            messages: s.messages.map(m => m.id === id ? { ...m, status: 'delivered' } : m),
          }));
        }, 1200);

        return id;
      },

      simulateReply: (from, to, delay = 2500) => {
        const replies = AUTO_REPLIES[from] ?? ['Thanks for your message! 🙏'];
        const reply = replies[Math.floor(Math.random() * replies.length)];

        // Show typing
        setTimeout(() => {
          set(s => ({ typingUsers: { ...s.typingUsers, [from]: true } }));
        }, 800);

        // Send reply + mark conversation as read
        setTimeout(() => {
          set(s => ({ typingUsers: { ...s.typingUsers, [from]: false } }));
          const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const msg: ChatMessage = {
            id, from, to,
            text: reply,
            type: 'text',
            status: 'delivered',
            timestamp: Date.now(),
            reactions: [],
          };
          set(s => ({ messages: [...s.messages, msg] }));
        }, delay);
      },

      addReaction: (msgId, emoji, userId) => {
        set(s => ({
          messages: s.messages.map(m => {
            if (m.id !== msgId) return m;
            const existing = m.reactions.findIndex(r => r.userId === userId && r.emoji === emoji);
            if (existing >= 0) return m; // already reacted
            return { ...m, reactions: [...m.reactions, { emoji, userId }] };
          }),
        }));
      },

      removeReaction: (msgId, userId) => {
        set(s => ({
          messages: s.messages.map(m =>
            m.id === msgId ? { ...m, reactions: m.reactions.filter(r => r.userId !== userId) } : m
          ),
        }));
      },

      markRead: (from, to) => {
        set(s => ({
          messages: s.messages.map(m =>
            m.from === from && m.to === to ? { ...m, status: 'read' } : m
          ),
        }));
      },

      deleteMessage: (msgId) => {
        set(s => ({
          messages: s.messages.map(m => m.id === msgId ? { ...m, deleted: true, text: 'Message deleted' } : m),
        }));
      },

      setTyping: (username, typing) => {
        set(s => ({ typingUsers: { ...s.typingUsers, [username]: typing } }));
      },

      getConversation: (user1, user2) => {
        return get().messages
          .filter(m =>
            (m.from === user1 && m.to === user2) ||
            (m.from === user2 && m.to === user1)
          )
          .sort((a, b) => a.timestamp - b.timestamp);
      },

      getContacts: () => get().contacts,

      getUnreadCount: (myUser) => {
        return get().messages.filter(m => m.to === myUser && m.status !== 'read').length;
      },

      getLastMessage: (user1, user2) => {
        const msgs = get().getConversation(user1, user2);
        return msgs[msgs.length - 1] ?? null;
      },

      updateOnlineStatus: () => {
        // Randomly toggle some contacts online/offline for realism
        set(s => ({
          contacts: s.contacts.map(c => ({
            ...c,
            online: c.online
              ? Math.random() > 0.1  // 90% chance stays online
              : Math.random() > 0.7, // 30% chance comes online
            lastSeen: c.online ? Date.now() : c.lastSeen,
          })),
        }));
      },
    }),
    { name: 'nhype-chat-v2', partialize: (s) => ({ messages: s.messages, initialized: s.initialized }) }
  )
);
