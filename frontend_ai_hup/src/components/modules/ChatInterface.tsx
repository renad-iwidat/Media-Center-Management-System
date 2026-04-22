import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, User, Sparkles, Trash2, Paperclip, AlertCircle } from 'lucide-react';
import { parseNumberedList } from '../../lib/markdown-parser';

declare const __VITE_API_URL__: string;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  prompt: string;
  think?: boolean;
  max_tokens?: number;
  temperature?: number;
}

interface ChatResponse {
  success: boolean;
  result?: string;
  error?: string;
  remaining?: number;
  resetTime?: number;
}

const API_BASE_URL = __VITE_API_URL__ || 'http://localhost:4000/api';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'أهلاً بك! أنا مساعدك الذكي المتخصص في شؤون الإعلام وصناعة المحتوى. كيف يمكنني مساعدتك اليوم؟', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [resetTime, setResetTime] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check if user has remaining messages
    if (remaining === 0) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `عذراً، لقد وصلت إلى الحد الأقصى من الرسائل (3 رسائل يومياً). يرجى المحاولة غداً.`, 
        timestamp: new Date() 
      }]);
      return;
    }

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context from conversation history
      const conversationContext = messages
        .map(m => `${m.role === 'user' ? 'المستخدم' : 'المساعد'}: ${m.content}`)
        .join('\n');

      // Create the prompt with context
      const fullPrompt = conversationContext 
        ? `السياق السابق:\n${conversationContext}\n\nالسؤال الجديد: ${input}`
        : input;

      // Call the backend API
      const response = await fetch(`${API_BASE_URL}/ai-hub/chat/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          think: false,
          max_tokens: 800,
          temperature: 0.3,
        } as ChatRequest),
      });

      const data: ChatResponse = await response.json();

      // Update remaining messages
      if (data.remaining !== undefined) {
        setRemaining(data.remaining);
      }
      if (data.resetTime !== undefined) {
        setResetTime(data.resetTime);
      }

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status} ${response.statusText}`);
      }

      if (!data.success || !data.result) {
        throw new Error(data.error || 'No result returned from API');
      }

      const assistantMessage: Message = { role: 'assistant', content: data.result, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'خطأ غير معروف';
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `عذراً، حدث خطأ أثناء معالجة طلبك: ${errorMessage}. يرجى المحاولة لاحقاً.`, 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'تم مسح المحادثة. كيف يمكنني مساعدتك الآن؟', timestamp: new Date() }]);
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1 text-right">
          <h2 className="text-xl font-bold">المساعد الذكي</h2>
          <p className="text-gray-400 text-xs">دردشة مفتوحة مع ذكاء اصطناعي متخصص في المجال الإعلامي.</p>
        </div>
        <div className="flex items-center gap-4">
          {remaining !== null && (
            <div className={`px-4 py-2 rounded-lg text-sm font-arabic ${
              remaining === 0 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                : remaining === 1 
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {remaining === 0 
                ? '❌ انتهت الرسائل' 
                : `📨 ${remaining} رسائل متبقية`}
            </div>
          )}
          <button 
            onClick={clearChat}
            className="p-3 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-2xl transition-all"
            title="مسح المحادثة"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Chat Main */}
        <div className="flex-1 glass-panel flex flex-col overflow-hidden bg-[#0b1224]/40">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
          >
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                  msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#2563eb] text-white'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
                </div>
                <div className={`max-w-[80%] p-3 rounded-2xl font-arabic text-sm leading-relaxed ${
                  msg.role === 'user'
                  ? 'bg-blue-600/10 border border-blue-600/20 text-blue-50 rounded-tr-none'
                  : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-wrap">
                    {msg.role === 'assistant' ? parseNumberedList(msg.content) : msg.content}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-2 block opacity-50">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-[#2563eb]/20 flex items-center justify-center text-[#2563eb]">
                  <Sparkles size={20} />
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl rounded-tl-none w-24 flex gap-1 items-center justify-center">
                   <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full animate-bounce" />
                   <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                   <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5 bg-white/[0.02]">
            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="اسألني أي شيء عن الإعلام..."
                rows={2}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-2xl py-4 pr-6 pl-16 focus:ring-2 focus:ring-[#2563eb]/20 outline-none transition-all placeholder:text-gray-600 resize-none font-arabic"
              />
              <div className="absolute left-4 bottom-4 flex gap-2">
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
              </div>
              <div className="absolute right-4 bottom-4 text-gray-500">
                <Paperclip size={18} className="cursor-pointer hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
