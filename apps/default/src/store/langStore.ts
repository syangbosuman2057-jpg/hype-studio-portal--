import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'en' | 'np';

export const translations = {
  en: {
    // Nav
    home: 'Home', discover: 'Discover', shop: 'Shop', chat: 'Chat',
    profile: 'Profile', upload: 'Upload', dashboard: 'Dashboard',
    // Common
    trending: 'Trending', topSellers: 'Top Sellers', hotProducts: 'Hot Products',
    addToCart: 'Add to Cart', buyNow: 'Buy Now', follow: 'Follow',
    following: 'Following', followers: 'Followers', share: 'Share',
    like: 'Like', comment: 'Comment', search: 'Search',
    viewAll: 'View All', back: 'Back', close: 'Close',
    // Shop
    category: 'Category', price: 'Price', rating: 'Rating',
    inStock: 'In Stock', soldOut: 'Sold Out', featured: 'Featured',
    // Auth
    signIn: 'Sign In', signUp: 'Sign Up', email: 'Email',
    password: 'Password', username: 'Username', location: 'City',
    customer: 'Customer', seller: 'Seller', createAccount: 'Create Account',
    // Cart
    cart: 'Cart', checkout: 'Checkout', total: 'Total',
    quantity: 'Quantity', address: 'Delivery Address', placeOrder: 'Place Order',
    orderPlaced: 'Order Placed!', continueShopping: 'Continue Shopping',
    // Rewards
    coins: 'Coins', rewards: 'Rewards', badges: 'Badges',
    streak: 'Streak', dailyBonus: 'Daily Bonus', redeemCoins: 'Redeem Coins',
    // Delivery
    trackOrder: 'Track Order', orderStatus: 'Order Status',
    estimatedDelivery: 'Estimated Delivery', orderConfirmed: 'Order Confirmed',
    // Live
    liveNow: 'LIVE NOW', watching: 'watching', joinStream: 'Join Stream',
    // Reviews
    writeReview: 'Write a Review', reviews: 'Reviews', verified: 'Verified',
    // Search
    smartSearch: 'Smart Search', filters: 'Filters', sortBy: 'Sort By',
    // Analytics
    analytics: 'Analytics', revenue: 'Revenue', orders: 'Orders',
    views: 'Video Views', conversion: 'Conversion',
    // Misc
    language: 'Language', settings: 'Settings', logout: 'Sign Out',
    namaste: 'Namaste!', shopNepal: 'Shop Nepal 🇳🇵',
  },
  np: {
    // Nav
    home: 'गृहपृष्ठ', discover: 'खोज्नुस्', shop: 'पसल', chat: 'कुराकानी',
    profile: 'प्रोफाइल', upload: 'अपलोड', dashboard: 'ड्यासबोर्ड',
    // Common
    trending: 'ट्रेन्डिङ', topSellers: 'शीर्ष विक्रेता', hotProducts: 'लोकप्रिय उत्पादन',
    addToCart: 'कार्टमा थप्नुस्', buyNow: 'अहिले किन्नुस्', follow: 'फलो गर्नुस्',
    following: 'फलो गर्दैछु', followers: 'फलोअर', share: 'साझा गर्नुस्',
    like: 'मन पर्यो', comment: 'टिप्पणी', search: 'खोज्नुस्',
    viewAll: 'सबै हेर्नुस्', back: 'फिर्ता', close: 'बन्द गर्नुस्',
    // Shop
    category: 'श्रेणी', price: 'मूल्य', rating: 'रेटिङ',
    inStock: 'स्टकमा छ', soldOut: 'सकियो', featured: 'विशेष',
    // Auth
    signIn: 'साइन इन', signUp: 'दर्ता गर्नुस्', email: 'इमेल',
    password: 'पासवर्ड', username: 'प्रयोगकर्ता नाम', location: 'सहर',
    customer: 'ग्राहक', seller: 'विक्रेता', createAccount: 'खाता बनाउनुस्',
    // Cart
    cart: 'कार्ट', checkout: 'भुक्तानी', total: 'जम्मा',
    quantity: 'मात्रा', address: 'डेलिभरी ठेगाना', placeOrder: 'अर्डर गर्नुस्',
    orderPlaced: 'अर्डर भयो!', continueShopping: 'किनमेल जारी राख्नुस्',
    // Rewards
    coins: 'सिक्का', rewards: 'पुरस्कार', badges: 'ब्याज',
    streak: 'स्ट्रिक', dailyBonus: 'दैनिक बोनस', redeemCoins: 'सिक्का रिडिम',
    // Delivery
    trackOrder: 'अर्डर ट्र्याक', orderStatus: 'अर्डर स्थिति',
    estimatedDelivery: 'अनुमानित डेलिभरी', orderConfirmed: 'अर्डर पुष्टि',
    // Live
    liveNow: 'लाइभ', watching: 'हेर्दैछन्', joinStream: 'सामेल हुनुस्',
    // Reviews
    writeReview: 'समीक्षा लेख्नुस्', reviews: 'समीक्षाहरू', verified: 'प्रमाणित',
    // Search
    smartSearch: 'स्मार्ट खोज', filters: 'फिल्टर', sortBy: 'क्रमबद्ध गर्नुस्',
    // Analytics
    analytics: 'विश्लेषण', revenue: 'आम्दानी', orders: 'अर्डर',
    views: 'भिडियो दृश्य', conversion: 'रूपान्तरण',
    // Misc
    language: 'भाषा', settings: 'सेटिङ', logout: 'साइन आउट',
    namaste: 'नमस्ते!', shopNepal: 'नेपाल किनमेल 🇳🇵',
  },
} as const;

export type TKey = keyof typeof translations.en;

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      t: (key) => translations[get().lang][key] ?? translations.en[key],
    }),
    { name: 'nepalese-hype-lang' }
  )
);
