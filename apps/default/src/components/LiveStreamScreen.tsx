import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, ShoppingBag, X, Users, Gift, Zap, ChevronLeft, Star } from 'lucide-react';
import { getVideoBackground, getSellerAvatar, formatNumber, formatNPR, getProductImage } from '../lib/images';
import { useCartStore } from '../store/cartStore';
import { useCoinsStore } from '../store/coinsStore';
import { useLangStore } from '../store/langStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface LiveStream {
  id: string;
  seller: string;
  title: string;
  viewers: number;
  likes: number;
  thumbnail: number;
  products: LiveProduct[];
  isLive: boolean;
}

interface LiveProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  category: string;
  stock: number;
}

const LIVE_STREAMS: LiveStream[] = [
  {
    id: 'ls1', seller: 'priya_fashion', title: 'Nepal Fashion Week LIVE — Exclusive Deals! 👗',
    viewers: 12400, likes: 48200, thumbnail: 2, isLive: true,
    products: [
      { id: 'p1', name: 'Dhaka Topi — Special Edition', price: 650, originalPrice: 850, category: 'fashion', stock: 12 },
      { id: 'p2', name: 'Pashmina Shawl — Limited', price: 2800, originalPrice: 3500, category: 'fashion', stock: 5 },
    ],
  },
  {
    id: 'ls2', seller: 'bikash_foods', title: 'Live Cooking: Authentic Newari Feast 🍛',
    viewers: 8900, likes: 31200, thumbnail: 1, isLive: true,
    products: [
      { id: 'p3', name: 'Samay Baji Spice Kit', price: 450, originalPrice: 650, category: 'food', stock: 30 },
      { id: 'p4', name: 'Momo Masala Bundle x3', price: 950, originalPrice: 1140, category: 'food', stock: 20 },
    ],
  },
  {
    id: 'ls3', seller: 'sita_crafts', title: 'Thangka Painting LIVE — Watch Me Create! 🎨',
    viewers: 4200, likes: 19800, thumbnail: 3, isLive: true,
    products: [
      { id: 'p5', name: 'Thangka Mini Buddha', price: 3200, originalPrice: 4200, category: 'crafts', stock: 3 },
    ],
  },
];

const SEED_COMMENTS = [
  { user: 'ram_ktm',      text: 'Namaste! This is amazing 🔥',           color: '#ef4444' },
  { user: 'sima_pok',     text: 'Is the Pashmina available in red? ❤️',  color: '#a855f7' },
  { user: 'arun_bkt',     text: 'Just ordered! So excited 🛍️',           color: '#3b82f6' },
  { user: 'priti_llp',    text: 'Best live ever! Dami 💯',               color: '#22c55e' },
  { user: 'dipak_bir',    text: 'Shipping to Biratnagar possible?',       color: '#f97316' },
  { user: 'anita_dhk',    text: '❤️❤️❤️ Love your style!',              color: '#ec4899' },
  { user: 'kiran_pokhara',text: 'Arrived from Pokhara to watch this 🏔️', color: '#06b6d4' },
  { user: 'hari_janaki',  text: 'Daami chha! Order garinchhu 🙌',        color: '#eab308' },
];

export default function LiveStreamScreen() {
  const [activeLive, setActiveLive] = useState<LiveStream | null>(null);
  const [comments, setComments] = useState(SEED_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [showProduct, setShowProduct] = useState<LiveProduct | null>(null);
  const [likes, setLikes] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
  const [totalViewers, setTotalViewers] = useState(0);
  const [activeProductIdx, setActiveProductIdx] = useState(0);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore(s => s.addItem);
  const { addCoins } = useCoinsStore();
  const { t } = useLangStore();

  // Auto-scroll comments
  useEffect(() => { commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  // Simulate real-time comments
  useEffect(() => {
    if (!activeLive) return;
    const interval = setInterval(() => {
      const sample = SEED_COMMENTS[Math.floor(Math.random() * SEED_COMMENTS.length)];
      setComments(c => [...c.slice(-30), { ...sample, user: sample.user + (Math.random() * 99 | 0) }]);
      setTotalViewers(v => v + (Math.random() * 5 - 2 | 0));
    }, 2500);
    return () => clearInterval(interval);
  }, [activeLive]);

  // Cycle pinned product
  useEffect(() => {
    if (!activeLive) return;
    const interval = setInterval(() => {
      setActiveProductIdx(i => (i + 1) % activeLive.products.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [activeLive]);

  function handleLike() {
    const newId = Date.now();
    const x = 30 + Math.random() * 40;
    setFloatingHearts(h => [...h, { id: newId, x }]);
    setLikes(l => l + 1);
    setTimeout(() => setFloatingHearts(h => h.filter(f => f.id !== newId)), 2000);
  }

  function handleSendComment() {
    if (!newComment.trim()) return;
    setComments(c => [...c, { user: 'you', text: newComment, color: '#ef4444' }]);
    setNewComment('');
    addCoins(2, 'Live stream comment 💬');
  }

  function handleSendGift() {
    toast.success('🎁 Gift sent! +10 coins earned');
    addCoins(10, 'Sent a gift in live stream 🎁');
    setComments(c => [...c, { user: 'you', text: '🎁 Sent a gift!', color: '#eab308' }]);
  }

  function handleBuyNow(product: LiveProduct) {
    addItem({ productId: product.id, name: product.name, price: product.price, seller: activeLive?.seller || '', qty: 1, image: getProductImage(product.category, 0) });
    addCoins(20, 'Purchased in live stream 🛍️');
    toast.success(`${product.name} added to cart! 🛍️ +20 coins`);
    setShowProduct(null);
  }

  if (activeLive) {
    const viewerCount = activeLive.viewers + totalViewers;
    const pinnedProduct = activeLive.products[activeProductIdx];

    return (
      <div className="flex-1 bg-black flex flex-col overflow-hidden relative">
        {/* Full-screen video bg */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${getVideoBackground(activeLive.thumbnail)})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/20" />

        {/* Floating hearts */}
        <div className="absolute right-4 bottom-40 pointer-events-none">
          <AnimatePresence>
            {floatingHearts.map(h => (
              <motion.div
                key={h.id}
                initial={{ opacity: 1, y: 0, scale: 0.5 }}
                animate={{ opacity: 0, y: -200, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: 'easeOut' }}
                className="absolute text-2xl"
                style={{ right: h.x }}
              >
                ❤️
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Top bar */}
        <div className="relative flex items-center gap-3 px-4 pt-4 pb-2 z-10">
          <button onClick={() => setActiveLive(null)} className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <img src={getSellerAvatar(activeLive.seller)} className="w-9 h-9 rounded-full border-2 border-red-500 bg-zinc-700" />
            <div>
              <p className="text-white font-bold text-sm">@{activeLive.seller}</p>
              <div className="flex items-center gap-2">
                <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse">● LIVE</span>
                <span className="text-white/70 text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" />{formatNumber(viewerCount)}
                </span>
              </div>
            </div>
          </div>
          <button className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl">Follow</button>
        </div>

        {/* Pinned product */}
        <AnimatePresence mode="wait">
          <motion.button
            key={pinnedProduct.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setShowProduct(pinnedProduct)}
            className="relative z-10 mx-4 bg-black/70 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3"
          >
            <img src={getProductImage(pinnedProduct.category, 0)} className="w-12 h-12 rounded-xl object-cover bg-zinc-800 flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-white font-semibold text-sm truncate">{pinnedProduct.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-red-400 font-black text-sm">{formatNPR(pinnedProduct.price)}</span>
                <span className="text-zinc-500 text-xs line-through">{formatNPR(pinnedProduct.originalPrice)}</span>
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {Math.round((1 - pinnedProduct.price / pinnedProduct.originalPrice) * 100)}% OFF
                </span>
              </div>
            </div>
            <ShoppingBag className="w-5 h-5 text-red-400 flex-shrink-0" />
          </motion.button>
        </AnimatePresence>

        {/* Comments */}
        <div className="relative flex-1 overflow-hidden z-10 px-4 py-2">
          <div className="h-full overflow-y-auto scrollbar-none flex flex-col justify-end gap-1.5">
            {comments.slice(-15).map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <span className="font-bold text-xs flex-shrink-0" style={{ color: c.color }}>@{c.user}</span>
                <span className="text-white/90 text-xs leading-snug">{c.text}</span>
              </motion.div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* Right action bar */}
        <div className="absolute right-4 bottom-28 flex flex-col gap-4 z-10">
          <button onClick={handleLike} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm active:scale-90 transition-transform">
              <Heart className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-white text-xs">{formatNumber(activeLive.likes + likes)}</span>
          </button>
          <button onClick={handleSendGift} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm active:scale-90 transition-transform">
              <Gift className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-white text-xs">Gift</span>
          </button>
          <button onClick={() => setShowProduct(pinnedProduct)} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 active:scale-90 transition-transform">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xs">Shop</span>
          </button>
        </div>

        {/* Comment input */}
        <div className="relative z-10 flex items-center gap-2 px-4 pb-4 pt-2">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendComment()}
            placeholder="Say something..."
            className="flex-1 bg-black/50 backdrop-blur-md text-white placeholder-white/40 rounded-2xl px-4 py-2.5 text-sm outline-none border border-white/10 focus:border-red-500/50 transition-colors"
          />
          <button onClick={handleSendComment} disabled={!newComment.trim()} className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Product buy sheet */}
        <AnimatePresence>
          {showProduct && (
            <>
              <div className="absolute inset-0 z-20" onClick={() => setShowProduct(null)} />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="absolute inset-x-0 bottom-0 z-30 bg-zinc-900 rounded-t-3xl p-5 border-t border-zinc-800"
              >
                <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
                <div className="flex gap-4 mb-4">
                  <img src={getProductImage(showProduct.category, 0)} className="w-20 h-20 rounded-2xl object-cover bg-zinc-800" />
                  <div>
                    <p className="text-white font-bold">{showProduct.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-red-400 font-black text-xl">{formatNPR(showProduct.price)}</span>
                      <span className="text-zinc-500 text-sm line-through">{formatNPR(showProduct.originalPrice)}</span>
                    </div>
                    <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                      LIVE EXCLUSIVE PRICE 🔴
                    </span>
                    <p className="text-zinc-500 text-xs mt-1">Only {showProduct.stock} left!</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowProduct(null)} className="flex-1 py-3 border border-zinc-700 text-white rounded-2xl font-semibold">Close</button>
                  <button onClick={() => handleBuyNow(showProduct)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> Buy Now
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Live streams list
  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-zinc-900">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          {t('liveNow')}
        </h1>
        <p className="text-zinc-500 text-xs mt-0.5">Shop in real-time with live sellers</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-4">
        {LIVE_STREAMS.map((stream, i) => (
          <motion.button
            key={stream.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => { setActiveLive(stream); setTotalViewers(stream.viewers); setComments(SEED_COMMENTS); setLikes(0); }}
            className="w-full text-left active:scale-[0.98] transition-transform"
          >
            <div className="relative rounded-3xl overflow-hidden" style={{ height: 200 }}>
              <img src={getVideoBackground(stream.thumbnail)} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full animate-pulse">● LIVE</span>
                <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Users className="w-3 h-3" />{formatNumber(stream.viewers)}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center gap-2 mb-2">
                  <img src={getSellerAvatar(stream.seller)} className="w-7 h-7 rounded-full border-2 border-red-500 bg-zinc-700" />
                  <span className="text-white font-semibold text-sm">@{stream.seller}</span>
                </div>
                <p className="text-white font-bold text-base leading-snug">{stream.title}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-zinc-300 text-xs flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" />{formatNumber(stream.likes)}</span>
                  <span className="text-zinc-300 text-xs">{stream.products.length} products live</span>
                </div>
              </div>

              {/* Product pills */}
              <div className="absolute top-3 right-3 space-y-1">
                {stream.products.slice(0, 2).map(p => (
                  <div key={p.id} className="bg-black/70 backdrop-blur-sm rounded-xl px-2.5 py-1 text-right">
                    <p className="text-white text-xs font-semibold truncate max-w-28">{p.name}</p>
                    <p className="text-red-400 text-xs font-black">{formatNPR(p.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
