import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, CheckCircle, AlertCircle, Copy, ChevronRight,
  Shield, Clock, Smartphone, Building2, CreditCard, X
} from 'lucide-react';
import { usePaymentStore, type PaymentMethod } from '../store/paymentStore';
import { useAuthStore } from '../store/authStore';
import { useNotifStore } from '../store/notifStore';
import { useCartStore } from '../store/cartStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Props {
  sellerId: string;
  orderId: string;
  productName: string;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'select_method' | 'instructions' | 'upload' | 'submitted';

const METHOD_ICONS: Record<string, React.ReactNode> = {
  esewa:  <Smartphone className="w-5 h-5 text-green-400" />,
  bank:   <Building2  className="w-5 h-5 text-blue-400" />,
  custom: <CreditCard className="w-5 h-5 text-purple-400" />,
};
const METHOD_COLORS: Record<string, string> = {
  esewa:  'from-green-900/40 to-emerald-900/30 border-green-500/30',
  bank:   'from-blue-900/40 to-indigo-900/30 border-blue-500/30',
  custom: 'from-purple-900/40 to-violet-900/30 border-purple-500/30',
};

export default function CheckoutPaymentScreen({ sellerId, orderId, productName, amount, onClose, onSuccess }: Props) {
  const { getSellerProfile, submitReceipt } = usePaymentStore();
  const { user }    = useAuthStore();
  const { addNotif } = useNotifStore();
  const clearCart   = useCartStore(s => s.clearCart);

  const [step, setStep]           = useState<Step>('select_method');
  const [method, setMethod]       = useState<PaymentMethod | null>(null);
  const [receiptData, setReceiptData] = useState('');
  const [txnNote, setTxnNote]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied]       = useState('');

  const profile = getSellerProfile(sellerId);
  const methods = profile?.methods ?? [];

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
    toast.success(`${label} copied!`);
  }

  function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setReceiptData(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!receiptData)       { toast.error('Please upload payment screenshot'); return; }
    if (!txnNote.trim())    { toast.error('Please add transaction ID or reference'); return; }
    setSubmitting(true);
    setTimeout(() => {
      submitReceipt({
        orderId,
        productName,
        amount,
        customerId:      user?.username ?? 'guest',
        sellerId,
        method:          method?.type ?? 'esewa',
        receiptUrl:      receiptData,
        transactionNote: txnNote.trim(),
      });
      addNotif({
        type: 'order', emoji: '📤',
        title: 'Receipt Uploaded',
        body:  `Your payment proof for ${productName} has been sent to @${sellerId} for verification.`,
      });
      setSubmitting(false);
      setStep('submitted');
    }, 1800);
  }

  if (methods.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
        <div className="bg-zinc-900 rounded-t-3xl p-6 w-full">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <p className="text-white font-bold text-lg text-center">No Payment Method</p>
          <p className="text-zinc-400 text-sm text-center mt-1">This seller hasn't set up payment methods yet. Contact them via chat.</p>
          <button onClick={onClose} className="w-full mt-5 py-3.5 bg-red-500 text-white font-bold rounded-2xl">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Sheet header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-900 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">
              {step === 'select_method'  ? 'Choose Payment'       :
               step === 'instructions'  ? 'Payment Instructions' :
               step === 'upload'        ? 'Upload Receipt'        : 'Payment Submitted!'}
            </h2>
            <p className="text-zinc-500 text-xs mt-0.5">Order: {orderId}</p>
          </div>
          {step !== 'submitted' && (
            <button onClick={onClose} className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {/* Amount pill */}
        {step !== 'submitted' && (
          <div className="mx-5 mt-3 mb-2 bg-gradient-to-r from-red-900/40 to-orange-900/30 border border-red-500/20 rounded-2xl px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-zinc-400 text-xs">Pay for</p>
              <p className="text-white font-semibold text-sm truncate max-w-48">{productName}</p>
            </div>
            <p className="text-red-400 font-black text-xl">रू {amount.toLocaleString()}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-none">
          <AnimatePresence mode="wait">

            {/* ── SELECT METHOD ───────────────────────────────────────────── */}
            {step === 'select_method' && (
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-3">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">@{sellerId} accepts payment via</p>
                {methods.map((m, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => { setMethod(m); setStep('instructions'); }}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 bg-gradient-to-br border rounded-2xl text-left active:scale-[0.98] transition-all',
                      METHOD_COLORS[m.type]
                    )}
                  >
                    <div className="w-12 h-12 bg-zinc-900/60 rounded-2xl flex items-center justify-center flex-shrink-0">
                      {METHOD_ICONS[m.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold">
                        {m.type === 'esewa'  ? 'eSewa' :
                         m.type === 'bank'   ? m.bankName :
                         m.label}
                      </p>
                      <p className="text-zinc-400 text-xs truncate mt-0.5">
                        {m.type === 'esewa'  ? `ID: ${m.esewaId}` :
                         m.type === 'bank'   ? `Acc: ${m.accountNumber}` :
                         m.details.slice(0, 40)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                  </motion.button>
                ))}

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-zinc-400 text-xs">Pay directly to the seller, then upload your receipt. The seller will verify and confirm your order.</p>
                </div>
              </motion.div>
            )}

            {/* ── INSTRUCTIONS ────────────────────────────────────────────── */}
            {step === 'instructions' && method && (
              <motion.div key="instructions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-5 space-y-4">

                {method.type === 'esewa' && (
                  <div className="bg-green-950/30 border border-green-500/20 rounded-2xl p-4 space-y-3">
                    <p className="text-white font-bold flex items-center gap-2">📱 eSewa Payment</p>
                    <CopyRow label="eSewa ID" value={method.esewaId} onCopy={() => copyToClipboard(method.esewaId, 'eSewa ID')} copied={copied === 'eSewa ID'} />
                    <CopyRow label="Account Name" value={method.name} onCopy={() => copyToClipboard(method.name, 'Account Name')} copied={copied === 'Account Name'} />
                    <CopyRow label="Amount" value={`रू ${amount.toLocaleString()}`} onCopy={() => copyToClipboard(String(amount), 'Amount')} copied={copied === 'Amount'} />
                  </div>
                )}

                {method.type === 'bank' && (
                  <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-4 space-y-3">
                    <p className="text-white font-bold flex items-center gap-2">🏦 Bank Transfer</p>
                    <CopyRow label="Bank" value={method.bankName} onCopy={() => copyToClipboard(method.bankName, 'Bank')} copied={copied === 'Bank'} />
                    <CopyRow label="Account No." value={method.accountNumber} onCopy={() => copyToClipboard(method.accountNumber, 'Account No.')} copied={copied === 'Account No.'} />
                    <CopyRow label="Account Name" value={method.accountName} onCopy={() => copyToClipboard(method.accountName, 'Account Name')} copied={copied === 'Account Name'} />
                    {method.branch && <CopyRow label="Branch" value={method.branch} onCopy={() => copyToClipboard(method.branch!, 'Branch')} copied={copied === 'Branch'} />}
                    <CopyRow label="Amount" value={`रू ${amount.toLocaleString()}`} onCopy={() => copyToClipboard(String(amount), 'Amount')} copied={copied === 'Amount'} />
                  </div>
                )}

                {method.type === 'custom' && (
                  <div className="bg-purple-950/30 border border-purple-500/20 rounded-2xl p-4">
                    <p className="text-white font-bold flex items-center gap-2 mb-3">💳 {method.label}</p>
                    <p className="text-zinc-300 text-sm leading-relaxed">{method.details}</p>
                    <div className="mt-3 pt-3 border-t border-purple-900/50">
                      <CopyRow label="Amount" value={`रू ${amount.toLocaleString()}`} onCopy={() => copyToClipboard(String(amount), 'Amount')} copied={copied === 'Amount'} />
                    </div>
                  </div>
                )}

                {method.instructions && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                    <p className="text-zinc-400 text-xs font-semibold mb-1">Seller's Note:</p>
                    <p className="text-zinc-300 text-sm">{method.instructions}</p>
                  </div>
                )}

                {/* Steps */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-white font-bold text-sm mb-3">📋 How to Pay</p>
                  {[
                    'Open your payment app',
                    `Send exactly रू ${amount.toLocaleString()} to the details above`,
                    'Take a screenshot of the confirmation',
                    'Come back and tap "Upload Receipt"',
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3 mb-2.5">
                      <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</div>
                      <p className="text-zinc-300 text-xs">{s}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep('upload')}
                  className="w-full py-4 bg-red-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <Upload className="w-5 h-5" /> I've Paid — Upload Receipt
                </button>
              </motion.div>
            )}

            {/* ── UPLOAD ──────────────────────────────────────────────────── */}
            {step === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-5 space-y-4">
                {/* Upload area */}
                <label className={cn(
                  'block w-full rounded-3xl border-2 border-dashed cursor-pointer transition-all',
                  receiptData ? 'border-green-500/50 bg-green-950/20' : 'border-zinc-700 hover:border-red-500/50 bg-zinc-900'
                )}>
                  <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
                  {receiptData ? (
                    <div className="p-3">
                      <img src={receiptData} alt="Receipt" className="w-full rounded-2xl object-cover max-h-56" />
                      <p className="text-green-400 text-center text-sm font-semibold mt-2">✅ Screenshot uploaded</p>
                      <p className="text-zinc-500 text-center text-xs">Tap to change</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10">
                      <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-3">
                        <Upload className="w-8 h-8 text-zinc-500" />
                      </div>
                      <p className="text-white font-semibold text-sm">Upload Payment Screenshot</p>
                      <p className="text-zinc-500 text-xs mt-1">Clear photo of confirmation • Max 5MB</p>
                    </div>
                  )}
                </label>

                {/* Transaction note */}
                <div>
                  <label className="text-zinc-400 text-xs font-semibold block mb-1.5">
                    Transaction ID / Reference <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={txnNote}
                    onChange={e => setTxnNote(e.target.value)}
                    placeholder="e.g. TXN#ESW20250412-881234 or Transfer Ref: 00123"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 text-white placeholder-zinc-600 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                  />
                </div>

                {/* Warning */}
                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-zinc-400 text-xs">Upload a real payment screenshot. Fake receipts may result in order cancellation and account ban.</p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !receiptData || !txnNote.trim()}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all"
                >
                  {submitting
                    ? <><span className="animate-spin">⟳</span> Submitting...</>
                    : <><CheckCircle className="w-5 h-5" /> Submit Receipt</>
                  }
                </button>
              </motion.div>
            )}

            {/* ── SUBMITTED ───────────────────────────────────────────────── */}
            {step === 'submitted' && (
              <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 px-5 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: 2, duration: 0.5 }}
                  className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mb-5"
                >
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </motion.div>
                <h3 className="text-white font-black text-xl mb-2">Receipt Submitted!</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-5">
                  Your payment proof has been sent to <span className="text-white font-semibold">@{sellerId}</span>. They will review and confirm your order within 24 hours.
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-full text-left space-y-2 mb-5">
                  <InfoRow label="Order" value={orderId} />
                  <InfoRow label="Amount" value={`रू ${amount.toLocaleString()}`} highlight />
                  <InfoRow label="Status" value="⏳ Awaiting Verification" />
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-5">
                  <Clock className="w-4 h-4" />
                  <span>You'll get notified once your payment is approved</span>
                </div>
                <button onClick={() => { clearCart(); onSuccess(); }} className="w-full py-3.5 bg-red-500 text-white font-bold rounded-2xl">
                  Done — Back to Shopping
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function CopyRow({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
      <span className="text-zinc-400 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-sm">{value}</span>
        <button onClick={onCopy} className={cn('transition-colors', copied ? 'text-green-400' : 'text-zinc-500 hover:text-white')}>
          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className={highlight ? 'text-green-400 font-bold' : 'text-white font-semibold'}>{value}</span>
    </div>
  );
}
