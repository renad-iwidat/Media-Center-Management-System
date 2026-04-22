import React, { useState } from 'react';
import { AlignLeft, Type, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { summarizeContent, rewriteContent, SummarizeStyle, RewriteStyle } from '../lib/ai-client';
import { parseNumberedList } from '../lib/markdown-parser';

interface InlineAIActionsProps {
  /** النص الأصلي الذي سيُلخَّص أو يُعاد صياغته */
  sourceText: string;
  /** callback لاستبدال النتيجة في الـ parent */
  onResult?: (newText: string) => void;
}

type ActionMode = 'SUMMARIZE' | 'REWRITE';

const SUMMARIZE_STYLES: { value: SummarizeStyle; label: string }[] = [
  { value: 'bullet_points',   label: 'نقاط'           },
  { value: 'short_paragraph', label: 'فقرة قصيرة'     },
  { value: 'headlines',       label: 'موجز العناوين'  },
];

const REWRITE_STYLES: { value: RewriteStyle; label: string }[] = [
  { value: 'radio_broadcast', label: 'بث إذاعي'       },
  { value: 'investigative',   label: 'صحفي استقصائي'  },
  { value: 'social_media',    label: 'سوشل ميديا'     },
  { value: 'formal',          label: 'رسمي مؤسسي'     },
  { value: 'casual',          label: 'عامي'            },
];

export default function InlineAIActions({ sourceText, onResult }: InlineAIActionsProps) {
  const [activeAction, setActiveAction] = useState<ActionMode | null>(null);
  const [summarizeStyle, setSummarizeStyle] = useState<SummarizeStyle>('bullet_points');
  const [rewriteStyle, setRewriteStyle]     = useState<RewriteStyle>('radio_broadcast');
  const [result, setResult]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const runAction = async (mode: ActionMode, sStyle?: SummarizeStyle, rStyle?: RewriteStyle) => {
    if (!sourceText.trim()) return;

    // toggle إذا نفس الـ action وفيه نتيجة
    if (activeAction === mode && result && !sStyle && !rStyle) {
      setIsExpanded(!isExpanded);
      return;
    }

    setActiveAction(mode);
    setResult(null);
    setIsExpanded(true);
    setIsLoading(true);

    try {
      let res: string;
      if (mode === 'SUMMARIZE') {
        res = await summarizeContent(sourceText, sStyle ?? summarizeStyle);
      } else {
        res = await rewriteContent(sourceText, rStyle ?? rewriteStyle);
      }
      setResult(res);
    } catch {
      setResult('حدث خطأ. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-3 border-t border-white/5 pt-3 space-y-2">
      {/* ── Action Buttons Row ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-gray-600 flex items-center gap-1">
          <Sparkles size={10} />
          أدوات AI
        </span>

        {/* ── Summarize ── */}
        <button
          onClick={() => runAction('SUMMARIZE')}
          disabled={isLoading || !sourceText.trim()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border disabled:opacity-30 ${
            activeAction === 'SUMMARIZE' && isExpanded
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
          }`}
        >
          {isLoading && activeAction === 'SUMMARIZE'
            ? <Loader2 size={12} className="animate-spin" />
            : <AlignLeft size={12} />
          }
          تلخيص
        </button>

        {/* Summarize style selector */}
        {activeAction === 'SUMMARIZE' && (
          <select
            value={summarizeStyle}
            onChange={(e) => {
              const v = e.target.value as SummarizeStyle;
              setSummarizeStyle(v);
            }}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500/40 text-gray-300"
          >
            {SUMMARIZE_STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}

        {/* ── Rewrite ── */}
        <button
          onClick={() => runAction('REWRITE')}
          disabled={isLoading || !sourceText.trim()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border disabled:opacity-30 ${
            activeAction === 'REWRITE' && isExpanded
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
          }`}
        >
          {isLoading && activeAction === 'REWRITE'
            ? <Loader2 size={12} className="animate-spin" />
            : <Type size={12} />
          }
          إعادة صياغة
        </button>

        {/* Rewrite style selector */}
        {activeAction === 'REWRITE' && (
          <select
            value={rewriteStyle}
            onChange={(e) => {
              const v = e.target.value as RewriteStyle;
              setRewriteStyle(v);
            }}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500/40 text-gray-300"
          >
            {REWRITE_STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}

        {/* Re-run with current style */}
        {activeAction && result && !isLoading && (
          <button
            onClick={() => runAction(
              activeAction,
              activeAction === 'SUMMARIZE' ? summarizeStyle : undefined,
              activeAction === 'REWRITE'   ? rewriteStyle   : undefined,
            )}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:border-white/20 transition-all"
          >
            <Sparkles size={10} />
            تطبيق
          </button>
        )}

        {/* Collapse toggle */}
        {result && !isLoading && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mr-auto flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {isExpanded ? 'إخفاء' : 'عرض النتيجة'}
          </button>
        )}
      </div>

      {/* ── Result Panel ── */}
      {isExpanded && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {activeAction === 'SUMMARIZE'
                ? <AlignLeft size={12} className="text-emerald-400" />
                : <Type size={12} className="text-blue-400" />
              }
              <span className={`text-[10px] font-bold ${activeAction === 'SUMMARIZE' ? 'text-emerald-400' : 'text-blue-400'}`}>
                {activeAction === 'SUMMARIZE' ? 'الملخص' : 'النص المعاد صياغته'}
              </span>
            </div>

            {/* استخدام النتيجة */}
            {result && !isLoading && onResult && (
              <button
                onClick={() => { onResult(result); setIsExpanded(false); }}
                className="text-[10px] px-2 py-1 bg-[#2563eb]/20 text-[#2563eb] border border-[#2563eb]/30 rounded-lg hover:bg-[#2563eb]/30 transition-colors"
              >
                استخدام هذا النص ↑
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 py-4 justify-center text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">جاري المعالجة...</span>
            </div>
          ) : result ? (
            <div className="space-y-1 font-arabic text-sm leading-relaxed">
              {parseNumberedList(result)}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
