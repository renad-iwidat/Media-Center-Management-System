import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotService, ChatMessage } from '../../services/chatbot';
import { useNavigate } from 'react-router-dom';
import ChatMessageComponent from './ChatMessage';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي في نظام إدارة مركز الإعلام. كيف يمكنني مساعدتك؟',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // فقاعة التعريف: تظهر كلما كانت المحادثة مغلقة (وتعاود الظهور بعد كل إغلاق)
  useEffect(() => {
    if (isOpen) {
      setShowHint(false);
      return;
    }
    const timer = setTimeout(() => setShowHint(true), 1500);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // إخفاء مؤقت للفقاعة فقط (ستعاود الظهور في المرة القادمة)
  const dismissHint = () => setShowHint(false);

  const openChat = () => {
    setIsOpen(true);
    setShowHint(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage(input);
      setMessages((prev) => [...prev, response]);

      // Handle navigation if needed
      if (response.action?.type === 'navigate' && response.action.payload?.path) {
        const path = response.action.payload.path;
        setTimeout(() => {
          navigate(path);
        }, 600);
      }

      // Handle opening an external URL (e.g. النظام الإخباري الذكي)
      if (response.action?.type === 'open_url' && response.action.payload?.url) {
        const url = response.action.payload.url;
        setTimeout(() => {
          window.open(url, '_blank', 'noopener,noreferrer');
        }, 400);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    chatbotService.clearHistory();
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'مرحباً! أنا مساعدك الذكي في نظام إدارة مركز الإعلام. كيف يمكنني مساعدتك؟',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <>
      {/* Chat Widget Button + Hint */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* فقاعة التعريف — تلفت الانتباه للمساعد */}
        <AnimatePresence>
          {showHint && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              dir="rtl"
              className="relative w-64 bg-white rounded-2xl shadow-2xl border border-orange-100 p-4 mb-1"
            >
              <button
                onClick={dismissHint}
                className="absolute top-2 left-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800 mb-1">
                    مساعدك الذكي هنا 👋
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    جديد على النظام؟ اسألني كيف يعمل وكيف تتعامل معه، وسأرشدك خطوة بخطوة.
                  </p>
                  <button
                    onClick={openChat}
                    className="mt-2.5 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    ابدأ الآن ←
                  </button>
                </div>
              </div>
              {/* ذيل الفقاعة */}
              <div className="absolute -bottom-1.5 right-7 w-3 h-3 bg-white border-l border-b border-orange-100 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* الزر العائم مع حلقة نابضة وحركة طفو */}
        <div className="relative">
          {!isOpen && (
            <motion.span
              className="absolute inset-0 rounded-full bg-orange-500"
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.8 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
          <motion.button
            onClick={() => (isOpen ? setIsOpen(false) : openChat())}
            className="relative w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/40 flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            animate={isOpen ? { y: 0 } : { y: [0, -8, 0] }}
            transition={isOpen ? {} : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
          </motion.button>
        </div>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            dir="rtl"
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-40 border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-orange-500 to-orange-600 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">مساعدك الذكي</h3>
                <p className="text-sm text-orange-100">نظام إدارة مركز الإعلام</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-orange-700/50 p-1 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <ChatMessageComponent key={msg.id} message={msg} />
              ))}
              {loading && (
                <div className="flex justify-center items-center py-4">
                  <Loader className="animate-spin text-orange-500" size={24} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="اكتب سؤالك هنا..."
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send size={18} />
                </button>
              </form>
              <button
                onClick={handleClearChat}
                className="w-full mt-2 text-sm text-gray-600 hover:text-gray-800 py-1 transition-colors"
              >
                مسح المحادثة
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
