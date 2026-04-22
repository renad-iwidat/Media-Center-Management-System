import React, { useState, useRef } from 'react';
import { Mic, Volume2, Send, Loader2, Play, Pause, Download, Music, FileText, Search, Check, FileAudio, FileVideo, Newspaper, Sparkles } from 'lucide-react';
import { generateAIContent } from '../../lib/gemini';
import { MOCK_MEDIA, MOCK_NEWS } from '../../lib/mockData';
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type AudioMode = 'STT' | 'TTS';

export default function AudioProcessing() {
  const [activeMode, setActiveMode] = useState<AudioMode>('STT');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voice, setVoice] = useState('Kore');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredMedia = MOCK_MEDIA.filter(item => 
    item.title.includes(searchTerm)
  );

  const filteredNews = MOCK_NEWS.filter(item => 
    item.title.includes(searchTerm) || item.content.includes(searchTerm)
  );

  const handleSTT = async () => {
    const media = MOCK_MEDIA.find(m => m.id === selectedMediaId);
    if (!media) return;

    setIsLoading(true);
    setResult(null);

    try {
      // Integration Simulation: In a real app, we'd fetch the file bytes from the URL/DB.
      // Since it's a simulated "Database" file, we use LLM logic for the transcript.
      const prompt = `أنت خبير تفريغ صوتي. قم بتفريغ محتوى هذا الملف الإخباري (بناءً على موضوعه: ${media.title}) إلى نص مكتوب دقيق مع مراعاة علامات الترقيم.`;
      const res = await generateAIContent(prompt, "أنت متخصص في تحويل الكلام إلى نص بدقة عالية.");
      setResult(res);
    } catch (e) {
      setResult('حدث خطأ أثناء التفريغ الصوتي.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTTS = async () => {
    const news = MOCK_NEWS.find(n => n.id === selectedNewsId);
    if (!news) return;

    setIsLoading(true);
    setAudioUrl(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: news.content }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice as any },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBlob = base64ToBlob(base64Audio, 'audio/wav');
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ في توليد الصوت. يرجى مراجعة إعدادات الـ API.');
    } finally {
      setIsLoading(false);
    }
  };

  const base64ToBlob = (base64: string, mime: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="space-y-8 text-right">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold">المختبر الصوتي الذكي</h2>
        <p className="text-gray-400">حوّل الملفات الموجودة في الأرشيف إلى نصوص، أو استمع للأخبار بأصوات احترافية.</p>
      </div>

      <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit mr-auto ml-0 flex-row-reverse">
        <button
          onClick={() => { setActiveMode('STT'); setResult(null); setSearchTerm(''); }}
          className={`px-8 py-3 rounded-xl text-sm font-arabic transition-all flex items-center gap-2 ${
            activeMode === 'STT' ? 'bg-[#2563eb] text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Mic size={18} />
          تحويل الصوت لنص (STT)
        </button>
        <button
          onClick={() => { setActiveMode('TTS'); setAudioUrl(null); setSearchTerm(''); }}
          className={`px-8 py-3 rounded-xl text-sm font-arabic transition-all flex items-center gap-2 ${
            activeMode === 'TTS' ? 'bg-[#2563eb] text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Volume2 size={18} />
          تحويل النص لصوت (TTS)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Resource Selection */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 space-y-4 h-[550px] flex flex-col">
            <h3 className="font-bold border-b border-white/5 pb-3 flex items-center gap-2">
              {activeMode === 'STT' ? <Music size={18} /> : <Newspaper size={18} />}
              <span>{activeMode === 'STT' ? 'اختر ملفاً من الأرشيف' : 'اختر خبراً للتسجيل'}</span>
            </h3>
            
            <div className="relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="ابحث في الأرشيف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]/20"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {activeMode === 'STT' ? (
                filteredMedia.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedMediaId(item.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedMediaId === item.id ? 'bg-[#2563eb]/10 border-[#2563eb]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.type === 'AUDIO' ? <FileAudio className="text-blue-400" size={18} /> : <FileVideo className="text-purple-400" size={18} />}
                      <span className="text-sm font-bold">{item.title}</span>
                    </div>
                    {selectedMediaId === item.id && <Check size={16} className="text-[#2563eb]" />}
                  </div>
                ))
              ) : (
                filteredNews.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedNewsId(item.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedNewsId === item.id ? 'bg-[#2563eb]/10 border-[#2563eb]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Newspaper className="text-emerald-400" size={18} />
                      <span className="text-sm font-bold truncate max-w-[200px]">{item.title}</span>
                    </div>
                    {selectedNewsId === item.id && <Check size={16} className="text-[#2563eb]" />}
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              {activeMode === 'TTS' && (
                <div className="flex gap-2">
                  {['Kore', 'Puck', 'Aoide'].map(v => (
                    <button
                      key={v}
                      onClick={() => setVoice(v)}
                      className={`flex-1 py-2 rounded-xl text-xs border transition-all ${
                        voice === v ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white/5 border-white/10 text-gray-500'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={activeMode === 'STT' ? handleSTT : handleTTS}
                disabled={isLoading || (activeMode === 'STT' ? !selectedMediaId : !selectedNewsId)}
                className="btn-primary w-full py-3 flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <span>{activeMode === 'STT' ? 'بدء التفريغ' : 'تحويل الخبر لصوت'}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-8 h-[550px] flex flex-col items-center justify-center text-center bg-[#0b1224] border-dashed border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563eb]/5 rounded-bl-full blur-2xl" />
            
            {activeMode === 'STT' ? (
              result ? (
                <div className="w-full h-full flex flex-col text-right">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <FileText size={20} className="text-[#2563eb]" />
                      <h4 className="font-bold">التفريغ النهائي</h4>
                    </div>
                  </div>
                  <div className="flex-1 bg-white/[0.02] rounded-2xl p-6 border border-white/5 overflow-y-auto custom-scrollbar font-arabic leading-loose text-gray-200">
                    {result}
                  </div>
                </div>
              ) : (
                <div className="opacity-10 py-20 flex flex-col items-center">
                  <Mic size={80} className="mb-4" />
                  <p className="text-xl font-arabic">اختر ملفاً من الأرشيف للتفريغ</p>
                </div>
              )
            ) : (
              audioUrl ? (
                <div className="space-y-8 w-full max-w-sm">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 bg-[#2563eb]/10 rounded-full flex items-center justify-center text-[#2563eb] relative">
                      <div className="absolute inset-0 rounded-full border-2 border-[#2563eb]/20 animate-ping" />
                      <Volume2 size={40} className="relative z-10" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-xl font-bold mb-2">النشرة الصوتية جاهزة</h4>
                      <p className="text-sm text-gray-400">المصدر: {MOCK_NEWS.find(n => n.id === selectedNewsId)?.title}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                    <audio 
                      ref={audioRef} 
                      src={audioUrl} 
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={togglePlayback}
                        className="w-14 h-14 bg-[#2563eb] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform"
                      >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} className="translate-x-0.5" />}
                      </button>
                      <div className="flex-1 space-y-2">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                           <div className={`h-full bg-[#2563eb] ${isPlaying ? 'w-full' : 'w-0'}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <a 
                    href={audioUrl} 
                    download="archive_audio.mp3"
                    className="flex items-center justify-center gap-3 text-sm text-gray-400 hover:text-white transition-colors py-2"
                  >
                    <Download size={18} />
                    تحميل التسجيل
                  </a>
                </div>
              ) : (
                <div className="opacity-10 py-20 flex flex-col items-center text-center">
                  <Volume2 size={80} className="mb-4" />
                  <p className="text-xl font-arabic">اختر خبراً لتحويله إلى صوت مسموع</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
