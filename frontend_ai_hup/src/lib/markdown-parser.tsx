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
          <strong key={`bold-${i}`} className="font-bold text-white">
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
          <em key={`italic-${i}`} className="italic text-gray-300">
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
            className="bg-gray-800 text-green-400 px-2 py-1 rounded text-sm font-mono"
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
              className="text-blue-400 hover:text-blue-300 underline"
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
    <div key={index} className="mb-2">
      {parseMarkdown(line)}
    </div>
  ));
}

/**
 * Parse numbered lists and headings
 */
export function parseNumberedList(text: string): React.ReactElement[] {
  const lines = text.split('\n');
  const result: React.ReactElement[] = [];
  let inList = false;
  let listItems: React.ReactElement[] = [];

  lines.forEach((line, index) => {
    // Check for headings (# ## ### etc)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      // Close any open list
      if (inList && listItems.length > 0) {
        result.push(
          <ol key={`list-${index}`} className="list-decimal mb-4">
            {listItems}
          </ol>
        );
        listItems = [];
        inList = false;
      }

      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const headingClasses = {
        1: 'text-3xl font-bold text-white mb-4 mt-6',
        2: 'text-2xl font-bold text-blue-300 mb-3 mt-5',
        3: 'text-xl font-bold text-blue-200 mb-2 mt-4',
        4: 'text-lg font-bold text-gray-100 mb-2 mt-3',
        5: 'text-base font-bold text-gray-200 mb-1 mt-2',
        6: 'text-sm font-bold text-gray-300 mb-1 mt-2',
      };

      const HeadingTag = `h${level}` as any;
      result.push(
        React.createElement(
          HeadingTag,
          { key: `heading-${index}`, className: headingClasses[level as keyof typeof headingClasses] },
          parseMarkdown(headingText)
        )
      );
      return;
    }

    // Check for numbered lists
    const match = line.match(/^\d+\.\s+(.+)$/);
    if (match) {
      inList = true;
      listItems.push(
        <li key={`item-${index}`} className="ml-6 mb-2">
          {parseMarkdown(match[1])}
        </li>
      );
    } else {
      if (inList && listItems.length > 0) {
        result.push(
          <ol key={`list-${index}`} className="list-decimal mb-4">
            {listItems}
          </ol>
        );
        listItems = [];
        inList = false;
      }
      if (line.trim()) {
        result.push(
          <div key={`text-${index}`} className="mb-2">
            {parseMarkdown(line)}
          </div>
        );
      }
    }
  });

  if (inList && listItems.length > 0) {
    result.push(
      <ol key="final-list" className="list-decimal mb-4">
        {listItems}
      </ol>
    );
  }

  return result;
}
