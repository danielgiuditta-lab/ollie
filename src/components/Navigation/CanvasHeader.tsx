import React, { useState } from 'react';
import { ChevronRight, X, Pin } from 'lucide-react';
import { themeTokens } from '../../utils/themeTokens';

import { cleanWorkspaceName } from '../Canvas/HomeLanding';

const AvatarCircle = ({ member }: { member: any }) => {
  const [error, setError] = useState(false);

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-3xs ring-2 ring-white dark:ring-[#1E1F22] shrink-0 overflow-hidden bg-blue-500"
      title={`${member.name} (${member.email})`}
    >
      {member.avatar && !error ? (
        <img 
          src={member.avatar} 
          className="w-full h-full object-cover" 
          alt={member.name} 
          onError={() => setError(true)}
        />
      ) : (
        (member.name || 'U').substring(0, 1).toUpperCase()
      )}
    </div>
  );
};

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
  activeProactiveTask?: any;
  activeSpaceId?: string | null;
  onPinArtifact?: (file: any) => void;
  isPinned?: boolean;
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
  theme = 'light',
  activeProactiveTask,
  activeSpaceId,
  onPinArtifact,
  isPinned = false
}: CanvasHeaderProps) {
  const isHome = viewState === 'home';
  const isDark = theme === 'dark';
  const isHomeSpace = !activeSpaceId || String(activeSpaceId).toLowerCase().trim() === 'home' || String(activeSpaceId).toLowerCase().trim() === 'home_guest' || String(activeSpaceId).toLowerCase().trim().startsWith('home_') || String(activeSpaceId).toLowerCase().trim().startsWith('home-') || String(activeSpaceId).toLowerCase().trim() === 'home dashboard';

  // Render shared space members list
  const SharedMembersAvatars = () => {
    if (!members || members.length === 0) return null;

    return (
      <div className="flex items-center -space-x-2 select-none shrink-0 mr-2">
        {members.map((member: any, idx: number) => (
          <AvatarCircle key={member.email || idx} member={member} />
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

    const spaceName = projectName === 'New Space' ? 'New Space' : cleanWorkspaceName(projectName);

    if (!selectedFile && viewState !== 'ai_summary' && !activeProactiveTask) {
      return (
        <span className="text-slate-800 dark:text-white text-lg font-medium">
          {spaceName}
        </span>
      );
    }

    let artifactName = selectedFile ? selectedFile.name : (viewState === 'ai_summary' ? 'Search Summary' : '');
    if (activeProactiveTask) {
      const isDone = activeProactiveTask.status === 'done' || activeProactiveTask.status === 'approved';
      let rawTaskTitle = isDone ? (activeProactiveTask.titleDone || activeProactiveTask.title) : (activeProactiveTask.title || activeProactiveTask.description || 'Task');
      if (rawTaskTitle.length > 38) {
        rawTaskTitle = rawTaskTitle.substring(0, 36).trim() + '...';
      }
      artifactName = rawTaskTitle;
    } else if (artifactName && typeof artifactName === 'string') {
      artifactName = artifactName.replace(/\.(doc|gdoc|gslides|gsheet|docx|pptx|xlsx|pdf|md|csv)$/i, '');
      if (artifactName.toLowerCase() === 'document') artifactName = 'Doc';
      if (artifactName.toLowerCase() === 'presentation') artifactName = 'Slide Deck';
      if (artifactName.toLowerCase() === 'spreadsheet') artifactName = 'Sheet';
      if (artifactName.length > 28) {
        artifactName = artifactName.substring(0, 26).trim() + '...';
      }
    }

    return (
      <div className="flex items-center text-slate-700 dark:text-slate-200 text-lg font-normal font-sans">
        <span 
          onClick={onHomeClick}
          className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition font-medium"
        >
          {spaceName}
        </span>
        <ChevronRight size={18} className="mx-2 text-slate-400 dark:text-slate-500 shrink-0" />
        
        <div className="flex items-center gap-1.5 text-slate-800 dark:text-white font-medium group/title">
          <span>{artifactName}</span>
          <button 
            onClick={selectedFile ? onCloseFile : onCloseWorkspace}
            className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition cursor-pointer border-none outline-none flex items-center justify-center animate-fade-in"
            title={selectedFile ? "Close file" : "Close search"}
          >
            <X size={14} className="text-slate-500 dark:text-slate-400" />
          </button>
          {onPinArtifact && (selectedFile || activeProactiveTask) && (
            <button
              onClick={() => onPinArtifact(selectedFile || activeProactiveTask)}
              className="opacity-0 group-hover/title:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition cursor-pointer border-none outline-none flex items-center justify-center animate-fade-in"
              title={isPinned ? "Unpin from Dashboard" : "Pin to Dashboard"}
            >
              <Pin size={14} className={isPinned ? "text-blue-500 dark:text-blue-400 fill-blue-500/20" : "text-slate-500 dark:text-slate-400"} />
            </button>
          )}
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
        {!isHome && !isHomeSpace && <SharedMembersAvatars />}

        {/* Library side panel toggle button */}
        {onToggleSourcesPanel && (
          <button
            onClick={onToggleSourcesPanel}
            className={`h-10 px-4 rounded-full text-xs font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-0 outline-none shrink-0 ${themeTokens.filledBg} ${themeTokens.filledHoverBg} text-slate-700 dark:text-white`}
            title="Toggle space library panel"
          >
            {isSourcesPanelOpen ? (
              <span className="material-symbols-rounded text-[20px] select-none text-slate-500 dark:text-slate-400">chevron_right</span>
            ) : (
              <span className="material-symbols-rounded text-[20px] select-none text-slate-500 dark:text-slate-400">chevron_left</span>
            )}
            <span>Library</span>
          </button>
        )}
      </div>
    </div>
  );
}
