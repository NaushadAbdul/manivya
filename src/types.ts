export type ProductCategory = 
  | 'dairy'
  | 'ice-creams'
  | 'stationery'
  | 'apparel-caps'
  | 'mugs-drinkware'
  | 'bottles-keychains'
  | 'pillows-home'
  | 'snacks-beverages'
  | 'personal-care';

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  iconName: string;
  badge?: string;
  description: string;
  image: string;
}

export interface ProductReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  approved: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  unit: string; // e.g. "500 ml", "1 Pack", "1 Pc", "200 Pages"
  brand: string;
  image: string;
  inStock: boolean;
  stockCount: number;
  rating: number;
  ratingCount: number;
  description: string;
  deliveryTimeMinutes: number;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isDealOfTheDay?: boolean;
  tags: string[];
  specs?: Record<string, string>;
  reviews?: ProductReview[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'owner';
  addresses: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  title: string; // 'Home', 'Office', 'Other'
  fullAddress: string;
  landmark?: string;
  area: string; // 'Gajuwaka Bypass Road', 'Pedagantyada', etc.
  pincode: string;
  isDefault?: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'placed' | 'packing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'failed';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  idempotencyKey?: string;
  items: {
    productId: string;
    productName: string;
    brand: string;
    unit: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  deliveryAddress: Address;
  itemTotal: number;
  deliveryFee: number;
  handlingFee: number;
  discountAmount: number;
  couponCodeApplied?: string;
  grandTotal: number;
  paymentMethod: 'UPI' | 'Razorpay' | 'Card' | 'COD' | string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  orderStatus: OrderStatus;
  createdAt: string;
  deliveryEtaMinutes: number;
  driverName?: string;
  driverPhone?: string;
}

export interface Coupon {
  code: string;
  discountPercent?: number;
  discountFlat?: number;
  minOrderValue: number;
  maxDiscount?: number;
  description: string;
  expiresAt: string;
  isActive: boolean;
}

export interface BusinessInfo {
  name: string;
  enterpriseName: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  totalReviews: number;
  isOpen: boolean;
  deliveryNotice: string;
  bannerTitle: string;
  bannerSubtitle: string;
}

export interface AdminStats {
  totalRevenue: number;
  todayOrdersCount: number;
  totalProductsCount: number;
  lowStockProductsCount: number;
  averageDeliveryTime: number;
  activeCustomersCount: number;
  cancelledOrdersCount?: number;
  cancelledProductsCount?: number;
}

export interface AIRecommendationRequest {
  userPrompt: string;
  budget?: number;
  occasion?: string;
}

export interface AIRecommendationResponse {
  summary: string;
  suggestedProductIds: string[];
  bundleTitle: string;
  reasoning: string;
}

export interface LocationArea {
  id: string;
  name: string;
  area: string;
  pincode: string;
  deliveryEta: string;
  isServiceable: boolean;
  lat?: number;
  lng?: number;
}
