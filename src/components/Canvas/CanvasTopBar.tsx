import React from 'react';
import { X, Maximize2, ExternalLink } from 'lucide-react';
import { IconButton } from '../Shared/IconButton';

interface CanvasTopBarProps {
  file: any;
  viewMode: 'file' | 'preview';
  onViewModeChange: (mode: 'file' | 'preview') => void;
  onClose: () => void;
  onExpand: () => void;
  onOpenInDrive?: (file: any) => void;
  appTheme?: 'light' | 'dark';
}

export function CanvasTopBar({
  file,
  viewMode,
  onViewModeChange,
  onClose,
  onExpand,
  onOpenInDrive,
  appTheme = 'light'
}: CanvasTopBarProps) {
  if (!file) return null;

  const nameLower = file.name?.toLowerCase() || '';
  const mimeLower = file.mimeType?.toLowerCase() || '';
  const isDark = appTheme === 'dark';

  // 1. Previewable code: html or markdown
  const isPreviewable = 
    nameLower.endsWith('.html') || 
    nameLower.endsWith('.htm') || 
    nameLower.endsWith('.md') || 
    nameLower.endsWith('.markdown') ||
    nameLower === 'index.html';

  // 2. Native drive artifacts (Google Docs, Sheets, Slides, Forms)
  const isDoc = mimeLower.includes('document') || nameLower.endsWith('.gdoc') || nameLower.endsWith('.docx') || nameLower.endsWith('.doc');
  const isSheet = mimeLower.includes('spreadsheet') || nameLower.endsWith('.gsheet') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls') || nameLower.endsWith('.csv');
  const isSlide = mimeLower.includes('presentation') || nameLower.endsWith('.gslides') || nameLower.endsWith('.pptx') || nameLower.endsWith('.ppt');
  const isForm = mimeLower.includes('form') || nameLower.includes('form');

  const isNativeDrive = !isPreviewable && (isDoc || isSheet || isSlide || isForm);

  // 3. Simple Close Button component matching screenshot (round, dynamic bg based on theme, hover)
  const CloseButton = () => (
    <button
      onClick={onClose}
      className="w-[40px] h-[40px] rounded-full flex items-center justify-center cursor-pointer transition select-none outline-none shrink-0 bg-[#003BC4]/5 dark:bg-[#282A2D] hover:bg-[#003BC4]/10 dark:hover:bg-[#35373A] text-slate-800 dark:text-white border-0"
      title="Close file"
      id="canvas-topbar-close"
    >
      <X size={18} className="stroke-[2.2] text-slate-800 dark:text-white" />
    </button>
  );

  // 4. Simple Expand Button component matching screenshot (round, dynamic bg, hover, Maximize2 icon)
  const ExpandButton = () => (
    <button
      onClick={onExpand}
      className="w-[40px] h-[40px] rounded-full flex items-center justify-center cursor-pointer transition select-none outline-none shrink-0 bg-[#003BC4]/5 dark:bg-[#282A2D] hover:bg-[#003BC4]/10 dark:hover:bg-[#35373A] text-slate-800 dark:text-white border-0"
      title="Expand to projector fullscreen"
      id="canvas-topbar-expand"
    >
      <Maximize2 size={16} className="stroke-[2.2] text-slate-800 dark:text-white" />
    </button>
  );

  // Layout 1: Previewable code (html / markdown)
  if (isPreviewable) {
    return (
      <div 
        id="canvas-topbar-previewable"
        className="absolute top-0 left-0 right-0 h-[72px] flex items-center justify-between px-4 pt-4 pb-4 z-30 select-none animate-in fade-in duration-200 transition-colors bg-white dark:bg-[#1E1F22]"
      >
        {/* Left: Close button */}
        <div className="flex items-center">
          <CloseButton />
        </div>

        {/* Center: Segmented controllers (Raw / Preview) */}
        <div className="flex p-0.5 rounded-full transition-colors duration-300 bg-[#003BC4]/5 dark:bg-[#282A2D]">
          <button
            onClick={() => onViewModeChange('file')}
            className={`px-6 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              viewMode === 'file'
                ? 'bg-white dark:bg-[#1E1F22] text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Raw
          </button>
          <button
            onClick={() => onViewModeChange('preview')}
            className={`px-6 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white dark:bg-[#1E1F22] text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Preview
          </button>
        </div>

        {/* Right: Expand (dual arrows pointing outwards) */}
        <div className="flex items-center">
          <ExpandButton />
        </div>
      </div>
    );
  }

  // Layout 2: Native Drive Artifacts
  if (isNativeDrive) {
    // Determine Editor type and safe link URL
    let editorName = 'Docs';
    let url = 'https://docs.google.com/document';
    const driveId = file.driveId || (file.id && !String(file.id).includes('copied') && !String(file.id).includes('sandbox') && !String(file.id).includes('suggested') && !String(file.id).includes('uploaded') && !String(file.id).includes('created-') && !String(file.id).includes('ingested-') ? file.id : null);

    if (isSheet) {
      editorName = 'Sheets';
      url = driveId ? `https://docs.google.com/spreadsheets/d/${driveId}/edit` : 'https://docs.google.com/spreadsheets';
    } else if (isSlide) {
      editorName = 'Slides';
      url = driveId ? `https://docs.google.com/presentation/d/${driveId}/edit` : 'https://docs.google.com/presentation';
    } else if (isForm) {
      editorName = 'Forms';
      url = driveId ? `https://docs.google.com/forms/d/${driveId}/edit` : 'https://docs.google.com/forms';
    } else {
      editorName = 'Docs';
      url = driveId ? `https://docs.google.com/document/d/${driveId}/edit` : 'https://docs.google.com/document';
    }

    return (
      <div 
        id="canvas-topbar-native"
        className="absolute top-0 left-0 right-0 h-[72px] flex items-center justify-between px-4 pt-4 pb-4 z-30 select-none animate-in fade-in duration-200 transition-colors bg-white dark:bg-[#1E1F22]"
      >
        {/* Left: Close button */}
        <div className="flex items-center">
          <CloseButton />
        </div>

        {/* Center: Empty */}
        <div className="flex-1" />

        {/* Right: Open in Native Editor Pill Button */}
        <div className="flex items-center">
          {onOpenInDrive ? (
            <button
              onClick={() => onOpenInDrive(file)}
              className="h-10 px-5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center hover:scale-105 cursor-pointer border-0 outline-none bg-[#003BC4]/5 dark:bg-[#282A2D] hover:bg-[#003BC4]/10 dark:hover:bg-[#35373A] text-slate-800 dark:text-white"
              title={`Open this in Google ${editorName}`}
            >
              <span>Open in {editorName}</span>
            </button>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center hover:scale-105 cursor-pointer decoration-transparent focus:outline-none bg-[#003BC4]/5 dark:bg-[#282A2D] hover:bg-[#003BC4]/10 dark:hover:bg-[#35373A] text-slate-800 dark:text-white"
              title={`Open this in Google ${editorName}`}
            >
              <span>Open in {editorName}</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  // Layout 3: Non-native, non-runnable formats (e.g. photos/PDFs or other custom types)
  return (
    <div 
      id="canvas-topbar-other"
      className="absolute top-0 left-0 right-0 h-[72px] flex items-center justify-between px-4 pt-4 pb-4 z-30 select-none animate-in fade-in duration-200 transition-colors bg-white dark:bg-[#1E1F22]"
    >
      {/* Left: Close button */}
      <div className="flex items-center">
        <CloseButton />
      </div>

      {/* Center: Empty */}
      <div className="flex-1" />

      {/* Right: Expand to projector fullscreen */}
      <div className="flex items-center">
        <ExpandButton />
      </div>
    </div>
  );
}
