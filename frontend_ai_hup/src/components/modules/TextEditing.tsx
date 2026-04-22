import React, { useState } from 'react';
import { Send, Loader2, Copy, Check, Type, AlignLeft, ShieldCheck } from 'lucide-react';
import { generateAIContent } from '../../lib/ai-client';

type EditMode = 'REWRITE' | 'SUMMARIZE' | 'GRAMMAR';

export default function TextEditing() {
  const [activeMode, setActiveMode] = useState<EditMode>('REWRITE');
  const [text, setText] = useState('');
  const [styleOrLength, setStyleOrLength] = useState('بث إذاعي');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleProcess = async () => {
    if (!text) return;
    setIsLoading(true);
    setResult(null);

    let prompt = '';
    let system = '';

    if (activeMode === 'REWRITE') {
      system = 'أنت محرر نصوص محترف. مهمتك إعادة صياغة النص بالأسلوب المطلوب مع الحفاظ على المعنى الأصلي.';
      prompt = `الأسلوب المطلوب: ${styleOrLength}\n\nالنص الأصلي:\n${text}\n\nيرجى إعادة صياغة النص.`;
    } else if (activeMode === 'SUMMARIZE') {
      system = 'أنت مساعد متخصص في تلخيص المحتوى.';
      prompt = `نوع التلخيص: ${styleOrLength}\n\nالنص الأصلي:\n${text}\n\nيرجى تقديم ملخص دقيق.`;
    } else {
      system = 'أنت خبير في اللغة العربية وقواعدها.';
      prompt = `النص للتدقيق:\n${text}\n\nيرجى تدقيق النص لغوياً واقتراح التصحيحات.`;
    }

    try {
      const res = await generateAIContent(prompt, system);
      setResult(res);
    } catch {
      setResult('حدث خطأ. يرجى المحاولة لاحقاً.');
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
    <div className="space-y-4 text-right">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">محرر التحرير الصحفي</h2>
        <p className="text-gray-400 text-xs">إعادة صياغة، تلخيص، وتدقيق لغوي فوري.</p>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        {[
          { id: 'REWRITE', label: 'إعادة صياغة', icon: Type },
          { id: 'SUMMARIZE', label: 'تلخيص', icon: AlignLeft },
          { id: 'GRAMMAR', label: 'تدقيق لغوي', icon: ShieldCheck },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => { setActiveMode(mode.id as EditMode); setResult(null); }}
            className={`px-5 py-2 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${
              activeMode === mode.id ? 'bg-[#2563eb] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <mode.icon size={14} />
            {mode.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="glass-panel p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400">النص الأصلي</label>
            <textarea
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
              rows={10}
              placeholder="ضع نصك هنا للمعالجة..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#2563eb]/20 outline-none transition-all placeholder:text-gray-600 resize-none leading-relaxed text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">
                {activeMode === 'REWRITE' ? 'الأسلوب' : activeMode === 'SUMMARIZE' ? 'نوع التلخيص' : 'خيار التدقيق'}
              </label>
              <select
                value={styleOrLength}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStyleOrLength(e.target.value)}
                className="w-full text-sm"
              >
                {activeMode === 'REWRITE' && (
                  <>
                    <option value="بث إذاعي">بث إذاعي</option>
                    <option value="صحفي استقصائي">صحفي استقصائي</option>
                    <option value="عامي/كاجوال">عامي/كاجوال</option>
                    <option value="رسمي مؤسسي">رسمي مؤسسي</option>
                  </>
                )}
                {activeMode === 'SUMMARIZE' && (
                  <>
                    <option value="نقاط (Bullet Points)">نقاط</option>
                    <option value="فقرة قصيرة مركزة">فقرة قصيرة</option>
                    <option value="موجز العناوين">موجز العناوين</option>
                  </>
                )}
                {activeMode === 'GRAMMAR' && (
                  <>
                    <option value="تدقيق كامل وشرح">تدقيق كامل</option>
                    <option value="تصحيح صامت">تصحيح صامت</option>
                  </>
                )}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleProcess}
                disabled={isLoading || !text}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} /><span>معالجة</span></>}
              </button>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="glass-panel p-4 bg-[#0b1224] border-dashed border-white/10 flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold">النص المعالج</h3>
            {result && (
              <button
                onClick={copyToClipboard}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white flex items-center gap-1.5 text-xs border border-white/5"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                <span>{copied ? 'تم' : 'نسخ'}</span>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar leading-relaxed text-gray-300 font-arabic text-sm whitespace-pre-wrap">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-[#2563eb]/20 border-t-[#2563eb] rounded-full animate-spin" />
                <p className="text-gray-500 text-xs">جاري المعالجة...</p>
              </div>
            ) : result ? result : (
              <div className="h-full flex items-center justify-center text-gray-600 text-xs italic">
                ستظهر النتيجة هنا
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
