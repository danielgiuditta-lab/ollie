import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  header?: React.ReactNode;
  theme?: 'light' | 'dark';
  isDragOver?: boolean;
  isSelected?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({
  children,
  header,
  theme = 'light',
  isDragOver = false,
  isSelected = false,
  className = '',
  style,
  ...props
}: CardProps) {
  const hasHeightClass = className.includes('h-') || className.includes('max-h-');
  const hasWidthClass = className.includes('w-') || className.includes('max-w-');

  return (
    <div
      style={style}
      className={`rounded-3xl border relative group flex flex-col overflow-hidden transition-all duration-200 ${
        !hasWidthClass ? 'w-full' : ''
      } ${!hasHeightClass ? 'h-full min-h-[340px]' : ''} ${
        theme === 'dark'
          ? 'bg-[#1E1F22] border-[#2B2D31] shadow-card'
          : 'bg-white border-[#E9EEF6] shadow-card'
      } ${
        isSelected
          ? 'border-[#3186FF] ring-2 ring-[#3186FF] shadow-[0_0_12px_rgba(49,134,255,0.25)] z-20'
          : ''
      } ${isDragOver ? 'scale-[1.005]' : ''} ${className}`}
      {...props}
    >
      {header}
      {children}
    </div>
  );
}
