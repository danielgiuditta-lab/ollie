import React from 'react';
import ReactMarkdown from 'react-markdown';
import { themeTokens } from '../../utils/themeTokens';

interface UserMessageProps {
  text: string;
  theme?: 'light' | 'dark';
  isGroupChat?: boolean;
  key?: number | string;
}

export function UserMessage({ text, theme = 'light', isGroupChat = false }: UserMessageProps) {
  const isDark = theme === 'dark';
  return (
    <div 
      className={`${themeTokens.filledBg} ${
        isDark ? 'text-[#E3E3E3]' : 'text-slate-800'
      } rounded-[24px] p-4 text-xs sm:text-base font-normal leading-relaxed max-w-[90%]`}
      style={{ fontFamily: '"Inter", sans-serif' }}
    >
      <ReactMarkdown components={{ p: ({ children }) => <span className="inline">{children}</span> }}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

