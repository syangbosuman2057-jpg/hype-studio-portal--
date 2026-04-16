import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Plan Definitions ─────────────────────────────────────────────────────────

export type PlanId = '1m' | '3m' | '6m' | '12m';

export interface SubscriptionPlan {
  id: PlanId;
  label: string;
  months: number;
  price: number;         // NPR
  originalPrice: number; // Before discount
  discountPct: number;
  perMonth: number;
  badge?: string;
  features: string[];
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: '1m',
    label: '1 Month',
    months: 1,
    price: 2000,
    originalPrice: 2000,
    discountPct: 0,
    perMonth: 2000,
    features: [
      'Upload unlimited products',
      'Upload videos',
      'Basic analytics',
      'Chat with customers',
    ],
  },
  {
    id: '3m',
    label: '3 Months',
    months: 3,
    price: 5500,
    originalPrice: 6000,
    discountPct: 8,
    perMonth: Math.round(5500 / 3),
    badge: 'Popular',
    features: [
      'Everything in 1 Month',
      'Priority listing',
      'Discount badge on profile',
      'Early access to features',
    ],
  },
  {
    id: '6m',
    label: '6 Months',
    months: 6,
    price: 10000,
    originalPrice: 12000,
    discountPct: 17,
    perMonth: Math.round(10000 / 6),
    badge: 'Best Value',
    features: [
      'Everything in 3 Months',
      'Featured seller badge',
      'Advanced analytics',
      'Dedicated support',
    ],
  },
  {
    id: '12m',
    label: '12 Months',
    months: 12,
    price: 18000,
    originalPrice: 24000,
    discountPct: 25,
    perMonth: 1500,
    badge: '🏆 Premium',
    features: [
      'Everything in 6 Months',
      'Gold verified badge',
      'Live streaming access',
      'Free featured ads every month',
      'Dedicated account manager',
    ],
  },
];

// ─── Subscription Record ──────────────────────────────────────────────────────

export type SubStatus = 'active' | 'expired' | 'expiring_soon' | 'none';

export interface SubscriptionRecord {
  id: string;
  planId: PlanId;
  startDate: string;   // ISO string
  expiryDate: string;  // ISO string
  paidAmount: number;
  paymentMethod: string;
  receiptId?: string;
  activatedAt: string;
}

// ─── Subscription Renewal Request ────────────────────────────────────────────

export interface RenewalRequest {
  id: string;
  planId: PlanId;
  amount: number;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptUrl?: string;
  note?: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface SubscriptionState {
  current: SubscriptionRecord | null;
  history: SubscriptionRecord[];
  pendingRenewal: RenewalRequest | null;

  // Computed helpers
  getStatus: () => SubStatus;
  getDaysRemaining: () => number;
  isActive: () => boolean;

  // Mutations
  activateSubscription: (planId: PlanId, paymentMethod: string, amount: number) => void;
  submitRenewalRequest: (planId: PlanId, amount: number, receiptUrl: string, note: string) => void;
  approveRenewal: () => void;
  rejectRenewal: () => void;
  clearPendingRenewal: () => void;

  // Dev helper
  expireNow: () => void;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      current: null,
      history: [],
      pendingRenewal: null,

      getStatus(): SubStatus {
        const { current } = get();
        if (!current) return 'none';
        const now = Date.now();
        const expiry = new Date(current.expiryDate).getTime();
        const daysLeft = (expiry - now) / 86400000;
        if (daysLeft <= 0) return 'expired';
        if (daysLeft <= 7) return 'expiring_soon';
        return 'active';
      },

      getDaysRemaining(): number {
        const { current } = get();
        if (!current) return 0;
        const diff = new Date(current.expiryDate).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / 86400000));
      },

      isActive(): boolean {
        const status = get().getStatus();
        return status === 'active' || status === 'expiring_soon';
      },

      activateSubscription(planId, paymentMethod, amount) {
        const plan = PLANS.find(p => p.id === planId)!;
        const now  = new Date();
        // If renewing from an existing active sub, extend from expiry
        const base = get().current && get().isActive()
          ? new Date(get().current!.expiryDate)
          : now;
        const expiry = addMonths(base, plan.months);

        const record: SubscriptionRecord = {
          id:            `sub-${Date.now()}`,
          planId,
          startDate:     now.toISOString(),
          expiryDate:    expiry.toISOString(),
          paidAmount:    amount,
          paymentMethod,
          activatedAt:   now.toISOString(),
        };

        set(s => ({
          current: record,
          history: [record, ...s.history].slice(0, 20),
          pendingRenewal: null,
        }));
      },

      submitRenewalRequest(planId, amount, receiptUrl, note) {
        const plan = PLANS.find(p => p.id === planId)!;
        const req: RenewalRequest = {
          id:          `ren-${Date.now()}`,
          planId,
          amount,
          receiptUrl,
          note,
          submittedAt: new Date().toISOString(),
          status:      'pending',
        };
        set({ pendingRenewal: req });
      },

      approveRenewal() {
        const { pendingRenewal, activateSubscription } = get();
        if (!pendingRenewal) return;
        activateSubscription(pendingRenewal.planId, 'receipt_verified', pendingRenewal.amount);
      },

      rejectRenewal() {
        set(s => ({
          pendingRenewal: s.pendingRenewal
            ? { ...s.pendingRenewal, status: 'rejected' }
            : null,
        }));
      },

      clearPendingRenewal() { set({ pendingRenewal: null }); },

      // Dev: expire subscription immediately for testing
      expireNow() {
        set(s => s.current
          ? { current: { ...s.current, expiryDate: new Date(Date.now() - 1000).toISOString() } }
          : s
        );
      },
    }),
    { name: 'nepalese-hype-subscription' }
  )
);
