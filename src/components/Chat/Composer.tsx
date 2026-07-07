import React, { useState } from 'react';
import { Plus, ArrowUp, ChevronDown, X } from 'lucide-react';

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
  onCreateArtifact?: (type: 'doc' | 'slide' | 'sheet' | 'pix' | 'site' | 'upload') => void;
}

export function Composer({ 
  disabled, 
  onSend, 
  placeholder, 
  theme = 'light',
  onCreateArtifact	
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

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Main Composer Box Container - Static footprint sizing */}
      <div className={`w-full ${theme === 'dark' ? 'bg-[#131416] border-[#2B2D31]' : 'bg-white border-gray-100'} rounded-3xl p-3 px-4 shadow-sm border flex flex-col gap-2 transition-all duration-300`}>
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
            className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer border-none outline-none bg-transparent ${
              theme === 'dark' 
                ? 'hover:bg-[#282A2D] text-[#9E9E9E] hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
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
            <button className={`h-10 px-4 rounded-full flex items-center gap-1.5 font-medium text-xs transition cursor-pointer border-none outline-none bg-transparent ${
              theme === 'dark'
                ? 'hover:bg-[#282A2D] text-white'
                : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
            }`}>
              <span className={theme === 'dark' ? 'font-semibold text-white' : 'font-semibold text-gray-700'}>Flash</span> Extended <ChevronDown size={14} />
            </button>
            <button 
              onClick={handleSend}
              disabled={!text.trim() || disabled}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition border-none outline-none ${
                text.trim() && !disabled 
                  ? (theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' : 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer') 
                  : (theme === 'dark' ? 'bg-[#2B2D31]/50 text-[#9E9E9E]/40 cursor-not-allowed' : 'bg-[#f0f4f9]/50 text-gray-400 cursor-not-allowed')
              }`}
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Sibling Drawer Row below the composer container with fully transparent area */}
      {isDrawerOpen && (
        <div className="flex items-center justify-around select-none animate-in fade-in slide-in-from-top-1 duration-200 bg-transparent py-1 gap-1">
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
      )}
    </div>
  );
}

