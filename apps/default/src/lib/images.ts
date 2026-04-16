// Map product/video categories to beautiful Unsplash images
const CATEGORY_IMAGES: Record<string, string[]> = {
  beauty: [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
    'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&q=80',
  ],
  electronics: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80',
  ],
  jewelry: [
    'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&q=80',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80',
  ],
  fashion: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
  ],
  food: [
    'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
    'https://images.unsplash.com/photo-1576867757603-05b134ebc379?w=400&q=80',
    'https://images.unsplash.com/photo-1596560548464-f010a7d4a571?w=400&q=80',
  ],
  crafts: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
    'https://images.unsplash.com/photo-1606744824163-985d376605aa?w=400&q=80',
    'https://images.unsplash.com/photo-1526566661780-1a67ea3c863e?w=400&q=80',
  ],
  travel: [
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=80',
    'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=400&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
    'https://images.unsplash.com/photo-1569650150395-58b9e4d50d6b?w=400&q=80',
  ],
  lifestyle: [
    'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=400&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80',
  ],
  tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80',
  ],
  accessories: [
    'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80',
  ],
  home: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80',
  ],
};

// Video thumbnails (portrait, phone-style)
const VIDEO_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=700&q=80&fit=crop',
  'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=700&q=80&fit=crop',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=700&q=80&fit=crop',
  'https://images.unsplash.com/photo-1606744824163-985d376605aa?w=400&h=700&q=80&fit=crop',
  'https://images.unsplash.com/photo-1576867757603-05b134ebc379?w=400&h=700&q=80&fit=crop',
  'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=400&h=700&q=80&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=700&q=80&fit=crop',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=700&q=80&fit=crop',
];

export function getProductImage(category: string, index = 0): string {
  const imgs = CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES.fashion;
  return imgs[index % imgs.length];
}

export function getVideoBackground(index: number): string {
  return VIDEO_BACKGROUNDS[index % VIDEO_BACKGROUNDS.length];
}

export function getSellerAvatar(username: string): string {
  return `https://api.dicebear.com/8.x/avataaars/svg?seed=${username}`;
}

export function formatNPR(amount: number): string {
  return `रू ${amount.toLocaleString('en-NP')}`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
