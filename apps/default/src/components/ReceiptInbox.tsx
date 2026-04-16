import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox, CheckCircle, XCircle, Clock, Eye, ChevronRight,
  AlertCircle, Filter, Image, FileText,
} from 'lucide-react';
import { usePaymentStore, type PaymentReceipt, type ReceiptStatus } from '../store/paymentStore';
import { useAuthStore } from '../store/authStore';
import { useNotifStore } from '../store/notifStore';
import { getSellerAvatar } from '../lib/images';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<ReceiptStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: 'text-zinc-400',   bg: 'bg-zinc-800 border-zinc-700',          icon: <Clock className="w-4 h-4" />          },
  submitted: { label: 'To Review', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', icon: <AlertCircle className="w-4 h-4" />    },
  verified:  { label: 'Verified',  color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30',   icon: <CheckCircle className="w-4 h-4" />    },
  rejected:  { label: 'Rejected',  color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30',       icon: <XCircle className="w-4 h-4" />        },
};

const METHOD_EMOJI: Record<string, string> = { esewa: '📱', bank: '🏦', custom: '💳' };

type FilterStatus = ReceiptStatus | 'all';

export default function ReceiptInbox() {
  const { user }      = useAuthStore();
  const { getReceiptsForSeller, approveReceipt, rejectReceipt } = usePaymentStore();
  const { addNotif }  = useNotifStore();
  const [selected, setSelected] = useState<PaymentReceipt | null>(null);
  const [filter, setFilter]     = useState<FilterStatus>('all');
  const [rejReason, setRejReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [imageModal, setImageModal] = useState(false);

  const sellerId = user?.username ?? '';
  const allReceipts = getReceiptsForSeller(sellerId);
  const filtered    = filter === 'all' ? allReceipts : allReceipts.filter(r => r.status === filter);
  const pendingCount = allReceipts.filter(r => r.status === 'submitted').length;

  function handleApprove(receipt: PaymentReceipt) {
    approveReceipt(receipt.id);
    addNotif({
      type: 'order', emoji: '✅',
      title: 'Payment Approved',
      body: `You verified payment from @${receipt.customerId} for ${receipt.productName}`,
    });
    toast.success(`Payment from @${receipt.customerId} verified! ✅`);
    setSelected(null);
  }

  function handleReject() {
    if (!rejReason.trim()) { toast.error('Please provide a rejection reason'); return; }
    rejectReceipt(selected!.id, rejReason.trim());
    addNotif({
      type: 'order', emoji: '❌',
      title: 'Payment Rejected',
      body: `You rejected payment from @${selected!.customerId}. Reason: ${rejReason}`,
    });
    toast('Payment receipt rejected. Customer has been notified.');
    setShowReject(false);
    setRejReason('');
    setSelected(null);
  }

  if (selected) {
    const conf = STATUS_CONFIG[selected.status];
    return (
      <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-zinc-900 flex-shrink-0">
          <button onClick={() => setSelected(null)} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 mb-2">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to Inbox
          </button>
          <h2 className="text-white font-bold text-lg">Receipt Detail</h2>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none p-4 pb-8 space-y-4">
          {/* Status badge */}
          <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-2xl border w-fit', conf.bg)}>
            <span className={conf.color}>{conf.icon}</span>
            <span className={cn('font-bold text-sm', conf.color)}>{conf.label}</span>
          </div>

          {/* Order info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2.5">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Order Details</p>
            <InfoRow label="Order ID"    value={selected.orderId} />
            <InfoRow label="Product"     value={selected.productName} />
            <InfoRow label="Amount"      value={`रू ${selected.amount.toLocaleString()}`} highlight />
            <InfoRow label="Customer"    value={`@${selected.customerId}`} />
            <InfoRow label="Method"      value={`${METHOD_EMOJI[selected.method] ?? '💳'} ${selected.method.charAt(0).toUpperCase() + selected.method.slice(1)}`} />
            <InfoRow label="Submitted"   value={new Date(selected.submittedAt).toLocaleString()} />
            {selected.reviewedAt && <InfoRow label="Reviewed" value={new Date(selected.reviewedAt).toLocaleString()} />}
          </div>

          {/* Transaction note */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Customer Note / Transaction ID</p>
            </div>
            <p className="text-white text-sm font-semibold">{selected.transactionNote}</p>
          </div>

          {/* Receipt image */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-4 h-4 text-zinc-500" />
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Payment Receipt</p>
            </div>
            <button onClick={() => setImageModal(true)} className="w-full relative">
              <img
                src={selected.receiptUrl}
                alt="Receipt"
                className="w-full rounded-2xl object-cover max-h-64 cursor-zoom-in"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400&q=80'; }}
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 hover:bg-black/30 transition-colors">
                <Eye className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </button>
            <p className="text-zinc-600 text-xs text-center mt-2">Tap to view full size</p>
          </div>

          {/* Rejection reason if rejected */}
          {selected.status === 'rejected' && selected.rejectionReason && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4">
              <p className="text-red-400 text-xs font-semibold mb-1">Rejection Reason</p>
              <p className="text-zinc-300 text-sm">{selected.rejectionReason}</p>
            </div>
          )}

          {/* Action buttons (only for submitted) */}
          {selected.status === 'submitted' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-xs text-center">Review this payment receipt carefully before approving</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReject(true)}
                  className="flex-1 py-3.5 border border-red-500/50 text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <XCircle className="w-5 h-5" /> Reject
                </button>
                <button
                  onClick={() => handleApprove(selected)}
                  className="flex-2 flex-1 py-3.5 bg-green-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 active:scale-95 transition-transform"
                >
                  <CheckCircle className="w-5 h-5" /> Approve
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reject modal */}
        <AnimatePresence>
          {showReject && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 z-20 flex items-end p-4">
              <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
                className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 w-full">
                <p className="text-white font-bold text-lg mb-1">Reject Receipt?</p>
                <p className="text-zinc-500 text-xs mb-3">Provide a reason so the customer can re-submit correctly.</p>
                <textarea
                  value={rejReason}
                  onChange={e => setRejReason(e.target.value)}
                  placeholder="e.g. Receipt image is blurry. Please re-upload a clear screenshot."
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-red-500 text-white placeholder-zinc-500 rounded-2xl p-3 text-sm outline-none resize-none mb-3 transition-colors"
                />
                <div className="flex gap-3">
                  <button onClick={() => { setShowReject(false); setRejReason(''); }} className="flex-1 py-3 border border-zinc-700 text-white rounded-2xl font-semibold">Cancel</button>
                  <button onClick={handleReject} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold">Reject</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image fullscreen modal */}
        <AnimatePresence>
          {imageModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 z-30 flex items-center justify-center p-4"
              onClick={() => setImageModal(false)}>
              <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </button>
              <img
                src={selected.receiptUrl}
                alt="Full receipt"
                className="max-w-full max-h-full rounded-2xl"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400&q=80'; }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-400" />
            <h1 className="text-white font-bold text-xl">Receipt Inbox</h1>
            {pendingCount > 0 && (
              <span className="bg-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <Filter className="w-3.5 h-3.5 text-zinc-500 ml-1" />
          </div>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-none">
          {(['all', 'submitted', 'verified', 'rejected'] as FilterStatus[]).map(f => {
            const count = f === 'all' ? allReceipts.length : allReceipts.filter(r => r.status === f).length;
            const conf  = f === 'all' ? null : STATUS_CONFIG[f as ReceiptStatus];
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all flex items-center gap-1',
                  filter === f
                    ? f === 'submitted' ? 'bg-yellow-500 text-black' :
                      f === 'verified'  ? 'bg-green-500 text-white'  :
                      f === 'rejected'  ? 'bg-red-500 text-white'    :
                                         'bg-zinc-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                )}>
                {f === 'all' ? 'All' : conf?.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <Inbox className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-semibold">No receipts {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
            <p className="text-xs mt-1">When customers pay and upload receipts, they'll appear here</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filtered.map((r, i) => {
              const conf = STATUS_CONFIG[r.status];
              return (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setSelected(r)}
                  className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start gap-3">
                    <img src={getSellerAvatar(r.customerId)} className="w-10 h-10 rounded-xl bg-zinc-800 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-bold text-sm">@{r.customerId}</p>
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border flex items-center gap-1', conf.bg, conf.color)}>
                          {conf.icon} {conf.label}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs truncate mt-0.5">{r.productName}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-600 text-xs">{METHOD_EMOJI[r.method]}</span>
                          <span className="text-zinc-600 text-xs">{new Date(r.submittedAt).toLocaleDateString()}</span>
                        </div>
                        <span className="text-white font-black">रू {r.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {r.status === 'submitted' && (
                    <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2 text-center">
                      <p className="text-yellow-400 text-xs font-bold">⚡ Action Required — Tap to review receipt</p>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className={cn('font-semibold text-right max-w-48 truncate', highlight ? 'text-green-400 font-black text-base' : 'text-white')}>
        {value}
      </span>
    </div>
  );
}
