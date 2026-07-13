import React from 'react';

export interface CardHeaderProps {
  title: React.ReactNode;
  count?: number;
  onTitleClick?: (e: React.MouseEvent) => void;
  titleTooltip?: string;
  actions?: React.ReactNode;
  theme?: 'light' | 'dark';
  className?: string;
}

export function CardHeader({
  title,
  count,
  onTitleClick,
  titleTooltip,
  actions,
  theme = 'light',
  className = ''
}: CardHeaderProps) {
  return (
    <div 
      className={`h-12 pl-4 pr-2 flex items-center justify-between shrink-0 bg-transparent z-20 pointer-events-auto rounded-t-3xl ${className}`}
    >
      <div 
        className={`flex items-center gap-1.5 min-w-0 ${onTitleClick ? 'cursor-pointer group/title' : ''}`}
        onClick={onTitleClick}
        title={titleTooltip}
      >
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 bg-slate-200/60 dark:bg-neutral-800 px-2 py-0.5 rounded-full ml-1 shrink-0">
            {count}
          </span>
        )}
        {onTitleClick && (
          <span className="text-slate-400 opacity-0 group-hover/title:opacity-100 transition-opacity text-[10px]">↗</span>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-1">
          {actions}
        </div>
      )}
    </div>
  );
}
