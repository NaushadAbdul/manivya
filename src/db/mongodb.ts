import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Product, Order, CategoryInfo, Coupon, BusinessInfo } from '../types';

// Mongoose Schemas for MongoDB Atlas
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  addresses: Array,
  createdAt: { type: String, required: true }
}, { timestamps: true });

const ProductSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String },
  brand: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  unit: { type: String, required: true },
  inStock: { type: Boolean, default: true },
  stockCount: { type: Number, default: 10 },
  isBestSeller: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isDealOfTheDay: { type: Boolean, default: false },
  rating: { type: Number, default: 4.5 },
  ratingCount: { type: Number, default: 12 },
  image: { type: String, required: true },
  description: { type: String, required: true },
  deliveryTimeMinutes: { type: Number, default: 10 },
  tags: [{ type: String }]
}, { timestamps: true });

const OrderSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  userEmail: { type: String },
  idempotencyKey: { type: String },
  items: Array,
  deliveryAddress: Object,
  itemTotal: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  handlingFee: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  couponCodeApplied: { type: String },
  grandTotal: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  orderStatus: { type: String, required: true },
  createdAt: { type: String, required: true },
  deliveryEtaMinutes: { type: Number, default: 12 },
  driverName: { type: String },
  driverPhone: { type: String }
}, { timestamps: true });

const CategorySchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  iconName: { type: String, required: true },
  badge: { type: String },
  description: { type: String, required: true },
  image: { type: String, required: true }
}, { timestamps: true });

const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true },
  discountPercent: { type: Number },
  discountFlat: { type: Number },
  minOrderValue: { type: Number, required: true },
  maxDiscount: { type: Number },
  description: { type: String, required: true },
  expiresAt: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const BusinessInfoSchema = new Schema({
  name: { type: String, required: true },
  enterpriseName: { type: String, required: true },
  category: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  rating: { type: Number, required: true },
  totalReviews: { type: Number, required: true },
  isOpen: { type: Boolean, required: true },
  deliveryNotice: { type: String, required: true },
  bannerTitle: { type: String, required: true },
  bannerSubtitle: { type: String, required: true }
}, { timestamps: true });

export const MongoUserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const MongoProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const MongoOrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export const MongoCategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);
export const MongoCouponModel = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
export const MongoBusinessModel = mongoose.models.BusinessInfo || mongoose.model('BusinessInfo', BusinessInfoSchema);

let isConnected = false;
let connectionError: string | null = null;

export async function initMongoDBAtlas() {
  const uri = process.env.MONGODB_URI;

  const isPlaceholder = !uri || 
    uri.includes('username:password') || 
    uri.includes('example.mongodb.net') || 
    uri.includes('<username>') || 
    uri.includes('<password>') || 
    uri.length < 15;

  if (isPlaceholder) {
    console.log('ℹ️ MongoDB Atlas: MONGODB_URI is not configured or is using default placeholder. Running in high-performance in-memory mode.');
    isConnected = false;
    connectionError = 'MONGODB_URI not configured. Please enter your MongoDB Atlas URI in Admin Dashboard or environment variables.';
    return {
      connected: false,
      reason: connectionError
    };
  }

  try {
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      connectionError = null;
      return { connected: true };
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    connectionError = null;
    console.log('✅ MongoDB Atlas connected successfully!');
    return { connected: true };
  } catch (err: any) {
    isConnected = false;
    let rawMsg = err.message || 'Failed to connect to MongoDB Atlas';
    
    if (rawMsg.includes("IP that isn't whitelisted") || rawMsg.includes("Could not connect to any servers") || rawMsg.includes("selection timeout")) {
      connectionError = 'IP Whitelist Blocked: MongoDB Atlas requires adding 0.0.0.0/0 (Allow Access from Anywhere) in Network Access to accept connections from Cloud Run containers.';
    } else if (rawMsg.toLowerCase().includes("bad auth") || rawMsg.toLowerCase().includes("authentication failed")) {
      connectionError = 'Authentication Failed: The database username or password in your MONGODB_URI is incorrect or expired. Please check your Atlas Database User credentials in MongoDB Atlas console.';
    } else {
      connectionError = rawMsg;
    }

    console.warn('⚠️ MongoDB Atlas Connection Notice:', connectionError);
    return { connected: false, reason: connectionError };
  }
}

export function getMongoStatus() {
  const uri = process.env.MONGODB_URI;
  const isPlaceholder = !uri || 
    uri.includes('username:password') || 
    uri.includes('example.mongodb.net') || 
    uri.includes('<username>') || 
    uri.includes('<password>') || 
    uri.length < 15;

  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    connectionError,
    uriConfigured: !isPlaceholder
  };
}

export async function saveOrderToMongo(order: Order) {
  if (!isConnected) return;
  try {
    await (MongoOrderModel as any).findOneAndUpdate({ id: order.id }, order, { upsert: true, new: true });
  } catch (err) {
    console.warn('⚠️ MongoDB save order warning:', err);
  }
}

export async function deleteOrderFromMongo(orderId: string) {
  if (!isConnected) return;
  try {
    await (MongoOrderModel as any).deleteOne({ id: orderId });
  } catch (err) {
    console.warn('⚠️ MongoDB delete order warning:', err);
  }
}

export async function saveProductToMongo(product: Product) {
  if (!isConnected) return;
  try {
    await (MongoProductModel as any).findOneAndUpdate({ id: product.id }, product, { upsert: true, new: true });
  } catch (err) {
    console.warn('⚠️ MongoDB save product warning:', err);
  }
}

export async function saveBusinessToMongo(info: BusinessInfo) {
  if (!isConnected) return;
  try {
    await (MongoBusinessModel as any).findOneAndUpdate({}, info, { upsert: true, new: true });
  } catch (err) {
    console.warn('⚠️ MongoDB save business info warning:', err);
  }
}

export async function loadAllFromMongo() {
  if (!isConnected) return null;
  try {
    const products = await (MongoProductModel as any).find({}).lean();
    const orders = await (MongoOrderModel as any).find({}).sort({ createdAt: -1 }).lean();
    const categories = await (MongoCategoryModel as any).find({}).lean();
    const coupons = await (MongoCouponModel as any).find({}).lean();
    const businessArr = await (MongoBusinessModel as any).find({}).lean();

    return {
      products: products.length > 0 ? (products as unknown as Product[]) : null,
      orders: orders.length > 0 ? (orders as unknown as Order[]) : null,
      categories: categories.length > 0 ? (categories as unknown as CategoryInfo[]) : null,
      coupons: coupons.length > 0 ? (coupons as unknown as Coupon[]) : null,
      businessInfo: businessArr.length > 0 ? (businessArr[0] as unknown as BusinessInfo) : null
    };
  } catch (err) {
    console.warn('⚠️ MongoDB loadAll error:', err);
    return null;
  }
}

export async function seedAndSyncInitialData(initial: {
  products: Product[];
  categories: CategoryInfo[];
  coupons: Coupon[];
  businessInfo: BusinessInfo;
  orders: Order[];
}) {
  if (!isConnected) return;
  try {
    const productCount = await (MongoProductModel as any).countDocuments();
    if (productCount === 0 && initial.products.length > 0) {
      await (MongoProductModel as any).insertMany(initial.products);
      console.log('📦 MongoDB Atlas: Seeded initial products');
    }

    const orderCount = await (MongoOrderModel as any).countDocuments();
    if (orderCount === 0 && initial.orders.length > 0) {
      await (MongoOrderModel as any).insertMany(initial.orders);
      console.log('📦 MongoDB Atlas: Seeded initial orders');
    }

    const categoryCount = await (MongoCategoryModel as any).countDocuments();
    if (categoryCount === 0 && initial.categories.length > 0) {
      await (MongoCategoryModel as any).insertMany(initial.categories);
      console.log('📦 MongoDB Atlas: Seeded initial categories');
    }

    const couponCount = await (MongoCouponModel as any).countDocuments();
    if (couponCount === 0 && initial.coupons.length > 0) {
      await (MongoCouponModel as any).insertMany(initial.coupons);
      console.log('📦 MongoDB Atlas: Seeded initial coupons');
    }

    const businessCount = await (MongoBusinessModel as any).countDocuments();
    if (businessCount === 0 && initial.businessInfo) {
      await (MongoBusinessModel as any).create(initial.businessInfo);
      console.log('📦 MongoDB Atlas: Seeded initial business info');
    }

    // Seed default admin user in MongoDB Atlas if none exists
    const adminCount = await (MongoUserModel as any).countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await (MongoUserModel as any).create({
        id: 'usr-admin-primary',
        name: 'Store Owner',
        email: 'admin@manivya.com',
        password: hashedPassword,
        phone: '7207554777',
        role: 'admin',
        addresses: [],
        createdAt: new Date().toISOString()
      });
      console.log('🔐 MongoDB Atlas: Seeded default admin account (admin@manivya.com)');
    }
  } catch (err) {
    console.warn('⚠️ MongoDB Atlas Seeding warning:', err);
  }
}

export async function findUserByEmailInMongo(email: string) {
  if (!isConnected) return null;
  try {
    return await (MongoUserModel as any).findOne({ email: email.toLowerCase().trim() }).lean();
  } catch (err) {
    console.warn('⚠️ MongoDB findUserByEmail error:', err);
    return null;
  }
}

export async function createUserInMongo(userData: any) {
  if (!isConnected) return null;
  try {
    return await (MongoUserModel as any).create(userData);
  } catch (err) {
    console.warn('⚠️ MongoDB createUser error:', err);
    return null;
  }
}

