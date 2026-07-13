import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  header?: React.ReactNode;
  theme?: 'light' | 'dark';
  isDragOver?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({
  children,
  header,
  theme = 'light',
  isDragOver = false,
  className = '',
  style,
  ...props
}: CardProps) {
  return (
    <div
      style={style}
      className={`min-w-[320px] h-[460px] rounded-3xl border relative group flex flex-col overflow-hidden transition-all duration-200 ${
        theme === 'dark'
          ? 'bg-[#1E1F22] border-[#2B2D31] shadow-card'
          : 'bg-white border-[#E9EEF6] shadow-card'
      } ${isDragOver ? 'ring-2 ring-blue-500 scale-[1.01]' : ''} ${className}`}
      {...props}
    >
      {header}
      {children}
    </div>
  );
}
