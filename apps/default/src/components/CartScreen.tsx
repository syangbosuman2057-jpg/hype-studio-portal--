import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Trash2, Plus, Minus, MapPin, CheckCircle,
  Loader2, ChevronRight, Package, Upload, Copy, Image,
  Smartphone, Building2, CreditCard, Clock, Shield,
  ArrowLeft, X, Zap, AlertCircle, FileCheck,
} from 'lucide-react';
import { useCartStore, type CartItem } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { usePaymentStore, type PaymentMethod } from '../store/paymentStore';
import { useNotifStore } from '../store/notifStore';
import { placeOrder } from '../lib/api';
import { formatNPR } from '../lib/images';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { ulid } from 'ulidx';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'cart' | 'address' | 'payment_info' | 'upload_receipt' | 'success';

const METHOD_META: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  esewa:  { label: 'eSewa',         emoji: '📱', color: 'text-green-400',  bg: 'bg-green-950/40 border-green-500/30'  },
  bank:   { label: 'Bank Transfer', emoji: '🏦', color: 'text-blue-400',   bg: 'bg-blue-950/40 border-blue-500/30'   },
  custom: { label: 'Other',         emoji: '💳', color: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-500/30' },
};

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepBar({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'cart',          label: 'Cart'    },
    { id: 'address',       label: 'Address' },
    { id: 'payment_info',  label: 'Payment' },
    { id: 'upload_receipt',label: 'Receipt' },
  ];
  const idx = steps.findIndex(s => s.id === current);

  return (
    <div className="flex items-center px-4 py-3 border-b border-zinc-900/60">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-0.5">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all',
              i < idx  ? 'bg-green-500 text-white' :
              i === idx ? 'bg-red-500 text-white ring-2 ring-red-500/30' :
                          'bg-zinc-800 text-zinc-500'
            )}>
              {i < idx ? '✓' : i + 1}
            </div>
            <span className={cn('text-[9px] font-semibold whitespace-nowrap',
              i <= idx ? 'text-white' : 'text-zinc-600')}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('flex-1 h-[2px] mx-1 rounded-full transition-all', i < idx ? 'bg-green-500' : 'bg-zinc-800')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Payment Method Card ──────────────────────────────────────────────────────
function PaymentMethodCard({
  method, selected, onSelect,
}: { method: PaymentMethod; selected: boolean; onSelect: () => void }) {
  const meta = METHOD_META[method.type];
  return (
    <button onClick={onSelect}
      className={cn(
        'w-full text-left rounded-2xl p-4 border-2 transition-all',
        selected ? 'border-red-500 bg-red-500/8' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
      )}>
      <div className="flex items-center gap-3">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border', meta.bg)}>
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-bold text-sm', meta.color)}>{meta.label}</p>
          {method.type === 'esewa'  && <p className="text-zinc-400 text-xs mt-0.5">{method.esewaId} · {method.name}</p>}
          {method.type === 'bank'   && <p className="text-zinc-400 text-xs mt-0.5">{method.bankName} · {method.accountNumber}</p>}
          {method.type === 'custom' && <p className="text-zinc-400 text-xs mt-0.5 truncate">{method.label}: {method.details.slice(0, 35)}</p>}
        </div>
        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
          selected ? 'border-red-500 bg-red-500' : 'border-zinc-600')}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}

// ─── Copy Row ─────────────────────────────────────────────────────────────────
function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  function doCopy() {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(`${label} copied!`);
  }
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50 last:border-0">
      <span className="text-zinc-500 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-white font-semibold text-sm">{value}</span>
        <button onClick={doCopy} className={cn('transition-colors', copied ? 'text-green-400' : 'text-zinc-600 hover:text-zinc-300')}>
          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CartScreen() {
  const { items, removeItem, updateQty, clearCart, total, count } = useCartStore();
  const { user }     = useAuthStore();
  const { getSellerProfile, submitReceipt } = usePaymentStore();
  const { addNotif } = useNotifStore();

  const [step, setStep]           = useState<Step>('cart');
  const [address, setAddress]     = useState('');
  const [orderId]                 = useState(`ORD-${ulid().slice(-8).toUpperCase()}`);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [receiptImg, setReceiptImg] = useState('');
  const [txnNote, setTxnNote]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [placing, setPlacing]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalAmount = total();
  const itemCount   = count();

  // Group items by seller
  const bySeller = items.reduce<Record<string, CartItem[]>>((acc, item) => {
    if (!acc[item.seller]) acc[item.seller] = [];
    acc[item.seller].push(item);
    return acc;
  }, {});
  const sellers = Object.keys(bySeller);

  // Use first seller's payment methods (most carts are single-seller in MVP)
  const primarySeller    = sellers[0] ?? '';
  const sellerProfile    = getSellerProfile(primarySeller);
  const paymentMethods   = sellerProfile?.methods ?? [];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setReceiptImg(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handlePlaceOrder() {
    if (!address.trim()) { toast.error('Please enter your delivery address'); return; }
    setPlacing(true);
    try {
      for (const item of items) {
        await placeOrder({
          customer: user?.username ?? 'guest',
          seller: item.seller,
          product: item.name,
          total: item.price * item.qty,
          qty: item.qty,
          address,
          orderId: `${orderId}-${item.seller}`,
        }).catch(() => {});
      }
      // Move to payment info step
      setPlacing(false);
      if (paymentMethods.length > 0) {
        setSelectedMethod(paymentMethods[0]);
        setStep('payment_info');
      } else {
        // No payment methods set up — skip to success with COD note
        setStep('success');
        addNotif({ type: 'order', emoji: '📦', title: 'Order Placed!', body: `Order ${orderId} placed. Contact @${primarySeller} for payment.` });
        clearCart();
      }
    } catch {
      toast.error('Order failed. Please try again.');
      setPlacing(false);
    }
  }

  function handleSubmitReceipt() {
    if (!receiptImg)       { toast.error('Please upload your payment screenshot'); return; }
    if (!txnNote.trim())   { toast.error('Please add your transaction ID or note'); return; }
    setSubmitting(true);
    setTimeout(() => {
      submitReceipt({
        orderId,
        productName: items.map(i => `${i.name} ×${i.qty}`).join(', '),
        amount: totalAmount,
        customerId: user?.username ?? 'guest',
        sellerId: primarySeller,
        method: selectedMethod?.type ?? 'esewa',
        receiptUrl: receiptImg,
        transactionNote: txnNote.trim(),
      });
      addNotif({
        type: 'order', emoji: '📤',
        title: 'Receipt Submitted!',
        body: `Payment proof for Order ${orderId} sent to @${primarySeller}. Awaiting verification.`,
      });
      setSubmitting(false);
      clearCart();
      setStep('success');
      toast.success('Receipt submitted successfully! ✅');
    }, 1800);
  }

  // ── Empty cart ───────────────────────────────────────────────────────────────
  if (itemCount === 0 && step === 'cart') {
    return (
      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-12 h-12 text-zinc-700" />
          </div>
          <h2 className="text-white font-black text-xl text-center mb-2">Your cart is empty</h2>
          <p className="text-zinc-500 text-sm text-center">Discover amazing Nepali products and add them here</p>
        </motion.div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 14 }}
          className="w-24 h-24 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-white font-black text-2xl mb-2">
            {receiptImg ? 'Receipt Submitted! 🎉' : 'Order Placed! 🎉'}
          </h2>
          <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
            {receiptImg
              ? `Your payment proof is under review by @${primarySeller}. You'll be notified once verified.`
              : `Your order has been placed. Contact @${primarySeller} to arrange payment.`
            }
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Order ID</span><span className="text-white font-mono font-bold text-xs">{orderId}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Amount</span><span className="text-red-400 font-black">{formatNPR(totalAmount)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Status</span>
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', receiptImg ? 'status-submitted' : 'status-pending')}>
                {receiptImg ? '⏳ Awaiting Verification' : '⏳ Pending Payment'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs mb-6">
            <Clock className="w-3.5 h-3.5" /> Delivery: 2–5 business days after payment verified
          </div>
          <button onClick={() => setStep('cart')}
            className="w-full py-3.5 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-500/25">
            Continue Shopping
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">

      {/* Header — padded for floating top bar */}
      <div className="bg-zinc-950 px-4 pt-[104px] pb-3 border-b border-zinc-900/80 flex-shrink-0">
        <div className="flex items-center gap-3">
          {step !== 'cart' && (
            <button onClick={() => {
              if (step === 'address') setStep('cart');
              else if (step === 'payment_info') setStep('address');
              else if (step === 'upload_receipt') setStep('payment_info');
            }} className="text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-white font-black text-xl">
              {step === 'cart'           ? '🛒 My Cart'              :
               step === 'address'        ? '📍 Delivery Address'     :
               step === 'payment_info'   ? '💳 Make Payment'         :
               step === 'upload_receipt' ? '📤 Upload Receipt'       : 'Done'}
            </h1>
            {step === 'cart' && (
              <p className="text-zinc-500 text-xs mt-0.5">{itemCount} item{itemCount !== 1 ? 's' : ''} · {formatNPR(totalAmount)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Step bar */}
      {step !== 'success' && <StepBar current={step} />}

      {/* ── STEP: CART ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <AnimatePresence mode="wait">

          {step === 'cart' && (
            <motion.div key="cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 pb-24 space-y-4">
              {/* Grouped by seller */}
              {sellers.map(sellerId => (
                <div key={sellerId} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
                    <div className="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <p className="text-zinc-300 font-semibold text-sm">@{sellerId}</p>
                  </div>
                  {bySeller[sellerId].map((item, i) => (
                    <motion.div key={item.productId} layout
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-3 p-4 border-b border-zinc-800/50 last:border-0">
                      <img src={item.image} className="w-16 h-16 rounded-xl object-cover bg-zinc-800 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{item.name}</p>
                        <p className="text-red-400 font-black text-base mt-1">{formatNPR(item.price)}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between gap-2">
                        <button onClick={() => removeItem(item.productId)} className="text-zinc-700 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-2 py-1.5">
                          <button onClick={() => item.qty > 1 ? updateQty(item.productId, item.qty - 1) : removeItem(item.productId)}
                            className="text-zinc-400 hover:text-white transition-colors">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-white text-sm font-black w-5 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.productId, item.qty + 1)}
                            className="text-zinc-400 hover:text-white transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}

              {/* Free delivery banner */}
              {totalAmount < 2000 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <p className="text-zinc-400 text-xs">
                    Add <span className="text-white font-bold">{formatNPR(2000 - totalAmount)}</span> more for free delivery! 🚚
                  </p>
                </div>
              )}

              {/* Order summary */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="text-white font-bold text-sm mb-3">Order Summary</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal ({itemCount} items)</span>
                    <span className="text-white">{formatNPR(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Delivery</span>
                    <span className={totalAmount >= 2000 ? 'text-green-400 font-semibold' : 'text-white'}>
                      {totalAmount >= 2000 ? 'FREE' : formatNPR(120)}
                    </span>
                  </div>
                  <div className="border-t border-zinc-800 pt-3 flex justify-between">
                    <span className="text-white font-black">Total</span>
                    <span className="text-red-400 font-black text-xl">
                      {formatNPR(totalAmount >= 2000 ? totalAmount : totalAmount + 120)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP: ADDRESS ────────────────────────────────────────────── */}
          {step === 'address' && (
            <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 pb-24 space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <label className="text-zinc-400 text-xs font-semibold flex items-center gap-1.5 mb-3">
                  <MapPin className="w-3.5 h-3.5" /> Delivery Address <span className="text-red-400">*</span>
                </label>
                <textarea value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Full address: Ward, Street, City, Province&#10;e.g. Ward 5, Thamel, Kathmandu, Bagmati Province"
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-red-500 text-white placeholder-zinc-600 rounded-xl p-3 text-sm outline-none resize-none transition-colors"
                />
              </div>

              {/* Quick city chips */}
              <div>
                <p className="text-zinc-500 text-xs mb-2">Quick select city:</p>
                <div className="flex gap-2 flex-wrap">
                  {['Kathmandu', 'Pokhara', 'Bhaktapur', 'Patan', 'Chitwan', 'Butwal'].map(city => (
                    <button key={city} onClick={() => setAddress(prev => city + (prev ? ', ' + prev : ''))}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-red-500/50 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition-all">
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-3 flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Your address is shared only with the seller to fulfill your order. Delivery: 2–5 business days.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── STEP: PAYMENT INFO ───────────────────────────────────────── */}
          {step === 'payment_info' && (
            <motion.div key="payment_info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 pb-24 space-y-4">

              {/* Amount banner */}
              <div className="bg-gradient-to-r from-red-900/40 to-rose-900/30 border border-red-500/25 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-xs">Amount to Pay</p>
                  <p className="text-white font-black text-3xl mt-0.5">{formatNPR(totalAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500 text-xs">Order</p>
                  <p className="text-zinc-300 font-mono text-xs font-bold">{orderId}</p>
                </div>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="bg-amber-950/30 border border-amber-500/20 rounded-2xl p-5 text-center">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <p className="text-white font-bold mb-1">No Payment Methods</p>
                  <p className="text-zinc-400 text-sm">@{primarySeller} hasn't set up payment details yet. Contact them via Chat.</p>
                </div>
              ) : (
                <>
                  {/* Method selector */}
                  <div>
                    <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
                      @{primarySeller} accepts payment via:
                    </p>
                    <div className="space-y-2.5">
                      {paymentMethods.map((m, i) => (
                        <PaymentMethodCard key={i} method={m} selected={selectedMethod === m} onSelect={() => setSelectedMethod(m)} />
                      ))}
                    </div>
                  </div>

                  {/* Payment details for selected method */}
                  {selectedMethod && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={cn('rounded-2xl p-4 border', METHOD_META[selectedMethod.type].bg)}>
                      <p className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                        {METHOD_META[selectedMethod.type].emoji} {METHOD_META[selectedMethod.type].label} Details
                      </p>

                      {selectedMethod.type === 'esewa' && (
                        <>
                          <CopyRow label="eSewa ID"    value={selectedMethod.esewaId} />
                          <CopyRow label="Name"        value={selectedMethod.name} />
                          <CopyRow label="Amount"      value={formatNPR(totalAmount)} />
                        </>
                      )}
                      {selectedMethod.type === 'bank' && (
                        <>
                          <CopyRow label="Bank"        value={selectedMethod.bankName} />
                          <CopyRow label="Account No." value={selectedMethod.accountNumber} />
                          <CopyRow label="Account Name" value={selectedMethod.accountName} />
                          {selectedMethod.branch && <CopyRow label="Branch" value={selectedMethod.branch} />}
                          <CopyRow label="Amount"      value={formatNPR(totalAmount)} />
                        </>
                      )}
                      {selectedMethod.type === 'custom' && (
                        <>
                          <p className="text-zinc-300 text-sm leading-relaxed mb-2">{selectedMethod.details}</p>
                          <CopyRow label="Amount" value={formatNPR(totalAmount)} />
                        </>
                      )}

                      {selectedMethod.instructions && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-zinc-500 text-xs">📝 Seller note: <span className="text-zinc-300">{selectedMethod.instructions}</span></p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* How to pay */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-white font-bold text-sm mb-3">📋 Steps</p>
                    {[
                      `Open your ${selectedMethod?.type === 'esewa' ? 'eSewa app' : selectedMethod?.type === 'bank' ? 'banking app' : 'payment app'}`,
                      `Send exactly ${formatNPR(totalAmount)} to the details above`,
                      'Take a clear screenshot of the confirmation',
                      'Tap "Upload Receipt" below and attach your screenshot',
                    ].map((s, i) => (
                      <div key={i} className="flex items-start gap-3 mb-2.5 last:mb-0">
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5">{i + 1}</div>
                        <p className="text-zinc-300 text-xs leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── STEP: UPLOAD RECEIPT ─────────────────────────────────────── */}
          {step === 'upload_receipt' && (
            <motion.div key="upload_receipt" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 pb-24 space-y-4">

              {/* Receipt upload area */}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <label className={cn(
                'block w-full rounded-3xl border-2 border-dashed cursor-pointer transition-all',
                receiptImg ? 'border-green-500/50 bg-green-950/10' : 'border-zinc-700 hover:border-red-500/50 bg-zinc-900'
              )} onClick={() => fileRef.current?.click()}>
                {receiptImg ? (
                  <div className="p-3">
                    <img src={receiptImg} alt="Receipt" className="w-full rounded-2xl object-cover max-h-72" />
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <p className="text-green-400 text-sm font-semibold">Screenshot uploaded</p>
                    </div>
                    <p className="text-zinc-500 text-xs text-center mt-0.5">Tap to change</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14">
                    <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center mb-4">
                      <Image className="w-10 h-10 text-zinc-600" />
                    </div>
                    <p className="text-white font-bold text-base">Upload Payment Screenshot</p>
                    <p className="text-zinc-500 text-sm mt-1">Clear photo of confirmation • Max 5MB</p>
                    <div className="mt-4 bg-red-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Choose File
                    </div>
                  </div>
                )}
              </label>

              {/* Transaction note */}
              <div>
                <label className="text-zinc-400 text-xs font-semibold block mb-2 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5" /> Transaction ID / Reference <span className="text-red-400">*</span>
                </label>
                <input value={txnNote} onChange={e => setTxnNote(e.target.value)}
                  placeholder="e.g. TXN#ESW20250412-88123 or Bank Ref: 001234"
                  className="input-field" />
              </div>

              {/* Order recap */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Payment Recap</p>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Order ID</span><span className="text-white font-mono font-bold text-xs">{orderId}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Amount Paid</span><span className="text-red-400 font-black">{formatNPR(totalAmount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Seller</span><span className="text-white font-semibold">@{primarySeller}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Method</span>
                  <span className="text-white font-semibold capitalize">{selectedMethod?.type ?? '—'}</span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Upload a genuine payment screenshot. Fake receipts may lead to order cancellation and account suspension.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom action bar — sits above floating nav ───────────────────── */}
      {step !== 'success' && (
        <div className="bg-zinc-950 border-t border-zinc-900/80 p-4 pb-24 flex-shrink-0">
          {step === 'cart' && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-400 text-sm">{itemCount} items</span>
              <span className="text-white font-black text-xl">{formatNPR(totalAmount)}</span>
            </div>
          )}
          <div className="flex gap-3">
            {step !== 'cart' && (
              <button onClick={() => {
                if (step === 'address') setStep('cart');
                else if (step === 'payment_info') setStep('address');
                else if (step === 'upload_receipt') setStep('payment_info');
              }} className="w-12 h-12 border border-zinc-700 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-all flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            {step === 'cart' && (
              <button onClick={() => setStep('address')}
                className="flex-1 py-3.5 bg-red-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 active:scale-[0.97] transition-all">
                <Zap className="w-5 h-5" /> Proceed to Checkout
              </button>
            )}

            {step === 'address' && (
              <button onClick={() => {
                if (!address.trim()) { toast.error('Please enter your delivery address'); return; }
                handlePlaceOrder();
              }} disabled={placing}
                className="flex-1 py-3.5 bg-red-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 disabled:opacity-50 active:scale-[0.97] transition-all">
                {placing ? <><Loader2 className="w-5 h-5 animate-spin" /> Placing...</> : <><ChevronRight className="w-5 h-5" /> Continue to Payment</>}
              </button>
            )}

            {step === 'payment_info' && (
              <button onClick={() => setStep('upload_receipt')}
                disabled={paymentMethods.length === 0 || !selectedMethod}
                className="flex-1 py-3.5 bg-red-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 disabled:opacity-40 active:scale-[0.97] transition-all">
                <Upload className="w-5 h-5" /> I've Paid — Upload Receipt
              </button>
            )}

            {step === 'upload_receipt' && (
              <button onClick={handleSubmitReceipt} disabled={submitting || !receiptImg || !txnNote.trim()}
                className="flex-1 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-40 active:scale-[0.97] transition-all">
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><CheckCircle className="w-5 h-5" /> Submit Receipt</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
