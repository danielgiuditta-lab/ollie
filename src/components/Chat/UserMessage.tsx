import React from 'react';
import ReactMarkdown from 'react-markdown';
import { themeTokens } from '../../utils/themeTokens';

interface UserMessageProps {
  text: string;
  theme?: 'light' | 'dark';
  isGroupChat?: boolean;
  key?: number | string;
  shadowClass?: string;
  borderClass?: string;
}

export function UserMessage({ 
  text, 
  theme = 'light', 
  isGroupChat = false, 
  shadowClass = 'shadow-none',
  borderClass = 'border-0'
}: UserMessageProps) {
  const isDark = theme === 'dark';
  return (
    <div 
      className={`w-fit self-end ml-auto bg-[#F0F4F9] dark:bg-[#282A2D] ${
        isDark ? 'text-[#E3E3E3]' : 'text-slate-900'
      } rounded-[40px] px-6 py-3.5 text-xs sm:text-base font-normal leading-relaxed max-w-[85%] ${shadowClass} ${borderClass} opacity-100`}
      style={{ fontFamily: '"Inter", sans-serif' }}
    >
      <ReactMarkdown components={{ p: ({ children }) => <span className="inline">{children}</span> }}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

