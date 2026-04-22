import React, { useState } from 'react';
import { Lightbulb, Send, Loader2, Copy, Check, Info, Sparkles, Search, User, Tv, Hash } from 'lucide-react';
import { generateAIContent } from '../../lib/gemini';
import { MOCK_PROGRAMS, MOCK_GUESTS } from '../../lib/mockData';

type Tool = 'IDEAS' | 'QUESTIONS' | 'TITLES';

export default function IdeaGeneration() {
  const [activeTool, setActiveTool] = useState<Tool>('IDEAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [additionalContext, setAdditionalContext] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredPrograms = MOCK_PROGRAMS.filter(p => p.name.includes(searchTerm));
  const filteredGuests = MOCK_GUESTS.filter(g => g.name.includes(searchTerm));

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);
    
    let prompt = '';
    let system = '';

    if (activeTool === 'IDEAS') {
      const program = MOCK_PROGRAMS.find(p => p.id === selectedProgramId);
      system = "أنت مساعد إبداعي لإنتاج البرامج التلفزيونية والإذاعية. مهمتك توليد أفكار مبدعة بناءً على برامج حالية وتوجهاتها.";
      prompt = `البرنامج المختار: ${program?.name || 'عام'}\nوصف البرنامج: ${program?.description || ''}\nسياق إضافي: ${additionalContext}\n\nيرجى اقتراح 8 أفكار مبتكرة لحلقات قادمة لهذا البرنامج.`;
    } else if (activeTool === 'QUESTIONS') {
      const guest = MOCK_GUESTS.find(g => g.id === selectedGuestId);
      const program = MOCK_PROGRAMS.find(p => p.id === selectedProgramId);
      system = "أنت معد برامج محترف. مهمتك توليد أسئلة مقابلات عميقة بناءً على سيرة الضيف ونوع البرنامج.";
      prompt = `الضيف: ${guest?.name || 'غير محدد'}\nتخصصه: ${guest?.specialty || ''}\nسيرته: ${guest?.bio || ''}\nالبرنامج المستضيف: ${program?.name || ''}\nسياق إضافي: ${additionalContext}\n\nيرجى اقتراح قائمة من 10 أسئلة ذكية للمقابلة.`;
    } else {
      const program = MOCK_PROGRAMS.find(p => p.id === selectedProgramId);
      system = "أنت كاتب عناوين محترف. مهمتك توليد عناوين جذابة ومثيرة للاهتمام للمحتوى الإعلامي.";
      prompt = `موضوع المحتوى: ${program?.name || 'عام'}\nسياق إضافي: ${additionalContext}\n\nيرجى اقتراح خيارات لعناوين جذابة وقوية تناسب هذا المحتوى.`;
    }

    try {
      const res = await generateAIContent(prompt, system);
      setResult(res);
    } catch (e) {
      setResult('عذراً، حدث خطأ أثناء التوليد. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 text-right">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold">وحدة الابتكار الإعلامي</h2>
        <p className="text-gray-400">ولد أفكاراً ذكية بناءً على قاعدة بيانات البرامج والضيوف المتاحة.</p>
      </div>

      <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit mr-auto ml-0 flex-row-reverse">
        {[
          { id: 'IDEAS', label: 'تطوير حلقات', icon: Lightbulb },
          { id: 'QUESTIONS', label: 'أسئلة لقاءات', icon: User },
          { id: 'TITLES', label: 'عناوين إبداعية', icon: Hash },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => { setActiveTool(tool.id as Tool); setResult(null); setSearchTerm(''); }}
            className={`px-8 py-3 rounded-xl text-sm font-arabic transition-all flex items-center gap-2 ${
              activeTool === tool.id ? 'bg-[#2563eb] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tool.icon size={18} />
            {tool.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Selector Panel */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          <div className="glass-panel p-6 space-y-6 flex-1 flex flex-col">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="relative group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  placeholder={activeTool === 'QUESTIONS' ? "ابحث عن ضيف أو برنامج..." : "ابحث عن برنامج..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                />
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 block">اختر البرنامج</label>
                  <div className="grid grid-cols-1 gap-2">
                    {filteredPrograms.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedProgramId(p.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedProgramId === p.id ? 'bg-[#2563eb]/10 border-[#2563eb]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Tv size={16} className="text-blue-400" />
                          <span className="text-sm font-bold">{p.name}</span>
                        </div>
                        {selectedProgramId === p.id && <Check size={14} className="text-[#2563eb]" />}
                      </div>
                    ))}
                  </div>
                </div>

                {activeTool === 'QUESTIONS' && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-gray-500 block">اختر الضيف</label>
                    <div className="grid grid-cols-1 gap-2">
                      {filteredGuests.map(g => (
                        <div 
                          key={g.id}
                          onClick={() => setSelectedGuestId(g.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            selectedGuestId === g.id ? 'bg-[#2563eb]/10 border-[#2563eb]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <User size={16} className="text-purple-400" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{g.name}</span>
                              <span className="text-[10px] text-gray-500">{g.specialty}</span>
                            </div>
                          </div>
                          {selectedGuestId === g.id && <Check size={14} className="text-[#2563eb]" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="text-xs font-bold text-gray-500">سياق إضافي أو موضوع الحلقة</label>
                <textarea 
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="مثال: حلقة عن التحديات العقارية في دبي..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-sm resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || (activeTool === 'QUESTIONS' ? !selectedGuestId || !selectedProgramId : !selectedProgramId)}
              className="btn-primary w-full py-4 flex items-center justify-center gap-3 disabled:opacity-30"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18} /> <span>إنشاء مخرجات إبداعية</span></>}
            </button>
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-8 min-h-[550px] flex flex-col justify-center bg-[#0b1224] border-dashed border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563eb]/5 rounded-bl-full blur-2xl" />
            
            {result ? (
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#2563eb]/10 rounded-lg flex items-center justify-center text-[#2563eb]">
                       <Lightbulb size={16} />
                    </div>
                    <h3 className="text-lg font-bold">الاقتراحات الإبداعية</h3>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white flex items-center gap-2 border border-white/5"
                  >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    <span className="text-xs">{copied ? 'تم النسخ' : 'نسخ الكل'}</span>
                  </button>
                </div>

                <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/10 font-arabic text-gray-200 whitespace-pre-wrap leading-loose shadow-inner">
                  {result}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-10 gap-4 py-20">
                <Sparkles size={80} />
                <p className="text-xl">اختر الموارد وسنولد لك أفكاراً مذهلة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
