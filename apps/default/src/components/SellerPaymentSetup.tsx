import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle, CreditCard, Building2, Smartphone, ChevronRight, Edit3, Shield } from 'lucide-react';
import { usePaymentStore, type PaymentMethod } from '../store/paymentStore';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

type AddingType = 'esewa' | 'bank' | 'custom' | null;

const METHOD_META: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  esewa:  { icon: <Smartphone className="w-5 h-5" />, label: 'eSewa',         color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30'   },
  bank:   { icon: <Building2 className="w-5 h-5" />,  label: 'Bank Transfer', color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30'     },
  custom: { icon: <CreditCard className="w-5 h-5" />, label: 'Other Method',  color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' },
};

export default function SellerPaymentSetup() {
  const { user } = useAuthStore();
  const { getSellerProfile, addPaymentMethod, removePaymentMethod } = usePaymentStore();
  const [adding, setAdding] = useState<AddingType>(null);

  // Form state
  const [esewaId, setEsewaId]         = useState('');
  const [esewaName, setEsewaName]     = useState('');
  const [esewaNote, setEsewaNote]     = useState('');
  const [bankName, setBankName]       = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankHolder, setBankHolder]   = useState('');
  const [bankBranch, setBankBranch]   = useState('');
  const [bankNote, setBankNote]       = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customDetails, setCustomDetails] = useState('');
  const [customNote, setCustomNote]   = useState('');
  const [deleteIdx, setDeleteIdx]     = useState<number | null>(null);

  const sellerId = user?.username ?? '';
  const profile  = getSellerProfile(sellerId);
  const methods  = profile?.methods ?? [];

  function resetForms() {
    setEsewaId(''); setEsewaName(''); setEsewaNote('');
    setBankName(''); setBankAccount(''); setBankHolder(''); setBankBranch(''); setBankNote('');
    setCustomLabel(''); setCustomDetails(''); setCustomNote('');
    setAdding(null);
  }

  function handleAddEsewa() {
    if (!esewaId.trim() || !esewaName.trim()) { toast.error('eSewa ID and name are required'); return; }
    const method: PaymentMethod = { type: 'esewa', esewaId: esewaId.trim(), name: esewaName.trim(), instructions: esewaNote.trim() || undefined };
    addPaymentMethod(sellerId, method);
    toast.success('eSewa payment method added!');
    resetForms();
  }

  function handleAddBank() {
    if (!bankName.trim() || !bankAccount.trim() || !bankHolder.trim()) { toast.error('Bank name, account number and holder name are required'); return; }
    const method: PaymentMethod = { type: 'bank', bankName: bankName.trim(), accountNumber: bankAccount.trim(), accountName: bankHolder.trim(), branch: bankBranch.trim() || undefined, instructions: bankNote.trim() || undefined };
    addPaymentMethod(sellerId, method);
    toast.success('Bank account added!');
    resetForms();
  }

  function handleAddCustom() {
    if (!customLabel.trim() || !customDetails.trim()) { toast.error('Method name and details are required'); return; }
    const method: PaymentMethod = { type: 'custom', label: customLabel.trim(), details: customDetails.trim(), instructions: customNote.trim() || undefined };
    addPaymentMethod(sellerId, method);
    toast.success(`${customLabel} payment method added!`);
    resetForms();
  }

  function handleDelete(idx: number) {
    removePaymentMethod(sellerId, idx);
    setDeleteIdx(null);
    toast.success('Payment method removed');
  }

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-900 flex-shrink-0">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-400" /> Payment Setup
        </h1>
        <p className="text-zinc-500 text-xs mt-0.5">Add payment methods customers will see at checkout</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 pb-8 space-y-4">

        {/* Security note */}
        <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-3 flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-zinc-400 text-xs leading-relaxed">
            Your payment details are shown to customers so they can send you money directly. Never share OTP or passwords.
          </p>
        </div>

        {/* Existing methods */}
        {methods.length > 0 && (
          <div className="space-y-3">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Your Payment Methods ({methods.length})</p>
            {methods.map((m, idx) => {
              const meta = METHOD_META[m.type];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('rounded-2xl p-4 border', meta.bg)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', meta.bg)}>
                        <span className={meta.color}>{meta.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">{meta.label}</p>
                        {m.type === 'esewa'  && <p className="text-zinc-400 text-xs mt-0.5">{m.esewaId} · {m.name}</p>}
                        {m.type === 'bank'   && <p className="text-zinc-400 text-xs mt-0.5">{m.bankName} · {m.accountNumber}</p>}
                        {m.type === 'custom' && <p className="text-zinc-400 text-xs mt-0.5">{m.label} · {m.details.slice(0, 40)}</p>}
                        {m.instructions && <p className="text-zinc-600 text-xs mt-1 italic">"{m.instructions}"</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteIdx(idx)}
                      className="text-zinc-600 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {methods.length === 0 && !adding && (
          <div className="text-center py-8 text-zinc-500">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No payment methods yet</p>
            <p className="text-xs mt-1">Add at least one so customers can pay you</p>
          </div>
        )}

        {/* Add method buttons */}
        {!adding && (
          <div className="space-y-3">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Add Payment Method</p>
            {([['esewa','eSewa','📱','Add your eSewa ID'],['bank','Bank Transfer','🏦','Add bank account details'],['custom','Other (Khalti, IME Pay…)','💳','Add any other method']] as [AddingType, string, string, string][]).map(([type, label, emoji, sub]) => (
              <button key={type} onClick={() => setAdding(type)}
                className="w-full flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl transition-all active:scale-[0.98]">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">{emoji}</div>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-sm">{label}</p>
                  <p className="text-zinc-500 text-xs">{sub}</p>
                </div>
                <Plus className="w-5 h-5 text-zinc-500" />
              </button>
            ))}
          </div>
        )}

        {/* eSewa form */}
        <AnimatePresence>
          {adding === 'esewa' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-green-950/20 border border-green-500/20 rounded-2xl p-4 space-y-3">
              <p className="text-white font-bold flex items-center gap-2">📱 Add eSewa Account</p>
              <Field label="eSewa ID / Phone Number *" value={esewaId} onChange={setEsewaId} placeholder="e.g. 9841234567" />
              <Field label="Account Holder Name *" value={esewaName} onChange={setEsewaName} placeholder="e.g. Priya Sharma" />
              <Field label="Instructions for customers (optional)" value={esewaNote} onChange={setEsewaNote} placeholder="e.g. Send and upload clear screenshot" multiline />
              <div className="flex gap-2">
                <button onClick={resetForms} className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 rounded-xl text-sm">Cancel</button>
                <button onClick={handleAddEsewa} className="flex-1 py-2.5 bg-green-500 text-white font-bold rounded-xl text-sm">Add eSewa</button>
              </div>
            </motion.div>
          )}

          {adding === 'bank' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-4 space-y-3">
              <p className="text-white font-bold flex items-center gap-2">🏦 Add Bank Account</p>
              <Field label="Bank Name *" value={bankName} onChange={setBankName} placeholder="e.g. Nepal Investment Bank" />
              <Field label="Account Number *" value={bankAccount} onChange={setBankAccount} placeholder="e.g. 01200123456789" />
              <Field label="Account Holder Name *" value={bankHolder} onChange={setBankHolder} placeholder="e.g. Priya Sharma Shrestha" />
              <Field label="Branch (optional)" value={bankBranch} onChange={setBankBranch} placeholder="e.g. Thamel Branch" />
              <Field label="Instructions (optional)" value={bankNote} onChange={setBankNote} placeholder="e.g. Use order ID as transfer reference" multiline />
              <div className="flex gap-2">
                <button onClick={resetForms} className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 rounded-xl text-sm">Cancel</button>
                <button onClick={handleAddBank} className="flex-1 py-2.5 bg-blue-500 text-white font-bold rounded-xl text-sm">Add Bank</button>
              </div>
            </motion.div>
          )}

          {adding === 'custom' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 space-y-3">
              <p className="text-white font-bold flex items-center gap-2">💳 Add Custom Payment Method</p>
              <Field label="Method Name *" value={customLabel} onChange={setCustomLabel} placeholder="e.g. Khalti, IME Pay, Cash on Delivery" />
              <Field label="Payment Details *" value={customDetails} onChange={setCustomDetails} placeholder="e.g. Khalti ID: 9841234567 (Your Name)" multiline />
              <Field label="Instructions (optional)" value={customNote} onChange={setCustomNote} placeholder="e.g. Send and upload confirmation screenshot" multiline />
              <div className="flex gap-2">
                <button onClick={resetForms} className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 rounded-xl text-sm">Cancel</button>
                <button onClick={handleAddCustom} className="flex-1 py-2.5 bg-purple-500 text-white font-bold rounded-xl text-sm">Add Method</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm delete */}
        <AnimatePresence>
          {deleteIdx !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4"
              onClick={() => setDeleteIdx(null)}>
              <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
                className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 w-full max-w-sm"
                onClick={e => e.stopPropagation()}>
                <p className="text-white font-bold text-lg text-center mb-2">Remove Payment Method?</p>
                <p className="text-zinc-400 text-sm text-center mb-5">Customers won't be able to pay using this method.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteIdx(null)} className="flex-1 py-3 border border-zinc-700 text-white rounded-2xl font-semibold">Cancel</button>
                  <button onClick={() => handleDelete(deleteIdx!)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold">Remove</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
  const cls = 'w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none';
  return (
    <div>
      <label className="text-zinc-400 text-xs font-semibold block mb-1.5">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} className={cls} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}
