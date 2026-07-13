import React, { useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { NativeViewer } from '../Canvas/NativeViewer';

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
    filesToLoad?: any[];
  };
  getFileIcon: (mimeType?: string) => string;
  onClick: () => void;
}

export const InferredTaskCard: React.FC<InferredTaskCardProps> = ({ item, getFileIcon, onClick }) => {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const previewFile = item.filesToLoad && item.filesToLoad.length > 0
    ? item.filesToLoad[0]
    : {
        id: item.id + '-file',
        name: item.sourceName || item.title || 'Artifact',
        mimeType: item.sourceMimeType || 'application/vnd.google-apps.presentation',
        content: item.previewContent || item.description || item.title
      };

  return (
    <div 
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-4 py-2 rounded-[24px] bg-[#F8FAFD] dark:bg-[#1E1F22] hover:bg-[#F1F3F9] dark:hover:bg-[#2B2D31] cursor-pointer transition-all duration-200 select-none"
    >
      {/* Left Column: Status Indicator */}
      <div className="shrink-0 w-8 h-8 flex items-center justify-center">
        <StatusIndicator status={item.status} />
      </div>

      {/* Center Column: Text & Sources */}
      <div className="flex-1 min-w-0 flex flex-col text-left">
        <div className="flex flex-col min-w-0">
          <h4 className="text-[16px] leading-[24px] font-medium font-['Google_Sans_Text','Inter',sans-serif] text-[#1B1C1D] dark:text-white truncate">
            {item.title}
          </h4>
          <p className="text-[14px] leading-[20px] font-normal font-['Google_Sans_Text','Inter',sans-serif] text-[#575B5F] dark:text-neutral-400 truncate">
            {item.description}
          </p>
        </div>
        {/* Source and Person capsule chips */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/50 dark:border-[#3E4042] text-[11px] font-semibold text-slate-650 dark:text-neutral-300 min-w-0">
            <img src={getFileIcon(item.sourceMimeType)} alt="doc icon" className="w-3.5 h-3.5 object-contain shrink-0" />
            <span className="max-w-[100px] truncate block">{item.sourceName}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/50 dark:border-[#3E4042] text-[11px] font-semibold text-slate-650 dark:text-neutral-300 min-w-0">
            {!avatarFailed ? (
              <img 
                src={item.personAvatar} 
                alt="avatar icon" 
                className="w-3.5 h-3.5 rounded-full object-cover shrink-0" 
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex flex-center items-center justify-center text-[7px] font-bold shrink-0">
                {(item.personName || 'U').substring(0, 1).toUpperCase()}
              </div>
            )}
            <span className="max-w-[80px] truncate block">{item.personName}</span>
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
            <div className="w-full h-full relative group-hover:scale-[1.03] transition-transform duration-300 pointer-events-none">
              <NativeViewer
                file={previewFile}
                mode="preview"
                hideHeader={true}
                isPreviewCard={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
