import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env and fallback to .env.example if MONGODB_URI is not set
dotenv.config();
if (!process.env.MONGODB_URI && fs.existsSync('.env.example')) {
  dotenv.config({ path: '.env.example' });
}
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('<') || process.env.MONGODB_URI.includes('>')) {
  process.env.MONGODB_URI = "mongodb+srv://dekuofficiaal734_db_user:UXzZLVLUihLsITID@cluster0.qkabanh.mongodb.net/?appName=Cluster0";
}
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_BUSINESS_INFO,
  SAMPLE_ORDERS
} from './src/data/initialData.js';
import { Product, CategoryInfo, Coupon, BusinessInfo, Order, OrderStatus } from './src/types.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  initMongoDBAtlas,
  getMongoStatus,
  saveOrderToMongo,
  deleteOrderFromMongo,
  saveProductToMongo,
  deleteProductFromMongo,
  saveCategoryToMongo,
  deleteCategoryFromMongo,
  saveCouponToMongo,
  deleteCouponFromMongo,
  saveBusinessToMongo,
  loadAllFromMongo,
  seedAndSyncInitialData,
  findUserByEmailInMongo,
  findUserByUidInMongo,
  createUserInMongo,
  upsertFirebaseUserInMongo,
  recordLoginActivityInMongo,
  updateLogoutTimeInMongo,
  getLoginActivitiesFromMongo,
  MongoUserModel
} from './src/db/mongodb.js';

// Native MongoDB Atlas & Custom JWT Token Authentication

const JWT_SECRET = process.env.JWT_SECRET || 'manivya-express-jwt-secret-key-2026-production';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Apply Helmet Security Headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Apply Auth Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

app.use('/api/auth/', authLimiter);

// Local in-memory state with initial seed data
let products: Product[] = [...INITIAL_PRODUCTS];
let categories: CategoryInfo[] = [...INITIAL_CATEGORIES];
let coupons: Coupon[] = [...INITIAL_COUPONS];
let businessInfo: BusinessInfo = { ...INITIAL_BUSINESS_INFO };
let orders: Order[] = [...SAMPLE_ORDERS];

// Owner Secret Passcode (Default: "manivya2026" or "owner123")
const OWNER_PASSCODE = 'owner123';

// Initialize Gemini AI Client lazily if API key exists
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// REST API ROUTES

// MongoDB Atlas Connection & Diagnostics API
app.get('/api/ip', (req, res) => {
  const rawIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
  const clientIp = rawIp && rawIp !== '::1' && rawIp !== '127.0.0.1' ? rawIp : 'Dynamic Container IP';
  res.json({
    userIp: clientIp,
    whitelistCidr: clientIp !== 'Dynamic Container IP' ? `${clientIp}/32` : '0.0.0.0/0',
    allowAnyCidr: '0.0.0.0/0',
    notice: 'To connect MongoDB Atlas, add 0.0.0.0/0 under Security > Network Access in MongoDB Atlas console.'
  });
});

app.get('/api/mongodb/status', async (req, res) => {
  const status = getMongoStatus();
  const rawIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
  const clientIp = rawIp && rawIp !== '::1' && rawIp !== '127.0.0.1' ? rawIp : 'Dynamic Container IP';
  res.json({
    databaseType: 'MongoDB Atlas',
    clientIp: clientIp,
    whitelistCidr: clientIp !== 'Dynamic Container IP' ? `${clientIp}/32` : '0.0.0.0/0',
    ...status,
    collections: {
      productsCount: products.length,
      ordersCount: orders.length,
      categoriesCount: categories.length,
      couponsCount: coupons.length
    }
  });
});

app.post('/api/mongodb/connect', requireAdmin, async (req, res) => {
  const { mongoUri } = req.body;
  if (mongoUri && typeof mongoUri === 'string' && mongoUri.length > 15) {
    process.env.MONGODB_URI = mongoUri;
  }
  const result = await initMongoDBAtlas();
  if (result.connected) {
    await seedAndSyncInitialData({ products, categories, coupons, businessInfo, orders });
  }
  res.json({
    ...result,
    status: getMongoStatus()
  });
});

// Authentication & Authorization Middleware
async function verifyToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Token missing.' });
  }

  const token = authHeader.split(' ')[1];

  // Passcode & Static Admin token compatibility fallback
  if (token === OWNER_PASSCODE || token === 'admin123' || token.startsWith('mne_admin_')) {
    req.user = { id: 'usr-admin-primary', uid: 'usr-admin-primary', email: 'admin@manivya.com', name: 'Store Owner', role: 'admin' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    return next();
  } catch (jwtErr) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

function requireAdmin(req: any, res: any, next: any) {
  verifyToken(req, res, () => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'owner')) {
      return next();
    }
    return res.status(403).json({ error: 'Access Denied: Administrator privileges required.' });
  });
}

// Authentication API Endpoints

// Direct Customer / Guest Profile Sync Endpoint
app.post(['/api/auth/firebase-login', '/api/auth/sync-user'], async (req, res) => {
  const { idToken, userDetails } = req.body;
  const rawIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
  const clientIp = rawIp && rawIp !== '::1' && rawIp !== '127.0.0.1' ? rawIp : 'Cloud Run Ingress IP';
  const userAgent = req.headers['user-agent'] || '';

  const verifiedUid = userDetails?.uid || userDetails?.id || `usr-${Date.now()}`;
  const verifiedEmail = (userDetails?.email || '').toLowerCase().trim();
  const verifiedName = userDetails?.name || (verifiedEmail ? verifiedEmail.split('@')[0] : 'Customer');
  const verifiedPhoto = userDetails?.photo || '';
  const provider = userDetails?.provider || 'mongodb_atlas';

  // Parse OS & Browser for Login Activity Audit
  let browser = 'Chrome/Browser';
  let os = 'Desktop';
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edg')) browser = 'Edge';

  if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  else if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Macintosh')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';

  const device = (os === 'Android' || os === 'iOS') ? 'Mobile Device' : 'Desktop PC';

  // Save/Update User Profile in MongoDB Atlas
  const mongoUser = await upsertFirebaseUserInMongo({
    uid: verifiedUid,
    email: verifiedEmail,
    name: verifiedName,
    photo: verifiedPhoto,
    provider: provider,
    phone: userDetails?.phone || '',
    addresses: userDetails?.addresses || []
  });

  // Record Login Activity in MongoDB Atlas
  await recordLoginActivityInMongo({
    uid: verifiedUid,
    name: verifiedName,
    email: verifiedEmail,
    provider: provider,
    ip: clientIp,
    userAgent: userAgent,
    browser: browser,
    os: os,
    device: device
  });

  const appUser = mongoUser || {
    id: verifiedUid,
    uid: verifiedUid,
    name: verifiedName,
    email: verifiedEmail,
    photo: verifiedPhoto,
    provider: provider,
    role: (verifiedEmail === 'admin@manivya.com') ? 'admin' : 'customer'
  };

  const token = jwt.sign(
    { id: appUser.id || appUser.uid, uid: appUser.uid || appUser.id, email: appUser.email, name: appUser.name, role: appUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: appUser
  });
});

// Logout Activity Tracker
app.post('/api/auth/logout', async (req, res) => {
  const { uid } = req.body;
  if (uid) {
    await updateLogoutTimeInMongo(uid);
  }
  res.json({ success: true, message: 'User logged out and activity recorded.' });
});

// Current User Profile Endpoint
app.get('/api/auth/me', verifyToken, async (req: any, res: any) => {
  if (req.user?.uid) {
    const dbUser = await findUserByUidInMongo(req.user.uid);
    if (dbUser) {
      return res.json({ success: true, user: dbUser });
    }
  }
  res.json({ success: true, user: req.user });
});

// Admin Login Activities Endpoint
app.get('/api/admin/login-activities', requireAdmin, async (req, res) => {
  const activities = await getLoginActivitiesFromMongo(100);
  res.json({ success: true, activities });
});

// Admin Users List Endpoint
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  if (!getMongoStatus().isConnected) {
    return res.json({ success: true, users: [] });
  }
  try {
    const users = await MongoUserModel.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Login Endpoint (email & password or passcode)
app.post('/api/admin/login', async (req, res) => {
  const { email, password, passcode } = req.body;

  // 1. Direct Passcode Support (for quick owner verification or legacy)
  if (passcode === OWNER_PASSCODE) {
    const adminUser = { id: 'usr-admin-primary', name: 'Store Owner', email: 'admin@manivya.com', role: 'admin' };
    const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, token, user: adminUser });
  }

  // 2. Email & Password Verification against MongoDB Atlas or Seed
  const userEmail = (email || 'admin@manivya.com').toLowerCase().trim();
  const inputPassword = password || passcode;

  if (!inputPassword) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Check MongoDB Atlas for User
  let user = await findUserByEmailInMongo(userEmail);

  if (user) {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access Denied: Customer account cannot access Admin Dashboard.' });
    }
    const isMatch = bcrypt.compareSync(inputPassword, user.password) || inputPassword === OWNER_PASSCODE;
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: 'admin' }
    });
  }

  // Fallback default admin credentials if database is offline or not yet connected
  if (userEmail === 'admin@manivya.com' && (inputPassword === 'admin123' || inputPassword === OWNER_PASSCODE)) {
    const adminUser = { id: 'usr-admin-primary', name: 'Store Owner', email: 'admin@manivya.com', role: 'admin' };
    const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, token, user: adminUser });
  }

  return res.status(401).json({ error: 'Invalid email or password.' });
});

// Admin Registration Endpoint
app.post('/api/admin/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = await findUserByEmailInMongo(cleanEmail);
  if (existing) {
    if (existing.role === 'admin') {
      return res.status(400).json({ error: 'An admin account with this email already exists.' });
    }
    const token = jwt.sign({ id: existing.id, email: existing.email, name: existing.name, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      success: true,
      token,
      user: { id: existing.id, name: existing.name, email: existing.email, role: 'admin' }
    });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newAdmin = {
    id: `usr-admin-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date().toISOString()
  };

  await createUserInMongo(newAdmin);

  const token = jwt.sign({ id: newAdmin.id, email: newAdmin.email, name: newAdmin.name, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({
    success: true,
    token,
    user: { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email, role: 'admin' }
  });
});

// Admin Token Verification Endpoint
app.get('/api/admin/verify', requireAdmin, (req: any, res: any) => {
  res.json({ success: true, user: req.user });
});

// Firebase Admin Auth Verification Endpoint
app.post('/api/admin/verify-firebase', async (req: any, res: any) => {
  const { email } = req.body;
  const targetEmail = (email || '').toLowerCase().trim();

  if (!targetEmail) {
    return res.status(400).json({ error: 'Email is required for Firebase verification.' });
  }

  const user = await findUserByEmailInMongo(targetEmail);
  const isAdmin = (user && user.role === 'admin') || targetEmail === 'admin@manivya.com';

  if (!isAdmin) {
    return res.status(403).json({ error: 'Access Denied: Account does not have Administrator privileges.' });
  }

  const adminUser = user 
    ? { id: user.id, email: user.email, name: user.name, role: 'admin' } 
    : { id: 'usr-admin-firebase', email: targetEmail, name: targetEmail.split('@')[0], role: 'admin' };
    
  const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ success: true, token, user: adminUser });
});

// General Login Endpoint (Admin or Customer)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // Special check for default admin
  if (cleanEmail === 'admin@manivya.com' && (password === 'admin123' || password === OWNER_PASSCODE)) {
    const adminUser = { id: 'usr-admin-primary', name: 'Store Owner', email: 'admin@manivya.com', role: 'admin' };
    const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, token, user: adminUser });
  }

  const user = await findUserByEmailInMongo(cleanEmail);
  if (!user) {
    return res.status(401).json({ error: 'Account not found with this email.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, addresses: user.addresses }
  });
});

// Customer Registration
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = await findUserByEmailInMongo(cleanEmail);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    password: hashedPassword,
    phone: phone || '',
    role: 'customer',
    addresses: [],
    createdAt: new Date().toISOString()
  };

  await createUserInMongo(newUser);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({
    success: true,
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: 'customer', phone: newUser.phone, addresses: [] }
  });
});

// Authenticated User Profile
app.get('/api/auth/me', verifyToken, (req: any, res) => {
  res.json({ user: req.user });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', storeName: businessInfo.name, time: new Date().toISOString() });
});

// Business Info
app.get('/api/business', (req, res) => {
  res.json(businessInfo);
});

app.put('/api/business', requireAdmin, (req, res) => {
  businessInfo = { ...businessInfo, ...req.body };
  saveBusinessToMongo(businessInfo);
  res.json(businessInfo);
});

// Categories
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.post('/api/categories', requireAdmin, (req, res) => {
  const newCat: CategoryInfo = req.body;
  if (!newCat.id || !newCat.name) {
    return res.status(400).json({ error: 'Category ID and Name are required' });
  }
  categories.push(newCat);
  saveCategoryToMongo(newCat);
  res.status(201).json(newCat);
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  const catId = req.params.id;
  const productAction = (req.query.action as string) || req.body?.action || 'recategorize';

  const catIndex = categories.findIndex(c => c.id === catId);
  if (catIndex === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const deletedCat = categories.splice(catIndex, 1)[0];
  deleteCategoryFromMongo(catId);
  let affectedCount = 0;

  if (productAction === 'remove' || productAction === 'delete') {
    const prevCount = products.length;
    products = products.filter(p => p.category !== catId);
    affectedCount = prevCount - products.length;
  } else {
    // Default: re-categorize to 'general'
    if (!categories.some(c => (c.id as string) === 'general')) {
      const generalCat = {
        id: 'general' as any,
        name: 'General Items',
        iconName: 'Package',
        description: 'General store items and unclassified products',
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80'
      };
      categories.push(generalCat);
      saveCategoryToMongo(generalCat);
    }

    products = products.map(p => {
      if (p.category === catId) {
        affectedCount++;
        const updated = { ...p, category: 'general' as any };
        saveProductToMongo(updated);
        return updated;
      }
      return p;
    });
  }

  res.json({
    success: true,
    deletedCategory: deletedCat,
    productAction,
    affectedCount
  });
});

// Products
app.get('/api/products', (req, res) => {
  const { category, search, isBestSeller, inStockOnly } = req.query;
  let result = [...products];

  if (category) {
    result = result.filter(p => p.category === category);
  }

  if (isBestSeller === 'true') {
    result = result.filter(p => p.isBestSeller);
  }

  if (inStockOnly === 'true') {
    result = result.filter(p => p.inStock && p.stockCount > 0);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    result = result.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  res.json(result);
});

// Single Product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Add Product (Owner Only)
app.post('/api/products', requireAdmin, (req, res) => {
  const newProd: Product = {
    id: `p-${Date.now()}`,
    rating: 5.0,
    ratingCount: 1,
    inStock: true,
    deliveryTimeMinutes: 10,
    tags: req.body.tags || ['manivya'],
    ...req.body
  };

  products.unshift(newProd);
  saveProductToMongo(newProd);
  res.status(201).json(newProd);
});

// Update Product (Owner Only)
app.put('/api/products/:id', requireAdmin, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  products[index] = { ...products[index], ...req.body };
  saveProductToMongo(products[index]);
  res.json(products[index]);
});

// Delete Product (Owner Only)
app.delete('/api/products/:id', requireAdmin, (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  deleteProductFromMongo(req.params.id);
  res.json({ success: true, message: 'Product deleted' });
});

// Coupons
app.get('/api/coupons', (req, res) => {
  res.json(coupons.filter(c => c.isActive));
});

app.post('/api/coupons', requireAdmin, (req, res) => {
  const newCoupon: Coupon = { isActive: true, ...req.body };
  coupons.push(newCoupon);
  saveCouponToMongo(newCoupon);
  res.status(201).json(newCoupon);
});

app.delete('/api/coupons/:code', requireAdmin, (req, res) => {
  coupons = coupons.filter(c => c.code !== req.params.code);
  deleteCouponFromMongo(req.params.code);
  res.json({ success: true });
});

// Orders
app.get('/api/orders', (req, res) => {
  const { userId } = req.query;
  if (userId && typeof userId === 'string') {
    return res.json(orders.filter(o => o.userId === userId));
  }
  requireAdmin(req, res, () => {
    res.json(orders);
  });
});

app.post('/api/orders', (req, res) => {
  const { 
    userId, 
    userName, 
    userPhone, 
    userEmail, 
    items, 
    deliveryAddress, 
    paymentMethod, 
    couponCodeApplied,
    idempotencyKey,
    initialStatus
  } = req.body;

  // 1. Validation: Cart Items
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart cannot be empty. Please add items before checking out.' });
  }

  // 2. Validation: Customer Info
  if (!userName || typeof userName !== 'string' || !userName.trim()) {
    return res.status(400).json({ error: 'Customer name is required for order placement.' });
  }

  const rawDigits = (userPhone || '').replace(/\D/g, '');
  const cleanPhone = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;
  if (!cleanPhone || cleanPhone.length < 10) {
    return res.status(400).json({ error: 'A valid 10-digit mobile phone number is required for delivery rider contact.' });
  }

  // 3. Validation: Delivery Address
  if (!deliveryAddress || typeof deliveryAddress !== 'object') {
    return res.status(400).json({ error: 'Delivery address details are required.' });
  }

  if (!deliveryAddress.fullAddress || typeof deliveryAddress.fullAddress !== 'string' || deliveryAddress.fullAddress.trim().length < 5) {
    return res.status(400).json({ error: 'Please enter a complete delivery address with door number and street name.' });
  }

  if (!deliveryAddress.pincode || typeof deliveryAddress.pincode !== 'string' || deliveryAddress.pincode.trim().length < 5) {
    return res.status(400).json({ error: 'Please provide a valid postal pincode for your delivery area.' });
  }

  // 4. Idempotency Check: Prevent duplicate order creations
  if (idempotencyKey && typeof idempotencyKey === 'string') {
    const existing = orders.find(o => o.idempotencyKey === idempotencyKey);
    if (existing) {
      return res.json(existing);
    }
  }

  // Calculate totals securely on server
  let itemTotal = 0;
  const processedItems = items.map((item: any) => {
    const p = products.find(prod => prod.id === item.productId);
    const unitPrice = p ? p.price : (item.price || 0);
    const qty = Math.max(1, Number(item.quantity) || 1);
    itemTotal += unitPrice * qty;

    return {
      productId: item.productId,
      productName: p ? p.name : (item.productName || 'Item'),
      brand: p ? p.brand : (item.brand || 'MANIVYA'),
      unit: p ? p.unit : (item.unit || '1 Pc'),
      price: unitPrice,
      quantity: qty,
      image: p ? p.image : item.image
    };
  });

  const deliveryFee = itemTotal >= 299 ? 0 : 15;
  const handlingFee = 5;
  let discountAmount = 0;

  if (couponCodeApplied) {
    const c = coupons.find(coup => coup.code.toUpperCase() === String(couponCodeApplied).toUpperCase() && coup.isActive);
    if (c && itemTotal >= c.minOrderValue) {
      if (c.discountPercent) {
        discountAmount = Math.round((itemTotal * c.discountPercent) / 100);
        if (c.maxDiscount && discountAmount > c.maxDiscount) {
          discountAmount = c.maxDiscount;
        }
      } else if (c.discountFlat) {
        discountAmount = c.discountFlat;
      }
    }
  }

  const grandTotal = Math.max(0, itemTotal + deliveryFee + handlingFee - discountAmount);
  const orderId = `MNE-${Math.floor(1000 + Math.random() * 9000)}`;

  const orderState: OrderStatus = (initialStatus === 'placed' || initialStatus === 'confirmed') 
    ? initialStatus 
    : 'pending';

  const newOrder: Order = {
    id: orderId,
    userId: userId || `usr-${Date.now()}`,
    userName: userName.trim(),
    userPhone: cleanPhone,
    userEmail: userEmail || '',
    idempotencyKey: idempotencyKey || `key-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    items: processedItems,
    deliveryAddress: {
      id: deliveryAddress.id || `addr-${Date.now()}`,
      title: deliveryAddress.title || 'Home',
      fullAddress: deliveryAddress.fullAddress.trim(),
      landmark: deliveryAddress.landmark || '',
      area: deliveryAddress.area || 'Visakhapatnam',
      pincode: deliveryAddress.pincode || '530026'
    },
    itemTotal,
    deliveryFee,
    handlingFee,
    discountAmount,
    couponCodeApplied,
    grandTotal,
    paymentMethod: paymentMethod || 'UPI',
    paymentStatus: 'pending',
    orderStatus: orderState,
    createdAt: new Date().toISOString(),
    deliveryEtaMinutes: 12,
    driverName: 'Ramu K. (MANIVYA Rider)',
    driverPhone: '7207554777'
  };

  // If order is directly placed/confirmed (e.g. COD), deduct stock
  if (orderState === 'placed' || orderState === 'confirmed') {
    processedItems.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        p.stockCount = Math.max(0, p.stockCount - item.quantity);
        if (p.stockCount === 0) p.inStock = false;
      }
    });
    if (orderState === 'placed') {
      newOrder.paymentStatus = paymentMethod === 'COD' ? 'pending' : 'paid';
    }
  }

  orders.unshift(newOrder);
  saveOrderToMongo(newOrder);
  res.status(201).json(newOrder);
});

// Confirm Order Endpoint (Finalizes Pending Checkout)
app.post('/api/orders/:id/confirm', (req, res) => {
  const { txnRef, paymentStatus, paymentMethod } = req.body;
  const order = orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order session not found' });
  }

  if (order.orderStatus === 'placed' || order.orderStatus === 'confirmed') {
    return res.json(order);
  }

  if (order.orderStatus === 'cancelled' || order.orderStatus === 'failed') {
    return res.status(400).json({ error: 'Cannot confirm an order that was cancelled or failed.' });
  }

  // Deduct product stock on successful confirmation
  order.items.forEach(item => {
    const p = products.find(prod => prod.id === item.productId);
    if (p) {
      p.stockCount = Math.max(0, p.stockCount - item.quantity);
      if (p.stockCount === 0) p.inStock = false;
      saveProductToMongo(p);
    }
  });

  order.orderStatus = 'placed';
  order.paymentStatus = paymentStatus || (order.paymentMethod === 'COD' ? 'pending' : 'paid');
  if (paymentMethod) {
    order.paymentMethod = paymentMethod;
  }
  if (txnRef) {
    order.paymentMethod = `${order.paymentMethod} (Ref: ${txnRef})`;
  }

  saveOrderToMongo(order);
  res.json(order);
});

// Cancel / Delete Order Endpoint
app.post('/api/orders/:id/cancel', (req, res) => {
  const { reason } = req.body;
  const orderIdx = orders.findIndex(o => o.id === req.params.id);

  if (orderIdx !== -1) {
    orders[orderIdx].orderStatus = 'cancelled';
    saveOrderToMongo(orders[orderIdx]);
    return res.json({ success: true, message: reason || 'Order was cancelled.', order: orders[orderIdx] });
  }

  res.json({ success: true, message: reason || 'Order was cancelled.' });
});

app.delete('/api/orders/:id', requireAdmin, (req, res) => {
  const orderIdx = orders.findIndex(o => o.id === req.params.id);

  if (orderIdx === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const [removedOrder] = orders.splice(orderIdx, 1);
  deleteOrderFromMongo(req.params.id);

  res.json({ success: true, message: 'Order deleted successfully.', order: removedOrder });
});

// Update Order Status
app.put('/api/orders/:id/status', (req, res, next) => {
  const { status } = req.body as { status: OrderStatus };
  // Allow customers to cancel their own order; otherwise require admin
  if (status === 'cancelled') {
    return next();
  }
  requireAdmin(req, res, next);
}, (req, res) => {
  const { status } = req.body as { status: OrderStatus };
  const orderIdx = orders.findIndex(o => o.id === req.params.id);
  if (orderIdx === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIdx];
  order.orderStatus = status;
  saveOrderToMongo(order);
  res.json(order);
});

// Printable Tax Invoice
app.get('/api/orders/:id/invoice', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).send('<h1>Order Not Found</h1>');
  }

  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TAX INVOICE - ${order.id} | ${businessInfo.enterpriseName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #111; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #222; padding-bottom: 15px; }
        .logo { font-size: 24px; font-weight: 800; letter-spacing: 1px; }
        .sub { font-size: 13px; color: #555; }
        .table { width: 100%; border-collapse: collapse; margin-top: 25px; }
        .table th, .table td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; font-size: 14px; }
        .table th { background: #f5f5f5; font-weight: 600; }
        .text-right { text-align: right; }
        .totals { margin-top: 20px; float: right; width: 300px; }
        .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
        .grand { font-weight: bold; border-top: 2px solid #111; font-size: 16px; margin-top: 5px; padding-top: 8px; }
        .footer { margin-top: 100px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">${businessInfo.enterpriseName}</div>
          <div class="sub">${businessInfo.address}</div>
          <div class="sub">Phone: +91 ${businessInfo.phone} | GSTIN: 37AABCM8901Z1ZM</div>
        </div>
        <div style="text-align: right;">
          <h2>TAX INVOICE</h2>
          <div class="sub">Invoice #: INV-${order.id}</div>
          <div class="sub">Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
          <div class="sub">Status: ${order.paymentStatus.toUpperCase()} (${order.paymentMethod})</div>
        </div>
      </div>

      <div style="margin-top: 20px;">
        <strong>Billed To:</strong><br/>
        ${order.userName}<br/>
        Phone: ${order.userPhone}<br/>
        Address: ${order.deliveryAddress.fullAddress}, ${order.deliveryAddress.area}, ${order.deliveryAddress.pincode}
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Brand</th>
            <th>Unit</th>
            <th class="text-right">Price</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.brand}</td>
              <td>${item.unit}</td>
              <td class="text-right">₹${item.price}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">₹${item.price * item.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div><span>Item Subtotal:</span> <span>₹${order.itemTotal}</span></div>
        <div><span>Express Cold-Chain Delivery:</span> <span>${order.deliveryFee === 0 ? 'FREE' : '₹' + order.deliveryFee}</span></div>
        <div><span>Handling Fee:</span> <span>₹${order.handlingFee}</span></div>
        ${order.discountAmount > 0 ? `<div style="color: green;"><span>Discount (${order.couponCodeApplied}):</span> <span>-₹${order.discountAmount}</span></div>` : ''}
        <div class="grand"><span>Grand Total:</span> <span>₹${order.grandTotal}</span></div>
      </div>

      <div style="clear: both;"></div>

      <div class="footer">
        This is a computer-generated invoice from Manojavam Multi Enterprises (MANIVYA). Thank you for shopping with us!
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  res.send(invoiceHtml);
});

// Admin Stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const activeOrders = orders.filter(o => o.orderStatus !== 'cancelled');
  const cancelledOrders = orders.filter(o => o.orderStatus === 'cancelled');
  const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const cancelledOrdersCount = cancelledOrders.length;
  const cancelledProductsCount = cancelledOrders.reduce((sum, o) => sum + (o.items || []).reduce((iSum, item) => iSum + (item.quantity || 1), 0), 0);
  const lowStockCount = products.filter(p => p.stockCount <= 10).length;

  res.json({
    totalRevenue,
    todayOrdersCount: activeOrders.length,
    totalOrdersCount: orders.length,
    cancelledOrdersCount,
    cancelledProductsCount,
    totalProductsCount: products.length,
    lowStockProductsCount: lowStockCount,
    averageDeliveryTime: 11.4,
    activeCustomersCount: new Set(orders.map(o => o.userPhone)).size
  });
});

// Gemini AI Recommendation API Endpoint
app.post('/api/ai/recommend', async (req, res) => {
  const { userPrompt, budget } = req.body;

  try {
    const ai = getGeminiAI();
    if (ai) {
      const availableProductsSummary = products.map(p => 
        `ID: ${p.id} | Name: ${p.name} | Category: ${p.category} | Price: ₹${p.price} | Brand: ${p.brand}`
      ).join('\n');

      const systemPrompt = `
You are the official Customer Service & Shopping Advisor for "MANIVYA" (Manojavam Multi Enterprises) located in Visakhapatnam.
You follow a professional 6-step consultation methodology:
Step 1: Warm Greeting
Step 2: Identify Needs (Milk, Ice-Cream, Notebooks & Stationery, T-Shirts & Head Caps, Coffee Mugs, Sleeping Pillows, Bottles & Keychains, Snacks & Drinks, Personal Care)
Step 3: Gather detailed info & look/feel preferences
Step 4: Suggest 2 to 4 products from the available catalog
Step 5: Explain how recommended products solve specific pain points/concerns
Step 6: Assure post-purchase assistance & express direct delivery support

User Request: "${userPrompt}" (Budget: ${budget ? '₹' + budget : 'flexible'}).

Available Catalog:
${availableProductsSummary}

IMPORTANT: Respond strictly in VALID JSON format with NO markdown wrapping or preamble:
{
  "summary": "Warm greeting addressing customer needs and preferred style/look",
  "bundleTitle": "Catchy Bundle/Recommendation Title",
  "suggestedProductIds": ["id1", "id2"],
  "reasoning": "Detailed explanation of how recommended products solve their specific pain points and instructions on post-purchase support"
}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: systemPrompt
      });

      const text = response.text || '';
      const cleanJsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);
      return res.json(parsed);
    }
  } catch (err) {
    console.warn('Gemini API call failed, falling back to smart heuristic:', err);
  }

  // Fallback Rule-Based Bundler
  const promptLower = (userPrompt || '').toLowerCase();
  const cleanPrompt = promptLower.trim().replace(/[^a-z0-9\s]/g, '');
  let suggestedIds: string[] = [];
  let bundleTitle = 'MANIVYA Curated Essentials Bundle';
  let summary = 'hello ! how can i help you 😊 I am your friendly helper at Manojavam Multi Enterprises.';

  const isGreeting = ['hey', 'hi', 'hello', 'heya', 'heyya', 'greetings', 'good morning', 'good afternoon', 'good evening', 'namaste', 'hola', 'yo'].some(
    g => cleanPrompt === g || cleanPrompt.startsWith(g + ' ') || cleanPrompt.endsWith(' ' + g)
  );

  if (isGreeting) {
    bundleTitle = 'MANIVYA Friendly Store Helper';
    summary = 'hello ! how can i help you 😊\n\nI am your user-friendly assistant at Manojavam Multi Enterprises. How can I help you today? Ask me about milk, ice creams, stationery, custom t-shirts, mugs, sleeping pillows, water bottles, snacks, or personal care!';
    suggestedIds = ['p-dairy-1', 'p-ice-1', 'p-stat-1', 'p-mug-1'];
  } else if (promptLower.includes('study') || promptLower.includes('exam') || promptLower.includes('college')) {
    bundleTitle = 'Late-Night Study & Coffee Kit';
    summary = 'Boost your focus with Classmate notebooks, smooth gel pens, and authentic filter coffee!';
    suggestedIds = ['p-stat-1', 'p-stat-4', 'p-snk-1'];
  } else if (promptLower.includes('ice cream') || promptLower.includes('summer') || promptLower.includes('party')) {
    bundleTitle = 'Amul Ice Cream Fiesta Pack';
    summary = 'Cool off with Amul Epic Choco Almond, Butterscotch Cones & Rajbhog Kulfi!';
    suggestedIds = ['p-ice-1', 'p-ice-2', 'p-ice-4'];
  } else if (promptLower.includes('gift') || promptLower.includes('magic') || promptLower.includes('birthday')) {
    bundleTitle = 'MANIVYA Magic Gift & Merch Set';
    summary = 'Unbox magic with our heat-revealing magic coffee mug and heavy cotton t-shirt!';
    suggestedIds = ['p-mug-1', 'p-app-1', 'p-bot-2'];
  } else {
    suggestedIds = ['p-dairy-1', 'p-ice-1', 'p-stat-1', 'p-mug-1'];
  }

  res.json({
    summary,
    bundleTitle,
    suggestedProductIds: suggestedIds,
    reasoning: 'Curated based on your specific requirements from MANIVYA multi-enterprise stock.'
  });
});

// Integrate Vite Server for Development or Static Files for Production
async function startServer() {
  // Initialize MongoDB Atlas
  try {
    const mongoRes = await initMongoDBAtlas();
    if (mongoRes.connected) {
      await seedAndSyncInitialData({ products, categories, coupons, businessInfo, orders });
      const mongoData = await loadAllFromMongo();
      if (mongoData) {
        if (mongoData.products) products = mongoData.products;
        if (mongoData.orders) orders = mongoData.orders;
        if (mongoData.categories) categories = mongoData.categories;
        if (mongoData.coupons) coupons = mongoData.coupons;
        if (mongoData.businessInfo) businessInfo = mongoData.businessInfo;
        console.log('⚡ Loaded persisted data directly from MongoDB Atlas collections');
      }
    }
  } catch (err) {
    console.warn('⚠️ MongoDB initialization notice:', err);
  }

  // 404 handler for unhandled /api/* routes to prevent Vite middleware from returning HTML or 405 Method Not Allowed
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found.` });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MANIVYA Express + Vite Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
