import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Plus } from 'lucide-react';
import { NativeViewer } from './NativeViewer';
import { CanvasTopBar } from './CanvasTopBar';
import { UserMessage } from '../Chat/UserMessage';
import { BotMessage } from '../Chat/BotMessage';
import { Button } from '../Shared/Button';
import { TypeAhead } from './TypeAhead';

import docsIcon from '../../assets/docs.png';
import sheetsIcon from '../../assets/sheets.png';
import slidesIcon from '../../assets/slides.png';
import htmlIcon from '../../assets/html.png';
import imageIcon from '../../assets/image.png';

interface AISummaryViewProps {
  sources: any[];
  messages: any[];
  onSendMessage: (text: string, aiMode?: boolean, contextFiles?: any[]) => void;
  isLoading: boolean;
  theme?: 'light' | 'dark';
  onSnap: () => void;
  onAddToProject?: () => void;
  isProject?: boolean;
  onShareProject?: () => void;
  onAddSource?: (file: any) => void;
  recentFiles?: any[];
  accessToken?: string | null;
}

export function AISummaryView({
  sources = [],
  messages = [],
  onSendMessage,
  isLoading,
  theme = 'light',
  onSnap,
  onAddToProject,
  isProject = false,
  onShareProject,
  onAddSource,
  recentFiles = [],
  accessToken = null
}: AISummaryViewProps) {
  const [activeFile, setActiveFile] = useState<any | null>(null);
  const [sourceViewMode, setSourceViewMode] = useState<'file' | 'preview'>('preview');
  const [inputValue, setInputValue] = useState('');
  const [sourcesWidth, setSourcesWidth] = useState<number>(320);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add Source state & debounced drive search
  const [sourceQuery, setSourceQuery] = useState('');
  const [isTypeAheadOpen, setIsTypeAheadOpen] = useState(false);
  const [apiResults, setApiResults] = useState<any[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const typeAheadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (typeAheadRef.current && !typeAheadRef.current.contains(e.target as Node)) {
        setIsTypeAheadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!sourceQuery.trim() || !accessToken || !isTypeAheadOpen) {
      setApiResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const q = `trashed = false and name contains '${sourceQuery.replace(/'/g, "\\'")}'`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=8&fields=files(id,name,mimeType,owners)`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setApiResults(data.files || []);
        }
      } catch (err) {
        console.error("Error searching drive files:", err);
      } finally {
        setIsSearchingApi(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [sourceQuery, accessToken, isTypeAheadOpen]);

  const filteredRecentFiles = (recentFiles || []).filter(f => 
    !sourceQuery.trim() || (f.name || '').toLowerCase().includes(sourceQuery.toLowerCase())
  );

  const handleSelectSource = (file: any) => {
    if (onAddSource) {
      onAddSource(file);
    }
    setSourceQuery('');
    setIsTypeAheadOpen(false);
  };

  const startResizeSources = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sourcesWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(180, Math.min(500, startWidth + deltaX));
      setSourcesWidth(newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('is-resizing');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.classList.add('is-resizing');
  };

  // Helper to get Google Workspace application icon matching file type
  const getFileIcon = (mimeType?: string, fileName?: string) => {
    const mType = (mimeType || '').toLowerCase();
    const name = (fileName || '').toLowerCase();
    if (mType.includes('document') || name.endsWith('.doc') || name.endsWith('.docx') || name.endsWith('.md') || name.endsWith('.txt')) {
      return docsIcon;
    }
    if (mType.includes('spreadsheet') || name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
      return sheetsIcon;
    }
    if (mType.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) {
      return slidesIcon;
    }
    if (mType.includes('html') || name.endsWith('.html') || name.endsWith('.htm')) {
      return htmlIcon;
    }
    if (mType.includes('image') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
      return imageIcon;
    }
    return docsIcon;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim(), true, sources);
      setInputValue('');
    }
  };

  // Scroll to bottom when streaming new content
  useEffect(() => {
    if (chatContainerRef.current && !activeFile) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, activeFile]);

  // Intercept links inside ReactMarkdown to render custom interactive inline capsule chips
  const markdownComponents = {
    a: ({ href, children }: any) => {
      const isDriveLink = href && (href.includes('drive.google.com/open') || href.includes('drive.google.com/file'));
      
      const handleClick = (e: React.MouseEvent) => {
        if (isDriveLink) {
          e.preventDefault();
          try {
            const urlObj = new URL(href);
            const fileId = urlObj.searchParams.get('id');
            if (fileId) {
              const matched = sources.find(s => s.id === fileId || s.driveId === fileId);
              if (matched) {
                setActiveFile(matched);
                setSourceViewMode('preview');
                return;
              }
            }
          } catch (err) {
            console.error("Error parsing link URL:", err);
          }
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      };

      if (isDriveLink) {
        return (
          <a
            href={href}
            onClick={handleClick}
            className="inline-flex items-center gap-1 bg-[#F0F4F9] hover:bg-[#D3E3FD] dark:bg-[#2B2D31] dark:hover:bg-[#3E4042] text-slate-700 dark:text-[#E3E3E3] text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer border border-[#E9EEF6] dark:border-neutral-700 mx-1 select-none decoration-transparent shrink-0"
          >
            {children}
          </a>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {children}
        </a>
      );
    }
  };

  return (
    <div className="w-full h-full flex gap-4 select-text min-h-0 overflow-hidden">
      
      {/* 1. SOURCES SIDEBAR (LEFT PANEL) */}
      <div 
        style={{ width: `${sourcesWidth}px` }}
        className="flex flex-col min-h-0 bg-white dark:bg-[#1E1F22] shrink-0 select-none rounded-[24px] overflow-hidden"
      >
        {/* Header Panel */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0 select-none">
          <h2 className="font-semibold tracking-tight text-gray-800 dark:text-white text-[16px]">
            Library
          </h2>
        </div>

        {/* Add Library Input Field with TypeAhead */}
        <div ref={typeAheadRef} className="px-4 py-2 shrink-0 select-none">
          <div className="relative z-30 w-full h-10 px-3 rounded-full bg-[#EEF2FA] dark:bg-[#282A2D] flex items-center gap-2 text-slate-700 dark:text-slate-200 transition-colors">
            <span 
              className="material-symbols-rounded select-none text-slate-500 dark:text-slate-400 shrink-0" 
              style={{ fontSize: '18px', fontVariationSettings: "'wght' 360" }}
            >
              search
            </span>
            <input
              type="text"
              value={sourceQuery}
              onChange={(e) => {
                setSourceQuery(e.target.value);
                setIsTypeAheadOpen(true);
              }}
              onFocus={() => setIsTypeAheadOpen(true)}
              placeholder="Add files to library"
              className="w-full bg-transparent border-none outline-none font-sans text-slate-700 dark:text-[#E3E3E3] placeholder-slate-500 dark:placeholder-slate-400 text-xs font-medium"
            />

            {isTypeAheadOpen && (sourceQuery.trim().length > 0 || (recentFiles && recentFiles.length > 0)) && (
              <TypeAhead
                mode="open"
                variant="standalone"
                hideHeader={true}
                filteredRecentFiles={filteredRecentFiles}
                apiResults={apiResults}
                filteredRecentPeople={[]}
                isSearchingApi={isSearchingApi}
                onAddContext={() => {}}
                onFileSelect={handleSelectSource}
              />
            )}
          </div>
        </div>

        {/* Sources List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1">
          {sources.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 italic">
              No context files selected
            </div>
          ) : (
            sources.map((file) => (
              <button
                key={file.id || file.driveId}
                onClick={() => {
                  setActiveFile(file);
                  setSourceViewMode('preview');
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition duration-200 cursor-pointer border-none bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 ${
                  activeFile?.id === file.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <img 
                  src={getFileIcon(file.mimeType, file.name)} 
                  alt="File type" 
                  className="w-5 h-5 object-contain shrink-0" 
                />
                <span className="text-[13px] font-sans font-medium text-slate-700 dark:text-[#E3E3E3] truncate">
                  {file.name}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Sources Panel Footer CTA Button */}
        <div className="p-4 pt-0 shrink-0 select-none">
          {isProject ? (
            <Button
              variant="primary"
              onClick={onShareProject}
              className="w-full text-xs h-10 font-medium shadow-none"
              theme={theme}
            >
              Share Project
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={onAddToProject}
              className="w-full text-xs h-10 font-medium"
              theme={theme}
            >
              Add to Project
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center h-full flex-1 min-w-0 min-h-0 relative z-20">
        <div 
          className="sidebar-resizer-grabber -ml-4" 
          onMouseDown={startResizeSources} 
          title="Drag to resize sources panel"
        />
        {/* 2. MAIN VIEWPORT (CENTER / RIGHT PANEL) */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white dark:bg-[#1E1F22] h-full relative rounded-[24px] overflow-hidden">
        
        {activeFile ? (
          /* File Preview Sub-view with standard CanvasTopBar */
          <div className="w-full h-full relative pt-[72px]">
            <CanvasTopBar
              file={activeFile}
              viewMode={sourceViewMode}
              onViewModeChange={setSourceViewMode}
              onClose={() => {
                setActiveFile(null);
              }}
              onExpand={() => {
                // Expanding from inside AI Summary sources is disabled/handled silently
              }}
              appTheme={theme}
            />
            
            <div className="w-full h-full relative">
              <NativeViewer 
                file={activeFile} 
                hideHeader={true} 
                mode={sourceViewMode}
                theme={theme} 
              />
            </div>
          </div>
        ) : (
          /* synthesized AI Summary document */
          <div className="w-full h-full flex flex-col min-h-0 overflow-hidden relative">
            
            {/* Scrollable Summary Panel (Row 1) */}
            <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto px-8 sm:px-16 md:px-24 py-8 pb-12">
              <div className="max-w-3xl mx-auto">
                {/* Messages Turn Loop */}
                {messages.length === 0 ? (
                  <div className="flex items-center gap-3 py-4 text-slate-400 dark:text-neutral-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400 dark:border-neutral-500"></div>
                    <span className="text-sm font-medium font-sans">Reading sources and preparing summary...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-10">
                    {messages.map((msg, idx) => {
                      if (msg.role === 'user') {
                        return (
                          <div key={idx} className="w-full flex flex-col items-end">
                            <UserMessage text={msg.text} theme={theme} />
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="w-full">
                          <BotMessage
                            text={msg.text}
                            theme={theme}
                            variant="summary"
                            sources={sources}
                            onSourceClick={(fileId) => {
                              const matched = sources.find(s => s.id === fileId || s.driveId === fileId);
                              if (matched) {
                                setActiveFile(matched);
                                setSourceViewMode('preview');
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Pinned Pill Input Field (Row 2 - Static Flex Footer) */}
            <div className="shrink-0 p-4 bg-white dark:bg-[#1E1F22] flex justify-center relative z-50 select-none">
              <div className="w-full max-w-[720px] min-h-[56px] py-1 bg-white dark:bg-[#2B2D31]/40 border border-gray-200 dark:border-[#2B2D31] hover:border-gray-300 dark:hover:border-gray-700 shadow-sm focus-within:shadow-md focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-300 flex items-center px-4 relative z-50 rounded-full">
                
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white mr-3 shrink-0 transition cursor-pointer flex items-center justify-center p-1.5 hover:bg-gray-150 dark:hover:bg-white/10 rounded-full"
                  title="Context files are automatically attached"
                >
                  <Plus size={18} className="stroke-[2.5]" />
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask a follow up on this summary..."
                  className="flex-1 bg-transparent border-none outline-none font-sans text-slate-700 dark:text-[#E3E3E3] placeholder-slate-400 text-sm sm:text-[14px] mr-22 h-10"
                  disabled={isLoading}
                />

                {/* Snap to Chat Sidebar Button */}
                <button
                  type="button"
                  onClick={onSnap}
                  className="absolute right-12 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-150 dark:hover:bg-white/10 shrink-0 cursor-pointer"
                  title="Snap to sidebar chat"
                >
                  <span className="material-symbols-rounded text-[20px]">grid_layout_side</span>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || isLoading}
                  className={`absolute right-2 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                    inputValue.trim() && !isLoading
                      ? 'bg-[#1a73e8] hover:bg-[#1557b0] text-white scale-100 cursor-pointer shadow-sm'
                      : 'bg-[#f0f4f9]/50 dark:bg-[#2B2D31]/50 text-gray-350 dark:text-gray-600 scale-95 cursor-not-allowed'
                  }`}
                  title="Send follow-up"
                >
                  <ArrowUp size={16} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
    </div>
  );
}
