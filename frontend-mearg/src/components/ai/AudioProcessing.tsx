import React, { useState, useRef } from 'react';
import { Mic, Volume2, Loader2, Play, Pause, Download, Music, FileText, Search, Check, FileAudio, FileVideo, Newspaper } from 'lucide-react';
import { generateAIContent } from '../../lib/ai-client';
import { MOCK_MEDIA, MOCK_NEWS } from '../../lib/mockData';

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

  const filteredMedia = MOCK_MEDIA.filter(item => item.title.includes(searchTerm));
  const filteredNews = MOCK_NEWS.filter(item => item.title.includes(searchTerm) || item.content.includes(searchTerm));

  const handleSTT = async () => {
    const media = MOCK_MEDIA.find(m => m.id === selectedMediaId);
    if (!media) return;
    setIsLoading(true);
    setResult(null);
    try {
      const prompt = `فرّغ محتوى هذا الملف الإخباري (موضوعه: ${media.title}) إلى نص مكتوب دقيق مع علامات الترقيم.`;
      const res = await generateAIContent(prompt, 'أنت متخصص في تحويل الكلام إلى نص بدقة عالية.');
      setResult(res);
    } catch {
      setResult('حدث خطأ أثناء التفريغ الصوتي.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTTS = async () => {
    setIsLoading(true);
    try {
      alert('ميزة TTS غير متاحة حالياً. يرجى التواصل مع المسؤول لتفعيلها.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="space-y-4 text-right">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">المختبر الصوتي</h2>
        <p className="text-gray-400 text-xs">حوّل الملفات إلى نصوص أو استمع للأخبار بأصوات احترافية.</p>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit mr-auto ml-0 flex-row-reverse">
        <button
          onClick={() => { setActiveMode('STT'); setResult(null); setSearchTerm(''); }}
          className={`px-5 py-2 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${activeMode === 'STT' ? 'bg-[#2563eb] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Mic size={14} /> صوت لنص (STT)
        </button>
        <button
          onClick={() => { setActiveMode('TTS'); setAudioUrl(null); setSearchTerm(''); }}
          className={`px-5 py-2 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${activeMode === 'TTS' ? 'bg-[#2563eb] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Volume2 size={14} /> نص لصوت (TTS)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Selector */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-4 space-y-3 h-[460px] flex flex-col">
            <h3 className="text-sm font-bold border-b border-white/5 pb-2 flex items-center gap-2">
              {activeMode === 'STT' ? <Music size={14} /> : <Newspaper size={14} />}
              <span>{activeMode === 'STT' ? 'اختر ملفاً من الأرشيف' : 'اختر خبراً للتسجيل'}</span>
            </h3>

            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input
                type="text"
                placeholder="ابحث..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]/20"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
              {activeMode === 'STT' ? filteredMedia.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMediaId(item.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedMediaId === item.id ? 'bg-[#2563eb]/10 border-[#2563eb]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center gap-2">
                    {item.type === 'AUDIO' ? <FileAudio className="text-blue-400 shrink-0" size={15} /> : <FileVideo className="text-purple-400 shrink-0" size={15} />}
                    <span className="text-xs font-bold">{item.title}</span>
                  </div>
                  {selectedMediaId === item.id && <Check size={13} className="text-[#2563eb]" />}
                </div>
              )) : filteredNews.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedNewsId(item.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedNewsId === item.id ? 'bg-[#2563eb]/10 border-[#2563eb]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center gap-2">
                    <Newspaper className="text-emerald-400 shrink-0" size={15} />
                    <span className="text-xs font-bold truncate max-w-[180px]">{item.title}</span>
                  </div>
                  {selectedNewsId === item.id && <Check size={13} className="text-[#2563eb]" />}
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              {activeMode === 'TTS' && (
                <div className="flex gap-1.5">
                  {['Kore', 'Puck', 'Aoide'].map(v => (
                    <button
                      key={v}
                      onClick={() => setVoice(v)}
                      className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${voice === v ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={activeMode === 'STT' ? handleSTT : handleTTS}
                disabled={isLoading || (activeMode === 'STT' ? !selectedMediaId : !selectedNewsId)}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-30"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <span>{activeMode === 'STT' ? 'بدء التفريغ' : 'تحويل لصوت'}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-4 h-[460px] flex flex-col items-center justify-center text-center bg-[#0b1224] border-dashed border-white/10 relative overflow-hidden">
            {activeMode === 'STT' ? (
              result ? (
                <div className="w-full h-full flex flex-col text-right">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-[#2563eb]" />
                    <h4 className="text-sm font-bold">التفريغ النهائي</h4>
                  </div>
                  <div className="flex-1 bg-white/[0.02] rounded-xl p-4 border border-white/5 overflow-y-auto custom-scrollbar font-arabic leading-loose text-gray-200 text-sm">
                    {result}
                  </div>
                </div>
              ) : (
                <div className="opacity-10 flex flex-col items-center gap-3">
                  <Mic size={48} />
                  <p className="text-sm">اختر ملفاً للتفريغ</p>
                </div>
              )
            ) : (
              audioUrl ? (
                <div className="space-y-5 w-full max-w-xs">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-[#2563eb]/10 rounded-full flex items-center justify-center text-[#2563eb] relative">
                      <div className="absolute inset-0 rounded-full border-2 border-[#2563eb]/20 animate-ping" />
                      <Volume2 size={28} className="relative z-10" />
                    </div>
                    <p className="text-sm font-bold">النشرة الصوتية جاهزة</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlayback} className="w-10 h-10 bg-[#2563eb] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform">
                        {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
                      </button>
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full bg-[#2563eb] ${isPlaying ? 'w-full' : 'w-0'}`} />
                      </div>
                    </div>
                  </div>
                  <a href={audioUrl} download="audio.mp3" className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                    <Download size={14} /> تحميل التسجيل
                  </a>
                </div>
              ) : (
                <div className="opacity-10 flex flex-col items-center gap-3">
                  <Volume2 size={48} />
                  <p className="text-sm">اختر خبراً لتحويله لصوت</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
