import React from 'react';

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
      className={`${
        isDark 
          ? 'bg-[#555a64] text-white' 
          : (isGroupChat ? 'bg-white text-slate-800 border border-slate-200/50 shadow-2xs' : 'bg-[#f1f3f4] text-[#3c4043]')
      } rounded-[24px] rounded-tr-sm p-4 text-xs sm:text-base font-normal leading-relaxed max-w-[90%] self-end`}
      style={{ fontFamily: '"Inter", sans-serif' }}
    >
      {text}
    </div>
  );
}
