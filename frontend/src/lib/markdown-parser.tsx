/**
 * Simple Markdown Parser
 * Converts markdown text to React elements
 */

import React from 'react';

export interface ParsedContent {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'list' | 'heading';
  content: string | ParsedContent[];
  level?: number; // for headings
  url?: string; // for links
}

/**
 * Parse markdown text and return formatted content
 * Supports: **bold**, *italic*, `code`, [link](url), # headings, - lists
 * Colors follow DESIGN_SYSTEM.md specifications
 */
export function parseMarkdown(text: string): (string | React.ReactElement)[] {
  const result: (string | React.ReactElement)[] = [];
  let i = 0;

  while (i < text.length) {
    // Check for bold (**text**)
    if (text[i] === '*' && text[i + 1] === '*') {
      const endIndex = text.indexOf('**', i + 2);
      if (endIndex !== -1) {
        const boldText = text.substring(i + 2, endIndex);
        result.push(
          <strong key={`bold-${i}`} className="font-extrabold text-[#1e293b] text-[1.05em]">
            {boldText}
          </strong>
        );
        i = endIndex + 2;
        continue;
      }
    }

    // Check for italic (*text*)
    if (text[i] === '*' && text[i + 1] !== '*') {
      const endIndex = text.indexOf('*', i + 1);
      if (endIndex !== -1) {
        const italicText = text.substring(i + 1, endIndex);
        result.push(
          <em key={`italic-${i}`} className="italic text-[#64748b]">
            {italicText}
          </em>
        );
        i = endIndex + 1;
        continue;
      }
    }

    // Check for code (`text`)
    if (text[i] === '`') {
      const endIndex = text.indexOf('`', i + 1);
      if (endIndex !== -1) {
        const codeText = text.substring(i + 1, endIndex);
        result.push(
          <code
            key={`code-${i}`}
            className="bg-[#f1f5f9] text-[#1e293b] px-2 py-1 rounded text-sm font-mono border border-[#e2e8f0]"
          >
            {codeText}
          </code>
        );
        i = endIndex + 1;
        continue;
      }
    }

    // Check for link ([text](url))
    if (text[i] === '[') {
      const endBracket = text.indexOf(']', i);
      if (endBracket !== -1 && text[endBracket + 1] === '(') {
        const endParen = text.indexOf(')', endBracket + 2);
        if (endParen !== -1) {
          const linkText = text.substring(i + 1, endBracket);
          const linkUrl = text.substring(endBracket + 2, endParen);
          result.push(
            <a
              key={`link-${i}`}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3d6a8a] hover:text-[#2d5570] underline transition-colors"
            >
              {linkText}
            </a>
          );
          i = endParen + 1;
          continue;
        }
      }
    }

    // Regular text
    let nextSpecial = text.length;
    const specialChars = ['*', '`', '['];
    for (const char of specialChars) {
      const index = text.indexOf(char, i);
      if (index !== -1 && index < nextSpecial) {
        nextSpecial = index;
      }
    }

    if (nextSpecial > i) {
      result.push(text.substring(i, nextSpecial));
      i = nextSpecial;
    } else {
      result.push(text[i]);
      i++;
    }
  }

  return result;
}

/**
 * Parse text with line breaks and markdown
 */
export function parseTextWithLineBreaks(text: string): React.ReactElement[] {
  const lines = text.split('\n');
  return lines.map((line, index) => (
    <div key={index} className="mb-2 text-[#1e293b]">
      {parseMarkdown(line)}
    </div>
  ));
}

/**
 * Parse numbered lists and headings
 * Colors follow DESIGN_SYSTEM.md specifications
 */
export function parseNumberedList(text: string): React.ReactElement[] {
  const lines = text.split('\n');
  const result: React.ReactElement[] = [];
  let inList = false;
  let listItems: React.ReactElement[] = [];

  lines.forEach((line, index) => {
    // ─── Horizontal rule ---
    if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
      if (inList && listItems.length > 0) {
        result.push(<ol key={`list-${index}`} className="list-decimal mb-4 mr-6">{listItems}</ol>);
        listItems = [];
        inList = false;
      }
      result.push(<hr key={`hr-${index}`} className="border-[#cbd5e1] my-4" />);
      return;
    }

    // ─── Headings # ## ###
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (inList && listItems.length > 0) {
        result.push(<ol key={`list-${index}`} className="list-decimal mb-4 mr-6">{listItems}</ol>);
        listItems = [];
        inList = false;
      }

      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const headingClasses: Record<number, string> = {
        1: 'text-2xl font-bold text-[#1e293b] mb-3 mt-6',
        2: 'text-xl font-bold text-[#1e293b] mb-2 mt-5',
        3: 'text-lg font-bold text-[#1e293b] mb-2 mt-4',
        4: 'text-base font-bold text-[#1e293b] mb-1 mt-3',
        5: 'text-sm font-bold text-[#1e293b] mb-1 mt-2',
        6: 'text-sm font-bold text-[#1e293b] mb-1 mt-2',
      };

      const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;
      result.push(
        React.createElement(
          HeadingTag,
          { key: `heading-${index}`, className: headingClasses[level] },
          parseMarkdown(headingText)
        )
      );
      return;
    }

    // ─── Bullet lists - item
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (inList && listItems.length > 0) {
        result.push(<ol key={`list-${index}`} className="list-decimal mb-4 mr-6">{listItems}</ol>);
        listItems = [];
        inList = false;
      }
      result.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2 mb-2 mr-2">
          <span className="text-[#3d6a8a] mt-1 shrink-0">•</span>
          <span className="text-[#1e293b]">{parseMarkdown(bulletMatch[1])}</span>
        </div>
      );
      return;
    }

    // ─── Numbered lists 1. item or ١. item (Arabic numbers)
    const numberedMatch = line.match(/^(\d+|[٠-٩]+)\.\s+(.+)$/);
    if (numberedMatch) {
      inList = true;
      listItems.push(
        <li key={`item-${index}`} className="mb-4 leading-relaxed text-[#1e293b] pr-2">
          <div className="flex flex-col gap-1">
            {parseMarkdown(numberedMatch[2])}
          </div>
        </li>
      );
      return;
    }

    // ─── Close list if open
    if (inList && listItems.length > 0) {
      result.push(
        <ol key={`list-${index}`} className="list-decimal mb-6 mr-8 space-y-2 [&>li]:pl-2 [&>li::marker]:text-[#4A7C9E] [&>li::marker]:font-bold">
          {listItems}
        </ol>
      );
      listItems = [];
      inList = false;
    }

    // ─── Empty line → spacer
    if (!line.trim()) {
      result.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    // ─── Regular paragraph
    result.push(
      <p key={`text-${index}`} className="mb-3 leading-loose text-[#1e293b] text-[15px]">
        {parseMarkdown(line)}
      </p>
    );
  });

  // Close any remaining list
  if (inList && listItems.length > 0) {
    result.push(
      <ol key="final-list" className="list-decimal mb-6 mr-8 space-y-2 [&>li]:pl-2 [&>li::marker]:text-[#4A7C9E] [&>li::marker]:font-bold">
        {listItems}
      </ol>
    );
  }

  return result;
}
