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
      const initialGreetingText = `${greetingInfo.text}, ${userName}! ${greetingInfo.icon}\n\nWelcome to MANIVYA Multi Enterprise. I am your AI Store Assistant powered by Gemini. Ask me anything about our Amul Dairy, Ice Creams, Notebooks & Stationery, Custom T-Shirts & Mugs, or Express Delivery in Visakhapatnam!`;
      
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
    "What Amul dairy items & ice creams are available?",
    "How much are custom printed T-shirts & Magic Mugs?",
    "What is your express delivery area in Visakhapatnam?",
    "Are there any active discount coupons?"
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
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
      let matchedProds: Product[] = [];
      let botResponseText = '';

      if (lowerText.includes('amul') || lowerText.includes('dairy') || lowerText.includes('milk') || lowerText.includes('ice cream')) {
        matchedProds = products.filter(p => p.category === 'dairy' || p.category === 'ice-creams').slice(0, 3);
        botResponseText = `Here are our top Amul Dairy & Ice Cream items available for cold-chain express delivery at store prices:`;
      } else if (lowerText.includes('t-shirt') || lowerText.includes('tee') || lowerText.includes('mug') || lowerText.includes('custom') || lowerText.includes('cap')) {
        matchedProds = products.filter(p => p.category === 'apparel-caps' || p.category === 'mugs-drinkware').slice(0, 3);
        botResponseText = `MANIVYA Multi Enterprise specializes in premium custom printing! Our heavy 220 GSM Cotton Tees start at ₹499 and Magic Heat-Revealing Mugs at ₹299.`;
      } else if (lowerText.includes('stationery') || lowerText.includes('notebook') || lowerText.includes('study') || lowerText.includes('pen')) {
        matchedProds = products.filter(p => p.category === 'stationery').slice(0, 3);
        botResponseText = `We carry authentic Classmate notebooks, smooth gel pens, geometry sets, and study supplies for school & college students in Visakhapatnam:`;
      } else if (lowerText.includes('delivery') || lowerText.includes('time') || lowerText.includes('pincode') || lowerText.includes('area') || lowerText.includes('address')) {
        botResponseText = `⚡ Our MANIVYA Express Hub is located at VIP Road, Siripuram & Gajuwaka Bypass Road, Visakhapatnam (Pincode 530026 & 530003). Orders over ₹299 get FREE instant delivery!`;
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
        id: `bot-${Date.now()}`,
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
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `I am happy to assist you with MANIVYA products! You can browse our catalog above or place an order for 10-minute delivery.`,
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
