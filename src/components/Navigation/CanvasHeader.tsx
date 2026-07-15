import React, { useState, useEffect } from 'react';
import { ChevronRight, X, Pin } from 'lucide-react';
import { themeTokens } from '../../utils/themeTokens';

import { cleanWorkspaceName } from '../Canvas/HomeLanding';

import { getAvatarForPerson } from '../../utils/personAvatars';

const AvatarCircle = ({ member }: { member: any }) => {
  const [error, setError] = useState(false);
  const name = typeof member === 'string' ? member : (member?.name || '');
  const avatarUrl = (member && typeof member === 'object' && member.avatar) ? member.avatar : getAvatarForPerson(name);

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-3xs ${themeTokens.groupChat.facepileRing} shrink-0 overflow-hidden bg-blue-500`}
      title={name ? (typeof member === 'object' && member.email ? `${name} (${member.email})` : name) : 'User'}
    >
      {avatarUrl && !error ? (
        <img 
          src={avatarUrl} 
          className="w-full h-full object-cover" 
          alt={name} 
          onError={() => setError(true)}
        />
      ) : (
        (name || 'U').substring(0, 1).toUpperCase()
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
  onPinArtifact?: (file: any, targetSpaceId?: string) => void;
  onUnpinArtifact?: (fileId: string, targetSpaceId?: string) => void;
  getSpacePins?: (spaceId: string | null) => string[];
  getHomeChatId?: () => string;
  isPinned?: boolean;
  projects?: any[];
  recentTasks?: any[];
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
  onUnpinArtifact,
  getSpacePins,
  getHomeChatId,
  isPinned = false,
  projects = [],
  recentTasks = []
}: CanvasHeaderProps) {
  const [isPinMenuOpen, setIsPinMenuOpen] = useState(false);
  const isHome = viewState === 'home';
  const isDark = theme === 'dark';
  const isHomeSpace = !activeSpaceId || String(activeSpaceId).toLowerCase().trim() === 'home' || String(activeSpaceId).toLowerCase().trim() === 'home_guest' || String(activeSpaceId).toLowerCase().trim().startsWith('home_') || String(activeSpaceId).toLowerCase().trim().startsWith('home-') || String(activeSpaceId).toLowerCase().trim() === 'home dashboard';

  useEffect(() => {
    if (!isPinMenuOpen) return;
    const handleClickOutside = () => setIsPinMenuOpen(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isPinMenuOpen]);

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

    const parentSpaceObj = (projects || []).find((p: any) => p && (p.id === activeSpaceId || p.activeSpaceId === activeSpaceId)) ||
                           (recentTasks || []).find((t: any) => t && (t.id === activeSpaceId || (t.type === 'space' && t.activeSpaceId === activeSpaceId)));
    const rawSpaceName = isHomeSpace ? 'Home' : (parentSpaceObj?.name || parentSpaceObj?.chatName || projectName);
    const spaceName = isHomeSpace ? 'Home' : (rawSpaceName === 'New Space' ? 'New Space' : cleanWorkspaceName(rawSpaceName));

    if (!selectedFile && viewState !== 'ai_summary' && !activeProactiveTask) {
      return (
        <span className="text-slate-800 dark:text-white text-lg font-medium">
          {spaceName}
        </span>
      );
    }

    let artifactName = selectedFile ? selectedFile.name : (viewState === 'ai_summary' ? 'Search Summary' : '');
    const isTodoArtifact = selectedFile && (selectedFile.isInferredTask || selectedFile.taskType === 'inferred' || selectedFile.id === 'todo-card' || selectedFile.name?.toLowerCase() === 'inferred_tasks.json' || selectedFile.name === 'To-dos');
    const isHtmlArtifact = selectedFile && selectedFile.name && (selectedFile.name.toLowerCase().endsWith('.html') || selectedFile.name.toLowerCase() === 'index.html');

    if (isTodoArtifact) {
      artifactName = 'To-dos';
    } else if (isHtmlArtifact) {
      let extractedTitle = selectedFile.title;
      if (!extractedTitle && selectedFile.content && typeof selectedFile.content === 'string') {
        const titleMatch = selectedFile.content.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1] && titleMatch[1].trim() !== 'App' && titleMatch[1].trim() !== 'My Web Workspace' && titleMatch[1].trim() !== 'New Site Workspace') {
          extractedTitle = titleMatch[1].trim();
        }
      }
      if (!extractedTitle && selectedFile.chatName && selectedFile.chatName !== 'Custom Tool' && selectedFile.chatName !== 'New Site Workspace') {
        extractedTitle = selectedFile.chatName;
      }
      const matchingTask = !extractedTitle ? (recentTasks || []).find((t: any) => t && (t.associatedFileId === selectedFile?.id || t.associatedFileId === selectedFile?.driveId || t.id === selectedFile?.chatId)) : null;
      if (!extractedTitle && matchingTask?.chatName && matchingTask.chatName !== 'Custom Tool' && matchingTask.chatName !== 'New Site Workspace') {
        extractedTitle = matchingTask.chatName;
      }
      if (extractedTitle) {
        artifactName = extractedTitle;
      } else {
        artifactName = selectedFile.name.replace(/\.(html|htm)$/i, '');
        if (artifactName.toLowerCase() === 'index') artifactName = 'Custom Tool';
      }
    } else if (activeProactiveTask) {
      const isDone = activeProactiveTask.status === 'done' || activeProactiveTask.status === 'approved';
      let rawTaskTitle = isDone ? (activeProactiveTask.titleDone || activeProactiveTask.title) : (activeProactiveTask.title || activeProactiveTask.description || 'Task');
      if (rawTaskTitle.length > 38) {
        rawTaskTitle = rawTaskTitle.substring(0, 36).trim() + '...';
      }
      artifactName = rawTaskTitle;
    } else if (artifactName && typeof artifactName === 'string') {
      artifactName = artifactName.replace(/\.(doc|gdoc|gslides|gsheet|docx|pptx|xlsx|pdf|md|csv|html|htm)$/i, '');
      if (artifactName.toLowerCase() === 'document') artifactName = 'Doc';
      if (artifactName.toLowerCase() === 'presentation') artifactName = 'Slide Deck';
      if (artifactName.toLowerCase() === 'spreadsheet') artifactName = 'Sheet';
    }

    if (artifactName && artifactName.length > 28) {
      artifactName = artifactName.substring(0, 26).trim() + '...';
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
          {onPinArtifact && (selectedFile || activeProactiveTask) && (() => {
            const activeFile = selectedFile || activeProactiveTask;
            const fileId = activeFile?.id || activeFile?.driveId;
            const homeChatId = getHomeChatId ? getHomeChatId() : 'home';

            const spaceTargetId = activeSpaceId && !isHomeSpace ? activeSpaceId : (activeFile?.activeSpaceId || activeFile?.folderId);
            const hasSpaceTarget = spaceTargetId && String(spaceTargetId).toLowerCase().trim() !== 'home' && String(spaceTargetId).toLowerCase().trim() !== 'home_guest' && !String(spaceTargetId).toLowerCase().trim().startsWith('home_') && !String(spaceTargetId).toLowerCase().trim().startsWith('home-');

            const spacePins = (getSpacePins && hasSpaceTarget) ? getSpacePins(spaceTargetId) : [];
            const homePins = getSpacePins ? getSpacePins(homeChatId) : [];

            const isPinnedToSpace = !!(fileId && spacePins.includes(fileId));
            const isPinnedToHome = !!(fileId && homePins.includes(fileId));
            const isPinnedAnywhere = isPinnedToSpace || isPinnedToHome || isPinned;

            return (
              <div className="relative inline-flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPinMenuOpen(prev => !prev);
                  }}
                  className="opacity-80 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition cursor-pointer border-none outline-none flex items-center justify-center animate-fade-in ml-1"
                  title="Pin options"
                >
                  <Pin size={14} className={isPinnedAnywhere ? "text-blue-500 dark:text-blue-400 fill-blue-500/20" : "text-slate-500 dark:text-slate-400"} />
                </button>

                {isPinMenuOpen && (
                  <div 
                    className="absolute top-full left-0 mt-1.5 z-[9999] bg-white dark:bg-[#2B2D31] rounded-xl border border-slate-200 dark:border-white/10 shadow-xl p-1 min-w-[190px] animate-in fade-in zoom-in-95 duration-100 select-none text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hasSpaceTarget && spaceName && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isPinnedToSpace) {
                            if (onUnpinArtifact) onUnpinArtifact(fileId, spaceTargetId);
                          } else {
                            onPinArtifact(activeFile, spaceTargetId);
                          }
                          setIsPinMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 transition-colors cursor-pointer outline-none mb-0.5 whitespace-nowrap"
                      >
                        <Pin size={14} className={isPinnedToSpace ? "text-blue-500 fill-blue-500/20 shrink-0" : "text-slate-400 shrink-0"} />
                        <span>{isPinnedToSpace ? `Unpin from ${spaceName}` : `Pin to ${spaceName}`}</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPinnedToHome) {
                          if (onUnpinArtifact) onUnpinArtifact(fileId, homeChatId);
                        } else {
                          onPinArtifact(activeFile, homeChatId);
                        }
                        setIsPinMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 transition-colors cursor-pointer outline-none whitespace-nowrap"
                    >
                      <Pin size={14} className={isPinnedToHome ? "text-blue-500 fill-blue-500/20 shrink-0" : "text-slate-400 shrink-0"} />
                      <span>{isPinnedToHome ? "Unpin from Home" : "Pin to Home"}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between px-6 w-full h-[64px] shrink-0 z-20 relative bg-transparent text-slate-800 dark:text-white select-none">
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
