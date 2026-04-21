import React, { useState } from 'react';
import { PenTool, Send, Loader2, Copy, Check, Type, AlignLeft, ShieldCheck } from 'lucide-react';
import { generateAIContent } from '../../lib/gemini';

type EditMode = 'REWRITE' | 'SUMMARIZE' | 'GRAMMAR';

export default function TextEditing() {
  const [activeMode, setActiveMode] = useState<EditMode>('REWRITE');
  const [text, setText] = useState('');
  const [styleOrLength, setStyleOrLength] = useState('إخباري/إذاعي');
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
      system = "أنت محرر نصوص محترف. مهمتك إعادة صياغة النص بالأسلوب المطلوب (إذاعي، صحفي، ودي) مع الحفاظ على المعنى الأصلي.";
      prompt = `الأسلوب المطلوب: ${styleOrLength}\n\nالنص الأصلي:\n${text}\n\nيرجى إعادة صياغة النص.`;
    } else if (activeMode === 'SUMMARIZE') {
      system = "أنت مساعد متخصص في تلخيص المحتوى. قم بتلخيص النص بالنشاط المطلوب (نقاط، فقرة قصيرة، إلخ).";
      prompt = `نوع التلخيص المطلوب: ${styleOrLength}\n\nالنص الأصلي:\n${text}\n\nيرجى تقديم ملخص دقيق للمحتوى.`;
    } else {
      system = "أنت خبير في اللغة العربية وقواعدها. قم بتدقيق النص لغوياً ونحوياً وشرح الأخطاء إن وجدت.";
      prompt = `النص للتدقيق:\n${text}\n\nيرجى تدقيق النص لغوياً واقتراح التصحيحات مع توضيح بسيط للقاعدة.`;
    }

    try {
      const res = await generateAIContent(prompt, system);
      setResult(res);
    } catch (e) {
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
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl">محرر التحرير الصحفي الذكي</h2>
        <p className="text-gray-400">أدوات متكاملة لتحسين جودة النصوص وصياغتها بأساليب إعلامية متنوعة.</p>
      </div>

      <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit">
        {[
          { id: 'REWRITE', label: 'إعادة صياغة', icon: Type },
          { id: 'SUMMARIZE', label: 'تلخيص النصوص', icon: AlignLeft },
          { id: 'GRAMMAR', label: 'تدقيق لغوي', icon: ShieldCheck },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => { setActiveMode(mode.id as EditMode); setResult(null); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-arabic transition-all flex items-center gap-2 ${
              activeMode === mode.id ? 'bg-brand-accent text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <mode.icon size={18} />
            {mode.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400">النص الأصلي</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder="ضع نصك هنا للمعالجة..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all placeholder:text-gray-600 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400">
                {activeMode === 'REWRITE' ? 'اختيار الأسلوب' : activeMode === 'SUMMARIZE' ? 'طول التلخيص' : 'خيار التدقيق'}
              </label>
              <select
                value={styleOrLength}
                onChange={(e) => setStyleOrLength(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-brand-accent/20"
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
                    <option value="نقاط (Bullet Points)">نقاط (Bullet Points)</option>
                    <option value="فقرة قصيرة مركزة">فقرة قصيرة مركزة</option>
                    <option value="موجز العناوين">موجز العناوين</option>
                  </>
                )}
                {activeMode === 'GRAMMAR' && (
                  <>
                    <option value="تدقيق كامل وشرح">تدقيق كامل وشرح</option>
                    <option value="تصحيح صامت">تصحيح صامت</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleProcess}
                disabled={isLoading || !text}
                className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> <span>معالجة النص</span></>}
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 bg-brand-surface border-dashed border-white/10 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">النص المعالج</h3>
            {result && (
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white flex items-center gap-2"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                <span className="text-xs">نسخ النتيجة</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar leading-relaxed text-gray-300 font-arabic whitespace-pre-wrap">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin"></div>
                <p className="text-gray-500">جاري العمل على نصك...</p>
              </div>
            ) : result ? (
              result
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 italic">
                ستظهر النتيجة هنا بعد الضغط ع "معالجة النص"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
