import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  variant?: 'primary' | 'secondary';
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export function Button({ 
  children, 
  theme = 'light', 
  variant = 'secondary', 
  className = '', 
  ...props 
}: ButtonProps) {
  const getStyles = () => {
    if (variant === 'primary') {
      return 'bg-[#3186FF] hover:bg-[#2071E5] active:bg-[#155DC2] text-white disabled:bg-[#F3F6FC] disabled:text-[#A8B2C4] disabled:opacity-100';
    }
    
    return 'bg-[#003BC4]/5 dark:bg-[#282A2D] hover:bg-[#003BC4]/10 dark:hover:bg-[#35373A] active:bg-[#003BC4]/15 dark:active:bg-[#404347] text-slate-900 dark:text-white disabled:bg-[#003BC4]/2 dark:disabled:bg-[#282A2D]/40 disabled:text-slate-400 dark:disabled:text-[#9E9E9E]/40';
  };

  return (
    <button
      className={`h-12 px-6 rounded-full font-semibold text-sm transition-all duration-200 cursor-pointer select-none outline-none border-none flex items-center justify-center gap-2 ${getStyles()} disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

