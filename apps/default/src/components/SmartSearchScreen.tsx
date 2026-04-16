import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal, Star, ShoppingBag, TrendingUp, Clock, Mic, Sparkles } from 'lucide-react';
import { getVideos, getProducts } from '../lib/api';
import { getProductImage, getVideoBackground, getSellerAvatar, formatNPR, formatNumber } from '../lib/images';
import { useCartStore } from '../store/cartStore';
import { useLangStore } from '../store/langStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface ProductNode { id: string; fieldValues: Record<string, any>; }
interface VideoNode   { id: string; fieldValues: Record<string, any>; }

const RECENT_SEARCHES = ['Pashmina shawl', 'Momo masala', 'Dhaka topi', 'Newari crafts'];
const TRENDING_SEARCHES = ['#NepaliFashion 🔥', 'Handicraft gifts', 'Organic spices', 'Traditional wear', 'Pokhara sellers'];
const AI_SUGGESTIONS: Record<string, string[]> = {
  'fashion': ['Try "Daura Suruwal" 👗', 'Also trending: Dhaka topi 🎩', 'Check priya_fashion live deals'],
  'food':    ['Try "Authentic Newari" 🍛', 'Also: Momo masala packs', 'Organic spices from Mustang'],
  'craft':   ['Try "Thangka paintings" 🎨', 'Also: Singing bowls', 'Handmade jewelry 💎'],
  'default': ['Try "Traditional Nepali" 🇳🇵', 'Explore handmade crafts', 'Live seller deals 🔴'],
};

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
type ResultTab = 'all' | 'products' | 'videos' | 'sellers';

export default function SmartSearchScreen() {
  const [query, setQuery]     = useState('');
  const [active, setActive]   = useState(false);
  const [products, setProducts] = useState<ProductNode[]>([]);
  const [videos, setVideos]   = useState<VideoNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy]   = useState<SortOption>('relevance');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice]   = useState(10000);
  const [selectedCat, setSelectedCat] = useState('');
  const [resultTab, setResultTab]     = useState<ResultTab>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const addItem  = useCartStore(s => s.addItem);
  const { t }    = useLangStore();

  useEffect(() => {
    Promise.all([getProducts(), getVideos()]).then(([p, v]) => {
      setProducts(p); setVideos(v); setLoading(false);
    });
  }, []);

  const filteredProducts = products.filter(p => {
    const name    = (p.fieldValues['/attributes/@pname'] ?? p.fieldValues['/text'] ?? '').toLowerCase();
    const cat     = p.fieldValues['/attributes/@pcategory'] ?? '';
    const price   = p.fieldValues['/attributes/@pprice']   ?? 0;
    const rating  = p.fieldValues['/attributes/@prating']  ?? 0;
    const matchQ  = !query || name.includes(query.toLowerCase());
    const matchC  = !selectedCat || cat === selectedCat;
    const matchP  = price <= maxPrice;
    const matchR  = rating >= minRating;
    return matchQ && matchC && matchP && matchR;
  }).sort((a, b) => {
    const ap = a.fieldValues['/attributes/@pprice']  ?? 0;
    const bp = b.fieldValues['/attributes/@pprice']  ?? 0;
    const ar = a.fieldValues['/attributes/@prating'] ?? 0;
    const br = b.fieldValues['/attributes/@prating'] ?? 0;
    if (sortBy === 'price_asc')  return ap - bp;
    if (sortBy === 'price_desc') return bp - ap;
    if (sortBy === 'rating')     return br - ar;
    return 0;
  });

  const filteredVideos = videos.filter(v => {
    const title = (v.fieldValues['/text'] ?? '').toLowerCase();
    const sel   = (v.fieldValues['/attributes/@vseller'] ?? '').toLowerCase();
    return !query || title.includes(query.toLowerCase()) || sel.includes(query.toLowerCase());
  });

  const aiSuggestions = query.toLowerCase().includes('fashion') ? AI_SUGGESTIONS.fashion :
    query.toLowerCase().includes('food') || query.toLowerCase().includes('momo') ? AI_SUGGESTIONS.food :
    query.toLowerCase().includes('craft') ? AI_SUGGESTIONS.craft : AI_SUGGESTIONS.default;

  function handleAddToCart(p: ProductNode) {
    const name = p.fieldValues['/attributes/@pname'] || p.fieldValues['/text'];
    const price = p.fieldValues['/attributes/@pprice'] || 0;
    const seller = p.fieldValues['/attributes/@pseller'] || '';
    const category = p.fieldValues['/attributes/@pcategory'] || 'fashion';
    addItem({ productId: p.id, name, price, seller, qty: 1, image: getProductImage(category, 0) });
    toast.success(`Added to cart! 🛍️`);
  }

  const hasQuery = query.length > 0;
  const hasResults = filteredProducts.length > 0 || filteredVideos.length > 0;

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Search header */}
      <div className="px-4 pt-4 pb-3 bg-zinc-950 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-white font-bold text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> {t('smartSearch')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex-1 flex items-center gap-2.5 rounded-2xl px-4 py-3 border transition-all',
            active ? 'bg-zinc-800 border-red-500/60' : 'bg-zinc-900 border-zinc-800'
          )}>
            <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setActive(true)}
              placeholder="Search products, videos, sellers..."
              className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm outline-none"
            />
            <AnimatePresence>
              {query && (
                <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => setQuery('')}>
                  <X className="w-4 h-4 text-zinc-500" />
                </motion.button>
              )}
            </AnimatePresence>
            <button className="text-zinc-500 hover:text-white transition-colors">
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center border transition-all flex-shrink-0',
              showFilters ? 'bg-red-500 border-red-500' : 'bg-zinc-900 border-zinc-800'
            )}
          >
            <SlidersHorizontal className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3">
                <div>
                  <p className="text-zinc-400 text-xs mb-2">Sort by</p>
                  <div className="flex gap-2 flex-wrap">
                    {([['relevance','Relevance'],['price_asc','Price ↑'],['price_desc','Price ↓'],['rating','Rating']] as [SortOption,string][]).map(([val, label]) => (
                      <button key={val} onClick={() => setSortBy(val)}
                        className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                          sortBy === val ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400')}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-zinc-400 text-xs mb-2">Category</p>
                  <div className="flex gap-2 flex-wrap">
                    {[['','All'],['fashion','Fashion'],['food','Food'],['crafts','Crafts'],['accessories','Accessories']].map(([val, label]) => (
                      <button key={label} onClick={() => setSelectedCat(val)}
                        className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                          selectedCat === val ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400')}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-zinc-400 text-xs mb-2">Min Rating: {minRating}★</p>
                  <div className="flex gap-2">
                    {[0, 3, 4, 4.5].map(r => (
                      <button key={r} onClick={() => setMinRating(r)}
                        className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                          minRating === r ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400')}>
                        {r === 0 ? 'All' : `${r}+`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result tabs when searching */}
        {hasQuery && (
          <div className="flex gap-1.5 pt-3 overflow-x-auto scrollbar-none">
            {(['all','products','videos'] as ResultTab[]).map(tab => (
              <button key={tab} onClick={() => setResultTab(tab)}
                className={cn('flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all',
                  resultTab === tab ? 'bg-red-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800')}>
                {tab === 'all' ? `All (${filteredProducts.length + filteredVideos.length})` :
                 tab === 'products' ? `Products (${filteredProducts.length})` :
                 `Videos (${filteredVideos.length})`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {!hasQuery ? (
          <div className="px-4 pb-6 space-y-5">
            {/* AI smart suggestions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <p className="text-white font-semibold text-sm">AI Suggestions</p>
              </div>
              <div className="space-y-2">
                {AI_SUGGESTIONS.default.map((s, i) => (
                  <motion.button key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    onClick={() => setQuery(s.replace(/[🇳🇵🎨🔴]/g, '').trim())}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-left hover:border-purple-500/40 transition-colors">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="text-zinc-300 text-sm">{s}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Trending */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <p className="text-white font-semibold text-sm">Trending Searches</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map(s => (
                  <button key={s} onClick={() => setQuery(s.replace(/#|🔥/g, '').trim())}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-xs font-medium hover:border-red-500/40 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-zinc-500" />
                <p className="text-white font-semibold text-sm">Recent Searches</p>
              </div>
              <div className="space-y-1">
                {RECENT_SEARCHES.map(s => (
                  <button key={s} onClick={() => setQuery(s)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-900 rounded-xl transition-colors">
                    <Clock className="w-4 h-4 text-zinc-600" />
                    <span className="text-zinc-400 text-sm">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-6">
            {/* AI suggestion banner when query matches */}
            {aiSuggestions && (
              <div className="bg-purple-950/40 border border-purple-500/20 rounded-2xl p-3 mb-4 mt-1">
                <p className="text-purple-300 text-xs font-semibold mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI suggests
                </p>
                <div className="flex gap-2 flex-wrap">
                  {aiSuggestions.map(s => (
                    <button key={s} onClick={() => setQuery(s.replace(/[🎩👗🎨💎🇳🇵🔴]/g, '').trim())}
                      className="bg-purple-500/20 text-purple-300 text-xs px-2.5 py-1 rounded-full font-medium">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!hasResults ? (
              <div className="text-center py-16 text-zinc-500">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No results for "{query}"</p>
                <p className="text-xs mt-1">Try a different term or check trending searches</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Products */}
                {(resultTab === 'all' || resultTab === 'products') && filteredProducts.length > 0 && (
                  <div>
                    {resultTab === 'all' && <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Products ({filteredProducts.length})</p>}
                    <div className="grid grid-cols-2 gap-3">
                      {filteredProducts.map((p, i) => {
                        const name = p.fieldValues['/attributes/@pname'] || p.fieldValues['/text'] || '';
                        const price = p.fieldValues['/attributes/@pprice'] || 0;
                        const rating = p.fieldValues['/attributes/@prating'] || 4.5;
                        const seller = p.fieldValues['/attributes/@pseller'] || '';
                        const cat = p.fieldValues['/attributes/@pcategory'] || 'fashion';
                        return (
                          <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                            <div className="relative">
                              <img src={getProductImage(cat, i)} className="w-full h-32 object-cover bg-zinc-800" />
                              <button onClick={() => handleAddToCart(p)}
                                className="absolute bottom-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                                <ShoppingBag className="w-3.5 h-3.5 text-white" />
                              </button>
                            </div>
                            <div className="p-3">
                              <p className="text-white font-semibold text-xs line-clamp-2">{name}</p>
                              <p className="text-zinc-600 text-xs mt-0.5">@{seller}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-red-400 font-bold text-sm">{formatNPR(price)}</span>
                                <span className="text-zinc-400 text-xs flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{rating}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {(resultTab === 'all' || resultTab === 'videos') && filteredVideos.length > 0 && (
                  <div>
                    <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Videos ({filteredVideos.length})</p>
                    <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
                      {filteredVideos.map((v, i) => {
                        const title = v.fieldValues['/text'] ?? '';
                        const seller = v.fieldValues['/attributes/@vseller'] ?? '';
                        const likes = v.fieldValues['/attributes/@vlikes'] ?? 0;
                        return (
                          <motion.div key={v.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                            className="flex-shrink-0 relative rounded-2xl overflow-hidden" style={{ width: 140, height: 200 }}>
                            <img src={getVideoBackground(i)} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-white text-xs font-semibold line-clamp-2">{title}</p>
                              <p className="text-zinc-400 text-xs">@{seller}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
