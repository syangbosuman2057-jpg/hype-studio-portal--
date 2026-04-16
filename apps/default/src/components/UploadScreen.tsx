import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Camera, Music, MapPin, Tag, DollarSign, Hash, FileText,
  Package, Sparkles, CheckCircle, ChevronRight, Store, X, Plus,
  Sliders, Zap, Star, Globe, Image,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useContentStore } from '../store/contentStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useNotifStore } from '../store/notifStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'fashion',     label: 'Fashion',     emoji: '👗' },
  { id: 'food',        label: 'Food',         emoji: '🍛' },
  { id: 'crafts',      label: 'Crafts',       emoji: '🎨' },
  { id: 'accessories', label: 'Accessories',  emoji: '💎' },
  { id: 'home',        label: 'Home',         emoji: '🏠' },
  { id: 'beauty',      label: 'Beauty',       emoji: '💄' },
  { id: 'electronics', label: 'Electronics',  emoji: '📱' },
];

const MUSIC_LIBRARY = [
  { id: 'm1', name: 'Resham Firiri — Classic',   duration: '3:12', genre: 'Traditional' },
  { id: 'm2', name: 'Trending Nepali Beat 2025', duration: '2:45', genre: 'Pop'         },
  { id: 'm3', name: 'Dashain Thali Beat',        duration: '4:01', genre: 'Festival'    },
  { id: 'm4', name: 'Tibetan Bowl Meditation',   duration: '5:30', genre: 'Spiritual'   },
  { id: 'm5', name: 'Newari Dhimay Rhythm',      duration: '3:55', genre: 'Traditional' },
  { id: 'm6', name: 'Smooth Lofi Study',         duration: '2:58', genre: 'Lofi'        },
  { id: 'm7', name: 'Energetic Promo Beat',      duration: '1:30', genre: 'Promo'       },
  { id: 'm8', name: 'No Music',                  duration: '—',    genre: 'None'        },
];

const VIDEO_FILTERS = [
  { id: 'none',      name: 'Original',   style: '' },
  { id: 'warm',      name: 'Warm',       style: 'sepia(0.4) saturate(1.3)' },
  { id: 'cool',      name: 'Cool',       style: 'hue-rotate(30deg) saturate(0.9)' },
  { id: 'vivid',     name: 'Vivid',      style: 'saturate(1.8) contrast(1.1)' },
  { id: 'fade',      name: 'Fade',       style: 'opacity(0.85) brightness(1.1)' },
  { id: 'dramatic',  name: 'Dramatic',   style: 'contrast(1.4) saturate(0.7)' },
];

const LOCATIONS = [
  'Kathmandu', 'Thamel, Kathmandu', 'New Road, Kathmandu', 'Pokhara',
  'Bhaktapur', 'Patan', 'Boudha', 'Chitwan', 'Butwal', 'Biratnagar', 'Mustang',
];

type UploadStep = 'type' | 'media' | 'details' | 'music' | 'filters' | 'preview';
type MediaType = 'video' | 'photo';

// ─── Component ────────────────────────────────────────────────────────────────

export default function UploadScreen() {
  const { user } = useAuthStore();
  const { addPost } = useContentStore();
  const { isActive } = useSubscriptionStore();
  const { addNotif } = useNotifStore();
  const isSeller = user?.role === 'seller';

  const [step, setStep]               = useState<UploadStep>('type');
  const [mediaType, setMediaType]     = useState<MediaType>('video');
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [selectedMusic, setSelectedMusic]   = useState(MUSIC_LIBRARY[0]);
  const [publishing, setPublishing]   = useState(false);
  const [published, setPublished]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [caption, setCaption]         = useState('');
  const [hashtags, setHashtags]       = useState('');
  const [location, setLocation]       = useState('');
  const [shopTag, setShopTag]         = useState('');   // customer: "bought from"
  // Seller-only
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productCategory, setProductCategory] = useState('fashion');
  const [productDesc, setProductDesc] = useState('');
  const [stock, setStock]             = useState('10');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
    setStep('details');
  }

  function handlePublish() {
    if (isSeller && !productName.trim()) { toast.error('Product name is required'); return; }
    if (!caption.trim()) { toast.error('Add a caption'); return; }
    setPublishing(true);

    setTimeout(() => {
      const hashArr = hashtags.split(/[\s,#]+/).filter(Boolean).map(h => `#${h}`);
      addPost({
        authorId:    user?.username ?? 'guest',
        authorName:  user?.username ?? 'Guest',
        authorAvatar: user?.avatar ?? '',
        authorVerified: user?.verified ?? false,
        role:        user?.role ?? 'customer',
        type:        mediaType,
        thumbnailIdx: Math.floor(Math.random() * 5),
        caption,
        hashtags:    hashArr,
        music:       selectedMusic.id !== 'm8' ? selectedMusic.name : undefined,
        location:    location || undefined,
        shopTag:     !isSeller ? (shopTag || undefined) : undefined,
        productName: isSeller ? (productName || undefined) : undefined,
        productPrice: isSeller ? (parseFloat(productPrice) || undefined) : undefined,
        productBrand: isSeller ? (productBrand || undefined) : undefined,
        productCategory: isSeller ? productCategory : undefined,
        productDescription: isSeller ? (productDesc || undefined) : undefined,
      });
      addNotif({ type: 'like', emoji: '📤', title: 'Content Published!', body: `Your ${mediaType} is now live on Nepalese Hype.` });
      setPublishing(false);
      setPublished(true);
    }, 2000);
  }

  function handleReset() {
    setStep('type'); setMediaPreview(''); setCaption(''); setHashtags('');
    setLocation(''); setShopTag(''); setProductName(''); setProductPrice('');
    setProductBrand(''); setProductDesc(''); setStock('10');
    setSelectedFilter('none'); setSelectedMusic(MUSIC_LIBRARY[0]);
    setPublished(false);
  }

  // ── Success screen
  if (published) {
    return (
      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
        <motion.div animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.6 }}>
          <div className="w-24 h-24 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-white font-black text-2xl mb-2">
            {mediaType === 'video' ? '🎬 Video Published!' : '📸 Photo Posted!'}
          </h2>
          <p className="text-zinc-400 text-sm mb-2">Your content is now live on Nepalese Hype 🇳🇵</p>
          {isSeller && productName && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 mb-6 mt-4">
              <p className="text-zinc-400 text-xs">Product tagged</p>
              <p className="text-white font-bold">{productName}</p>
              <p className="text-red-400 font-black">रू {parseFloat(productPrice || '0').toLocaleString()}</p>
            </div>
          )}
          <button onClick={handleReset} className="w-full py-4 bg-red-500 text-white font-black rounded-2xl mt-6">
            Upload Another ➕
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header with steps — padded for floating top bar */}
      <div className="bg-zinc-950 px-4 pt-[104px] pb-3 border-b border-zinc-900 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-white font-bold text-xl">📤 Create</h1>
          {step !== 'type' && (
            <button onClick={() => setStep('type')} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {/* Step indicators */}
        {step !== 'type' && (
          <div className="flex gap-1.5">
            {(['media', 'details', 'music', 'filters'] as UploadStep[]).map((s, i) => {
              const steps: UploadStep[] = ['media', 'details', 'music', 'filters'];
              const currentIdx = steps.indexOf(step);
              const sIdx = i;
              return (
                <div key={s} className={cn(
                  'h-1 rounded-full flex-1 transition-all',
                  sIdx <= currentIdx ? 'bg-red-500' : 'bg-zinc-800'
                )} />
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none pb-28">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: TYPE ──────────────────────────────────────────────── */}
          {step === 'type' && (
            <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4 pb-8">
              {/* Role badge */}
              <div className={cn(
                'flex items-center gap-3 rounded-2xl p-4 border',
                isSeller ? 'bg-red-950/30 border-red-500/30' : 'bg-blue-950/30 border-blue-500/30'
              )}>
                <span className="text-2xl">{isSeller ? '🛒' : '👤'}</span>
                <div>
                  <p className="text-white font-bold">{isSeller ? 'Seller Mode' : 'Customer Mode'}</p>
                  <p className="text-zinc-500 text-xs">
                    {isSeller
                      ? 'You can add product pricing and sell items'
                      : 'You can share content and tag sellers'}
                  </p>
                </div>
              </div>

              {/* Content type */}
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">What are you creating?</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'video' as MediaType, emoji: '🎬', label: 'Short Video', sub: 'Vertical video up to 60s' },
                  { type: 'photo' as MediaType, emoji: '📸', label: 'Photo Post',  sub: 'Single or multiple photos' },
                ].map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => { setMediaType(opt.type); setStep('media'); }}
                    className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 text-left active:scale-[0.97] transition-all"
                  >
                    <span className="text-4xl block mb-3">{opt.emoji}</span>
                    <p className="text-white font-bold">{opt.label}</p>
                    <p className="text-zinc-500 text-xs mt-1">{opt.sub}</p>
                  </button>
                ))}
              </div>

              {/* Seller capabilities preview */}
              {isSeller && (
                <div className="bg-gradient-to-br from-red-900/30 to-zinc-900 border border-red-500/20 rounded-2xl p-4">
                  <p className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" /> Seller Features Available
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: '💰', label: 'Add product price' },
                      { icon: '🏷️', label: 'Tag products in video' },
                      { icon: '🏪', label: 'Add brand & shop' },
                      { icon: '📦', label: 'Manage stock' },
                    ].map(f => (
                      <div key={f.label} className="flex items-center gap-2 text-xs text-zinc-300">
                        <span>{f.icon}</span> {f.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isSeller && (
                <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-4">
                  <p className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" /> Customer Upload Features
                  </p>
                  <div className="space-y-1.5">
                    {['Share videos and photos', 'Add captions & hashtags', 'Tag a shop/seller', 'Add music & filters'].map(f => (
                      <p key={f} className="text-zinc-400 text-xs flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-400" /> {f}
                      </p>
                    ))}
                    <p className="text-zinc-600 text-xs flex items-center gap-2 mt-2">
                      <X className="w-3 h-3 text-red-500" /> Cannot add pricing or sell products
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: MEDIA ─────────────────────────────────────────────── */}
          {step === 'media' && (
            <motion.div key="media" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 space-y-4 pb-8">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Upload {mediaType === 'video' ? 'Video' : 'Photo'}
              </p>
              <input ref={fileRef} type="file" accept={mediaType === 'video' ? 'video/*' : 'image/*'} className="hidden" onChange={handleFileChange} />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-3xl border-2 border-dashed border-zinc-700 hover:border-red-500/60 bg-zinc-900 transition-all py-16 flex flex-col items-center gap-4 active:scale-[0.98]"
              >
                <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center">
                  {mediaType === 'video' ? <Video className="w-10 h-10 text-zinc-500" /> : <Image className="w-10 h-10 text-zinc-500" />}
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">Tap to select {mediaType}</p>
                  <p className="text-zinc-500 text-sm mt-1">
                    {mediaType === 'video' ? 'MP4, MOV, AVI — up to 60s' : 'JPG, PNG, HEIC'}
                  </p>
                </div>
                <div className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm">
                  Browse Files
                </div>
              </button>

              {/* Demo skip */}
              <button
                onClick={() => { setMediaPreview('demo'); setStep('details'); }}
                className="w-full py-3 border border-zinc-700 text-zinc-500 rounded-2xl text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ⚡ Skip — Continue without media (Demo)
              </button>
            </motion.div>
          )}

          {/* ── STEP 3: DETAILS ───────────────────────────────────────────── */}
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 space-y-4 pb-8">

              {/* Media preview thumbnail */}
              {mediaPreview && mediaPreview !== 'demo' && (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-zinc-900">
                  {mediaType === 'photo'
                    ? <img src={mediaPreview} className="w-full h-full object-cover" style={{ filter: VIDEO_FILTERS.find(f => f.id === selectedFilter)?.style }} />
                    : <video src={mediaPreview} className="w-full h-full object-cover" style={{ filter: VIDEO_FILTERS.find(f => f.id === selectedFilter)?.style }} />
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="text-zinc-400 text-xs font-semibold block mb-1.5">Caption <span className="text-red-400">*</span></label>
                <div className="bg-zinc-900 border border-zinc-700 focus-within:border-red-500 rounded-2xl px-4 py-3 transition-colors">
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder={isSeller ? "Describe your product, tell your story... 🇳🇵" : "Share your experience... 🎉"}
                    rows={3}
                    maxLength={500}
                    className="w-full bg-transparent text-white placeholder-zinc-500 outline-none text-sm resize-none"
                  />
                  <p className="text-zinc-700 text-xs text-right">{caption.length}/500</p>
                </div>
              </div>

              {/* Hashtags */}
              <FieldRow icon={<Hash className="w-4 h-4" />} label="Hashtags" value={hashtags} onChange={setHashtags}
                placeholder="#NepaliFashion #MadeInNepal #Trending" />

              {/* Location */}
              <div>
                <label className="text-zinc-400 text-xs font-semibold block mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Location
                </label>
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  {LOCATIONS.slice(0, 6).map(loc => (
                    <button key={loc} onClick={() => setLocation(loc === location ? '' : loc)}
                      className={cn('flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                        location === loc ? 'bg-red-500 border-red-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      )}>
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* CUSTOMER: Shop tag */}
              {!isSeller && (
                <FieldRow icon={<Store className="w-4 h-4" />} label='Tag a Shop (e.g. "Bought from @priya_fashion")'
                  value={shopTag} onChange={setShopTag} placeholder="@seller_username" />
              )}

              {/* SELLER: Product fields */}
              {isSeller && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 py-2 border-b border-zinc-800">
                    <Package className="w-4 h-4 text-red-400" />
                    <p className="text-white font-bold text-sm">Product Details</p>
                  </div>

                  <FieldRow icon={<Package className="w-4 h-4" />} label="Product Name *" value={productName} onChange={setProductName} placeholder="e.g. Premium Pashmina Shawl" />
                  <FieldRow icon={<DollarSign className="w-4 h-4" />} label="Price (NPR) *" value={productPrice} onChange={setProductPrice} placeholder="e.g. 3500" type="number" />
                  <FieldRow icon={<Star className="w-4 h-4" />} label="Brand Name" value={productBrand} onChange={setProductBrand} placeholder="e.g. Priya Crafts" />
                  <FieldRow icon={<Tag className="w-4 h-4" />} label="Stock Quantity" value={stock} onChange={setStock} placeholder="e.g. 10" type="number" />

                  {/* Category */}
                  <div>
                    <label className="text-zinc-400 text-xs font-semibold block mb-1.5">Category</label>
                    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                      {CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setProductCategory(cat.id)}
                          className={cn('flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                            productCategory === cat.id ? 'bg-red-500 border-red-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          )}>
                          {cat.emoji} {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Product description */}
                  <div>
                    <label className="text-zinc-400 text-xs font-semibold block mb-1.5 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Product Description
                    </label>
                    <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)}
                      placeholder="Materials, size, shipping info, care instructions..."
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 text-white placeholder-zinc-500 rounded-2xl px-4 py-3 text-sm outline-none resize-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep('music')} className="flex-1 py-3.5 bg-zinc-900 border border-zinc-700 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2">
                  <Music className="w-4 h-4" /> Add Music
                </button>
                <button onClick={() => setStep('filters')} className="flex-1 py-3.5 bg-zinc-900 border border-zinc-700 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2">
                  <Sliders className="w-4 h-4" /> Filters
                </button>
              </div>

              <button onClick={handlePublish} disabled={publishing}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 disabled:opacity-50 active:scale-[0.98] transition-all">
                {publishing ? <><span className="animate-spin">⟳</span> Publishing...</> : <><Zap className="w-5 h-5" /> Publish Now</>}
              </button>
            </motion.div>
          )}

          {/* ── STEP 4: MUSIC ─────────────────────────────────────────────── */}
          {step === 'music' && (
            <motion.div key="music" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 pb-8 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-bold text-lg">🎵 Music Library</p>
                <button onClick={() => setStep('details')} className="text-red-400 text-sm font-semibold">Done</button>
              </div>
              {MUSIC_LIBRARY.map((track, i) => (
                <motion.button key={track.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => { setSelectedMusic(track); setStep('details'); }}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left',
                    selectedMusic.id === track.id ? 'bg-red-500/15 border-red-500/40' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                  )}>
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                    selectedMusic.id === track.id ? 'bg-red-500' : 'bg-zinc-800')}>
                    <Music className={cn('w-6 h-6', selectedMusic.id === track.id ? 'text-white' : 'text-zinc-500')} />
                  </div>
                  <div className="flex-1">
                    <p className={cn('font-semibold text-sm', selectedMusic.id === track.id ? 'text-white' : 'text-zinc-300')}>{track.name}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{track.genre} · {track.duration}</p>
                  </div>
                  {selectedMusic.id === track.id && <CheckCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* ── STEP 5: FILTERS ───────────────────────────────────────────── */}
          {step === 'filters' && (
            <motion.div key="filters" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 pb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-bold text-lg">✨ Filters</p>
                <button onClick={() => setStep('details')} className="text-red-400 text-sm font-semibold">Done</button>
              </div>

              {/* Filter preview */}
              <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-zinc-900 mb-4">
                <img
                  src={mediaPreview && mediaPreview !== 'demo'
                    ? mediaPreview
                    : 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=400&q=80'}
                  className="w-full h-full object-cover transition-all duration-500"
                  style={{ filter: VIDEO_FILTERS.find(f => f.id === selectedFilter)?.style }}
                />
                <div className="absolute bottom-2 left-2 bg-black/60 px-2.5 py-1 rounded-lg text-white text-xs font-bold">
                  {VIDEO_FILTERS.find(f => f.id === selectedFilter)?.name}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {VIDEO_FILTERS.map(filter => (
                  <button key={filter.id} onClick={() => setSelectedFilter(filter.id)}
                    className={cn('relative rounded-xl overflow-hidden border-2 transition-all',
                      selectedFilter === filter.id ? 'border-red-500' : 'border-zinc-800')}>
                    <img
                      src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=200&q=60"
                      className="w-full aspect-square object-cover"
                      style={{ filter: filter.style }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center">
                      <p className="text-white text-xs font-semibold">{filter.name}</p>
                    </div>
                    {selectedFilter === filter.id && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

function FieldRow({ icon, label, value, onChange, placeholder, type = 'text' }: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-zinc-400 text-xs font-semibold block mb-1.5 flex items-center gap-1">
        <span className="text-zinc-500">{icon}</span> {label}
      </label>
      <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder}
        className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 text-white placeholder-zinc-500 rounded-2xl px-4 py-3 text-sm outline-none transition-colors" />
    </div>
  );
}
