import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ManivyaLogo } from './ManivyaLogo';
import { api } from '../services/api';
import { Product } from '../types';
import { Sparkles, X, Send, ShoppingBag, Bot, User as UserIcon, Clock, CheckCircle2, MessageSquare, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  suggestedProducts?: Product[];
}

export const AIAssistantModal: React.FC = () => {
  const { 
    isAIAssistantOpen, 
    setIsAIAssistantOpen, 
    currentUser, 
    products, 
    addToCart, 
    addToast 
  } = useStore();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Time-based greeting helper
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good morning', icon: '🌅' };
    if (hour >= 12 && hour < 17) return { text: 'Good afternoon', icon: '☀️' };
    return { text: 'Good evening', icon: '🌙' };
  };

  const greetingInfo = getTimeGreeting();
  const userName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Customer';

  // Initial greeting message in chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (isAIAssistantOpen && messages.length === 0) {
      const initialGreetingText = `${greetingInfo.text}, ${userName}! ${greetingInfo.icon} Welcome to Manojavam Multi Enterprises (MANIVYA). I am your Personal Shopping & Services Advisor.

How can I help you today? Please tell me what you're looking for:
• 🥛 Milk & Amul Dairy Products
• 🍦 Amul Ice-Creams & Frozen Treats
• 📓 Classmate Notebooks & Student Stationery
• 👕 Custom Printed T-Shirts & Embroidered Head Caps
• ☕ Magic Heat-Revealing & Ceramic Coffee Mugs
• 🛌 Ergonomic Memory Foam Sleeping Pillows
• 🧪 Stainless Steel Bottles & Keychains
• ☕ Snacks, Filter Coffee & Refreshments
• 🧼 Herbal Personal Care & Hygiene Essentials

Let me know what you need or the look & feel you are aiming for, and I will recommend the best options for you!`;
      
      setMessages([
        {
          id: 'msg-init',
          sender: 'bot',
          text: initialGreetingText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isAIAssistantOpen, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isAIAssistantOpen) return null;

  const quickQuestions = [
    "🥛 Fresh Milk & Amul Dairy",
    "🍦 Amul Ice-Creams",
    "📓 Notebooks & Stationery",
    "👕 Custom T-Shirts & Head Caps",
    "☕ Magic Coffee Mugs",
    "🛌 Memory Foam Sleeping Pillows",
    "🧪 Steel Water Bottles & Keychains",
    "☕ Snacks & Filter Coffee",
    "🧼 Personal Care Essentials"
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      // Find matching products locally or ask API
      const lowerText = text.toLowerCase();
      const cleanText = lowerText.trim().replace(/[^a-z0-9\s]/g, '');
      let matchedProds: Product[] = [];
      let botResponseText = '';

      const greetingKeywords = ['hey', 'hi', 'hello', 'heya', 'heyya', 'greetings', 'good morning', 'good afternoon', 'good evening', 'namaste', 'hola', 'yo'];
      const isGreeting = greetingKeywords.some(g => cleanText === g || cleanText.startsWith(g + ' ') || cleanText.endsWith(' ' + g));

      if (isGreeting) {
        botResponseText = `hello ! how can i help you 😊

I am your friendly store helper at Manojavam Multi Enterprises (MANIVYA). I am here to help you with anything you need! 

What can I assist you with today?
• 🥛 Milk & Amul Dairy Products
• 🍦 Amul Ice-Creams
• 📓 Notebooks & Stationery
• 👕 Custom T-Shirts & Head Caps
• ☕ Magic Coffee Mugs
• 🛌 Sleeping Pillows
• 🧪 Bottles & Keychains
• ☕ Snacks & Drinks
• 🧼 Personal Care Essentials

Feel free to tell me what you're looking for or ask any questions!`;
      } else if (lowerText.includes('pillow') || lowerText.includes('sleep') || lowerText.includes('bed')) {
        matchedProds = products.filter(p => p.category === 'pillows-home').slice(0, 3);
        botResponseText = `🛌 **Sleeping Pillows Advisory:**
Looking for optimal neck alignment or plush cloud-like comfort?
We recommend our **MANIVYA Orthopedic Contour Memory Foam Pillow** (₹799) and **Microfiber Plush Sleeping Pillow** (₹499).

✨ **Why these solve your needs:**
• Relieves cervical neck stiffness with slow-rebound memory foam.
• Hypoallergenic breathable outer bamboo cover keeps you cool all night.
• Perfect for back, side, and stomach sleepers.

Feel free to ask if you need a specific firmness level! Reaching out after purchase gives you a 1-year shape guarantee.`;
      } else if (lowerText.includes('bottle') || lowerText.includes('keychain') || lowerText.includes('steel') || lowerText.includes('flask')) {
        matchedProds = products.filter(p => p.category === 'bottles-keychains').slice(0, 3);
        botResponseText = `🧪 **Bottles & Keychains Advisory:**
Aiming for a sleek, durable everyday carry look for college, gym, or office?
We recommend our **Double-Wall Vacuum Insulated Stainless Steel Bottle (750ml)** (₹449) and **Laser-Engraved Metal Keychains** (₹149).

✨ **Why these solve your needs:**
• Keeps beverages cold for 24 hours / hot for 12 hours with zero condensation sweat.
• 100% BPA-free, leak-proof screw cap with matte tactile grip.
• Keychains feature solid rust-proof alloy with custom engraving available.

Our team is available 24/7 if you need custom logo engraving after purchase!`;
      } else if (lowerText.includes('snack') || lowerText.includes('coffee') || lowerText.includes('drink') || lowerText.includes('chips')) {
        matchedProds = products.filter(p => p.category === 'snacks-beverages').slice(0, 3);
        botResponseText = `☕ **Snacks & Drinks Advisory:**
Need a quick energetic booster or authentic South Indian taste?
We recommend our **Authentic Kumbakonam Degree Filter Coffee Mix** (₹120) and **Crispy Banana & Tapioca Snack Chips** (₹60).

✨ **Why these solve your needs:**
• Roasted chicory & Arabica coffee blend delivers rich aroma in under 2 minutes.
• Freshly fried in pure groundnut oil with zero trans fats or preservatives.

Enjoy instant cold-chain delivery! Reach out if you want recurring weekly snack subscriptions.`;
      } else if (lowerText.includes('care') || lowerText.includes('soap') || lowerText.includes('face') || lowerText.includes('sanitizer')) {
        matchedProds = products.filter(p => p.category === 'personal-care').slice(0, 3);
        botResponseText = `🧼 **Personal Care Essentials Advisory:**
Looking for gentle, dermatologically safe skin & body care?
We recommend our **Neem & Tulsi Herbal Anti-Acne Face Wash** (₹149) and **Organic Cold-Pressed Coconut Milk Soap** (₹89).

✨ **Why these solve your needs:**
• Paraben-free, sulfate-free gentle cleansing suitable for sensitive coastal Indian skin.
• Enriched with natural essential oils to maintain skin moisture barrier.

Let us know if you need specific ingredient consultations post-purchase!`;
      } else if (lowerText.includes('amul') || lowerText.includes('dairy') || lowerText.includes('milk') || lowerText.includes('ice cream')) {
        matchedProds = products.filter(p => p.category === 'dairy' || p.category === 'ice-creams').slice(0, 3);
        botResponseText = `🥛 **Milk & Amul Ice Creams Advisory:**
Looking for daily fresh pasteurized milk or refreshing family dessert tubs?
We recommend **Amul Taaza Toned Fresh Milk (500ml)** (₹27) and **Amul Epic Choco Almond Ice Cream Stick** (₹60).

✨ **Why these solve your needs:**
• Guaranteed 100% cold-chain temperature monitoring straight to your doorstep.
• Pure milk solids with rich calcium and no synthetic fat substitutes.

Delivered in insulated cold bags straight to your doorstep in Visakhapatnam! Reach out anytime for monthly milk delivery plans.`;
      } else if (lowerText.includes('t-shirt') || lowerText.includes('tee') || lowerText.includes('mug') || lowerText.includes('custom') || lowerText.includes('cap')) {
        matchedProds = products.filter(p => p.category === 'apparel-caps' || p.category === 'mugs-drinkware').slice(0, 3);
        botResponseText = `👕 **Custom Apparel & Coffee Mugs Advisory:**
Aiming for a modern oversized streetwear vibe or personalized photo gift?
We recommend our **MANIVYA 220 GSM Heavy Combed Cotton Unisex Tee** (₹499) and **Heat-Revealing Magic Ceramic Coffee Mug** (₹299).

✨ **Why these solve your needs:**
• Bio-washed anti-pilling 100% cotton tee preserves shape and vibrant color across 50+ washes.
• Magic mug changes color from pitch black to reveal your high-res printed photo when hot liquid is poured!

Upload your custom designs during checkout. Our design team will support you post-purchase if you need preview mockups!`;
      } else if (lowerText.includes('stationery') || lowerText.includes('notebook') || lowerText.includes('study') || lowerText.includes('pen')) {
        matchedProds = products.filter(p => p.category === 'stationery').slice(0, 3);
        botResponseText = `📓 **Notebooks & Stationery Advisory:**
Preparing for college exams, office notes, or bullet journaling?
We recommend **Classmate Longbook 6-Pack (172 Pages)** (₹240) and **Smooth Smudge-Free Gel Pens (Pack of 5)** (₹75).

✨ **Why these solve your needs:**
• Elemental chlorine-free paper prevents ink bleed-through even with fountain and gel pens.
• Ergonomic rubberized pen grip reduces hand fatigue during long study sessions.

Let us know if you need bulk student discount orders!`;
      } else if (lowerText.includes('delivery') || lowerText.includes('time') || lowerText.includes('pincode') || lowerText.includes('area') || lowerText.includes('address')) {
        botResponseText = `⚡ Our MANIVYA Owner Hub is located at 25-1-13, Gajuwaka Bypass Rd, Durgavanipalem, Pedagantyada, Visakhapatnam, Andhra Pradesh - 530026. Orders over ₹299 get FREE express delivery!`;
      } else if (lowerText.includes('coupon') || lowerText.includes('discount') || lowerText.includes('offer')) {
        botResponseText = `🎉 Active Coupons Today:\n• MANIVYA50: ₹50 OFF on orders above ₹299\n• AMUL10: 10% OFF on Amul Dairy & Ice Creams\n• FIRST100: ₹100 OFF for new account registrations!`;
      } else {
        // Fallback to backend Gemini AI recommendation
        const res = await api.getAIRecommendation(text);
        botResponseText = res.summary || res.reasoning;
        if (res.suggestedProductIds && res.suggestedProductIds.length > 0) {
          matchedProds = res.suggestedProductIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
        }
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedProducts: matchedProds.length > 0 ? matchedProds : undefined
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          sender: 'bot',
          text: `I am happy to assist you with MANIVYA products! You can browse our catalog above or place an order directly.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col h-[85vh] max-h-[680px]"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg border border-blue-400/30">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <ManivyaLogo className="h-5" />
                  <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    AI Chatbot
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  {greetingInfo.icon} {greetingInfo.text}, {userName}!
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAIAssistantOpen(false)}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-zinc-950/50 text-xs">
            {messages.map((msg, msgIdx) => (
              <div
                key={`chat-msg-${msg.id}-${msgIdx}`}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 space-y-2 shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                  {/* Product Cards in Bot Answer */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-zinc-800">
                      {msg.suggestedProducts.map((p, pIdx) => (
                        <div
                          key={`${msg.id}-sp-${p.id}-${pIdx}`}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate text-[11px]">{p.name}</p>
                              <p className="text-[10px] text-zinc-400 font-mono">₹{p.price} • {p.unit}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              addToCart(p, 1);
                              addToast(`Added ${p.name} to cart 🛒`, 'success');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-[10px] shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="block text-[9px] font-mono text-right opacity-60">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    {userName.charAt(0)}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-zinc-400 font-mono text-[11px] p-2 bg-zinc-900/60 rounded-xl w-fit">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-100" />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-200" />
                <span>MANIVYA Assistant thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Pills */}
          <div className="p-2 bg-zinc-900 border-t border-zinc-800/80 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {quickQuestions.map((q, qIdx) => (
              <button
                key={`qq-${qIdx}`}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-full bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] whitespace-nowrap shrink-0 transition-colors font-medium"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-zinc-950 border-t border-zinc-800 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask product questions, ${userName}...`}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-blue-500 font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-md disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
