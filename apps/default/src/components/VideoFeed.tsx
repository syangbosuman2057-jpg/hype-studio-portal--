import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, ShoppingBag, Bookmark,
  Music, MapPin, Store, ChevronDown, Send, X, User,
  Play, Pause, Volume2, VolumeX,
} from 'lucide-react';
import { useContentStore, type Post } from '../store/contentStore';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useNotifStore } from '../store/notifStore';
import { getVideoBackground, getProductImage, getSellerAvatar, formatNumber, formatNPR } from '../lib/images';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = diff / 60000 | 0, h = diff / 3600000 | 0, d = diff / 86400000 | 0;
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

// ─── Comment Sheet ─────────────────────────────────────────────────────────────

function CommentsSheet({ post, onClose }: { post: Post; onClose: () => void }) {
  const { user }    = useAuthStore();
  const { getComments, addComment } = useContentStore();
  const [text, setText] = useState('');
  const comments = getComments(post.id);

  function handleSend() {
    if (!text.trim()) return;
    addComment(post.id, user?.username ?? 'guest', user?.username ?? 'Guest', text.trim());
    setText('');
  }

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="absolute inset-x-0 bottom-0 bg-zinc-950 border-t border-zinc-800 rounded-t-3xl z-20 flex flex-col"
      style={{ height: '70%' }}>
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-900">
        <p className="text-white font-bold">{formatNumber(post.comments)} Comments</p>
        <button onClick={onClose}><X className="w-5 h-5 text-zinc-400" /></button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-3 space-y-4">
        {comments.length === 0 && (
          <div className="text-center py-10 text-zinc-500">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No comments yet. Be first!</p>
          </div>
        )}
        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${c.authorId}`} className="w-9 h-9 rounded-full bg-zinc-800 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{c.authorName}</p>
              <p className="text-zinc-300 text-sm mt-0.5">{c.text}</p>
              <p className="text-zinc-600 text-xs mt-1">{timeAgo(c.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 px-4 py-3 border-t border-zinc-900">
        <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${user?.username}`} className="w-8 h-8 rounded-full bg-zinc-800" />
        <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-2">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Add a comment..." className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm outline-none" />
          <button onClick={handleSend} disabled={!text.trim()}>
            <Send className={cn('w-4 h-4', text.trim() ? 'text-red-400' : 'text-zinc-700')} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Product Tag Overlay ───────────────────────────────────────────────────────

function ProductTag({ post, onBuy }: { post: Post; onBuy: () => void }) {
  const [show, setShow] = useState(false);
  if (!post.productName || !post.productPrice) return null;
  return (
    <>
      <button onClick={() => setShow(true)}
        className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-2 active:scale-95 transition-transform">
        <ShoppingBag className="w-4 h-4 text-white" />
        <div className="text-left">
          <p className="text-white text-xs font-semibold leading-none truncate max-w-28">{post.productName}</p>
          <p className="text-red-400 text-xs font-black">{formatNPR(post.productPrice)}</p>
        </div>
      </button>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-x-4 bottom-32 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-3xl p-4 z-10">
            <div className="flex justify-between items-start mb-3">
              <p className="text-white font-bold">{post.productName}</p>
              <button onClick={() => setShow(false)}><X className="w-4 h-4 text-zinc-400" /></button>
            </div>
            {post.productBrand && <p className="text-zinc-500 text-xs mb-1">by {post.productBrand}</p>}
            {post.productDescription && <p className="text-zinc-400 text-xs mb-3">{post.productDescription}</p>}
            <div className="flex items-center justify-between mb-3">
              <span className="text-red-400 font-black text-2xl">{formatNPR(post.productPrice)}</span>
              {post.productCategory && (
                <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-xl">{post.productCategory}</span>
              )}
            </div>
            <button onClick={() => { onBuy(); setShow(false); }}
              className="w-full py-3 bg-red-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Add to Cart
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Single Post Card ──────────────────────────────────────────────────────────

function PostCard({ post, isActive }: { post: Post; isActive: boolean }) {
  const { user } = useAuthStore();
  const { toggleLike, toggleSave, toggleFollow, isLiked, isSaved, isFollowing, incrementShare } = useContentStore();
  const addItem = useCartStore(s => s.addItem);
  const { addNotif } = useNotifStore();

  const [showComments, setShowComments] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);
  const liked  = isLiked(post.id);
  const saved  = isSaved(post.id);
  const following = isFollowing(post.authorId);

  function handleLike() {
    toggleLike(post.id);
    if (!liked) {
      const id = Date.now();
      setFloatingHearts(h => [...h, id]);
      setTimeout(() => setFloatingHearts(h => h.filter(x => x !== id)), 1500);
    }
  }

  function handleShare() {
    incrementShare(post.id);
    toast.success('Link copied! Share with friends 📤');
    addNotif({ type: 'like', emoji: '📤', title: 'Shared', body: `You shared "${post.caption.slice(0, 40)}..."` });
  }

  function handleAddToCart() {
    if (!post.productName || !post.productPrice) return;
    addItem({
      productId: post.id, name: post.productName, price: post.productPrice,
      seller: post.authorId, qty: 1,
      image: getProductImage(post.productCategory ?? 'fashion', 0),
    });
    toast.success(`${post.productName} added to cart! 🛍️`);
  }

  // Music ticker animation
  const [musicOffset, setMusicOffset] = useState(0);
  useEffect(() => {
    if (!isActive || !post.music) return;
    const interval = setInterval(() => setMusicOffset(o => o + 1), 50);
    return () => clearInterval(interval);
  }, [isActive, post.music]);

  return (
    <div className="relative w-full h-full flex-shrink-0 bg-black overflow-hidden">
      {/* Background */}
      <img
        src={getVideoBackground(post.thumbnailIdx)}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.85)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />

      {/* Floating hearts */}
      <div className="absolute right-6 bottom-48 pointer-events-none">
        <AnimatePresence>
          {floatingHearts.map(id => (
            <motion.div key={id} initial={{ opacity: 1, y: 0, scale: 0.5, x: 0 }}
              animate={{ opacity: 0, y: -200, scale: 2, x: (Math.random() - 0.5) * 60 }}
              exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: 'easeOut' }}
              className="absolute text-2xl">❤️</motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Video type badge */}
      {post.type === 'video' && (
        <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          VIDEO
        </div>
      )}

      {/* Right action bar — sits above bottom nav */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
        {/* Author */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative">
            <img src={getSellerAvatar(post.authorId)} className="w-12 h-12 rounded-full border-2 border-white bg-zinc-700" />
            {!following && (
              <button onClick={() => toggleFollow(post.authorId)}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-black border-2 border-black">
                +
              </button>
            )}
          </div>
        </div>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <motion.div animate={liked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
            <Heart className={cn('w-8 h-8 drop-shadow-lg', liked ? 'fill-red-500 text-red-500' : 'text-white')} />
          </motion.div>
          <span className="text-white text-xs font-bold drop-shadow">{formatNumber(post.likes)}</span>
        </button>

        {/* Comment */}
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <MessageCircle className="w-8 h-8 text-white drop-shadow-lg" />
          <span className="text-white text-xs font-bold drop-shadow">{formatNumber(post.comments)}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <Share2 className="w-8 h-8 text-white drop-shadow-lg" />
          <span className="text-white text-xs font-bold drop-shadow">{formatNumber(post.shares)}</span>
        </button>

        {/* Save */}
        <button onClick={() => toggleSave(post.id)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <Bookmark className={cn('w-8 h-8 drop-shadow-lg', saved ? 'fill-yellow-400 text-yellow-400' : 'text-white')} />
          <span className="text-white text-xs font-bold drop-shadow">Save</span>
        </button>

        {/* Shop (seller posts only) */}
        {post.role === 'seller' && post.productName && (
          <button onClick={handleAddToCart} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
            <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/50">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xs font-bold drop-shadow">Shop</span>
          </button>
        )}
      </div>

      {/* Bottom info — above nav */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-24 pt-10">
        {/* Author name & follow */}
        <div className="flex items-center gap-2 mb-2">
          <p className="text-white font-black text-base">@{post.authorId}</p>
          {post.authorVerified && (
            <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">✓</span>
          )}
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
            post.role === 'seller' ? 'bg-red-500/30 text-red-300' : 'bg-blue-500/20 text-blue-300')}>
            {post.role === 'seller' ? '🛒 Seller' : '👤'}
          </span>
          {!following && post.authorId !== user?.username && (
            <button onClick={() => toggleFollow(post.authorId)}
              className="ml-auto bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              Follow
            </button>
          )}
          {following && (
            <span className="ml-auto text-white/50 text-xs">Following</span>
          )}
        </div>

        {/* Caption */}
        <p className="text-white text-sm leading-snug mb-2 line-clamp-2">{post.caption}</p>

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <p className="text-blue-300 text-xs mb-2 line-clamp-1">{post.hashtags.join(' ')}</p>
        )}

        {/* Shop tag (customer posts) */}
        {post.shopTag && (
          <div className="flex items-center gap-1.5 mb-2">
            <Store className="w-3.5 h-3.5 text-yellow-400" />
            <p className="text-yellow-300 text-xs font-semibold">Bought from {post.shopTag}</p>
          </div>
        )}

        {/* Location */}
        {post.location && (
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            <p className="text-zinc-400 text-xs">{post.location}</p>
          </div>
        )}

        {/* Product tag chip */}
        {post.role === 'seller' && (
          <div className="mb-3">
            <ProductTag post={post} onBuy={handleAddToCart} />
          </div>
        )}

        {/* Music ticker */}
        {post.music && (
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-2xl px-3 py-2 overflow-hidden">
            <Music className="w-3.5 h-3.5 text-white flex-shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
            <div className="overflow-hidden flex-1">
              <motion.p
                animate={{ x: [0, -200] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="text-white text-xs whitespace-nowrap"
              >
                {post.music} &nbsp;&nbsp;&nbsp; {post.music}
              </motion.p>
            </div>
          </div>
        )}
      </div>

      {/* Comments sheet */}
      <AnimatePresence>
        {showComments && (
          <>
            <div className="absolute inset-0 z-10" onClick={() => setShowComments(false)} />
            <CommentsSheet post={post} onClose={() => setShowComments(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Feed ─────────────────────────────────────────────────────────────────

export default function VideoFeed() {
  const { getFeedPosts, incrementView } = useContentStore();
  const posts = getFeedPosts();
  const [currentIdx, setCurrentIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    incrementView(posts[currentIdx]?.id ?? '');
  }, [currentIdx]);

  function handleScroll() {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const newIdx = Math.round(el.scrollTop / el.clientHeight);
    if (newIdx !== currentIdx) setCurrentIdx(newIdx);
  }

  if (posts.length === 0) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-zinc-500">
          <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No posts yet</p>
          <p className="text-xs">Be the first to upload!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="absolute inset-0 overflow-y-scroll scrollbar-none"
      style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      {posts.map((post, idx) => (
        <div key={post.id} style={{ height: '100vh', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
          <PostCard post={post} isActive={idx === currentIdx} />
        </div>
      ))}
    </div>
  );
}
