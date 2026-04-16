import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'customer' | 'seller';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  bio: string;
  location: string;
  followers: number;
  following: number;
  verified: boolean;
  avatar: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AVATARS = [
  'https://api.dicebear.com/8.x/avataaars/svg?seed=',
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    { name: 'nepalese-hype-auth' }
  )
);

export function generateAvatar(username: string) {
  return `https://api.dicebear.com/8.x/avataaars/svg?seed=${username}`;
}
