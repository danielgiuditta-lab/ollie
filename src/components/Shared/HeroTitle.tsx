import React from 'react';

export function HeroTitle({ children, className = '', theme = 'light' }: { children: React.ReactNode, className?: string, theme?: 'light' | 'dark' }) {
  return (
    <h1 
      className={`text-[32px] text-center tracking-tight leading-tight ${theme === 'dark' ? 'text-[#9E9E9E]' : 'text-gray-800'} ${className}`}
      style={ { 
        fontFamily: '"Google Sans Flex", sans-serif', 
        fontWeight: 300,
        fontVariationSettings: '"ROND" 100'
      } }
    >
      {children}
    </h1>
  );
}
