import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, ArrowUp, X, Sparkles, FileText, User } from 'lucide-react';
import ollieAvatarSvg from '../../assets/ollie-avatar.svg';
import { OllieMascot } from '../Shared/OllieMascot';
import { AIModeButton } from '../Shared/AIModeButton';
import { RainbowRimOverlay } from '../Shared/RainbowRimOverlay';
import { TypeAhead } from './TypeAhead';
import { getChipIcon, ContextChip } from '../Shared/SourceChip';

import docsIcon from '../../assets/docs.png';
import sheetsIcon from '../../assets/sheets.png';
import slidesIcon from '../../assets/slides.png';
import htmlIcon from '../../assets/html.png';
import imageIcon from '../../assets/image.png';

const AimodeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 17A7 7 0 1 0 10 3a7 7 0 0 0 0 14z" />
    <path d="m21 21-6-6" />
    <path d="M13 3.5l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="currentColor" stroke="none" />
  </svg>
);

interface LandingInputProps {
  onSubmit?: (val: string, aiMode?: boolean, contextFiles?: any[]) => void;
  onChange?: (val: string) => void;
  onFileSelect?: (file: any) => void;
  placeholder?: string;
  onCreateArtifact?: (type: 'doc' | 'slide' | 'sheet' | 'pix' | 'site' | 'upload') => void;
  theme?: 'light' | 'dark';
  mode?: 'search' | 'create';
  defaultDrawerOpen?: boolean;
  accessToken?: string | null;
  recentItems?: any[];
  userProfile?: any;
  defaultAiMode?: boolean;
}

export function LandingInput({ 
  onSubmit, 
  onChange,
  onFileSelect,
  placeholder = "Create or add...",
  onCreateArtifact,
  theme = 'light',
  mode = 'create',
  defaultDrawerOpen = false,
  accessToken = null,
  recentItems = [],
  userProfile,
  defaultAiMode = false
}: LandingInputProps) {
  const [value, setValue] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(defaultDrawerOpen);
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [aiMode, setAiMode] = useState(defaultAiMode);

  // Selected work contexts (people or files)
  const [selectedContexts, setSelectedContexts] = useState<any[]>([]);
  const [apiResults, setApiResults] = useState<any[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync drawer open state when defaultDrawerOpen changes
  React.useEffect(() => {
    setIsDrawerOpen(defaultDrawerOpen);
  }, [defaultDrawerOpen]);

  // Click outside to close context dropdown
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPlusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isTypeAheadVisible = mode === 'search' && (aiMode ? isPlusOpen : (isPlusOpen || value.trim().length > 0));

  // Debounced API search for Google Drive matching files
  React.useEffect(() => {
    if (!value.trim() || mode !== 'search' || !accessToken || !isTypeAheadVisible) {
      setApiResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const q = `trashed = false and name contains '${value.replace(/'/g, "\\'")}'`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=8&fields=files(id,name,mimeType,owners)`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
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
  }, [value, accessToken, mode, isTypeAheadVisible]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (value.trim() || selectedContexts.length > 0)) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((value.trim() || selectedContexts.length > 0) && onSubmit) {
      let prefix = '';
      if (selectedContexts.length > 0) {
        prefix = selectedContexts.map(c => `[Context ${c.type}: ${c.name}]`).join(' ') + ' ';
      }
      onSubmit(prefix + value, aiMode, selectedContexts);
      setValue('');
      setSelectedContexts([]);
      setIsPlusOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    if (onChange) {
      onChange(val);
    }
  };

  const handleAddContext = (item: { id: string; name: string; mimeType?: string; type: 'file' | 'person' }) => {
    if (!selectedContexts.some(c => c.id === item.id)) {
      setSelectedContexts(prev => [...prev, item]);
    }
    setIsPlusOpen(false);
  };

  const handleFileSelectFromTypeAhead = (file: any) => {
    if (onFileSelect) {
      onFileSelect(file);
    }
    setValue('');
    setIsPlusOpen(false);
  };

  const handleRemoveContext = (id: string) => {
    setSelectedContexts(prev => prev.filter(c => c.id !== id));
  };

  // Filter local recent files
  const recentFiles = (recentItems || []).filter(item => item.type === 'file' || item.isReal);

  // Extract unique owners (people) from recent items list
  const recentPeople = React.useMemo(() => {
    const peopleMap = new Map<string, { name: string; email?: string; photoLink?: string }>();
    (recentItems || []).forEach(item => {
      if (item.owners && Array.isArray(item.owners)) {
        item.owners.forEach((owner: any) => {
          if (owner.displayName) {
            peopleMap.set(owner.displayName, {
              name: owner.displayName,
              email: owner.emailAddress,
              photoLink: owner.photoLink || owner.picture
            });
          }
        });
      }
    });

    if (peopleMap.size === 0) {
      peopleMap.set("Sakura Okoro", { name: "Sakura Okoro", email: "sakura@example.com" });
      peopleMap.set("Malik Harold", { name: "Malik Harold", email: "malik@example.com" });
      peopleMap.set("Adam Lee", { name: "Adam Lee", email: "adam@example.com" });
    }
    return Array.from(peopleMap.values());
  }, [recentItems]);

  const query = value.toLowerCase().trim();
  const filteredRecentFiles = recentFiles.filter(f => f.name.toLowerCase().includes(query));
  const filteredRecentPeople = recentPeople.filter(p => p.name.toLowerCase().includes(query));

  return (
    <div 
      id="landing-input-container" 
      ref={containerRef}
      className="w-full max-w-[720px] mx-auto select-none flex flex-col relative px-4 mt-8 mb-16 z-40"
    >
      {/* Main Input Field Wrapper with flex-wrap to accommodate chips dynamically */}
      <div className="relative w-full p-[1px] transition-all duration-300 rounded-full z-40">
        {/* Animated Rainbow Border when AI Mode is active */}
        <RainbowRimOverlay active={aiMode} borderRadiusClass="rounded-full" />

        <motion.div 
          layoutId="landing-input-main"
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full min-h-[64px] py-2 ${theme === 'dark' ? 'bg-[#1E1F22] text-white border-[#2B2D31]' : 'bg-white dark:bg-[#1E1F22] border-gray-200 dark:border-[#2B2D31]'} border ${
            aiMode 
              ? 'border-transparent' 
              : 'hover:border-gray-300 dark:hover:border-gray-700 shadow-sm focus-within:shadow-md focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100'
          } transition-all duration-300 flex items-center flex-wrap px-6 relative z-50 rounded-full`}
        >
          {/* Left icon toggle indicator for search mode */}
          {(mode === 'search' && aiMode) && (
            <button
              type="button"
              onClick={() => {
                setIsPlusOpen(!isPlusOpen);
              }}
              className="text-gray-650 hover:text-gray-900 dark:hover:text-white mr-4 shrink-0 transition cursor-pointer flex items-center justify-center p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"
              title={isPlusOpen ? "Close context menu" : "Add files or people context"}
            >
              {isPlusOpen ? (
                <X id="landing-input-plus" size={20} className="stroke-[2.5]" />
              ) : (
                <OllieMascot size={20} state="idle" followCursor={true} />
              )}
            </button>
          )}

          {/* Selected Context Chips matching AI mode summary style */}
          {mode === 'search' && selectedContexts.map((context) => (
            <ContextChip 
              key={context.id}
              name={context.name}
              mimeType={context.mimeType}
              type={context.type}
              onRemove={() => handleRemoveContext(context.id)}
            />
          ))}
          
          {/* Main Input Text Field */}
          <input 
            id="landing-input-field"
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder || (aiMode ? "Search and get AI summaries of your Drive files..." : "Create or add...")}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            className={`flex-1 bg-transparent border-none outline-none font-sans text-slate-700 dark:text-[#E3E3E3] placeholder-slate-400 text-sm sm:text-[15px] ${mode === 'create' ? 'mr-14' : 'mr-44'} min-w-0 truncate placeholder:truncate h-12`}
          />

          {/* AI Mode Sparkles Toggle Button */}
          {mode !== 'create' && (
            <div className="absolute right-15 flex items-center justify-center z-20">
              <AIModeButton 
                aiMode={aiMode} 
                onToggle={() => { 
                  if (aiMode) {
                    setSelectedContexts([]);
                  }
                  setAiMode(!aiMode); 
                  setIsPlusOpen(false); 
                }} 
                theme={theme} 
              />
            </div>
          )}

          {/* Right Arrow Submission Button */}
          <button
            id="landing-input-submit"
            onClick={handleSubmit}
            disabled={!value.trim() && selectedContexts.length === 0}
            className={`absolute right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
              (value.trim() || selectedContexts.length > 0)
                ? 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900 text-white scale-100 cursor-pointer shadow-md' 
                : 'bg-[#f0f4f9]/50 dark:bg-[#2B2D31]/50 text-gray-300 dark:text-gray-600 scale-95 cursor-not-allowed'
            }`}
            title="Submit request"
          >
            <ArrowUp size={18} className="stroke-[2.5]" />
          </button>
        </motion.div>
      </div>

      {/* 1. TypeAhead Component for Search mode */}
      {isTypeAheadVisible && (
        <TypeAhead 
          mode={(aiMode && isPlusOpen) ? 'context' : 'open'}
          filteredRecentFiles={filteredRecentFiles}
          apiResults={apiResults}
          filteredRecentPeople={filteredRecentPeople}
          isSearchingApi={isSearchingApi}
          onAddContext={handleAddContext}
          onFileSelect={handleFileSelectFromTypeAhead}
          userProfile={userProfile}
        />
      )}

      {/* 2. Creation Drawer for Creation mode */}
      {mode === 'create' && (
        <div className="bg-[#F0F4F9] dark:bg-[#2B2D31] rounded-b-[28px] -mt-8 pt-12 pb-6 px-2 sm:px-6 select-none animate-in fade-in slide-in-from-top-2 duration-300 flex items-center justify-around gap-1 relative z-20">
          {/* Doc */}
          <button 
            type="button"
            onClick={() => {
              if (onCreateArtifact) onCreateArtifact('doc');
            }}
            className="flex flex-col items-center gap-2 group cursor-pointer transition-all duration-200 active:scale-95 bg-transparent"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition duration-200">
              <img src={docsIcon} alt="Doc" className="w-11 h-11 sm:w-12 sm:h-12 object-contain transition duration-200 group-hover:scale-110" />
            </div>
            <span className="text-[11px] sm:text-xs text-slate-600 font-medium font-sans">Doc</span>
          </button>

          {/* Sheet */}
          <button 
            type="button"
            onClick={() => {
              if (onCreateArtifact) onCreateArtifact('sheet');
            }}
            className="flex flex-col items-center gap-2 group cursor-pointer transition-all duration-200 active:scale-95 bg-transparent"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition duration-200">
              <img src={sheetsIcon} alt="Sheet" className="w-11 h-11 sm:w-12 sm:h-12 object-contain transition duration-200 group-hover:scale-110" />
            </div>
            <span className="text-[11px] sm:text-xs text-slate-600 font-medium font-sans">Sheet</span>
          </button>

          {/* Slide */}
          <button 
            type="button"
            onClick={() => {
              if (onCreateArtifact) onCreateArtifact('slide');
            }}
            className="flex flex-col items-center gap-2 group cursor-pointer transition-all duration-200 active:scale-95 bg-transparent"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition duration-200">
              <img src={slidesIcon} alt="Slide" className="w-11 h-11 sm:w-12 sm:h-12 object-contain transition duration-200 group-hover:scale-110" />
            </div>
            <span className="text-[11px] sm:text-xs text-slate-600 font-medium font-sans">Slide</span>
          </button>

          {/* App */}
          <button 
            type="button"
            onClick={() => {
              if (onCreateArtifact) onCreateArtifact('site');
            }}
            className="flex flex-col items-center gap-2 group cursor-pointer transition-all duration-200 active:scale-95 bg-transparent"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition duration-200">
              <img src={htmlIcon} alt="App" className="w-11 h-11 sm:w-12 sm:h-12 object-contain transition duration-200 group-hover:scale-110" />
            </div>
            <span className="text-[11px] sm:text-xs text-slate-600 font-medium font-sans">App</span>
          </button>

          {/* Pix */}
          <button 
            type="button"
            onClick={() => {
              if (onCreateArtifact) onCreateArtifact('pix');
            }}
            className="flex flex-col items-center gap-2 group cursor-pointer transition-all duration-200 active:scale-95 bg-transparent"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition duration-200">
              <img src={imageIcon} alt="Pix" className="w-11 h-11 sm:w-12 sm:h-12 object-contain transition duration-200 group-hover:scale-110" />
            </div>
            <span className="text-[11px] sm:text-xs text-slate-600 font-medium font-sans">Pix</span>
          </button>

          {/* Upload */}
          <button 
            type="button"
            onClick={() => {
              if (onCreateArtifact) onCreateArtifact('upload');
            }}
            className="flex flex-col items-center gap-2 group cursor-pointer transition-all duration-200 active:scale-95 bg-transparent"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition duration-200">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-650 transition duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-600 font-medium font-sans">Upload</span>
          </button>
        </div>
      )}
    </div>
  );
}
