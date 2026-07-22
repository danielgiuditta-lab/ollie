import React, { useState } from 'react';
import { Plus, ArrowUp, ChevronDown, X } from 'lucide-react';
import ollieAvatarSvg from '../../assets/ollie-avatar.svg';

import docsIcon from '../../assets/docs.png';
import sheetsIcon from '../../assets/sheets.png';
import slidesIcon from '../../assets/slides.png';
import htmlIcon from '../../assets/html.png';
import imageIcon from '../../assets/image.png';

interface ComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
  placeholder?: string;
  theme?: 'light' | 'dark';
  isGroupChat?: boolean;
  onCreateArtifact?: (type: 'doc' | 'slide' | 'sheet' | 'pix' | 'site' | 'upload') => void;
  layout?: 'side' | 'bottom';
  onDockToSide?: () => void;
}

export function Composer({ 
  disabled, 
  onSend, 
  placeholder, 
  theme = 'light',
  isGroupChat = false,
  onCreateArtifact,
  layout = 'side',
  onDockToSide
}: ComposerProps) {
  const [text, setText] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderDrawer = () => (
    <div className={`flex items-center justify-around select-none animate-in fade-in duration-200 bg-transparent py-1 gap-1 ${
      layout === 'bottom' ? 'slide-in-from-bottom-1 mb-1' : 'slide-in-from-top-1'
    }`}>
      {/* Doc */}
      <button 
        type="button"
        onClick={() => {
          if (onCreateArtifact) onCreateArtifact('doc');
          setIsDrawerOpen(false);
        }}
        className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-150 active:scale-95 bg-transparent"
      >
        <div className="w-11 h-11 bg-f0f4f9 hover:bg-white rounded-xl flex items-center justify-center shadow-xs group-hover:shadow-sm border border-gray-100 hover:border-blue-200 transition duration-150">
          <img src={docsIcon} alt="Doc" className="w-6 h-6 object-contain" />
        </div>
        <span className="text-[10px] text-slate-500 font-medium font-sans">Doc</span>
      </button>

      {/* Slide */}
      <button 
        type="button"
        onClick={() => {
          if (onCreateArtifact) onCreateArtifact('slide');
          setIsDrawerOpen(false);
        }}
        className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-150 active:scale-95 bg-transparent"
      >
        <div className="w-11 h-11 bg-f0f4f9 hover:bg-white rounded-xl flex items-center justify-center shadow-xs group-hover:shadow-sm border border-gray-100 hover:border-yellow-250 transition duration-150">
          <img src={slidesIcon} alt="Slide" className="w-6 h-6 object-contain" />
        </div>
        <span className="text-[10px] text-slate-500 font-medium font-sans">Slide</span>
      </button>

      {/* Sheet */}
      <button 
        type="button"
        onClick={() => {
          if (onCreateArtifact) onCreateArtifact('sheet');
          setIsDrawerOpen(false);
        }}
        className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-150 active:scale-95 bg-transparent"
      >
        <div className="w-11 h-11 bg-f0f4f9 hover:bg-white rounded-xl flex items-center justify-center shadow-xs group-hover:shadow-sm border border-gray-100 hover:border-emerald-250 transition duration-150">
          <img src={sheetsIcon} alt="Sheet" className="w-6 h-6 object-contain" />
        </div>
        <span className="text-[10px] text-slate-500 font-medium font-sans">Sheet</span>
      </button>

      {/* Pix */}
      <button 
        type="button"
        onClick={() => {
          if (onCreateArtifact) onCreateArtifact('pix');
          setIsDrawerOpen(false);
        }}
        className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-150 active:scale-95 bg-transparent"
      >
        <div className="w-11 h-11 bg-f0f4f9 hover:bg-white rounded-xl flex items-center justify-center shadow-xs group-hover:shadow-sm border border-gray-100 hover:border-red-200 transition duration-150">
          <img src={imageIcon} alt="Pix" className="w-6 h-6 object-contain" />
        </div>
        <span className="text-[10px] text-slate-500 font-medium font-sans">Pix</span>
      </button>

      {/* Site */}
      <button 
        type="button"
        onClick={() => {
          if (onCreateArtifact) onCreateArtifact('site');
          setIsDrawerOpen(false);
        }}
        className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-150 active:scale-95 bg-transparent"
      >
        <div className="w-11 h-11 bg-f0f4f9 hover:bg-white rounded-xl flex items-center justify-center shadow-xs group-hover:shadow-sm border border-gray-100 hover:border-blue-200 transition duration-150">
          <img src={htmlIcon} alt="Site" className="w-6 h-6 object-contain" />
        </div>
        <span className="text-[10px] text-slate-500 font-medium font-sans">Site</span>
      </button>

      {/* Upload */}
      <button 
        type="button"
        onClick={() => {
          if (onCreateArtifact) onCreateArtifact('upload');
          setIsDrawerOpen(false);
        }}
        className="flex flex-col items-center gap-1 group cursor-pointer transition-all duration-150 active:scale-95 bg-transparent"
      >
        <div className="w-11 h-11 bg-f0f4f9 hover:bg-white rounded-xl flex items-center justify-center shadow-xs group-hover:shadow-sm border border-gray-100 hover:border-gray-300 transition duration-150">
          <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <span className="text-[10px] text-slate-500 font-medium font-sans">Upload</span>
      </button>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Sibling Drawer Row ABOVE the composer container in bottom state */}
      {layout === 'bottom' && isDrawerOpen && renderDrawer()}

      {layout === 'bottom' ? (
        /* BOTTOM STATE VISUALS (Horizontal pill design matching the image) */
        <div className="relative w-full">
          {/* Subtle bluish-purple glow background */}
          <div className="absolute -inset-3 bg-gradient-to-r from-[#8B5CF6]/15 via-[#6366F1]/15 to-[#3B82F6]/15 rounded-full blur-2xl -z-10 pointer-events-none" />

          <div className={`w-full h-[72px] ${
            isGroupChat
              ? (theme === 'dark' ? 'bg-[#18191B]/95 border-[#2B2D31] shadow-card' : 'bg-slate-100/95 border-[#E9EEF6] shadow-card')
              : (theme === 'dark' ? 'bg-[#1E1F22]/95 border-[#2B2D31] shadow-card' : 'bg-white/95 border-[#E9EEF6] shadow-card')
          } rounded-full px-5 border flex items-center gap-3.5 backdrop-blur-md transition-all duration-300`}>
            {/* Left Plus Button */}
            <button 
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer border-none outline-none shrink-0 ${
                isGroupChat
                  ? (theme === 'dark' ? 'hover:bg-[#282A2D] text-[#9E9E9E] hover:text-white' : 'hover:bg-slate-200/80 text-slate-600 hover:text-slate-900')
                  : (theme === 'dark' ? 'hover:bg-[#282A2D] text-[#9E9E9E] hover:text-white' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800')
              }`}
              title={isDrawerOpen ? "Close drawer" : "Add or Create Options"}
            >
              {isDrawerOpen ? (
                <X size={20} className="stroke-[2.5]" />
              ) : (
                <img src={ollieAvatarSvg} alt="Ollie" className="w-5 h-5 object-contain grayscale opacity-90" />
              )}
            </button>

            {/* Input text area */}
            <div className="flex-1 min-w-0 h-full flex items-center">
              <textarea
                placeholder={placeholder || "Search, add files or tell me what you want to build..."}
                rows={1}
                className={`w-full bg-transparent resize-none outline-none text-[15px] ${
                  theme === 'dark' ? 'text-[#E3E3E3] placeholder-[#9E9E9E]' : 'text-slate-800 placeholder-slate-400'
                } py-1.5 max-h-[48px] min-h-[30px] border-none ring-0 focus:ring-0 focus:border-none focus:outline-none overflow-y-auto align-middle`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                style={{ scrollbarWidth: 'none' }}
              />
            </div>

            {/* Action buttons (Dock to side & Send) */}
            <div className="flex items-center gap-2 shrink-0">
              {onDockToSide && (
                <button
                  onClick={onDockToSide}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer border-none outline-none ${
                    isGroupChat
                      ? (theme === 'dark' ? 'hover:bg-[#282A2D] text-[#9E9E9E] hover:text-white' : 'hover:bg-slate-200/80 text-slate-600 hover:text-slate-850')
                      : (theme === 'dark' ? 'hover:bg-[#282A2D] text-[#9E9E9E] hover:text-white' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-850')
                  }`}
                  title="Dock to side"
                >
                  <span className="material-symbols-rounded text-[22px] select-none">dock_to_right</span>
                </button>
              )}

              <button 
                onClick={handleSend}
                disabled={!text.trim() || disabled}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition border-none outline-none ${
                  text.trim() && !disabled 
                    ? (theme === 'dark' ? 'bg-[#0B57D0] text-white hover:bg-blue-750 cursor-pointer' : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer') 
                    : (isGroupChat 
                        ? (theme === 'dark' ? 'bg-transparent text-[#9E9E9E]/40 cursor-not-allowed' : 'bg-transparent text-slate-400 cursor-not-allowed')
                        : (theme === 'dark' ? 'bg-[#2B2D31]/50 text-[#9E9E9E]/40 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')
                      )
                }`}
              >
                <ArrowUp size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ORIGINAL SIDE STATE VISUALS (Group Chat background aware) */
        <div className={`w-full ${
          isGroupChat
            ? (theme === 'dark' ? 'bg-[#18191B] border-[#2B2D31]' : 'bg-slate-100/90 border-[#E9EEF6]')
            : (theme === 'dark' ? 'bg-[#131416] border-[#2B2D31]' : 'bg-white border-[#E9EEF6]')
        } rounded-3xl p-3 px-4 shadow-card border flex flex-col gap-2 transition-all duration-300`}>
          <textarea
            placeholder={placeholder || "what do you want to build?"}
            className={`w-full bg-transparent resize-none outline-none text-sm ${theme === 'dark' ? 'text-[#E3E3E3] placeholder-[#9E9E9E]' : 'text-gray-800 placeholder-gray-500'} py-2 max-h-32 min-h-12 border-none ring-0 focus:ring-0 focus:border-none focus:outline-none`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
          <div className="flex items-center justify-between mt-2">
            <button 
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer border-none outline-none ${
                isGroupChat
                  ? (theme === 'dark' ? 'hover:bg-[#282A2D] text-[#9E9E9E] hover:text-white' : 'hover:bg-slate-200/80 text-slate-600 hover:text-slate-900')
                  : (theme === 'dark' ? 'hover:bg-[#282A2D] text-[#9E9E9E] hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800')
              }`}
              title={isDrawerOpen ? "Close drawer" : "Add or Create Options"}
            >
              {isDrawerOpen ? (
                <X size={20} className="stroke-[2.5]" />
              ) : (
                <Plus size={20} className="stroke-[2.5]" />
              )}
            </button>
            <div className="flex items-center gap-3">
              <button className={`h-10 px-4 rounded-full flex items-center gap-1.5 font-medium text-xs transition cursor-pointer border-none outline-none ${
                isGroupChat
                  ? (theme === 'dark' ? 'hover:bg-[#282A2D] text-white' : 'hover:bg-slate-200/80 text-slate-700 hover:text-slate-900')
                  : (theme === 'dark' ? 'hover:bg-[#282A2D] text-white' : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900')
              }`}>
                <span className={theme === 'dark' ? 'font-semibold text-white' : 'font-semibold text-gray-700'}>Flash</span> Extended <ChevronDown size={14} />
              </button>
              <button 
                onClick={handleSend}
                disabled={!text.trim() || disabled}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition border-none outline-none ${
                  text.trim() && !disabled 
                    ? (theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer') 
                    : (isGroupChat 
                        ? (theme === 'dark' ? 'bg-transparent text-[#9E9E9E]/40 cursor-not-allowed' : 'bg-transparent text-slate-400 cursor-not-allowed')
                        : (theme === 'dark' ? 'bg-[#2B2D31]/50 text-[#9E9E9E]/40 cursor-not-allowed' : 'bg-[#f0f4f9]/50 text-gray-400 cursor-not-allowed')
                      )
                }`}
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sibling Drawer Row BELOW the composer container when in side state */}
      {layout !== 'bottom' && isDrawerOpen && renderDrawer()}
    </div>
  );
}

