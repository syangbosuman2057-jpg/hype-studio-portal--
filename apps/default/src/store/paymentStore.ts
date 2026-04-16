import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Seller Payment Methods ───────────────────────────────────────────────────

export interface EsewaMethod {
  type: 'esewa';
  esewaId: string;       // phone or eSewa ID
  name: string;          // Account holder name
  instructions?: string;
}

export interface BankMethod {
  type: 'bank';
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
  instructions?: string;
}

export interface CustomMethod {
  type: 'custom';
  label: string;         // e.g. "Khalti", "IME Pay"
  details: string;       // Free text with instructions
  instructions?: string;
}

export type PaymentMethod = EsewaMethod | BankMethod | CustomMethod;

export interface SellerPaymentProfile {
  sellerId: string;      // username
  methods: PaymentMethod[];
  updatedAt: string;
}

// ─── Receipt & Payment Records ────────────────────────────────────────────────

export type ReceiptStatus = 'pending' | 'submitted' | 'verified' | 'rejected';

export interface PaymentReceipt {
  id: string;
  orderId: string;
  productName: string;
  amount: number;
  customerId: string;   // username
  sellerId: string;     // username
  method: PaymentMethod['type'];
  receiptUrl: string;   // base64 data URL or external URL
  transactionNote: string;
  submittedAt: string;
  status: ReceiptStatus;
  reviewedAt?: string;
  rejectionReason?: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_PROFILES: SellerPaymentProfile[] = [
  {
    sellerId: 'priya_fashion',
    updatedAt: new Date().toISOString(),
    methods: [
      { type: 'esewa',  esewaId: '9841234567', name: 'Priya Sharma', instructions: 'Send payment to this eSewa ID and upload screenshot' },
      { type: 'bank',   bankName: 'Nepal Investment Bank', accountNumber: '01200123456789', accountName: 'Priya Sharma Shrestha', branch: 'Thamel Branch', instructions: 'Use your order ID as the transfer reference' },
    ],
  },
  {
    sellerId: 'bikash_foods',
    updatedAt: new Date().toISOString(),
    methods: [
      { type: 'esewa', esewaId: '9851098765', name: 'Bikash Maharjan', instructions: 'eSewa only. Upload clear screenshot.' },
      { type: 'custom', label: 'Khalti', details: 'Khalti ID: 9851098765 (Bikash Maharjan)', instructions: 'Send amount via Khalti and upload confirmation' },
    ],
  },
];

const SEED_RECEIPTS: PaymentReceipt[] = [
  {
    id: 'rcpt-001', orderId: 'ORD-2025-001', productName: 'Pashmina Shawl × 1',
    amount: 3500, customerId: 'ram_ktm', sellerId: 'priya_fashion',
    method: 'esewa', receiptUrl: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400&q=80',
    transactionNote: 'TXN#ESW20250412-881234 — Paid रू3500',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'submitted',
  },
  {
    id: 'rcpt-002', orderId: 'ORD-2025-002', productName: 'Momo Masala Bundle × 2',
    amount: 900, customerId: 'sima_pok', sellerId: 'bikash_foods',
    method: 'bank', receiptUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80',
    transactionNote: 'Transfer ref: ORD-2025-002',
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'verified', reviewedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'rcpt-003', orderId: 'ORD-2025-003', productName: 'Dhaka Topi × 1',
    amount: 850, customerId: 'arun_bkt', sellerId: 'priya_fashion',
    method: 'esewa', receiptUrl: 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=400&q=80',
    transactionNote: 'Paid via eSewa',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'rejected', reviewedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    rejectionReason: 'Receipt image is blurry. Please re-upload a clear screenshot.',
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface PaymentState {
  sellerProfiles: SellerPaymentProfile[];
  receipts: PaymentReceipt[];

  // Seller Payment Profile
  getSellerProfile: (sellerId: string) => SellerPaymentProfile | null;
  saveSellerProfile: (profile: SellerPaymentProfile) => void;
  addPaymentMethod: (sellerId: string, method: PaymentMethod) => void;
  removePaymentMethod: (sellerId: string, index: number) => void;

  // Receipt Workflow
  submitReceipt: (receipt: Omit<PaymentReceipt, 'id' | 'submittedAt' | 'status'>) => string;
  approveReceipt: (receiptId: string) => void;
  rejectReceipt: (receiptId: string, reason: string) => void;

  // Queries
  getReceiptsForSeller: (sellerId: string) => PaymentReceipt[];
  getReceiptsForCustomer: (customerId: string) => PaymentReceipt[];
  getReceiptById: (id: string) => PaymentReceipt | null;
  getPendingCount: (sellerId: string) => number;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      sellerProfiles: SEED_PROFILES,
      receipts: SEED_RECEIPTS,

      getSellerProfile: (sellerId) =>
        get().sellerProfiles.find(p => p.sellerId === sellerId) ?? null,

      saveSellerProfile: (profile) =>
        set(s => ({
          sellerProfiles: [
            ...s.sellerProfiles.filter(p => p.sellerId !== profile.sellerId),
            { ...profile, updatedAt: new Date().toISOString() },
          ],
        })),

      addPaymentMethod: (sellerId, method) => {
        const existing = get().getSellerProfile(sellerId);
        const updated: SellerPaymentProfile = existing
          ? { ...existing, methods: [...existing.methods, method], updatedAt: new Date().toISOString() }
          : { sellerId, methods: [method], updatedAt: new Date().toISOString() };
        get().saveSellerProfile(updated);
      },

      removePaymentMethod: (sellerId, index) => {
        const existing = get().getSellerProfile(sellerId);
        if (!existing) return;
        const methods = existing.methods.filter((_, i) => i !== index);
        get().saveSellerProfile({ ...existing, methods });
      },

      submitReceipt: (data) => {
        const id = `rcpt-${Date.now()}`;
        const receipt: PaymentReceipt = {
          ...data, id, submittedAt: new Date().toISOString(), status: 'submitted',
        };
        set(s => ({ receipts: [receipt, ...s.receipts] }));
        return id;
      },

      approveReceipt: (receiptId) =>
        set(s => ({
          receipts: s.receipts.map(r =>
            r.id === receiptId
              ? { ...r, status: 'verified', reviewedAt: new Date().toISOString() }
              : r
          ),
        })),

      rejectReceipt: (receiptId, reason) =>
        set(s => ({
          receipts: s.receipts.map(r =>
            r.id === receiptId
              ? { ...r, status: 'rejected', rejectionReason: reason, reviewedAt: new Date().toISOString() }
              : r
          ),
        })),

      getReceiptsForSeller:   (sid)  => get().receipts.filter(r => r.sellerId === sid),
      getReceiptsForCustomer: (cid)  => get().receipts.filter(r => r.customerId === cid),
      getReceiptById:         (id)   => get().receipts.find(r => r.id === id) ?? null,
      getPendingCount:        (sid)  => get().receipts.filter(r => r.sellerId === sid && r.status === 'submitted').length,
    }),
    { name: 'nepalese-hype-payments' }
  )
);
