import React from 'react';
import { PeerCursors } from './PeerCursors';
import { RainbowRimOverlay } from '../Shared/RainbowRimOverlay';
import { ShapeLoader } from '../Shared/ShapeLoader';

interface CanvasMainProps {
  viewState: 'home' | 'null' | 'app' | 'files' | 'file_viewer' | 'ai_summary' | 'dashboard';
  setViewState: (state: 'home' | 'null' | 'app' | 'files' | 'file_viewer' | 'ai_summary' | 'dashboard') => void;
  isLoading?: boolean;
  currentTask?: string;
  appTheme?: 'light' | 'dark';
  children: React.ReactNode;
  theme?: 'light' | 'dark';
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
  peers,
  currentUserId,
  selectedFile
}: CanvasMainProps) {
  const isHome = viewState === 'home';
  const isDocTask = currentTask === 'doc' || !!selectedFile?.isDocJourney || selectedFile?.name === 'document.doc' || selectedFile?.name?.endsWith('.doc') || (selectedFile?.mimeType && selectedFile.mimeType.includes('document'));
  const isTransparentContainer = isHome || viewState === 'ai_summary';

  const showRainbowRim = false;

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 relative h-full overflow-y-auto custom-scrollbar">
      {/* Outer wrapper to host the 1px Rainbow Rim Overlay without clipping */}
      <div className={`flex flex-col flex-1 h-full min-h-0 relative transition-all duration-300 rounded-[32px] ${showRainbowRim ? 'p-[1px]' : ''}`}>
        {showRainbowRim && (
          <RainbowRimOverlay active={true} borderRadiusClass="rounded-[32px]" variant="canvas" />
        )}
        
        {/* Inner Container with rounded corners */}
        <div className="flex flex-col flex-1 h-full min-h-0 relative z-10 bg-transparent border-transparent shadow-none">
          {!(isLoading && viewState !== 'ai_summary') ? (
            <div 
              id="canvas-main-viewport"
              className="flex-1 w-full h-full relative z-0 min-h-0 overflow-y-auto custom-scrollbar transition-all duration-300 pt-0"
            >
              {children}
              {peers && viewState !== 'home' && viewState !== 'ai_summary' && (
                <PeerCursors peers={peers} currentUserId={currentUserId} />
              )}
            </div>
          ) : (
            <div className="flex-1 w-full h-full relative flex items-center justify-center overflow-hidden bg-transparent">
              <div className="relative z-10 flex items-center justify-center -translate-y-12">
                <ShapeLoader size={324} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

