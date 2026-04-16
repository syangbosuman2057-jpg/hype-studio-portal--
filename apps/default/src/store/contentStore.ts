import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PostType = 'video' | 'photo';
export type PostRole = 'customer' | 'seller';

export interface TaggedProduct {
  id: string;
  name: string;
  price: number;
  x: number; // % position on image/video
  y: number;
}

export interface Post {
  id: string;
  authorId: string;      // username
  authorName: string;
  authorAvatar: string;
  authorVerified: boolean;
  role: PostRole;
  type: PostType;
  thumbnailIdx: number;  // index for getVideoBackground / getProductImage
  caption: string;
  hashtags: string[];
  music?: string;        // music name
  location?: string;     // shop/area name
  shopTag?: string;      // "@seller" tag from customer
  // Seller-only
  productName?: string;
  productPrice?: number;
  productBrand?: string;
  productDescription?: string;
  productCategory?: string;
  taggedProducts?: TaggedProduct[];
  // Stats
  likes: number;
  comments: number;
  shares: number;
  views: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  likes: number;
  createdAt: string;
}

// ─── Seed content ─────────────────────────────────────────────────────────────

const SEED_POSTS: Post[] = [
  {
    id: 'post-1', authorId: 'priya_fashion', authorName: 'Priya Sharma', authorAvatar: '', authorVerified: true,
    role: 'seller', type: 'video', thumbnailIdx: 1,
    caption: 'New Pashmina collection just dropped! 🔥 Quality you can feel, style you can show 😍',
    hashtags: ['#NepaliFashion', '#Pashmina', '#EthnicWear', '#KathmanduStyle'],
    music: 'Resham Firiri - Classic', location: 'New Road, Kathmandu',
    productName: 'Premium Pashmina Shawl', productPrice: 3500, productBrand: 'Priya Crafts',
    productCategory: 'fashion', productDescription: 'Handwoven premium pashmina from Mustang',
    taggedProducts: [{ id: 'tp-1', name: 'Pashmina Shawl', price: 3500, x: 40, y: 60 }],
    likes: 12400, comments: 342, shares: 891, views: 94000, createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'post-2', authorId: 'bikash_foods', authorName: 'Bikash Maharjan', authorAvatar: '', authorVerified: true,
    role: 'seller', type: 'video', thumbnailIdx: 2,
    caption: 'Authentic Newari Samay Baji kit — everything you need in one box! 🍛🥢',
    hashtags: ['#NewariFood', '#SamayBaji', '#MadeInNepal', '#AuthenticTaste'],
    music: 'Traditional Newari Dhimay', location: 'Bhaktapur, Nepal',
    productName: 'Samay Baji Complete Kit', productPrice: 1200, productBrand: 'Bikash Kitchen',
    productCategory: 'food', productDescription: 'Authentic Newari spice kit with recipe guide',
    likes: 8900, comments: 201, shares: 445, views: 67000, createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'post-3', authorId: 'arun_bkt', authorName: 'Arun Karki', authorAvatar: '', authorVerified: false,
    role: 'customer', type: 'video', thumbnailIdx: 3,
    caption: 'Just got this amazing Dhaka topi from @priya_fashion — perfect for Dashain! 🎉🇳🇵',
    hashtags: ['#DhakaTopi', '#Dashain2025', '#BoughtFromNepalese'],
    music: 'Dashain Thali Beat', shopTag: '@priya_fashion', location: 'Pokhara',
    likes: 3200, comments: 89, shares: 156, views: 24000, createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'post-4', authorId: 'sita_crafts', authorName: 'Sita Tamang', authorAvatar: '', authorVerified: true,
    role: 'seller', type: 'photo', thumbnailIdx: 0,
    caption: 'Handpainted Thangka — 3 months of work 🎨✨ Each piece is unique and tells a story',
    hashtags: ['#Thangka', '#BuddhistArt', '#HandmadeNepal', '#ArtFromNepal'],
    music: 'Tibetan Bowl Meditation', location: 'Boudha, Kathmandu',
    productName: 'Thangka Buddha Painting', productPrice: 8500, productBrand: 'Sita Art Studio',
    productCategory: 'crafts', productDescription: 'Hand-painted traditional Thangka, 24x18 inches',
    likes: 5600, comments: 178, shares: 312, views: 42000, createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'post-5', authorId: 'ram_ktm', authorName: 'Ram Sharma', authorAvatar: '', authorVerified: false,
    role: 'customer', type: 'video', thumbnailIdx: 4,
    caption: 'Street food tour in Thamel! Momo from @bikash_foods is 🔥🔥🔥',
    hashtags: ['#ThamelStreetFood', '#MomoLovers', '#KathmanduEats', '#NepalFood'],
    music: 'Trending Nepali Beat 2025', shopTag: '@bikash_foods', location: 'Thamel, Kathmandu',
    likes: 2100, comments: 67, shares: 89, views: 18000, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'post-6', authorId: 'priya_fashion', authorName: 'Priya Sharma', authorAvatar: '', authorVerified: true,
    role: 'seller', type: 'video', thumbnailIdx: 0,
    caption: 'Behind the scenes — how we make our Dhaka fabric 🧵 #MadeWithLove',
    hashtags: ['#DhakaFabric', '#MadeInNepal', '#TextileArt', '#BehindTheScenes'],
    music: 'Resham Firiri Remix', location: 'Patan, Kathmandu',
    productName: 'Dhaka Fabric Roll 2m', productPrice: 850, productBrand: 'Priya Crafts',
    productCategory: 'fashion',
    likes: 7800, comments: 223, shares: 567, views: 58000, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const SEED_COMMENTS: Comment[] = [
  { id: 'c1', postId: 'post-1', authorId: 'sima_pok', authorName: 'Sima Poudel', authorAvatar: '', text: 'This is so beautiful! Is it available in blue? 💙', likes: 12, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'c2', postId: 'post-1', authorId: 'ram_ktm', authorName: 'Ram Sharma', authorAvatar: '', text: 'Dami chha! Ordering one for my mom 🙏', likes: 8, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'c3', postId: 'post-2', authorId: 'anita_dhk', authorName: 'Anita Shrestha', authorAvatar: '', text: 'This reminds me of my grandmother\'s cooking! 😍', likes: 24, createdAt: new Date(Date.now() - 3600000 * 6).toISOString() },
  { id: 'c4', postId: 'post-3', authorId: 'priya_fashion', authorName: 'Priya Sharma', authorAvatar: '', text: 'Thank you for showing off our topi! You look amazing 🙏❤️', likes: 45, createdAt: new Date(Date.now() - 3600000 * 10).toISOString() },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface ContentState {
  posts: Post[];
  comments: Comment[];
  likedPostIds: Set<string>;
  savedPostIds: Set<string>;
  followingIds: Set<string>;

  // Posts
  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'shares' | 'views' | 'createdAt'>) => string;
  getPostById: (id: string) => Post | null;
  getPostsByUser: (userId: string) => Post[];
  getFeedPosts: () => Post[];

  // Social
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (userId: string) => void;
  isLiked: (postId: string) => boolean;
  isSaved: (postId: string) => boolean;
  isFollowing: (userId: string) => boolean;
  incrementView: (postId: string) => void;
  incrementShare: (postId: string) => void;

  // Comments
  addComment: (postId: string, authorId: string, authorName: string, text: string) => void;
  getComments: (postId: string) => Comment[];
}

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      posts: SEED_POSTS,
      comments: SEED_COMMENTS,
      likedPostIds: new Set<string>(),
      savedPostIds: new Set<string>(),
      followingIds: new Set<string>(['priya_fashion', 'bikash_foods']),

      addPost: (data) => {
        const id = `post-${Date.now()}`;
        const post: Post = {
          ...data,
          id,
          likes: 0, comments: 0, shares: 0, views: 1,
          createdAt: new Date().toISOString(),
        };
        set(s => ({ posts: [post, ...s.posts] }));
        return id;
      },

      getPostById: (id) => get().posts.find(p => p.id === id) ?? null,
      getPostsByUser: (uid) => get().posts.filter(p => p.authorId === uid),
      getFeedPosts: () => [...get().posts].sort((a, b) => b.views - a.views),

      toggleLike: (postId) => {
        const liked = new Set(get().likedPostIds);
        const wasLiked = liked.has(postId);
        if (wasLiked) liked.delete(postId); else liked.add(postId);
        set(s => ({
          likedPostIds: liked,
          posts: s.posts.map(p => p.id === postId
            ? { ...p, likes: wasLiked ? p.likes - 1 : p.likes + 1 }
            : p
          ),
        }));
      },

      toggleSave: (postId) => {
        const saved = new Set(get().savedPostIds);
        if (saved.has(postId)) saved.delete(postId); else saved.add(postId);
        set({ savedPostIds: saved });
      },

      toggleFollow: (userId) => {
        const following = new Set(get().followingIds);
        if (following.has(userId)) following.delete(userId); else following.add(userId);
        set({ followingIds: following });
      },

      isLiked:     (postId)  => get().likedPostIds.has(postId),
      isSaved:     (postId)  => get().savedPostIds.has(postId),
      isFollowing: (userId)  => get().followingIds.has(userId),

      incrementView: (postId) => set(s => ({
        posts: s.posts.map(p => p.id === postId ? { ...p, views: p.views + 1 } : p),
      })),

      incrementShare: (postId) => set(s => ({
        posts: s.posts.map(p => p.id === postId ? { ...p, shares: p.shares + 1 } : p),
      })),

      addComment: (postId, authorId, authorName, text) => {
        const comment: Comment = {
          id: `c-${Date.now()}`, postId, authorId, authorName,
          authorAvatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=${authorId}`,
          text, likes: 0, createdAt: new Date().toISOString(),
        };
        set(s => ({
          comments: [comment, ...s.comments],
          posts: s.posts.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p),
        }));
      },

      getComments: (postId) => get().comments.filter(c => c.postId === postId),
    }),
    {
      name: 'nepalese-hype-content',
      // Sets can't be persisted directly — serialize/deserialize
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          if (parsed?.state) {
            parsed.state.likedPostIds = new Set(parsed.state.likedPostIds ?? []);
            parsed.state.savedPostIds = new Set(parsed.state.savedPostIds ?? []);
            parsed.state.followingIds = new Set(parsed.state.followingIds ?? []);
          }
          return parsed;
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              likedPostIds: [...value.state.likedPostIds],
              savedPostIds: [...value.state.savedPostIds],
              followingIds: [...value.state.followingIds],
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
