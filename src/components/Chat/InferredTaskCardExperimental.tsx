import React from 'react';
import { X, Check } from 'lucide-react';

interface InferredTaskCardProps {
  item: {
    id: string;
    title: string;
    description: string;
    status?: string;
  };
  getFileIcon?: (mimeType?: string) => string;
  onClick: () => void;
  sectionType?: 'decision' | 'generative';
  onApprove?: (e: React.MouseEvent) => void;
  onReject?: (e: React.MouseEvent) => void;
}

export const InferredTaskCardExperimental: React.FC<InferredTaskCardProps> = ({ 
  item, 
  onClick, 
  sectionType = 'decision',
  onApprove,
  onReject
}) => {
  return (
    <div 
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-6 py-5 hover:bg-slate-150/40 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors duration-200 select-none min-w-0"
    >
      {/* Title & Subtitle */}
      <div className="flex-1 min-w-0 flex flex-col text-left">
        <h4 className="text-[16px] leading-[24px] font-medium font-sans text-slate-900 dark:text-white truncate">
          {item.title}
        </h4>
        <p className="text-[14px] leading-[20px] font-normal font-sans text-slate-500 dark:text-neutral-400 mt-0.5">
          {item.description}
        </p>
      </div>

      {/* Action Buttons on the Right */}
      <div className="shrink-0 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
        {sectionType === 'decision' ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onReject) onReject(e);
              }}
              className="w-10 h-10 rounded-full bg-[#FCE8E6] hover:bg-[#FAD2CF] text-[#C5221F] dark:bg-red-950/30 dark:text-red-400 flex items-center justify-center cursor-pointer transition-colors"
              title="Decline"
            >
              <X size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onApprove) onApprove(e);
              }}
              className="w-10 h-10 rounded-full bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] dark:bg-green-950/30 dark:text-green-400 flex items-center justify-center cursor-pointer transition-colors"
              title="Accept"
            >
              <Check size={20} />
            </button>
          </>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D2E3FC] to-[#ADCBF9] hover:from-[#C2DBFB] hover:to-[#9BBEF7] text-[#1967D2] font-semibold text-[13.5px] leading-none transition-all cursor-pointer"
          >
            Get Started
          </button>
        )}
      </div>
    </div>
  );
};
