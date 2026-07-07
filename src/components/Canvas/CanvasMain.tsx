import React, { useState, useEffect } from 'react';
import { Maximize2 } from 'lucide-react';
import { HeroTitle } from '../Shared/HeroTitle';
import { IconButton } from '../Shared/IconButton';
import { PeerCursors } from './PeerCursors';
import { RainbowRimOverlay } from '../Shared/RainbowRimOverlay';

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

const LOADING_HEADLINES = [
  "Defining the User's Vision...",
  "Designing the UI and Code...",
  "Implementing the Initial HTML...",
  "Wiring up Components...",
  "Refining the Application..."
];

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
  const [headlineIndex, setHeadlineIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setHeadlineIndex((prev) => (prev + 1) % LOADING_HEADLINES.length);
      }, 3500);
    } else {
      setHeadlineIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const isHome = viewState === 'home';
  const isDocTask = currentTask === 'doc' || !!selectedFile?.isDocJourney || selectedFile?.name === 'document.doc' || selectedFile?.name?.endsWith('.doc') || (selectedFile?.mimeType && selectedFile.mimeType.includes('document'));
  const isTransparentContainer = isHome || viewState === 'ai_summary';
  const containerBgClass = (viewState === 'app' && !isLoading) 
    ? 'bg-white' 
    : (isLoading ? 'bg-f8f9fa' : 'bg-white');

  const showRainbowRim = isDocTask && isLoading && !isTransparentContainer;

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 relative h-full overflow-hidden">
      {/* Outer wrapper to host the 1px Rainbow Rim Overlay without clipping */}
      <div className={`flex flex-col flex-1 h-full min-h-0 overflow-hidden relative transition-all duration-300 rounded-[32px] ${showRainbowRim ? 'p-[1px]' : ''}`}>
        {showRainbowRim && (
          <RainbowRimOverlay active={true} borderRadiusClass="rounded-[32px]" variant="canvas" />
        )}
        
        {/* Inner Container with rounded corners and overflow-hidden */}
        <div 
          className={`flex flex-col flex-1 h-full min-h-0 overflow-hidden relative z-10 transition-all duration-300 ${
            isTransparentContainer 
              ? 'border-transparent bg-transparent shadow-none' 
              : `rounded-[32px] overflow-hidden border-0 border-transparent shadow-none ${containerBgClass}`
          }`}
        >
          {!(isLoading && !isDocTask && viewState !== 'ai_summary') ? (
            <div 
              id="canvas-main-viewport"
              className="flex-1 w-full h-full relative z-0 min-h-0 overflow-hidden transition-all duration-300 pt-0"
            >
              {children}
              {peers && (viewState === 'projector' || viewState === 'public_projector') && (
                <PeerCursors peers={peers} currentUserId={currentUserId} />
              )}
            </div>
          ) : (
            <div className="flex-1 w-full h-full relative flex items-center justify-center overflow-hidden">
              {/* Agent Building Indicator (Animated Undulating Glow) */}
              <div className="absolute top-20 -left-10 w-96 h-96 bg-blue-300/50 rounded-full mix-blend-multiply filter blur-3xl animate-blob pointer-events-none"></div>
              <div className="absolute top-20 -right-10 w-96 h-96 bg-indigo-300/50 rounded-full mix-blend-multiply filter blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '2s' }}></div>
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-300/50 rounded-full mix-blend-multiply filter blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '4s' }}></div>
              
              <div className="relative z-10 text-center px-8 max-w-3xl">
                <HeroTitle className="animate-pulse transition-opacity duration-1000">
                  {LOADING_HEADLINES[headlineIndex]}
                </HeroTitle>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
