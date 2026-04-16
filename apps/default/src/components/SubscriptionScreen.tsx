import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, CheckCircle, Clock, AlertTriangle, XCircle, Zap,
  ChevronRight, Shield, Star, Calendar, Upload, X, ArrowRight,
} from 'lucide-react';
import {
  useSubscriptionStore, PLANS, type PlanId, type SubscriptionPlan,
} from '../store/subscriptionStore';
import { useNotifStore } from '../store/notifStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  active:         { color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30',  icon: <CheckCircle className="w-4 h-4" />,    label: 'Active'        },
  expiring_soon:  { color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', icon: <AlertTriangle className="w-4 h-4" />, label: 'Expiring Soon' },
  expired:        { color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30',       icon: <XCircle className="w-4 h-4" />,       label: 'Expired'       },
  none:           { color: 'text-zinc-400',   bg: 'bg-zinc-800 border-zinc-700',            icon: <Clock className="w-4 h-4" />,         label: 'No Plan'       },
};

const PAYMENT_METHODS_INFO = [
  { id: 'esewa', label: 'eSewa',         emoji: '📱', color: 'from-green-600 to-emerald-700' },
  { id: 'bank',  label: 'Bank Transfer', emoji: '🏦', color: 'from-blue-600 to-indigo-700'  },
  { id: 'khalti',label: 'Khalti',        emoji: '💜', color: 'from-purple-600 to-violet-700' },
];

// Admin eSewa/Bank details for subscription payments
const ADMIN_PAYMENT = {
  esewa:  { id: '9800000001', name: 'Nepalese Hype Official' },
  bank:   { bank: 'Nepal Bank Limited', account: '00100110001234', name: 'Nepalese Hype Pvt. Ltd.', branch: 'New Road, Kathmandu' },
};

type Step = 'status' | 'select_plan' | 'payment_method' | 'payment_instructions' | 'upload_receipt' | 'pending';

export default function SubscriptionScreen() {
  const {
    current, pendingRenewal, getStatus, getDaysRemaining,
    submitRenewalRequest, clearPendingRenewal,
    // For demo/testing: activate directly
    activateSubscription,
  } = useSubscriptionStore();
  const { addNotif } = useNotifStore();

  const [step, setStep]             = useState<Step>('status');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('esewa');
  const [receiptData, setReceiptData]   = useState<string>('');
  const [receiptNote, setReceiptNote]   = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const status     = getStatus();
  const daysLeft   = getDaysRemaining();
  const statusConf = STATUS_CONFIG[status];

  function handlePlanSelect(plan: SubscriptionPlan) {
    setSelectedPlan(plan);
    setStep('payment_method');
  }

  function handleMethodSelect(method: string) {
    setSelectedMethod(method);
    setStep('payment_instructions');
  }

  function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setReceiptData(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmitReceipt() {
    if (!receiptData) { toast.error('Please upload your payment receipt'); return; }
    if (!receiptNote.trim()) { toast.error('Please add your transaction ID or note'); return; }
    setSubmitting(true);
    setTimeout(() => {
      submitRenewalRequest(
        selectedPlan!.id,
        selectedPlan!.price,
        receiptData,
        receiptNote
      );
      addNotif({
        type: 'order',
        emoji: '📋',
        title: 'Renewal Request Submitted',
        body: `Your ${selectedPlan!.label} plan request is under review. We'll activate it within 24 hours.`,
      });
      setSubmitting(false);
      setStep('pending');
      toast.success('Receipt submitted! Your account will be activated within 24 hours.');
    }, 1500);
  }

  // Demo: instant activation (for testing)
  function handleDemoActivate(planId: PlanId) {
    activateSubscription(planId, 'demo', PLANS.find(p => p.id === planId)!.price);
    addNotif({ type: 'badge', emoji: '✅', title: 'Subscription Activated!', body: `Your ${PLANS.find(p => p.id === planId)!.label} plan is now active. Start selling!` });
    toast.success('✅ Subscription activated! You can now upload and sell.');
    setStep('status');
  }

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-950 px-4 pt-4 pb-3 border-b border-zinc-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          {step !== 'status' && (
            <button onClick={() => setStep('status')} className="text-zinc-400 hover:text-white mr-1">
              <X className="w-5 h-5" />
            </button>
          )}
          <Crown className="w-5 h-5 text-yellow-400" />
          <h1 className="text-white font-bold text-xl">Subscription</h1>
        </div>
        <p className="text-zinc-500 text-xs mt-0.5 ml-7">Manage your seller plan</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        <AnimatePresence mode="wait">

          {/* ── STATUS OVERVIEW ─────────────────────────────────────────────── */}
          {step === 'status' && (
            <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4 pb-8">

              {/* Status Card */}
              <div className={cn(
                'rounded-3xl p-5 border relative overflow-hidden',
                status === 'active'        ? 'bg-gradient-to-br from-green-900/40 to-zinc-900 border-green-500/30' :
                status === 'expiring_soon' ? 'bg-gradient-to-br from-yellow-900/40 to-zinc-900 border-yellow-500/30' :
                status === 'expired'       ? 'bg-gradient-to-br from-red-900/40 to-zinc-900 border-red-500/30' :
                                             'bg-zinc-900 border-zinc-800'
              )}>
                {/* Glow orb */}
                <div className={cn(
                  'absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20',
                  status === 'active' ? 'bg-green-500' : status === 'expiring_soon' ? 'bg-yellow-500' : status === 'expired' ? 'bg-red-500' : 'bg-zinc-600'
                )} />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-zinc-400 text-xs mb-1">Current Status</p>
                      <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full border w-fit', statusConf.bg)}>
                        <span className={statusConf.color}>{statusConf.icon}</span>
                        <span className={cn('font-bold text-sm', statusConf.color)}>{statusConf.label}</span>
                      </div>
                    </div>
                    <Crown className="w-8 h-8 text-yellow-400 opacity-60" />
                  </div>

                  {current ? (
                    <>
                      <p className="text-white font-black text-2xl mb-1">
                        {PLANS.find(p => p.id === current.planId)?.label ?? 'Custom'} Plan
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Expires {new Date(current.expiryDate).toLocaleDateString('en-NP', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Days countdown */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-zinc-400">Time Remaining</span>
                          <span className={cn('font-bold', daysLeft <= 7 ? 'text-red-400' : 'text-white')}>
                            {daysLeft} days left
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (daysLeft / (PLANS.find(p => p.id === current.planId)?.months ?? 1) / 30) * 100)}%` }}
                            transition={{ duration: 1 }}
                            className={cn('h-full rounded-full', daysLeft <= 7 ? 'bg-red-500' : daysLeft <= 30 ? 'bg-yellow-500' : 'bg-green-500')}
                          />
                        </div>
                      </div>

                      {status === 'expiring_soon' && (
                        <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                          <p className="text-yellow-300 text-xs">Your subscription expires in {daysLeft} days. Renew now to keep selling!</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <p className="text-zinc-300 text-lg font-bold">No Active Plan</p>
                      <p className="text-zinc-500 text-sm mt-1">Subscribe to start selling on Nepalese Hype</p>
                    </div>
                  )}
                </div>
              </div>

              {/* What you get */}
              {current && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-white font-bold text-sm mb-3">✅ Your Plan Includes</p>
                  <div className="space-y-2">
                    {(PLANS.find(p => p.id === current.planId)?.features ?? []).map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-zinc-300 text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending renewal notice */}
              {pendingRenewal && pendingRenewal.status === 'pending' && (
                <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-bold text-sm">Renewal Under Review</p>
                    <p className="text-zinc-400 text-xs mt-1">
                      Your {PLANS.find(p => p.id === pendingRenewal.planId)?.label} plan renewal receipt was submitted on{' '}
                      {new Date(pendingRenewal.submittedAt).toLocaleDateString()}. We'll activate within 24 hours.
                    </p>
                    <button onClick={clearPendingRenewal} className="text-blue-400 text-xs mt-2 underline">Cancel request</button>
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => setStep('select_plan')}
                  className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/30 active:scale-[0.98] transition-transform"
                >
                  <Crown className="w-5 h-5" />
                  {current ? 'Renew / Upgrade Plan' : 'Subscribe Now'}
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* History */}
                {useSubscriptionStore.getState().history.length > 1 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Subscription History</p>
                    {useSubscriptionStore.getState().history.slice(0, 5).map((h, i) => (
                      <div key={h.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                        <div>
                          <p className="text-white text-sm font-semibold">{PLANS.find(p => p.id === h.planId)?.label}</p>
                          <p className="text-zinc-600 text-xs">{new Date(h.startDate).toLocaleDateString()} → {new Date(h.expiryDate).toLocaleDateString()}</p>
                        </div>
                        <span className="text-green-400 font-bold text-sm">रू {h.paidAmount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SELECT PLAN ─────────────────────────────────────────────────── */}
          {step === 'select_plan' && (
            <motion.div key="select_plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 pb-8 space-y-4">
              <div>
                <h2 className="text-white font-bold text-lg">Choose Your Plan</h2>
                <p className="text-zinc-500 text-xs mt-1">All plans include full seller access. Longer plans save more.</p>
              </div>

              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <button
                    onClick={() => handlePlanSelect(plan)}
                    className={cn(
                      'w-full text-left rounded-3xl p-5 border transition-all active:scale-[0.98] relative overflow-hidden',
                      plan.id === '6m'  ? 'bg-gradient-to-br from-yellow-900/50 to-orange-900/30 border-yellow-500/50' :
                      plan.id === '12m' ? 'bg-gradient-to-br from-purple-900/50 to-indigo-900/30 border-purple-500/50' :
                                          'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                    )}
                  >
                    {plan.badge && (
                      <span className={cn(
                        'absolute top-4 right-4 text-xs font-black px-2.5 py-1 rounded-full',
                        plan.id === '12m' ? 'bg-purple-500 text-white' :
                        plan.id === '6m'  ? 'bg-yellow-500 text-black' :
                                            'bg-red-500 text-white'
                      )}>
                        {plan.badge}
                      </span>
                    )}

                    <div className="mb-3">
                      <p className="text-white font-black text-xl">{plan.label}</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-white font-black text-3xl">रू {plan.price.toLocaleString()}</span>
                        {plan.discountPct > 0 && (
                          <>
                            <span className="text-zinc-500 text-sm line-through">रू {plan.originalPrice.toLocaleString()}</span>
                            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                              {plan.discountPct}% OFF
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-zinc-500 text-xs mt-1">रू {plan.perMonth.toLocaleString()} / month</p>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          <span className="text-zinc-300 text-xs">{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-xs">Tap to select</span>
                      <div className={cn(
                        'flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl',
                        plan.id === '12m' ? 'bg-purple-500 text-white' :
                        plan.id === '6m'  ? 'bg-yellow-500 text-black' :
                                            'bg-red-500 text-white'
                      )}>
                        Select <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── PAYMENT METHOD ──────────────────────────────────────────────── */}
          {step === 'payment_method' && selectedPlan && (
            <motion.div key="payment_method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 pb-8 space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="text-zinc-400 text-xs">Selected Plan</p>
                <p className="text-white font-black text-xl">{selectedPlan.label}</p>
                <p className="text-yellow-400 font-bold">रू {selectedPlan.price.toLocaleString()}</p>
              </div>

              <div>
                <h2 className="text-white font-bold text-lg mb-1">Choose Payment Method</h2>
                <p className="text-zinc-500 text-xs">Pay via any method below, then upload your receipt</p>
              </div>

              {PAYMENT_METHODS_INFO.map((m, i) => (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handleMethodSelect(m.id)}
                  className="w-full flex items-center gap-4 p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-600 active:scale-[0.98] transition-all"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-3xl flex-shrink-0`}>
                    {m.emoji}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-bold">{m.label}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Pay then upload screenshot</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600" />
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* ── PAYMENT INSTRUCTIONS ────────────────────────────────────────── */}
          {step === 'payment_instructions' && selectedPlan && (
            <motion.div key="payment_instructions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 pb-8 space-y-4">
              <div>
                <h2 className="text-white font-bold text-lg">Payment Instructions</h2>
                <p className="text-zinc-500 text-xs mt-0.5">Follow the steps below carefully</p>
              </div>

              {/* Amount banner */}
              <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/40 border border-yellow-500/30 rounded-2xl p-4 text-center">
                <p className="text-zinc-400 text-xs mb-1">Total Amount to Pay</p>
                <p className="text-white font-black text-4xl">रू {selectedPlan.price.toLocaleString()}</p>
                <p className="text-yellow-400 text-sm mt-1">{selectedPlan.label} Plan</p>
              </div>

              {/* Method-specific details */}
              {selectedMethod === 'esewa' && (
                <div className="bg-green-950/30 border border-green-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📱</span>
                    <p className="text-white font-bold">eSewa Payment Details</p>
                  </div>
                  {[
                    { label: 'eSewa ID', value: ADMIN_PAYMENT.esewa.id },
                    { label: 'Account Name', value: ADMIN_PAYMENT.esewa.name },
                    { label: 'Amount', value: `रू ${selectedPlan.price.toLocaleString()}` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-green-900/50 last:border-0">
                      <span className="text-zinc-400 text-sm">{row.label}</span>
                      <span className="text-white font-bold text-sm">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedMethod === 'bank' && (
                <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏦</span>
                    <p className="text-white font-bold">Bank Transfer Details</p>
                  </div>
                  {[
                    { label: 'Bank',    value: ADMIN_PAYMENT.bank.bank },
                    { label: 'Account No.', value: ADMIN_PAYMENT.bank.account },
                    { label: 'Account Name', value: ADMIN_PAYMENT.bank.name },
                    { label: 'Branch',  value: ADMIN_PAYMENT.bank.branch },
                    { label: 'Amount',  value: `रू ${selectedPlan.price.toLocaleString()}` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-blue-900/50 last:border-0">
                      <span className="text-zinc-400 text-sm">{row.label}</span>
                      <span className="text-white font-bold text-sm">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedMethod === 'khalti' && (
                <div className="bg-purple-950/30 border border-purple-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">💜</span>
                    <p className="text-white font-bold">Khalti Payment</p>
                  </div>
                  <p className="text-zinc-300 text-sm">
                    Send रू {selectedPlan.price.toLocaleString()} to Khalti ID: <span className="text-purple-300 font-bold">9800000001</span> (Nepalese Hype Official)
                  </p>
                </div>
              )}

              {/* Steps */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="text-white font-bold text-sm mb-3">📋 Steps to Follow</p>
                {[
                  `Open your ${selectedMethod === 'esewa' ? 'eSewa app' : selectedMethod === 'bank' ? 'banking app or visit bank' : 'Khalti app'}`,
                  `Send exactly रू ${selectedPlan.price.toLocaleString()} to the details above`,
                  'Take a clear screenshot of the payment confirmation',
                  'Come back here and upload your receipt',
                  'Your subscription will be activated within 24 hours',
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3 mb-3">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-zinc-300 text-sm">{s}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep('upload_receipt')}
                className="w-full py-4 bg-red-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 active:scale-[0.98] transition-transform"
              >
                <Upload className="w-5 h-5" />
                I've Paid — Upload Receipt
              </button>

              {/* Demo shortcut */}
              <button
                onClick={() => handleDemoActivate(selectedPlan.id)}
                className="w-full py-3 border border-zinc-700 text-zinc-500 text-sm rounded-2xl hover:border-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ⚡ Demo: Activate Instantly (Testing Only)
              </button>
            </motion.div>
          )}

          {/* ── UPLOAD RECEIPT ──────────────────────────────────────────────── */}
          {step === 'upload_receipt' && selectedPlan && (
            <motion.div key="upload_receipt" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 pb-8 space-y-4">
              <div>
                <h2 className="text-white font-bold text-lg">Upload Payment Receipt</h2>
                <p className="text-zinc-500 text-xs mt-0.5">Upload a clear screenshot of your payment</p>
              </div>

              {/* Receipt upload area */}
              <label className={cn(
                'block w-full rounded-3xl border-2 border-dashed transition-all cursor-pointer',
                receiptData ? 'border-green-500/50 bg-green-950/20' : 'border-zinc-700 hover:border-red-500/50 bg-zinc-900'
              )}>
                <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
                {receiptData ? (
                  <div className="p-3">
                    <img src={receiptData} alt="Receipt" className="w-full rounded-2xl object-cover max-h-64" />
                    <p className="text-green-400 text-center text-sm font-semibold mt-2">✅ Receipt uploaded</p>
                    <p className="text-zinc-500 text-center text-xs">Tap to change</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-3">
                      <Upload className="w-8 h-8 text-zinc-500" />
                    </div>
                    <p className="text-white font-semibold">Tap to upload receipt</p>
                    <p className="text-zinc-500 text-xs mt-1">Screenshot or photo of payment • Max 5MB</p>
                  </div>
                )}
              </label>

              {/* Transaction note */}
              <div>
                <label className="text-zinc-400 text-xs font-semibold mb-2 block">
                  Transaction ID / Note <span className="text-red-400">*</span>
                </label>
                <input
                  value={receiptNote}
                  onChange={e => setReceiptNote(e.target.value)}
                  placeholder="e.g. TXN#ESW20250412-881234 or Bank ref: 001234"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 text-white placeholder-zinc-600 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
                />
              </div>

              {/* Validation notice */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Our team verifies every receipt manually. False receipts will result in permanent account suspension. Keep your payment confirmation for 30 days.
                </p>
              </div>

              <button
                onClick={handleSubmitReceipt}
                disabled={submitting || !receiptData || !receiptNote.trim()}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              >
                {submitting ? (
                  <><span className="animate-spin">⟳</span> Submitting...</>
                ) : (
                  <><CheckCircle className="w-5 h-5" /> Submit Receipt for Review</>
                )}
              </button>
            </motion.div>
          )}

          {/* ── PENDING ─────────────────────────────────────────────────────── */}
          {step === 'pending' && (
            <motion.div key="pending" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-24 h-24 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mb-6"
              >
                <Clock className="w-12 h-12 text-blue-400" />
              </motion.div>
              <h2 className="text-white font-black text-2xl mb-2">Receipt Submitted!</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Your {selectedPlan?.label} plan renewal is under review. Our team will verify your payment and activate your account within <span className="text-white font-bold">24 hours</span>.
              </p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-full text-left space-y-2 mb-6">
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Plan</span><span className="text-white font-bold">{selectedPlan?.label}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Amount</span><span className="text-yellow-400 font-bold">रू {selectedPlan?.price.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Method</span><span className="text-white font-semibold capitalize">{selectedMethod}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Status</span><span className="text-blue-400 font-bold">⏳ Under Review</span></div>
              </div>
              <button onClick={() => setStep('status')} className="w-full py-3.5 bg-red-500 text-white font-bold rounded-2xl">
                Back to Dashboard
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
