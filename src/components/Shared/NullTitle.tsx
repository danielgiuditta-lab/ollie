import React from 'react';

interface NullTitleProps {
  children: React.ReactNode;
  className?: string;
  theme?: 'light' | 'dark';
}

export function NullTitle({ children, className = '', theme = 'light' }: NullTitleProps) {
  return (
    <h1 
      className={`text-[45px] tracking-tight font-normal text-[#3186FF] text-center select-none ${className}`}
      style={{ 
        fontFamily: '"Google Sans Flex", "Google Sans", "Product Sans", "Inter", sans-serif',
        lineHeight: '1.15'
      }}
    >
      {children}
    </h1>
  );
}
