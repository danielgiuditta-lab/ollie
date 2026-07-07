import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'header' | 'card' | 'borderless';
  theme?: 'light' | 'dark';
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  id?: string;
}

export function IconButton({ children, variant = 'header', theme = 'light', className = '', ...props }: IconButtonProps) {
  const baseClasses = "w-[40px] h-[40px] rounded-full flex items-center justify-center cursor-pointer transition select-none outline-none shrink-0";
  const isDark = theme === 'dark';
  const variantClasses = variant === 'header' 
    ? "bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-slate-800 dark:text-white"
    : variant === 'borderless'
      ? "bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-0"
      : "bg-[#003BC4]/5 dark:bg-[#282A2D] hover:bg-[#003BC4]/10 dark:hover:bg-[#35373A] text-slate-700 dark:text-white hover:text-slate-900 dark:hover:text-white border-0";

  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
