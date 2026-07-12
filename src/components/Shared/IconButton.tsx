import React from 'react';
import { themeTokens } from '../../utils/themeTokens';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'header' | 'card' | 'borderless';
  theme?: 'light' | 'dark';
  isGroupChat?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  id?: string;
}

export function IconButton({ children, variant = 'header', theme = 'light', isGroupChat = false, className = '', ...props }: IconButtonProps) {
  const baseClasses = "w-[40px] h-[40px] rounded-full flex items-center justify-center cursor-pointer transition select-none outline-none shrink-0";
  const isDark = theme === 'dark';
  const variantClasses = variant === 'header' 
    ? `bg-transparent ${themeTokens.hoverBg} text-slate-800 dark:text-white`
    : variant === 'borderless'
      ? `bg-transparent ${themeTokens.hoverBg} ${themeTokens.text.idle} border-0`
      : isGroupChat
        ? `bg-transparent hover:bg-slate-200/80 text-slate-700 dark:hover:bg-[#282A2D] dark:text-[#E3E3E3] border-0 shadow-none`
        : `${themeTokens.filledBg} ${themeTokens.filledHoverBg} ${themeTokens.text.idle} border-0`;

  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
