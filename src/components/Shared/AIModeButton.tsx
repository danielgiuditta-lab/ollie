import React from 'react';
import { Search } from 'lucide-react';

interface AIModeButtonProps {
  aiMode: boolean;
  onToggle: () => void;
  theme?: 'light' | 'dark';
}

const AimodeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 17A7 7 0 1 0 10 3a7 7 0 0 0 0 14z" />
    <path d="m21 21-6-6" />
    <path d="M13 3.5l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="currentColor" stroke="none" />
  </svg>
);

export function AIModeButton({ aiMode, onToggle, theme = 'light' }: AIModeButtonProps) {
  if (aiMode) {
    return (
      <div className="relative group flex items-center justify-center p-[1px] rounded-full transition-all duration-300">
        <button
          type="button"
          onClick={onToggle}
          className="relative z-10 bg-[#f0f4f9] dark:bg-[#2B2D31] hover:bg-[#e4e9f0] dark:hover:bg-[#34373c] text-slate-800 dark:text-white h-10 px-4 rounded-full flex items-center gap-2 font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer border-none outline-none select-none shadow-xs shrink-0"
          title="Switch to Quick Search"
        >
          <Search size={16} className="text-slate-800 dark:text-white shrink-0 stroke-[2.5]" />
          <span className="font-semibold text-slate-800 dark:text-white whitespace-nowrap">Quick Search</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative group flex items-center justify-center p-[1px] rounded-full transition-all duration-300">
      <button
        type="button"
        onClick={onToggle}
        className="relative z-10 bg-[#f0f4f9] dark:bg-[#2B2D31] hover:bg-[#e4e9f0] dark:hover:bg-[#34373c] text-slate-800 dark:text-white h-10 px-4 rounded-full flex items-center gap-2 font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer border-none outline-none select-none shadow-xs shrink-0"
        title="Toggle AI Summary Mode"
      >
        <AimodeIcon className="w-4 h-4 text-slate-800 dark:text-white shrink-0" />
        <span className="font-semibold text-slate-800 dark:text-white whitespace-nowrap">AI Mode</span>
      </button>
    </div>
  );
}
