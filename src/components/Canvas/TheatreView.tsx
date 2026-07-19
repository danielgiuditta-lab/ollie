import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  X,
  ChevronRight
} from 'lucide-react';
import { NativeViewer } from './NativeViewer';
import { InferredTaskDiffView } from './InferredTaskDiffView';
import { Composer } from '../Chat/Composer';
import { getFileIcon } from '../Shared/FileIcon';
import { getAvatarForPerson } from '../../utils/personAvatars';

interface TheatreTaskCellProps {
  item: any;
  isSelected: boolean;
  isSignedOff: boolean;
  onClick: () => void;
  onOpenSource: (urlOrName?: string) => void;
  onToggleComplete?: (taskId: string) => void;
}

function getAbbreviatedCellTitle(item: any, isSignedOff: boolean): string {
  if (!item) return '';

  if (item.shortTitle) return item.shortTitle;

  // If sourceName is clean and descriptive, use sourceName without file extension
  if (item.sourceName && typeof item.sourceName === 'string') {
    const cleanSource = item.sourceName.replace(/\.[^/.]+$/, "").replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, "").trim();
    if (
      cleanSource && 
      cleanSource.length > 2 && 
      cleanSource.length < 45 && 
      !cleanSource.toLowerCase().includes('google drive') && 
      !cleanSource.toLowerCase().includes('calendar') && 
      !cleanSource.toLowerCase().includes('chat')
    ) {
      return cleanSource;
    }
  }

  const raw = isSignedOff 
    ? (item.titleDone || item.title || item.description || '')
    : (item.title || item.titleDone || item.description || '');

  if (!raw) return 'Task';

  let cleaned = raw;
  cleaned = cleaned.replace(/^I\s+(?:started\s+(?:an?\s+)?(?:outline\s+for\s+the\s+)?|updated\s+|prepared\s+(?:files\s+to\s+share\s+in\s+)?|proposed\s+(?:a\s+)?|drafted\s+|reviewed\s+|created\s+)/i, '');
  cleaned = cleaned.replace(/\s+(?:per|for|requested by)\s+[A-Z][a-z]+(?:'s)?\s*(?:comment|request|feedback)?.*$/i, '');
  cleaned = cleaned.trim();

  if (cleaned.length > 40) {
    cleaned = cleaned.substring(0, 38).trim() + '…';
  }

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned || raw;
}

function TheatreTaskCell({ item, isSelected, isSignedOff, onClick, onOpenSource, onToggleComplete }: TheatreTaskCellProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const titleText = getAbbreviatedCellTitle(item, isSignedOff);

  const descText = isSignedOff
    ? (item.descriptionDone || item.description || item.action || 'Your tasks will be added to "My tasks" when notes are ready')
    : (item.description || item.descriptionDone || item.action || 'Gemini will write a professional follow-up email for you...');

  const resolvedSourceName = item.sourceName || item.workspace || 'Google Drive';
  const resolvedPersonName = item.personName || 'Maya Lin';
  const resolvedAvatar = item.personAvatar || getAvatarForPerson(resolvedPersonName, Boolean(item.isReal || item.driveId || item.isOAuth));

  const avatarElement = (!avatarFailed && resolvedAvatar) ? (
    <img 
      src={resolvedAvatar} 
      alt={resolvedPersonName} 
      className="w-4 h-4 rounded-full object-cover shrink-0"
      onError={() => setAvatarFailed(true)}
    />
  ) : (
    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
      {resolvedPersonName.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-[2px] first:rounded-t-[16px] last:rounded-b-[16px] bg-[#1E1F22] hover:bg-[#232529] cursor-pointer transition-all duration-150 select-none flex items-start justify-between gap-3 min-w-0 ${
        isSelected ? 'bg-[#222428]' : ''
      }`}
    >
      <div className={`flex-1 min-w-0 flex flex-col gap-1 ${isSignedOff && !isSelected ? 'opacity-30' : 'opacity-100'}`}>
        {/* Cell Title: Google Sans Regular 14/20 in #E3E3E3 */}
        <h4 className="text-[14px] leading-[20px] font-normal font-['Google_Sans','Google_Sans_Text',sans-serif] text-[#E3E3E3] truncate">
          {titleText}
        </h4>

        {/* Cell Subtitle: Google Sans Regular 12/16 in #E3E3E3 0.7 opacity */}
        <p className="text-[12px] leading-[16px] font-normal font-['Google_Sans','Google_Sans_Text',sans-serif] text-[#E3E3E3]/70 truncate">
          {descText}
        </p>
      </div>

      {/* Signed Off Checkmark Button (no border stroke, click unmarks as completed) */}
      {isSignedOff && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleComplete) onToggleComplete(item.id);
          }}
          className="w-8 h-8 rounded-full bg-[#080809] hover:bg-[#18191C] text-white flex items-center justify-center shrink-0 self-center transition-colors cursor-pointer"
          title="Unmark as completed"
        >
          <Check size={16} className="text-white stroke-[2.5]" />
        </div>
      )}
    </div>
  );
}

interface TheatreViewProps {
  todoItems: any[];
  initialIndex?: number;
  onClose: () => void;
  onSendMessage: (text: string, aiMode?: boolean, contextFiles?: any[]) => void;
  setActiveSidebar?: any;
  onUpdateTaskStatus?: (taskId: string, status: 'done' | 'working' | 'rejected') => void;
  userProfile?: any;
  accessToken?: string | null;
  theme?: 'light' | 'dark';
  driveFiles?: any[];
}

export function TheatreView({
  todoItems = [],
  initialIndex = 0,
  onClose,
  onSendMessage,
  setActiveSidebar,
  onUpdateTaskStatus,
  userProfile,
  accessToken,
  theme = 'dark',
  driveFiles = []
}: TheatreViewProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  // Sync initial index if todoItems changes
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < todoItems.length) {
      setActiveIndex(initialIndex);
    }
  }, [initialIndex, todoItems.length]);

  const activeTask = todoItems[activeIndex] || todoItems[0] || null;

  const [canvasAvatarFailed, setCanvasAvatarFailed] = useState(false);

  const activeSourceName = activeTask?.sourceName || activeTask?.workspace || 'Google Drive';
  const activePersonName = activeTask?.personName || 'Maya Lin';
  const activeAvatar = activeTask?.personAvatar || getAvatarForPerson(activePersonName, Boolean(activeTask?.isReal || activeTask?.driveId || activeTask?.isOAuth));

  const canvasAvatarElement = (!canvasAvatarFailed && activeAvatar) ? (
    <img 
      src={activeAvatar} 
      alt={activePersonName} 
      className="w-4 h-4 rounded-full object-cover shrink-0"
      onError={() => setCanvasAvatarFailed(true)}
    />
  ) : (
    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
      {activePersonName.charAt(0).toUpperCase()}
    </div>
  );

  const isCurrentSignedOff = activeTask ? completedTaskIds.has(activeTask.id) : false;

  const canvasTitleText = activeTask ? (
    isCurrentSignedOff 
      ? (activeTask.titleDone || activeTask.title || activeTask.description)
      : (activeTask.title || activeTask.titleDone || activeTask.description)
  ) : '';

  const canvasMetaText = activeTask ? (
    isCurrentSignedOff
      ? (activeTask.descriptionDone || activeTask.description || activeTask.action || 'Your tasks will be added to "My tasks" when notes are ready')
      : (activeTask.description || activeTask.descriptionDone || activeTask.action || 'Gemini will write a professional follow-up email for you...')
  ) : '';

  // Handle task approval (Yes)
  const handleApprove = () => {
    if (!activeTask) return;
    const nextCompleted = new Set(completedTaskIds);
    nextCompleted.add(activeTask.id);
    setCompletedTaskIds(nextCompleted);

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(activeTask.id, 'done');
    }

    // Advance to next task if available
    if (activeIndex < todoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  // Handle task rejection (No)
  const handleReject = () => {
    if (!activeTask) return;
    const nextCompleted = new Set(completedTaskIds);
    nextCompleted.add(activeTask.id);
    setCompletedTaskIds(nextCompleted);

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(activeTask.id, 'rejected');
    }

    // Advance to next task if available
    if (activeIndex < todoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setActiveIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveIndex(prev => Math.min(todoItems.length - 1, prev + 1));
  };

  // Handle steer submission using shared Composer
  const handleSteerSubmit = (val: string) => {
    if (!val.trim()) return;

    if (activeTask) {
      const nextCompleted = new Set(completedTaskIds);
      nextCompleted.add(activeTask.id);
      setCompletedTaskIds(nextCompleted);

      if (onUpdateTaskStatus) {
        onUpdateTaskStatus(activeTask.id, 'done');
      }
    }

    const fullMsg = activeTask 
      ? `Regarding task "${activeTask.title || activeTask.description}": ${val}`
      : val;

    onSendMessage(fullMsg);
    if (setActiveSidebar) {
      setActiveSidebar('gemini');
    }

    // Advance to next task if available
    if (activeTask && activeIndex < todoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  // Handle unmarking task as complete (return to default in-queue state)
  const handleToggleComplete = (taskId: string) => {
    const nextCompleted = new Set(completedTaskIds);
    if (nextCompleted.has(taskId)) {
      nextCompleted.delete(taskId);
    }
    setCompletedTaskIds(nextCompleted);

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(taskId, 'working');
    }
  };

  // Helper to open source link in a new tab
  const handleOpenSourceChip = (urlOrName?: string) => {
    if (!urlOrName) return;
    if (urlOrName.startsWith('http')) {
      window.open(urlOrName, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://drive.google.com/drive/search?q=${encodeURIComponent(urlOrName)}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Group tasks for Left List maintaining fixed section structure matching inferred task list
  const startedTasks = todoItems.filter(t => t.type !== 'fyi' && t.category !== 'fyi');
  const fyiTasks = todoItems.filter(t => t.type === 'fyi' || t.category === 'fyi');

  // Determine native tool button label
  const getNativeToolLabel = () => {
    if (!activeTask) return 'Open in Drive';
    const type = (activeTask.type || activeTask.sourceMimeType || '').toLowerCase();
    if (type.includes('slide') || type.includes('presentation')) return 'Open in Slides';
    if (type.includes('doc') || type.includes('word')) return 'Open in Docs';
    if (type.includes('sheet') || type.includes('csv') || type.includes('excel')) return 'Open in Sheets';
    if (type.includes('mail') || type.includes('gmail')) return 'Open in Gmail';
    if (type.includes('calendar')) return 'Open in Calendar';
    return 'Open in native tool';
  };

  // Construct target document file object for NativeViewer/DiffView
  const getTaskFileObject = (task: any) => {
    if (!task) return null;
    
    // If explicit filesToLoad array exists on the task, load the first target file
    if (task.filesToLoad && task.filesToLoad.length > 0) {
      const target = task.filesToLoad[0];
      return {
        ...target,
        id: target.id || task.id,
        name: target.name || task.sourceName || task.title || 'Document',
        mimeType: target.mimeType || (task.type === 'slide' ? 'application/vnd.google-apps.presentation' : 'application/vnd.google-apps.document'),
        title: task.title,
        description: task.description,
        originalMarkdown: task.originalMarkdown,
        updatedMarkdown: task.updatedMarkdown,
        summaryOfChanges: task.summaryOfChanges,
        commentText: task.commentText,
        personName: task.personName,
        personAvatar: task.personAvatar
      };
    }

    // Try matching drive file from driveFiles
    let matchingDriveFile = null;
    if (driveFiles && driveFiles.length > 0) {
      const taskDriveId = task.driveId || task.fileId;
      const taskNameLower = (task.sourceName || task.title || '').toLowerCase().trim();
      matchingDriveFile = driveFiles.find((f: any) => {
        if (taskDriveId && (f.id === taskDriveId || f.driveId === taskDriveId)) return true;
        if (taskNameLower && f.name && (f.name.toLowerCase().includes(taskNameLower) || taskNameLower.includes(f.name.toLowerCase()))) return true;
        return false;
      });
    }

    if (matchingDriveFile) {
      return {
        ...matchingDriveFile,
        id: matchingDriveFile.id || task.id,
        name: matchingDriveFile.name || task.sourceName || task.title || 'Document',
        title: task.title,
        description: task.description,
        content: matchingDriveFile.content || task.updatedMarkdown || task.description || '',
        originalMarkdown: task.originalMarkdown,
        updatedMarkdown: task.updatedMarkdown,
        summaryOfChanges: task.summaryOfChanges,
        commentText: task.commentText,
        personName: task.personName,
        personAvatar: task.personAvatar
      };
    }

    // Resolve file type based on mimeType / source text
    const textForMime = `${task.sourceName || ''} ${task.sourceMimeType || ''} ${task.type || ''} ${task.description || ''}`.toLowerCase();
    let resolvedMime = 'application/vnd.google-apps.document';
    let resolvedType = 'doc';

    if (textForMime.includes('slide') || textForMime.includes('presentation')) {
      resolvedMime = 'application/vnd.google-apps.presentation';
      resolvedType = 'slide';
    } else if (textForMime.includes('sheet') || textForMime.includes('csv') || textForMime.includes('spreadsheet')) {
      resolvedMime = 'application/vnd.google-apps.spreadsheet';
      resolvedType = 'sheet';
    }

    return {
      id: task.id,
      name: task.sourceName || task.title || 'Task Document',
      mimeType: task.sourceMimeType || resolvedMime,
      type: resolvedType,
      title: task.title,
      description: task.description,
      content: task.updatedMarkdown || task.description || task.action || task.title || '',
      originalMarkdown: task.originalMarkdown,
      updatedMarkdown: task.updatedMarkdown,
      summaryOfChanges: task.summaryOfChanges,
      commentText: task.commentText,
      personName: task.personName,
      personAvatar: task.personAvatar
    };
  };

  const activeFileObject = getTaskFileObject(activeTask);

  const hasAnyDone = todoItems.some(t => completedTaskIds.has(t.id));

  return (
    <div className="fixed inset-0 z-50 bg-[#141517] text-white flex flex-col select-none font-sans animate-in fade-in duration-200 p-4 md:p-6 overflow-hidden">
      {/* Top Header Bar matching design specs */}
      <div className="w-full shrink-0 flex items-center justify-between pb-3 px-1">
        {/* Left Breadcrumbs */}
        <div className="flex items-center gap-2 text-[17px] font-normal text-neutral-400">
          <span 
            onClick={onClose}
            className="cursor-pointer hover:text-white transition-colors font-normal text-neutral-300"
          >
            Home
          </span>
          <ChevronRight size={18} className="text-neutral-500 shrink-0" />
          <span className="text-white font-medium">Taskview</span>
        </div>

        {/* Right Action Buttons (Open in Native Tool + Close, no borders) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenSourceChip(activeTask?.sourceName || activeTask?.title)}
            className="h-9 px-4 rounded-full bg-[#282A2D] hover:bg-[#35373A] text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {getFileIcon(activeTask?.sourceName || activeTask?.title, activeTask?.sourceMimeType || activeTask?.type)}
            <span>{getNativeToolLabel()}</span>
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#282A2D] hover:bg-[#35373A] text-white flex items-center justify-center transition-all cursor-pointer"
            title="Close Taskview"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Split Container */}
      <div className="flex-1 w-full min-h-0 flex gap-6 overflow-hidden">
        {/* Left Panel: Home Tasks Directory Card matching 131314 with 24px border radii & 16px padding */}
        <div className="w-80 md:w-[380px] shrink-0 bg-[#131314] rounded-[24px] p-4 flex flex-col overflow-y-auto select-text font-['Google_Sans','Google_Sans_Text',sans-serif]">
          {/* Active Tasks ("What I started..." or "What I did...") */}
          {startedTasks.length > 0 && (
            <div className="flex flex-col">
              <h3 className="text-[20px] leading-[28px] font-normal text-[#E3E3E3] pt-2 mb-4 px-1">
                {hasAnyDone ? 'What I did...' : 'What I started...'}
              </h3>
              <div className="flex flex-col gap-[2px] rounded-[16px] overflow-hidden">
                {startedTasks.map((item) => {
                  const itemIndex = todoItems.findIndex(t => t.id === item.id);
                  const isSelected = itemIndex === activeIndex;
                  const isSignedOff = completedTaskIds.has(item.id);
                  return (
                    <TheatreTaskCell
                      key={item.id}
                      item={item}
                      isSelected={isSelected}
                      isSignedOff={isSignedOff}
                      onClick={() => setActiveIndex(itemIndex)}
                      onOpenSource={handleOpenSourceChip}
                      onToggleComplete={handleToggleComplete}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* FYI Tasks ("FYI") */}
          {fyiTasks.length > 0 && (
            <div className="flex flex-col">
              <h3 className={`text-[20px] leading-[28px] font-normal text-[#E3E3E3] mb-4 px-1 ${startedTasks.length > 0 ? 'pt-6' : 'pt-2'}`}>
                FYI
              </h3>
              <div className="flex flex-col gap-[2px] rounded-[16px] overflow-hidden">
                {fyiTasks.map((item) => {
                  const itemIndex = todoItems.findIndex(t => t.id === item.id);
                  const isSelected = itemIndex === activeIndex;
                  const isSignedOff = completedTaskIds.has(item.id);
                  return (
                    <TheatreTaskCell
                      key={item.id}
                      item={item}
                      isSelected={isSelected}
                      isSignedOff={isSignedOff}
                      onClick={() => setActiveIndex(itemIndex)}
                      onOpenSource={handleOpenSourceChip}
                      onToggleComplete={handleToggleComplete}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Area: Artifact View + Centered Controls Dock directly under it */}
        <div className="flex-1 h-full min-w-0 flex flex-col gap-3 overflow-hidden pb-1">
          {/* Selected Task Target Artifact View (No border stroke, 32px padding, matching cell container bg #131314) */}
          <div className="flex-1 min-h-0 rounded-[24px] overflow-y-auto bg-[#131314] relative shadow-2xl flex flex-col p-8 select-text">
            {/* Title, Metaline (capped at 2 lines), and Sources Unit (Max width 70%, 40px gap below) */}
            {activeTask && (
              <div className="w-full shrink-0 flex flex-col items-start max-w-[70%] mb-[40px] font-['Google_Sans','Google_Sans_Text',sans-serif]">
                {/* Title: 32px with tightened line spacing (leading-[38px]) */}
                <h3 className="text-[32px] leading-[38px] font-normal text-white">
                  {canvasTitleText}
                </h3>

                {/* Metaline: 20px with auto line height, capped at 2 lines */}
                <p className="text-[20px] leading-normal font-normal text-neutral-300 mt-2 line-clamp-2 overflow-hidden text-ellipsis">
                  {canvasMetaText}
                </p>

                {/* Sources below that */}
                <div className="flex items-center gap-2 flex-wrap mt-4">
                  {activePersonName && (
                    <div 
                      onClick={() => handleOpenSourceChip(activePersonName)}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#28292D] hover:bg-[#33353B] text-[12px] font-normal text-[#E3E3E3] transition-colors cursor-pointer"
                    >
                      {canvasAvatarElement}
                      <span className="truncate max-w-[140px]">{activePersonName}</span>
                    </div>
                  )}

                  {activeSourceName && (
                    <div 
                      onClick={() => handleOpenSourceChip(activeSourceName)}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#28292D] hover:bg-[#33353B] text-[12px] font-normal text-[#E3E3E3] transition-colors cursor-pointer"
                    >
                      {getFileIcon(activeSourceName, activeTask?.sourceMimeType || activeTask?.type)}
                      <span className="truncate max-w-[160px]">{activeSourceName}</span>
                    </div>
                  )}

                  {activeTask?.links && activeTask.links.map((link: any, idx: number) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/40 hover:bg-blue-900/50 text-blue-400 text-[12px] font-normal transition-colors"
                    >
                      {link.label || 'Open Link'}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Artifacts in Diff View Filling Remaining Canvas Height */}
            {activeFileObject ? (
              <div 
                key={activeTask?.id || activeIndex}
                className="w-full flex-1 min-h-0 animate-in slide-in-from-bottom-4 duration-200 ease-out flex flex-col overflow-hidden"
              >
                {activeFileObject.originalMarkdown || activeFileObject.updatedMarkdown ? (
                  <InferredTaskDiffView 
                    file={activeFileObject}
                    theme="light"
                    className="w-full h-full flex flex-col items-stretch justify-start bg-transparent p-0 overflow-hidden"
                    hideFooterText={true}
                  />
                ) : (
                  <NativeViewer
                    file={activeFileObject}
                    hideHeader={true}
                    mode="preview"
                    theme="light"
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-500 text-sm font-medium">
                No artifact preview available for this task.
              </div>
            )}
          </div>

          {/* Bottom Controls Dock: Reusing Shared Bottom Composer, Centered Under Artifact */}
          <div className="w-full shrink-0 flex items-center justify-center gap-3 pt-1 relative z-10">
            {/* Previous Task Arrow Button */}
            <button
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="w-12 h-12 rounded-full bg-[#282A2D] hover:bg-[#35373A] text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-md"
              title="Previous task"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Reject / Decline Button matching InferredTaskCard style */}
            <button
              onClick={handleReject}
              className="w-12 h-12 rounded-full bg-[#FCE8E6] dark:bg-red-950/40 hover:bg-[#FAD2CF] dark:hover:bg-red-900/60 text-[#C5221F] dark:text-red-400 flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-md"
              title="Decline"
            >
              <X size={24} className="stroke-[2.5]" />
            </button>

            {/* Center Steer Input using bottom layout Composer */}
            <div className="w-96 md:w-[600px] max-w-full flex items-center">
              <Composer
                onSend={handleSteerSubmit}
                disabled={false}
                placeholder={activeTask?.type === 'slide' ? "Suggest an update to the slides..." : "Give agent a steer..."}
                theme="dark"
                layout="bottom"
              />
            </div>

            {/* Approve / Accept Button matching InferredTaskCard style */}
            <button
              onClick={handleApprove}
              className="w-12 h-12 rounded-full bg-[#E6F4EA] dark:bg-green-950/40 hover:bg-[#CEEAD6] dark:hover:bg-green-900/60 text-[#137333] dark:text-green-400 flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-md"
              title="Accept"
            >
              <Check size={24} className="stroke-[2.5]" />
            </button>

            {/* Next Task Arrow Button */}
            <button
              onClick={handleNext}
              disabled={activeIndex === todoItems.length - 1}
              className="w-12 h-12 rounded-full bg-[#282A2D] hover:bg-[#35373A] text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-md"
              title="Next task"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
