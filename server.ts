import express from 'express';
import path from 'path';
import fs from 'fs';
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

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', storeName: businessInfo.name, time: new Date().toISOString() });
});

// Business Info
app.get('/api/business', (req, res) => {
  res.json(businessInfo);
});

app.put('/api/business', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${OWNER_PASSCODE}`) {
    return res.status(401).json({ error: 'Unauthorized: Owner access required' });
  }
  businessInfo = { ...businessInfo, ...req.body };
  res.json(businessInfo);
});

// Categories
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${OWNER_PASSCODE}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const newCat: CategoryInfo = req.body;
  if (!newCat.id || !newCat.name) {
    return res.status(400).json({ error: 'Category ID and Name are required' });
  }
  categories.push(newCat);
  res.status(201).json(newCat);
});

app.delete('/api/categories/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${OWNER_PASSCODE}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const catId = req.params.id;
  const productAction = (req.query.action as string) || req.body?.action || 'recategorize';

  const catIndex = categories.findIndex(c => c.id === catId);
  if (catIndex === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const deletedCat = categories.splice(catIndex, 1)[0];
  let affectedCount = 0;

  if (productAction === 'remove' || productAction === 'delete') {
    const prevCount = products.length;
    products = products.filter(p => p.category !== catId);
    affectedCount = prevCount - products.length;
  } else {
    // Default: re-categorize to 'general'
    if (!categories.some(c => (c.id as string) === 'general')) {
      categories.push({
        id: 'general' as any,
        name: 'General Items',
        iconName: 'Package',
        description: 'General store items and unclassified products',
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80'
      });
    }

    products = products.map(p => {
      if (p.category === catId) {
        affectedCount++;
        return { ...p, category: 'general' as any };
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
app.post('/api/products', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${OWNER_PASSCODE}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
  res.status(201).json(newProd);
});

// Update Product (Owner Only)
app.put('/api/products/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${OWNER_PASSCODE}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});

// Delete Product (Owner Only)
app.delete('/api/products/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${OWNER_PASSCODE}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  products = products.filter(p => p.id !== req.params.id);
  res.json({ success: true, message: 'Product deleted' });
});

// Coupons
app.get('/api/coupons', (req, res) => {
  res.json(coupons.filter(c => c.isActive));
});

app.post('/api/coupons', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${OWNER_PASSCODE}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const newCoupon: Coupon = { isActive: true, ...req.body };
  coupons.push(newCoupon);
  res.status(201).json(newCoupon);
});

app.delete('/api/coupons/:code', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${OWNER_PASSCODE}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  coupons = coupons.filter(c => c.code !== req.params.code);
  res.json({ success: true });
});

// Orders
app.get('/api/orders', (req, res) => {
  const { userId } = req.query;
  if (userId && typeof userId === 'string') {
    return res.json(orders.filter(o => o.userId === userId));
  }
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { userId, userName, userPhone, userEmail, items, deliveryAddress, paymentMethod, couponCodeApplied } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart items cannot be empty' });
  }

  // Calculate totals securely on server
  let itemTotal = 0;
  const processedItems = items.map((item: any) => {
    const p = products.find(prod => prod.id === item.productId);
    const unitPrice = p ? p.price : item.price;
    itemTotal += unitPrice * item.quantity;

    // Deduct stock
    if (p) {
      p.stockCount = Math.max(0, p.stockCount - item.quantity);
      if (p.stockCount === 0) p.inStock = false;
    }

    return {
      productId: item.productId,
      productName: p ? p.name : item.productName,
      brand: p ? p.brand : (item.brand || 'MANIVYA'),
      unit: p ? p.unit : (item.unit || '1 Pc'),
      price: unitPrice,
      quantity: item.quantity,
      image: p ? p.image : item.image
    };
  });

  const deliveryFee = itemTotal >= 299 ? 0 : 15;
  const handlingFee = 5;
  let discountAmount = 0;

  if (couponCodeApplied) {
    const c = coupons.find(coup => coup.code.toUpperCase() === couponCodeApplied.toUpperCase() && coup.isActive);
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

  const newOrder: Order = {
    id: orderId,
    userId: userId || `usr-${Date.now()}`,
    userName: userName || 'Valued Customer',
    userPhone: userPhone || '7207554777',
    userEmail: userEmail || '',
    items: processedItems,
    deliveryAddress: deliveryAddress || {
      id: 'addr-default',
      title: 'Home',
      fullAddress: '25-1-13, Gajuwaka Bypass Road, Pedagantyada',
      area: 'Gajuwaka Bypass Road',
      pincode: '530026'
    },
    itemTotal,
    deliveryFee,
    handlingFee,
    discountAmount,
    couponCodeApplied,
    grandTotal,
    paymentMethod: paymentMethod || 'UPI',
    paymentStatus: paymentMethod === 'COD' ? 'pending' : 'paid',
    orderStatus: 'placed',
    createdAt: new Date().toISOString(),
    deliveryEtaMinutes: 12,
    driverName: 'Ramu K. (MANIVYA Rider)',
    driverPhone: '7207554777'
  };

  orders.unshift(newOrder);
  res.status(201).json(newOrder);
});

// Update Order Status
app.put('/api/orders/:id/status', (req, res) => {
  const authHeader = req.headers.authorization;
  const { status } = req.body as { status: OrderStatus };

  // Customers can cancel their own order; other status updates require owner passcode
  if (status !== 'cancelled' && authHeader !== `Bearer ${OWNER_PASSCODE}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.orderStatus = status;
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

// Admin Passcode Auth
app.post('/api/admin/login', (req, res) => {
  const { passcode } = req.body;
  if (passcode === OWNER_PASSCODE) {
    return res.json({ success: true, token: OWNER_PASSCODE, role: 'owner' });
  }
  res.status(401).json({ error: 'Invalid owner security passcode' });
});

// Admin Stats
app.get('/api/admin/stats', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${OWNER_PASSCODE}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const lowStockCount = products.filter(p => p.stockCount <= 10).length;

  res.json({
    totalRevenue,
    todayOrdersCount: orders.length,
    totalProductsCount: products.length,
    lowStockProductsCount: lowStockCount,
    averageDeliveryTime: 11.4,
    activeCustomersCount: new Set(orders.map(o => o.userPhone)).size || 120
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
You are the official AI Shopping Assistant for "MANIVYA" (Manojavam Multi Enterprises) located in Visakhapatnam.
We sell Amul Dairy, Amul Ice Creams, Notebooks & Stationery, MANIVYA Custom T-Shirts, Embroidered Caps, Magic Mugs, Water Bottles, Sleeping Pillows, Snacks & Personal Care.

Goal: Analyze the user's intent: "${userPrompt}" (Budget: ${budget ? '₹' + budget : 'flexible'}).
Select 2 to 4 product IDs from the available list that form the absolute best combo/bundle for the user.

Available Catalog:
${availableProductsSummary}

IMPORTANT: Respond strictly in VALID JSON format with NO markdown wrapping or preamble:
{
  "summary": "Short 1-sentence friendly greeting and explanation",
  "bundleTitle": "Catchy Bundle Name (e.g. Study & Refreshment Combo)",
  "suggestedProductIds": ["id1", "id2"],
  "reasoning": "Brief explanation why these products fit perfectly"
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
  let suggestedIds: string[] = [];
  let bundleTitle = 'MANIVYA Curated Essentials Bundle';
  let summary = 'Here is a custom curated combination of products from our multi-enterprise store.';

  if (promptLower.includes('study') || promptLower.includes('exam') || promptLower.includes('college')) {
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
