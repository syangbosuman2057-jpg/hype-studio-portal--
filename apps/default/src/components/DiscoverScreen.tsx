import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Hash, Users, Flame, Star, Store, Play, Heart } from 'lucide-react';
import { useContentStore } from '../store/contentStore';
import { getVideoBackground, getSellerAvatar, formatNumber } from '../lib/images';
import { cn } from '../lib/utils';

const TRENDING_HASHTAGS = [
  { tag: '#NepaliFashion',   posts: '24.2K', color: 'from-red-500 to-rose-600'     },
  { tag: '#MadeInNepal',     posts: '18.9K', color: 'from-orange-500 to-red-500'   },
  { tag: '#Pashmina',        posts: '12.1K', color: 'from-purple-500 to-pink-500'  },
  { tag: '#NewariFood',      posts: '9.8K',  color: 'from-yellow-500 to-orange-500'},
  { tag: '#KathmanduStyle',  posts: '8.4K',  color: 'from-blue-500 to-cyan-500'   },
  { tag: '#Thangka',         posts: '6.3K',  color: 'from-green-500 to-teal-500'  },
  { tag: '#DhakaFabric',     posts: '5.1K',  color: 'from-pink-500 to-red-400'    },
  { tag: '#NepalSeller',     posts: '4.7K',  color: 'from-indigo-500 to-purple-500'},
];

const TOP_SELLERS = [
  { id: 'priya_fashion', name: 'Priya Sharma',   followers: 22100, category: 'Fashion',   rating: 4.9, verified: true  },
  { id: 'bikash_foods',  name: 'Bikash Maharjan', followers: 18400, category: 'Food',      rating: 4.8, verified: true  },
  { id: 'sita_crafts',   name: 'Sita Tamang',    followers: 9200,  category: 'Crafts',    rating: 4.9, verified: true  },
  { id: 'ram_jewels',    name: 'Ram Jewels',     followers: 7600,  category: 'Jewelry',   rating: 4.7, verified: false },
  { id: 'pokhara_crafts',name: 'Pokhara Crafts', followers: 5800,  category: 'Art',       rating: 4.8, verified: true  },
  { id: 'anita_beauty',  name: 'Anita Beauty',   followers: 4900,  category: 'Beauty',    rating: 4.6, verified: false },
];

type DiscoverTab = 'trending' | 'sellers' | 'hashtags';

export default function DiscoverScreen() {
  const { getFeedPosts, toggleFollow, isFollowing } = useContentStore();
  const [query, setQuery]   = useState('');
  const [tab, setTab]       = useState<DiscoverTab>('trending');
  const allPosts = getFeedPosts();

  const filteredPosts = query
    ? allPosts.filter(p =>
        p.caption.toLowerCase().includes(query.toLowerCase()) ||
        p.hashtags.some(h => h.toLowerCase().includes(query.toLowerCase())) ||
        p.authorId.toLowerCase().includes(query.toLowerCase())
      )
    : allPosts;

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Search bar — padded for floating header */}
      <div className="px-4 pt-[104px] pb-3 bg-zinc-950 flex-shrink-0">
        <h1 className="text-white font-bold text-xl mb-3 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" /> Discover
        </h1>
        <div className={cn(
          'flex items-center gap-3 bg-zinc-900 border rounded-2xl px-4 py-3 transition-all',
          query ? 'border-red-500/60' : 'border-zinc-800'
        )}>
          <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search videos, people, hashtags..."
            className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm outline-none" />
        </div>
      </div>

      {/* Tabs (when not searching) */}
      {!query && (
        <div className="flex gap-1 px-4 mb-3 flex-shrink-0">
          {([['trending','🔥 Trending'],['sellers','🛒 Sellers'],['hashtags','# Hashtags']] as [DiscoverTab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn('flex-1 py-2 rounded-xl text-xs font-bold transition-all',
                tab === id ? 'bg-red-500 text-white' : 'bg-zinc-900 text-zinc-400 border border-zinc-800')}>
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-none pb-24">

        {/* ── SEARCH RESULTS ──────────────────────────────────────────────── */}
        {query && (
          <div className="px-4 pb-6">
            <p className="text-zinc-500 text-xs mb-3">{filteredPosts.length} results for "{query}"</p>
            <div className="grid grid-cols-3 gap-0.5">
              {filteredPosts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="relative aspect-square bg-zinc-900">
                  <img src={getVideoBackground(post.thumbnailIdx)} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20" />
                  {post.type === 'video' && (
                    <div className="absolute top-1 left-1 bg-black/60 rounded p-0.5">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 flex items-center gap-0.5">
                    <Heart className="w-3 h-3 text-white fill-white" />
                    <span className="text-white text-xs font-bold">{formatNumber(post.likes)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            {filteredPosts.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No results found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        )}

        {/* ── TRENDING TAB ─────────────────────────────────────────────────── */}
        {!query && tab === 'trending' && (
          <div className="pb-6">
            {/* Featured banner */}
            <div className="mx-4 mb-4 relative rounded-3xl overflow-hidden" style={{ height: 200 }}>
              <img src={getVideoBackground(1)} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/20" />
              <div className="absolute bottom-4 left-4">
                <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full mb-2 inline-block">🔥 TRENDING NOW</span>
                <p className="text-white font-black text-xl leading-tight">Nepal Fashion Week<br/>Exclusive Drops</p>
                <p className="text-zinc-300 text-xs mt-1">24.2K posts · Updated 2min ago</p>
              </div>
            </div>

            {/* Video grid */}
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider px-4 mb-3">Popular Videos</p>
            <div className="grid grid-cols-3 gap-0.5 px-0">
              {allPosts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                  className="relative aspect-square bg-zinc-900">
                  <img src={getVideoBackground(post.thumbnailIdx)} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20" />
                  {post.type === 'video' && (
                    <div className="absolute top-1 left-1 bg-black/60 rounded p-0.5">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                  {post.role === 'seller' && post.productPrice && (
                    <div className="absolute top-1 right-1 bg-red-500/90 text-white text-xs font-black px-1.5 py-0.5 rounded-md">
                      रू {post.productPrice.toLocaleString()}
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 flex items-center gap-0.5">
                    <Heart className="w-3 h-3 text-white fill-white" />
                    <span className="text-white text-xs font-bold">{formatNumber(post.likes)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── SELLERS TAB ──────────────────────────────────────────────────── */}
        {!query && tab === 'sellers' && (
          <div className="px-4 pb-6 space-y-3">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Top Sellers in Nepal</p>
            {TOP_SELLERS.map((seller, i) => (
              <motion.div key={seller.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="relative flex-shrink-0">
                  <img src={getSellerAvatar(seller.id)} className="w-14 h-14 rounded-2xl bg-zinc-800" />
                  {seller.verified && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-zinc-900">
                      <span className="text-white text-xs font-black">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold text-sm truncate">@{seller.id}</p>
                  </div>
                  <p className="text-zinc-500 text-xs">{seller.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-zinc-400 text-xs">{formatNumber(seller.followers)} followers</span>
                    <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full">{seller.category}</span>
                    <span className="text-yellow-400 text-xs flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-400" />{seller.rating}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleFollow(seller.id)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex-shrink-0',
                    isFollowing(seller.id) ? 'border-zinc-600 text-zinc-400' : 'bg-red-500 border-red-500 text-white'
                  )}>
                  {isFollowing(seller.id) ? 'Following' : 'Follow'}
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── HASHTAGS TAB ─────────────────────────────────────────────────── */}
        {!query && tab === 'hashtags' && (
          <div className="px-4 pb-6">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Trending Hashtags</p>
            <div className="grid grid-cols-2 gap-3">
              {TRENDING_HASHTAGS.map((ht, i) => (
                <motion.button key={ht.tag} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  onClick={() => setQuery(ht.tag)}
                  className="relative rounded-2xl overflow-hidden p-4 text-left active:scale-[0.97] transition-transform">
                  <div className={`absolute inset-0 bg-gradient-to-br ${ht.color} opacity-20`} />
                  <div className={`absolute inset-0 border border-current opacity-10 rounded-2xl bg-gradient-to-br ${ht.color}`} style={{ background: 'transparent' }} />
                  <div className="relative">
                    <Hash className="w-5 h-5 text-white/60 mb-2" />
                    <p className="text-white font-black text-sm">{ht.tag}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">{ht.posts} posts</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Suggested accounts */}
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mt-5 mb-3">Suggested Accounts</p>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
              {TOP_SELLERS.slice(0, 5).map(seller => (
                <div key={seller.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
                  <div className="relative">
                    <img src={getSellerAvatar(seller.id)} className="w-16 h-16 rounded-2xl bg-zinc-800" />
                    {seller.verified && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-zinc-950">
                        <span className="text-white text-xs font-black">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-zinc-300 text-xs text-center truncate w-full">@{seller.id}</p>
                  <button onClick={() => toggleFollow(seller.id)}
                    className={cn('w-full py-1 rounded-lg text-xs font-bold transition-all',
                      isFollowing(seller.id) ? 'border border-zinc-600 text-zinc-400' : 'bg-red-500 text-white')}>
                    {isFollowing(seller.id) ? '✓' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
