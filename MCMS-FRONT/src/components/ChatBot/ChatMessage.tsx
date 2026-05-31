import React from 'react';
import { ChatMessage as ChatMessageType } from '../../services/chatbot';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Props {
  message: ChatMessageType;
}

/**
 * تحويل النص الغامق (**...**) إلى عناصر <strong> بشكل آمن.
 * نتعامل مع نص الذكاء الاصطناعي كمصدر غير موثوق، لذلك لا نستخدم أبداً
 * dangerouslySetInnerHTML — فقط عناصر React نصّية.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // ندعم: الروابط [نص](رابط) ثم الخط الغامق **نص**
  const nodes: React.ReactNode[] = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let idx = 0;

  const pushBold = (chunk: string, kp: string) => {
    const parts = chunk.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach((part, i) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        nodes.push(<strong key={`${kp}-b-${i}`}>{part.slice(2, -2)}</strong>);
      } else if (part) {
        nodes.push(<React.Fragment key={`${kp}-t-${i}`}>{part}</React.Fragment>);
      }
    });
  };

  while ((m = linkRegex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      pushBold(text.slice(lastIndex, m.index), `${keyPrefix}-pre-${idx}`);
    }
    nodes.push(
      <a
        key={`${keyPrefix}-a-${idx}`}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-600 underline hover:text-orange-700 font-medium"
      >
        {m[1]}
      </a>
    );
    lastIndex = m.index + m[0].length;
    idx++;
  }
  if (lastIndex < text.length) {
    pushBold(text.slice(lastIndex), `${keyPrefix}-rest`);
  }
  return nodes;
}

/**
 * عرض محتوى الرسالة مع دعم مبسّط لـ Markdown:
 * - القوائم المرقّمة (1. 2. 3.)
 * - القوائم النقطية (- أو *)
 * - الخط الغامق (**نص**)
 * - الفقرات والأسطر الجديدة
 */
function renderContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let bucket: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!bucket) return;
    const items = bucket.items;
    const ListTag = bucket.ordered ? 'ol' : 'ul';
    blocks.push(
      <ListTag
        key={`list-${key++}`}
        className={`pr-5 my-1 space-y-1 ${bucket.ordered ? 'list-decimal' : 'list-disc'}`}
      >
        {items.map((it, idx) => (
          <li key={`li-${key}-${idx}`} className="leading-relaxed">
            {renderInline(it, `li-${key}-${idx}`)}
          </li>
        ))}
      </ListTag>
    );
    bucket = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const headingMatch = line.match(/^\s*(#{1,6})\s+(.*)$/);
    const orderedMatch = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);

    if (headingMatch) {
      flushList();
      const text = headingMatch[2].replace(/\*\*/g, '');
      blocks.push(
        <p key={`h-${key++}`} className="font-bold text-[15px] text-gray-900 mt-2 first:mt-0">
          {renderInline(text, `h-${key}`)}
        </p>
      );
    } else if (orderedMatch) {
      if (!bucket || !bucket.ordered) {
        flushList();
        bucket = { ordered: true, items: [] };
      }
      bucket.items.push(orderedMatch[1]);
    } else if (bulletMatch) {
      if (!bucket || bucket.ordered) {
        flushList();
        bucket = { ordered: false, items: [] };
      }
      bucket.items.push(bulletMatch[1]);
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      blocks.push(
        <p key={`p-${key++}`} className="leading-relaxed">
          {renderInline(line, `p-${key}`)}
        </p>
      );
    }
  }

  flushList();
  return <div className="space-y-1.5">{blocks}</div>;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        dir="rtl"
        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm break-words ${
          isUser
            ? 'bg-orange-500 text-white rounded-bl-md'
            : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-br-md'
        }`}
      >
        {isUser ? (
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          renderContent(message.content)
        )}
        <p
          className={`text-[11px] mt-1.5 ${
            isUser ? 'text-orange-100' : 'text-gray-400'
          }`}
        >
          {format(new Date(message.timestamp), 'HH:mm', { locale: ar })}
        </p>
      </div>
    </motion.div>
  );
}
