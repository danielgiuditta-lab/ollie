import React from 'react';
import { PeerCursors } from './PeerCursors';
import { RainbowRimOverlay } from '../Shared/RainbowRimOverlay';
import { ShapeLoader } from '../Shared/ShapeLoader';

interface CanvasMainProps {
  viewState: 'home' | 'null' | 'app' | 'files' | 'file_viewer' | 'projector' | 'public_projector' | 'ai_summary';
  setViewState: (state: 'home' | 'null' | 'app' | 'files' | 'file_viewer' | 'projector' | 'public_projector' | 'ai_summary') => void;
  isLoading?: boolean;
  currentTask?: string;
  appTheme?: 'light' | 'dark';
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  onExpand?: () => void;
  peers?: Record<string, any>;
  currentUserId?: string;
  selectedFile?: any;
}

export function CanvasMain({ 
  viewState, 
  setViewState, 
  isLoading, 
  currentTask, 
  appTheme, 
  children, 
  theme = 'light', 
  onExpand,
  peers,
  currentUserId,
  selectedFile
}: CanvasMainProps) {
  const isHome = viewState === 'home';
  const isDocTask = currentTask === 'doc' || !!selectedFile?.isDocJourney || selectedFile?.name === 'document.doc' || selectedFile?.name?.endsWith('.doc') || (selectedFile?.mimeType && selectedFile.mimeType.includes('document'));
  const isTransparentContainer = isHome || viewState === 'ai_summary';

  const showRainbowRim = isDocTask && isLoading && !isTransparentContainer;

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 relative h-full overflow-hidden">
      {/* Outer wrapper to host the 1px Rainbow Rim Overlay without clipping */}
      <div className={`flex flex-col flex-1 h-full min-h-0 overflow-hidden relative transition-all duration-300 rounded-[32px] ${showRainbowRim ? 'p-[1px]' : ''}`}>
        {showRainbowRim && (
          <RainbowRimOverlay active={true} borderRadiusClass="rounded-[32px]" variant="canvas" />
        )}
        
        {/* Inner Container with rounded corners and overflow-hidden */}
        <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden relative z-10 bg-transparent border-transparent shadow-none">
          {!(isLoading && !isDocTask && viewState !== 'ai_summary') ? (
            <div 
              id="canvas-main-viewport"
              className="flex-1 w-full h-full relative z-0 min-h-0 overflow-hidden transition-all duration-300 pt-0"
            >
              {children}
              {peers && viewState !== 'home' && viewState !== 'ai_summary' && (
                <PeerCursors peers={peers} currentUserId={currentUserId} />
              )}
            </div>
          ) : (
            <div className="flex-1 w-full h-full relative flex items-center justify-center overflow-hidden bg-slate-50/50 dark:bg-slate-900/10">
              {/* Agent Building Indicator (Animated Undulating Glow) */}
              <div className="absolute top-20 -left-10 w-96 h-96 bg-blue-300/20 dark:bg-blue-900/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob pointer-events-none"></div>
              <div className="absolute top-20 -right-10 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-900/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '2s' }}></div>
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-300/20 dark:bg-purple-900/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '4s' }}></div>
              
              <div className="relative z-10 flex items-center justify-center">
                <ShapeLoader size={180} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

