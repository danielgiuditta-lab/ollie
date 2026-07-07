import React from 'react';
import { ChevronRight, X } from 'lucide-react';

interface CanvasHeaderProps {
  projectName?: string;
  viewState: string;
  onHomeClick: () => void;
  onCloseWorkspace: () => void;
  peers?: Record<string, any>;
  theme?: 'light' | 'dark';
}

export function CanvasHeader({
  projectName = 'New',
  viewState,
  onHomeClick,
  onCloseWorkspace,
  peers,
  theme = 'light'
}: CanvasHeaderProps) {
  const isHome = viewState === 'home';

  const PeerAvatarsList = () => {
    if (!peers) return null;
    const list = Object.values(peers);
    if (list.length === 0) return null;

    return (
      <div className="flex items-center -space-x-2 select-none shrink-0">
        {list.map((peer: any) => (
          <div
            key={peer.id}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-3xs ring-2 ring-white dark:ring-[#1E1F22] shrink-0"
            style={{ backgroundColor: peer.color || '#3B82F6' }}
            title={`${peer.name} is active in this space`}
          >
            {peer.name.substring(0, 1).toUpperCase()}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 w-full h-[64px] shrink-0 z-20 relative bg-transparent text-slate-800 dark:text-white select-none">
      <div className="flex items-center gap-2">
        <div className="flex items-center text-slate-700 dark:text-slate-200 text-lg font-normal font-sans">
          <span 
            onClick={onHomeClick}
            className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition font-medium"
          >
            Home
          </span>
          {!isHome && (
            <>
              <ChevronRight size={18} className="mx-2 text-slate-400 dark:text-slate-500 shrink-0" />
              <div className="flex items-center gap-1.5 bg-[#003BC4]/5 dark:bg-[#2B2D31] px-3 py-1 rounded-xl text-slate-950 dark:text-white font-semibold">
                <span>{projectName}</span>
                <button 
                  onClick={onCloseWorkspace}
                  className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition cursor-pointer border-none outline-none flex items-center justify-center"
                  title="Close Space"
                >
                  <X size={14} className="text-slate-500 dark:text-slate-400" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        <PeerAvatarsList />
      </div>
    </div>
  );
}
