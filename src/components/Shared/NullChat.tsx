import React from 'react';
import { NullTitle } from './NullTitle';

interface NullChatProps {
  headline: React.ReactNode;
  metaline?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  theme?: 'light' | 'dark';
}

export function NullChat({
  headline,
  metaline,
  icon,
  children,
  theme = 'light'
}: NullChatProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 text-center select-none bg-transparent">
      <div className="max-w-[520px] w-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
        {icon && (
          <div className="w-16 h-16 bg-blue-50/80 dark:bg-blue-950/20 rounded-full flex items-center justify-center shadow-2xs">
            {icon}
          </div>
        )}
        
        <div className="space-y-3">
          <NullTitle theme={theme}>{headline}</NullTitle>
          {metaline && (
            <p className="text-[15px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-md mx-auto">
              {metaline}
            </p>
          )}
        </div>

        {children && (
          <div className="w-full pt-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
