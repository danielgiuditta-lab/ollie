import React from 'react';
import { FileIcon } from './FileIcon';

interface FileRowProps {
  name: string;
  mimeType?: string;
  subtitle?: string;
  isSelected?: boolean;
  isAnimating?: boolean;
  theme?: 'light' | 'dark';
  onClick?: () => void;
  rightElement?: React.ReactNode;
  className?: string;
  dataId?: string;
}

export function FileRow({
  name,
  mimeType,
  subtitle,
  isSelected = false,
  isAnimating = false,
  theme = 'light',
  onClick,
  rightElement,
  className = '',
  dataId
}: FileRowProps) {
  const isDark = theme === 'dark';

  return (
    <div
      onClick={onClick}
      data-id={dataId || name}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 group relative select-none ${
        isAnimating ? 'opacity-0 scale-95 pointer-events-none' : ''
      } ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? (isDark ? 'bg-white/10 text-white font-bold' : 'bg-[#f0f4f9] text-slate-900 font-bold')
          : (isDark ? 'hover:bg-white/5 text-gray-200 font-medium' : 'hover:bg-gray-100/80 text-slate-800 font-medium')
      } ${className}`}
    >
      <div className="flex items-center gap-2.5 truncate pr-2 flex-1 min-w-0">
        <div className="shrink-0 transition-transform group-hover:scale-105">
          <FileIcon fileName={name} mimeType={mimeType} size={18} />
        </div>
        <div className="flex flex-col min-w-0 flex-1 truncate">
          <span 
            className="text-xs truncate leading-tight"
            style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
          >
            {name}
          </span>
          {subtitle && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-normal">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {rightElement && (
        <div className="shrink-0 ml-2 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );
}
