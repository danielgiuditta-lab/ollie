import React from 'react';
import { ChevronRight } from 'lucide-react';

interface FolderRowProps {
  name: string;
  isNew?: boolean;
  isSelected?: boolean;
  isImpacted?: boolean;
  isAnimating?: boolean;
  theme?: 'light' | 'dark';
  onClick?: () => void;
  variant?: 'row' | 'badge';
  className?: string;
  dataId?: string;
}

export function FolderRow({
  name,
  isNew = false,
  isSelected = false,
  isImpacted = false,
  isAnimating = false,
  theme = 'light',
  onClick,
  variant = 'row',
  className = '',
  dataId
}: FolderRowProps) {
  const isDark = theme === 'dark';

  if (variant === 'badge') {
    return (
      <div 
        onClick={onClick}
        data-id={dataId || name}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all select-none ${
          onClick ? 'cursor-pointer hover:opacity-90' : ''
        } ${isImpacted ? 'impact-pulse scale-105' : ''} ${isAnimating ? 'opacity-0 scale-95 pointer-events-none' : ''} ${
          isNew
            ? (isDark ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-300')
            : (isDark ? 'bg-blue-950/40 text-blue-400 border-blue-800/60' : 'bg-blue-50 text-blue-700 border-blue-300')
        } ${className}`}
        style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
      >
        <span 
          className="material-symbols-rounded select-none shrink-0 inline-flex items-center justify-center text-[#444746] dark:text-[#C4C7C5]" 
          style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
        >
          {isNew ? 'create_new_folder' : 'folder'}
        </span>
        <span className="truncate max-w-[140px]">{name}</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      data-id={dataId || name}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 group relative select-none ${
        isAnimating ? 'opacity-0 scale-95 pointer-events-none' : ''
      } ${
        onClick ? 'cursor-pointer' : ''
      } ${isImpacted ? 'impact-pulse scale-105 bg-blue-100 dark:bg-blue-900/40' : ''} ${
        isSelected
          ? (isDark ? 'bg-white/10 text-white font-bold' : 'bg-[#f0f4f9] text-slate-900 font-bold')
          : (isDark ? 'hover:bg-white/5 text-gray-200 font-medium' : 'hover:bg-gray-100/80 text-slate-800 font-medium')
      } ${className}`}
    >
      <div className="flex items-center gap-2.5 truncate pr-2 flex-1 min-w-0">
        <div className="shrink-0 transition-transform group-hover:scale-105 flex items-center justify-center">
          <span 
            className="material-symbols-rounded select-none shrink-0 inline-flex items-center justify-center text-[#444746] dark:text-[#C4C7C5]" 
            style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            {isNew ? 'create_new_folder' : 'folder'}
          </span>
        </div>
        <span 
          className="text-xs truncate"
          style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
        >
          {name}
        </span>
      </div>

      <ChevronRight size={14} className="text-slate-400 dark:text-slate-300 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
    </div>
  );
}

