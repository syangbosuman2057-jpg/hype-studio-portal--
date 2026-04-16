import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Star, ShoppingBag, X, ChevronRight, Loader2,
  Plus, Minus, Tag, Store, MapPin, TrendingUp, Grid3X3,
  List, Heart, Share2, Package,
} from 'lucide-react';
import { getProducts } from '../lib/api';
import { getProductImage, getSellerAvatar, formatNPR, formatNumber } from '../lib/images';
import { useCartStore } from '../store/cartStore';
import { useContentStore } from '../store/contentStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

// ─── Types & constants ────────────────────────────────────────────────────────
interface Product {
  id: string;
  fieldValues: Record<string, any>;
}

const CATEGORIES = [
  { id: 'all',        label: 'All',        emoji: '🛍️' },
  { id: 'fashion',    label: 'Fashion',    emoji: '👗' },
  { id: 'food',       label: 'Food',       emoji: '🍛' },
  { id: 'crafts',     label: 'Crafts',     emoji: '🎨' },
  { id: 'accessories',label: 'Accessories',emoji: '💎' },
  { id: 'home',       label: 'Home',       emoji: '🏠' },
  { id: 'beauty',     label: 'Beauty',     emoji: '💄' },
];

const CAT_MAP: Record<string, string> = {
  All: 'all', Fashion: 'fashion', Food: 'food', Crafts: 'crafts',
  Accessories: 'accessories', Home: 'home', Beauty: 'beauty',
};

const SORT_OPTIONS = [
  { id: 'popular',   label: 'Popular'    },
  { id: 'newest',    label: 'Newest'     },
  { id: 'price_asc', label: 'Price ↑'   },
  { id: 'price_desc',label: 'Price ↓'   },
];

// ─── Seed local products (from contentStore sellers) ──────────────────────────
const LOCAL_PRODUCTS = [
  { id: 'lp-1', name: 'Premium Pashmina Shawl', price: 3500, seller: 'priya_fashion', category: 'fashion', rating: 4.9, reviews: 234, stock: 8, badge: '🔥 Hot', description: 'Hand-woven premium pashmina from Mustang. Extremely soft, warm and elegant.' },
  { id: 'lp-2', name: 'Samay Baji Complete Kit', price: 1200, seller: 'bikash_foods', category: 'food', rating: 4.8, reviews: 156, stock: 20, badge: '⭐ Top Rated', description: 'Authentic Newari spice kit with recipe guide. Perfect for festivals.' },
  { id: 'lp-3', name: 'Thangka Buddha Painting 24×18"', price: 8500, seller: 'sita_crafts', category: 'crafts', rating: 4.9, reviews: 89, stock: 3, badge: '🎨 Handmade', description: 'Hand-painted traditional Thangka, each piece unique. Comes with certificate.' },
  { id: 'lp-4', name: 'Dhaka Topi — Classic Red', price: 850, seller: 'priya_fashion', category: 'accessories', rating: 4.7, reviews: 312, stock: 45, badge: null, description: 'Traditional Nepali topi in premium Dhaka fabric. One size fits all.' },
  { id: 'lp-5', name: 'Dhaka Fabric Roll 2m', price: 850, seller: 'priya_fashion', category: 'fashion', rating: 4.6, reviews: 178, stock: 30, badge: null, description: 'Traditional Dhaka fabric, 2 meters. Perfect for sarees and kurtas.' },
  { id: 'lp-6', name: 'Momo Masala Pack ×3', price: 450, seller: 'bikash_foods', category: 'food', rating: 4.9, reviews: 423, stock: 60, badge: '🔥 Bestseller', description: 'Secret Newari momo spice blend. Pack of 3 for 30 portions total.' },
  { id: 'lp-7', name: 'Silver Filigree Earrings', price: 2200, seller: 'ram_jewels', category: 'accessories', rating: 4.8, reviews: 67, stock: 12, badge: '✨ New', description: 'Handcrafted sterling silver filigree earrings from Patan.' },
  { id: 'lp-8', name: 'Lokta Paper Notebook A5', price: 380, seller: 'pokhara_crafts', category: 'crafts', rating: 4.5, reviews: 201, stock: 100, badge: null, description: 'Handmade lokta paper notebook, 80 pages. Eco-friendly and durable.' },
  { id: 'lp-9', name: 'Himalayan Pink Salt 500g', price: 320, seller: 'bikash_foods', category: 'food', rating: 4.7, reviews: 345, stock: 80, badge: '💪 Healthy', description: 'Pure Himalayan pink salt, mineral rich. Premium quality.' },
  { id: 'lp-10', name: 'Wool Dhurrie Rug 4×6ft', price: 4200, seller: 'sita_crafts', category: 'home', rating: 4.8, reviews: 45, stock: 7, badge: '🏠 Popular', description: 'Hand-woven wool dhurrie. Traditional patterns, modern homes.' },
];

// ─── Product Detail Sheet ─────────────────────────────────────────────────────
function ProductDetail({
  product, onClose, onAddToCart
}: { product: typeof LOCAL_PRODUCTS[0]; onClose: () => void; onAddToCart: (qty: number) => void }) {
  const [qty, setQty]       = useState(1);
  const [liked, setLiked]   = useState(false);
  const img = getProductImage(product.category, 0);

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed inset-x-0 bottom-0 z-40 bg-zinc-950 border-t border-zinc-800 rounded-t-3xl overflow-hidden"
      style={{ maxWidth: 448, margin: '0 auto', maxHeight: '88vh' }}>
      {/* Image */}
      <div className="relative h-56 flex-shrink-0">
        <img src={img} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-black/60 backdrop-blur rounded-full flex items-center justify-center">
          <X className="w-4 h-4 text-white" />
        </button>
        {product.badge && (
          <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full">{product.badge}</span>
        )}
        {product.stock <= 5 && (
          <span className="absolute bottom-4 right-4 bg-amber-500 text-black text-xs font-black px-2.5 py-1 rounded-full">Only {product.stock} left!</span>
        )}
      </div>

      <div className="overflow-y-auto scrollbar-none p-5 space-y-4" style={{ maxHeight: 'calc(88vh - 224px)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-white font-black text-xl leading-tight">{product.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={cn('w-3.5 h-3.5', s <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700')} />
                ))}
              </div>
              <span className="text-amber-400 text-xs font-bold">{product.rating}</span>
              <span className="text-zinc-600 text-xs">({formatNumber(product.reviews)} reviews)</span>
            </div>
          </div>
          <button onClick={() => setLiked(!liked)} className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Heart className={cn('w-5 h-5', liked ? 'fill-red-500 text-red-500' : 'text-zinc-500')} />
          </button>
        </div>

        <p className="text-red-400 font-black text-3xl">{formatNPR(product.price)}</p>

        <div className="flex items-center gap-3">
          <img src={getSellerAvatar(product.seller)} className="w-8 h-8 rounded-xl bg-zinc-800" />
          <div>
            <p className="text-white text-sm font-semibold">@{product.seller}</p>
            <p className="text-zinc-500 text-xs">Verified Seller</p>
          </div>
        </div>

        <p className="text-zinc-400 text-sm leading-relaxed">{product.description}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <Package className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-white text-xs font-bold">{product.stock} in stock</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <Store className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-white text-xs font-bold">Pay via eSewa / Bank</p>
          </div>
        </div>

        <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
          <Tag className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-zinc-400 text-xs leading-relaxed">
            Payment is made directly to the seller via eSewa or Bank Transfer. You'll upload proof after payment.
          </p>
        </div>

        {/* Qty + Add */}
        <div className="flex items-center gap-3 pb-2">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}><Minus className="w-4 h-4 text-zinc-400" /></button>
            <span className="text-white font-black text-lg w-6 text-center">{qty}</span>
            <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}><Plus className="w-4 h-4 text-zinc-400" /></button>
          </div>
          <button onClick={() => onAddToCart(qty)}
            className="flex-1 py-3.5 bg-red-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 active:scale-[0.97] transition-all">
            <ShoppingBag className="w-5 h-5" /> Add to Cart · {formatNPR(product.price * qty)}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ShopScreen ──────────────────────────────────────────────────────────
export default function ShopScreen() {
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('all');
  const [sort, setSort]               = useState('popular');
  const [viewMode, setViewMode]       = useState<'grid' | 'list'>('grid');
  const [selected, setSelected]       = useState<typeof LOCAL_PRODUCTS[0] | null>(null);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    getProducts().then(p => { setApiProducts(p); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Merge API + local products
  const allProducts = LOCAL_PRODUCTS;

  const filtered = allProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.seller.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || p.category === category;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sort === 'price_asc')  return a.price - b.price;
    if (sort === 'price_desc') return b.price - a.price;
    if (sort === 'newest')     return Math.random() - 0.5;
    return b.reviews - a.reviews; // popular
  });

  function handleAddToCart(product: typeof LOCAL_PRODUCTS[0], qty: number) {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      seller: product.seller,
      qty,
      image: getProductImage(product.category, 0),
    });
    toast.success(`Added to cart! 🛍️`, { description: product.name });
    setSelected(null);
  }

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">

      {/* Header — padded for floating top bar */}
      <div className="px-4 pt-[104px] pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-white font-black text-xl flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-red-400" /> Shop Nepal
            </h1>
            <p className="text-zinc-500 text-xs">{filtered.length} products found</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
              className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 focus-within:border-red-500/60 rounded-2xl px-4 py-3 mb-3 transition-colors">
          <Search className="w-4 h-4 text-zinc-600 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products, sellers..."
            className="flex-1 bg-transparent text-white placeholder-zinc-600 text-sm outline-none" />
          {search && (
            <button onClick={() => setSearch('')}><X className="w-4 h-4 text-zinc-600" /></button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition-all',
                category === cat.id
                  ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              )}>
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort bar */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3">
          <span className="text-zinc-600 text-xs self-center flex-shrink-0">Sort:</span>
          {SORT_OPTIONS.map(s => (
            <button key={s.id} onClick={() => setSort(s.id)}
              className={cn(
                'flex-shrink-0 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all',
                sort === s.id ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              )}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured banner */}
      {!search && category === 'all' && (
        <div className="mx-4 mb-4 relative rounded-2xl overflow-hidden flex-shrink-0" style={{ height: 100 }}>
          <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"
            className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/30" />
          <div className="absolute inset-0 flex items-center px-4">
            <div>
              <p className="text-xs text-amber-400 font-bold mb-0.5">🔥 THIS WEEK</p>
              <p className="text-white font-black text-base leading-tight">Nepal Fashion<br />Mega Sale</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-white font-black text-xl">Up to</p>
              <p className="text-red-400 font-black text-3xl">25% OFF</p>
            </div>
          </div>
        </div>
      )}

      {/* Product grid / list */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pb-28">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton rounded-2xl" style={{ height: 220 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No products found</p>
            <p className="text-xs mt-1">Try a different search or category</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p, i) => (
              <motion.button key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(p)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-transform">
                <div className="relative h-40">
                  <img src={getProductImage(p.category, i % 4)} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {p.badge && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{p.badge}</span>
                  )}
                  {p.stock <= 5 && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">Low</span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); handleAddToCart(p, 1); }}
                    className="absolute bottom-2 right-2 w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-white font-bold text-xs leading-snug line-clamp-2 mb-1">{p.name}</p>
                  <p className="text-red-400 font-black text-base">{formatNPR(p.price)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-amber-400 text-xs font-bold">{p.rating}</span>
                    <span className="text-zinc-700 text-xs">({formatNumber(p.reviews)})</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p, i) => (
              <motion.button key={p.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(p)}
                className="w-full flex gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-left active:scale-[0.98] transition-transform">
                <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                  <img src={getProductImage(p.category, i % 4)} className="w-full h-full object-cover" />
                  {p.badge && (
                    <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">{p.badge.split(' ')[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm line-clamp-2 leading-snug">{p.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">@{p.seller}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-amber-400 text-xs font-bold">{p.rating}</span>
                  </div>
                  <p className="text-red-400 font-black text-lg mt-1">{formatNPR(p.price)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); handleAddToCart(p, 1); }}
                  className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 self-center shadow-lg active:scale-90 transition-transform">
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Product detail sheet */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-30" onClick={() => setSelected(null)} />
            <ProductDetail product={selected} onClose={() => setSelected(null)}
              onAddToCart={qty => handleAddToCart(selected, qty)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
