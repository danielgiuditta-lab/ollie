import React from 'react';
import { ChevronRight, X } from 'lucide-react';

interface CanvasHeaderProps {
  projectName?: string;
  viewState: string;
  onHomeClick: () => void;
  onCloseWorkspace: () => void;
  onCloseFile?: () => void;
  selectedFile?: any;
  members?: any[];
  onOpenInDrive?: (file: any) => void;
  onToggleSourcesPanel?: () => void;
  isSourcesPanelOpen?: boolean;
  peers?: Record<string, any>;
  theme?: 'light' | 'dark';
}

export function CanvasHeader({
  projectName = 'New',
  viewState,
  onHomeClick,
  onCloseWorkspace,
  onCloseFile,
  selectedFile,
  members = [],
  onOpenInDrive,
  onToggleSourcesPanel,
  isSourcesPanelOpen = true,
  peers,
  theme = 'light'
}: CanvasHeaderProps) {
  const isHome = viewState === 'home';
  const isDark = theme === 'dark';

  // Render shared space members list
  const SharedMembersAvatars = () => {
    if (!members || members.length === 0) return null;

    return (
      <div className="flex items-center -space-x-2 select-none shrink-0 mr-2">
        {members.map((member: any, idx: number) => (
          <div
            key={member.email || idx}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-3xs ring-2 ring-white dark:ring-[#1E1F22] shrink-0 overflow-hidden bg-blue-500"
            title={`${member.name} (${member.email})`}
          >
            {member.avatar ? (
              <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
            ) : (
              (member.name || 'U').substring(0, 1).toUpperCase()
            )}
          </div>
        ))}
      </div>
    );
  };

  // Determine native Drive document editor names & Web Link
  const mimeLower = selectedFile?.mimeType?.toLowerCase() || '';
  const nameLower = selectedFile?.name?.toLowerCase() || '';

  const isDoc = mimeLower.includes('document') || nameLower.endsWith('.gdoc') || nameLower.endsWith('.docx') || nameLower.endsWith('.doc');
  const isSheet = mimeLower.includes('spreadsheet') || nameLower.endsWith('.gsheet') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls') || nameLower.endsWith('.csv');
  const isSlide = mimeLower.includes('presentation') || nameLower.endsWith('.gslides') || nameLower.endsWith('.pptx') || nameLower.endsWith('.ppt');
  const isForm = mimeLower.includes('form') || nameLower.includes('form');

  const isNativeDrive = selectedFile && (isDoc || isSheet || isSlide || isForm);

  let editorName = 'Docs';
  let url = 'https://docs.google.com/document';
  if (isSheet) {
    editorName = 'Sheets';
    url = selectedFile?.id ? `https://docs.google.com/spreadsheets/d/${selectedFile.id}/edit` : 'https://docs.google.com/spreadsheets';
  } else if (isSlide) {
    editorName = 'Slides';
    url = selectedFile?.id ? `https://docs.google.com/presentation/d/${selectedFile.id}/edit` : 'https://docs.google.com/presentation';
  } else if (isForm) {
    editorName = 'Forms';
    url = selectedFile?.id ? `https://docs.google.com/forms/d/${selectedFile.id}/edit` : 'https://docs.google.com/forms';
  } else {
    editorName = 'Docs';
    url = selectedFile?.id ? `https://docs.google.com/document/d/${selectedFile.id}/edit` : 'https://docs.google.com/document';
  }

  const renderBreadcrumbs = () => {
    if (isHome) {
      return (
        <span className="text-slate-800 dark:text-white text-lg font-medium">
          Home
        </span>
      );
    }

    const spaceName = projectName === 'New Space' ? 'New Space' : projectName;

    if (!selectedFile && viewState !== 'ai_summary') {
      return (
        <div className="flex items-center gap-1.5 bg-[#003BC4]/5 dark:bg-[#2B2D31] px-3 py-1 rounded-xl text-slate-950 dark:text-white font-semibold">
          <span>{spaceName}</span>
          <button 
            onClick={onCloseWorkspace}
            className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition cursor-pointer border-none outline-none flex items-center justify-center"
            title="Close Space"
          >
            <X size={14} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      );
    }

    const artifactName = selectedFile ? selectedFile.name : (viewState === 'ai_summary' ? 'Search Summary' : '');

    return (
      <div className="flex items-center text-slate-700 dark:text-slate-200 text-lg font-normal font-sans">
        <span 
          onClick={onHomeClick}
          className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition font-medium"
        >
          {spaceName}
        </span>
        <ChevronRight size={18} className="mx-2 text-slate-400 dark:text-slate-500 shrink-0" />
        
        <div className="flex items-center gap-1.5 bg-[#003BC4]/5 dark:bg-[#2B2D31] px-3 py-1 rounded-xl text-slate-950 dark:text-white font-semibold">
          <span>{artifactName}</span>
          <button 
            onClick={selectedFile ? onCloseFile : onCloseWorkspace}
            className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition cursor-pointer border-none outline-none flex items-center justify-center"
            title={selectedFile ? "Close file" : "Close search"}
          >
            <X size={14} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 w-full h-[64px] shrink-0 z-20 relative bg-transparent text-slate-800 dark:text-white select-none">
      <div className="flex items-center gap-2">
        {renderBreadcrumbs()}
      </div>

      <div className="flex items-center gap-3 relative select-none">
        {/* Actual people avatars shared with */}
        {!isHome && <SharedMembersAvatars />}

        {/* Open in drive/editor button */}
        {isNativeDrive && (
          onOpenInDrive ? (
            <button
              onClick={() => onOpenInDrive(selectedFile)}
              className="h-9 px-4 rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-0 outline-none bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 shrink-0"
              title={`Open this in Google ${editorName}`}
            >
              <span>Open in {editorName}</span>
            </button>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] cursor-pointer decoration-transparent focus:outline-none bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 shrink-0"
              title={`Open this in Google ${editorName}`}
            >
              <span>Open in {editorName}</span>
            </a>
          )
        )}

        {/* Sources side panel toggle borderless button with docs symbol */}
        {!isHome && onToggleSourcesPanel && (
          <button
            onClick={onToggleSourcesPanel}
            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition select-none outline-none border-none bg-transparent ${
              isSourcesPanelOpen
                ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
            }`}
            title="Toggle space sources panel"
          >
            <span className="material-symbols-rounded font-medium select-none" style={{ fontSize: '22px' }}>description</span>
          </button>
        )}
      </div>
    </div>
  );
}
