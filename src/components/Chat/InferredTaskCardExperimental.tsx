import React from 'react';
import { motion } from 'motion/react';

interface InferredTaskCardProps {
  item: {
    id: string;
    title: string;
    description: string;
    status?: string;
    links?: Array<{ label: string; url: string }>;
  };
  getFileIcon?: (mimeType?: string) => string;
  onClick: () => void;
  sectionType?: 'decision' | 'generative' | 'fyi';
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
    <motion.div 
      layoutId={`cell-${item.id}`}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 p-4 rounded-[16px] bg-[#F8FAFD] dark:bg-[#282A2D] hover:bg-[#EEF4FE] dark:hover:bg-[#35373A] cursor-pointer transition-colors duration-200 select-none min-w-0"
    >
      {/* Title & Subtitle */}
      <div className="flex-1 min-w-0 flex flex-col text-left">
        <h4 className="text-[16px] leading-[24px] font-medium font-sans text-slate-900 dark:text-white truncate">
          {item.title}
        </h4>
        <p className="text-[14px] leading-[20px] font-normal font-sans text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
          {item.description}
        </p>
        
        {/* Render links for FYI tasks if they exist */}
        {item.links && item.links.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
            {item.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-colors"
              >
                {link.label || 'Open Link'}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons on the Right */}
      {sectionType !== 'fyi' && (
        <div className="shrink-0 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {sectionType === 'decision' ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReject) onReject(e);
                }}
                className="w-12 h-12 rounded-full bg-[#FCE8E6] hover:bg-[#FAD2CF] text-[#C5221F] dark:bg-red-950/30 dark:text-red-400 flex items-center justify-center cursor-pointer transition-colors"
                title="Decline"
              >
                <span className="material-symbols-rounded select-none" style={{ fontSize: '32px', fontVariationSettings: "'wght' 600" }}>close</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onApprove) onApprove(e);
                }}
                className="w-12 h-12 rounded-full bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] dark:bg-green-950/30 dark:text-green-400 flex items-center justify-center cursor-pointer transition-colors"
                title="Accept"
              >
                <span className="material-symbols-rounded select-none" style={{ fontSize: '32px', fontVariationSettings: "'wght' 600" }}>check</span>
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="px-6 h-12 rounded-full bg-gradient-to-r from-[#D2E3FC] to-[#ADCBF9] hover:from-[#C2DBFB] hover:to-[#9BBEF7] text-[#1967D2] font-medium font-sans text-[14px] flex items-center justify-center transition-all cursor-pointer leading-none"
            >
              Get Started
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};
