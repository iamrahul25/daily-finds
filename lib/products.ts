export type Product = {
  id: string;
  name: string;
  /** URL of an uploaded image (stored in Cloudflare KV, served from /images). Dummy products use `emoji` instead. */
  image?: string;
  emoji?: string;
  category: string;
  price: number;
  originalPrice: number;
  store: string;
  rating?: number;
  reviews?: number;
  tag: string;
  bg?: string;
  description: string;
  url: string;
};

export const PLATFORMS = ["Amazon", "Flipkart", "Myntra", "Meesho", "Ajio", "Nykaa"];

export const DEFAULT_BG = "#ffe6ef";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Vercel caps request bodies at 4.5 MB, and the server action body limit in next.config.ts matches. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

// Replace each "url" with your real affiliate link (Amazon Associates, Flipkart, Myntra, etc.)
export const dummyProducts: Product[] = [
  { id: "1", name: "Capybara Plushie", emoji: "🦫", category: "Plushies", price: 799, originalPrice: 1199, store: "Amazon", rating: 4.8, reviews: 2310, tag: "Bestseller", bg: "#ffe6c7", description: "Super soft 30cm capybara with a tiny orange on its head. Hypoallergenic filling, machine washable.", url: "https://example.com/aff/capybara?tag=YOURTAG" },
  { id: "2", name: "Kawaii Bunny Mug", emoji: "🐰", category: "Home", price: 349, originalPrice: 499, store: "Flipkart", rating: 4.6, reviews: 880, tag: "New", bg: "#ffe0ec", description: "Ceramic 350ml mug with a bunny-ear lid and spoon. Microwave safe.", url: "https://example.com/aff/mug?tag=YOURTAG" },
  { id: "3", name: "Pastel Gel Pen Set (24)", emoji: "🖍️", category: "Stationery", price: 249, originalPrice: 399, store: "Amazon", rating: 4.7, reviews: 1540, tag: "Deal", bg: "#e3f0ff", description: "24 pastel colours, 0.5mm tip, smooth quick-dry ink. Perfect for journaling.", url: "https://example.com/aff/pens?tag=YOURTAG" },
  { id: "4", name: "Cloud Night Lamp", emoji: "☁️", category: "Home", price: 999, originalPrice: 1499, store: "Amazon", rating: 4.5, reviews: 640, tag: "Trending", bg: "#e6e3ff", description: "Dimmable USB cloud lamp with 7 colours and a touch switch.", url: "https://example.com/aff/lamp?tag=YOURTAG" },
  { id: "5", name: "Cat Paw Phone Case", emoji: "🐱", category: "Accessories", price: 299, originalPrice: 449, store: "Myntra", rating: 4.4, reviews: 420, tag: "", bg: "#ffeacc", description: "Shockproof silicone case with a squishy paw pad on the back.", url: "https://example.com/aff/case?tag=YOURTAG" },
  { id: "6", name: "Strawberry Tote Bag", emoji: "🍓", category: "Accessories", price: 449, originalPrice: 699, store: "Flipkart", rating: 4.6, reviews: 760, tag: "Deal", bg: "#ffd9de", description: "Heavy cotton canvas tote with embroidered strawberries and an inner zip pocket.", url: "https://example.com/aff/tote?tag=YOURTAG" },
  { id: "7", name: "Mini Succulent Kit", emoji: "🌵", category: "Home", price: 399, originalPrice: 0, store: "Amazon", rating: 4.3, reviews: 310, tag: "", bg: "#dff5e1", description: "Three mini succulents in pastel pots, ready to display on your desk.", url: "https://example.com/aff/plants?tag=YOURTAG" },
  { id: "8", name: "Sticker Pack – Cute Animals", emoji: "🐼", category: "Stationery", price: 149, originalPrice: 249, store: "Amazon", rating: 4.9, reviews: 3120, tag: "Bestseller", bg: "#eeeeee", description: "100 waterproof vinyl stickers for laptops, bottles and journals.", url: "https://example.com/aff/stickers?tag=YOURTAG" },
];

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export const discount = (p: Product) =>
  p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
