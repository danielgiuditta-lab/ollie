import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';

interface InferredTaskCardProps {
  item: {
    id: string;
    title: string;
    description: string;
    workspace: string;
    sourceName: string;
    sourceMimeType: string;
    personName: string;
    personAvatar: string;
    status: string;
    hasPreview?: boolean;
    previewContent?: string;
  };
  getFileIcon: (mimeType?: string) => string;
  onClick: () => void;
}

export const InferredTaskCard: React.FC<InferredTaskCardProps> = ({ item, getFileIcon, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-5 py-4 rounded-[24px] bg-slate-50 dark:bg-[#2B2D31] border border-slate-200 dark:border-[#3E4042] hover:bg-slate-100 dark:hover:bg-[#3E4042] cursor-pointer transition-all duration-200 select-none"
    >
      {/* Left Column: Status Indicator */}
      <div className="shrink-0 w-8 h-8 flex items-center justify-center">
        <StatusIndicator status={item.status} />
      </div>

      {/* Center Column: Text & Sources */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 text-left">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-white leading-snug">
          {item.title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium leading-relaxed">
          {item.description}
        </p>
        {/* Source and Person capsule chips */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/50 dark:border-[#3E4042] text-[11px] font-semibold text-slate-650 dark:text-neutral-300">
            <img src={getFileIcon(item.sourceMimeType)} alt="doc icon" className="w-3.5 h-3.5 object-contain" />
            <span>{item.sourceName}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/50 dark:border-[#3E4042] text-[11px] font-semibold text-slate-650 dark:text-neutral-300">
            <img src={item.personAvatar} alt="avatar icon" className="w-3.5 h-3.5 rounded-full object-cover" />
            <span>{item.personName}</span>
          </div>
        </div>
      </div>

      {/* Right Column: Preview of proactive artifact if exists */}
      {item.hasPreview && (
        <div className="shrink-0 w-[110px] h-[72px] rounded-2xl overflow-hidden border border-slate-200/60 dark:border-neutral-700 bg-neutral-900 flex items-center justify-center shadow-2xs relative group select-none">
          {item.status === 'working' ? (
            <div className="w-full h-full p-2 bg-gradient-to-br from-indigo-950 to-slate-900 flex flex-col items-center justify-center gap-1 text-center">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="text-[8px] font-medium text-slate-450 tracking-tight uppercase leading-none">Drafting...</span>
            </div>
          ) : (
            <div className="w-full h-full p-2.5 bg-gradient-to-br from-indigo-950 to-slate-900 text-white flex flex-col items-start justify-between text-left group-hover:scale-105 transition-transform duration-300">
              <div className="flex justify-between items-center w-full">
                <span className="text-[8px] font-bold text-white tracking-wide truncate pr-1">Q3 Roadmap</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={6} className="text-white" />
                </div>
              </div>
              <div className="space-y-1 w-full">
                <div className="w-full h-1 bg-white/20 rounded-xs" />
                <div className="w-4/5 h-1 bg-white/20 rounded-xs" />
                <div className="w-3/5 h-1 bg-white/25 rounded-xs" />
              </div>
              <span className="text-[7px] text-slate-350 leading-none">Consolidated slides draft</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
