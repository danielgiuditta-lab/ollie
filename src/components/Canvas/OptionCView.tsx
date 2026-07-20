import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  X,
  ChevronRight,
  Pencil,
  Plus,
  ArrowUp
} from 'lucide-react';
import { NativeViewer } from './NativeViewer';
import { InferredTaskDiffView } from './InferredTaskDiffView';
import { getFileIcon } from '../Shared/FileIcon';
import { getAvatarForPerson } from '../../utils/personAvatars';

interface OptionCViewProps {
  todoItems: any[];
  initialIndex?: number;
  onClose: () => void;
  onSendMessage: (text: string, aiMode?: boolean, contextFiles?: any[]) => void;
  setActiveSidebar?: any;
  onUpdateTaskStatus?: (taskId: string, status: 'done' | 'working' | 'rejected') => void;
  userProfile?: any;
  accessToken?: string | null;
  driveFiles?: any[];
}

function getAbbreviatedCellTitle(item: any, isSignedOff: boolean): string {
  if (!item) return '';
  if (item.shortTitle) return item.shortTitle;

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

export function OptionCView({
  todoItems = [],
  initialIndex = 0,
  onClose,
  onSendMessage,
  setActiveSidebar,
  onUpdateTaskStatus,
  userProfile,
  accessToken,
  driveFiles = []
}: OptionCViewProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [steerInput, setSteerInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [actionToast, setActionToast] = useState<{ text: 'Approved' | 'Declined' | 'Skipped'; key: number } | null>(null);

  const triggerActionToast = (text: 'Approved' | 'Declined' | 'Skipped') => {
    const key = Date.now();
    setActionToast({ text, key });
    setTimeout(() => {
      setActionToast(prev => (prev?.key === key ? null : prev));
    }, 750);
  };

  const orderedTodoItems = useMemo(() => {
    const approval = todoItems.filter(t => t.category === 'needs_approval' || t.type === 'chat');
    const working = todoItems.filter(t => t.category === 'needs_input' || t.category === 'continue_working' || (t.type !== 'chat' && t.type !== 'fyi' && t.category !== 'needs_approval' && t.category !== 'fyi'));
    const fyi = todoItems.filter(t => t.type === 'fyi' || t.category === 'fyi');
    const combined = [...approval, ...working, ...fyi];
    return combined.length > 0 ? combined : todoItems;
  }, [todoItems]);

  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < orderedTodoItems.length) {
      setActiveIndex(initialIndex);
      setSteerInput('');
    }
  }, [initialIndex, orderedTodoItems.length]);

  const activeTask = orderedTodoItems[activeIndex] || orderedTodoItems[0] || null;
  const prevTask = activeIndex > 0 ? orderedTodoItems[activeIndex - 1] : null;
  const nextTask = activeIndex < orderedTodoItems.length - 1 ? orderedTodoItems[activeIndex + 1] : null;

  const isChatReplyTask = Boolean(
    activeTask && (
      activeTask.type === 'chat' ||
      activeTask.type === 'message' ||
      activeTask.senderMessage ||
      activeTask.proposedReply ||
      (typeof activeTask.sourceName === 'string' && activeTask.sourceName.toLowerCase().includes('chat'))
    )
  );

  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [editableProposalText, setEditableProposalText] = useState('');

  useEffect(() => {
    if (activeTask) {
      setEditableProposalText(
        activeTask.proposedReply || activeTask.action || "hey alan!\nconversion is steady at 21%"
      );
      setIsEditingProposal(false);
    }
  }, [activeTask?.id]);

  const activeSourceName = activeTask?.sourceName || activeTask?.workspace || 'Google Drive';
  const activePersonName = activeTask?.personName || 'Maya Lin';
  const activeAvatar = activeTask?.personAvatar || getAvatarForPerson(activePersonName);

  const canvasAvatarElement = (
    <img 
      src={activeAvatar} 
      alt={activePersonName} 
      className="w-4 h-4 rounded-full object-cover shrink-0"
      onError={(e) => { (e.target as HTMLImageElement).src = '/people/sarah_lin.jpg'; }}
    />
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

  const handleApprove = () => {
    if (!activeTask) return;
    triggerActionToast('Approved');
    const nextCompleted = new Set(completedTaskIds);
    nextCompleted.add(activeTask.id);
    setCompletedTaskIds(nextCompleted);
    setSteerInput('');

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(activeTask.id, 'done');
    }

    if (activeIndex < orderedTodoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handleReject = () => {
    if (!activeTask) return;
    triggerActionToast('Declined');
    const nextCompleted = new Set(completedTaskIds);
    nextCompleted.add(activeTask.id);
    setCompletedTaskIds(nextCompleted);
    setSteerInput('');

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(activeTask.id, 'rejected');
    }

    if (activeIndex < orderedTodoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex === 0) return;
    triggerActionToast('Skipped');
    setActiveIndex(prev => Math.max(0, prev - 1));
    setSteerInput('');
  };

  const handleNext = () => {
    if (activeIndex === orderedTodoItems.length - 1) return;
    triggerActionToast('Skipped');
    setActiveIndex(prev => Math.min(orderedTodoItems.length - 1, prev + 1));
    setSteerInput('');
  };

  const handleSteerSubmit = (val: string) => {
    if (!val.trim()) return;
    triggerActionToast('Approved');

    if (activeTask) {
      if (isChatReplyTask) {
        activeTask.proposedReply = val;
        setEditableProposalText(val);
      }
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

    setSteerInput('');

    if (activeTask && activeIndex < orderedTodoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handleDockToSide = () => {
    if (steerInput.trim()) {
      const fullMsg = activeTask 
        ? `Regarding task "${activeTask.title || activeTask.description}": ${steerInput.trim()}`
        : steerInput.trim();
      onSendMessage(fullMsg);
      setSteerInput('');
    }
    onClose();
    if (setActiveSidebar) {
      setActiveSidebar('gemini');
    }
  };

  const handleOpenSourceChip = (urlOrName?: string) => {
    if (!urlOrName) return;
    if (urlOrName.startsWith('http')) {
      window.open(urlOrName, '_blank', 'noopener,noreferrer');
      return;
    }

    const lower = urlOrName.toLowerCase();
    if (lower.includes('chat')) {
      window.open('https://chat.google.com', '_blank', 'noopener,noreferrer');
    } else if (lower.includes('calendar')) {
      window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer');
    } else if (lower.includes('gmail') || lower.includes('mail')) {
      window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://drive.google.com/drive/search?q=${encodeURIComponent(urlOrName)}`, '_blank', 'noopener,noreferrer');
    }
  };

  const getTaskFileObject = (task: any) => {
    if (!task) return null;

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

  const getSteerPlaceholder = () => {
    if (!activeTask) return "Tell Ollie how to respond differently...";

    if (
      activeTask.type === 'chat' || 
      activeTask.workspace === 'Google Chat' || 
      activeTask.sourceName?.toLowerCase().includes('chat') ||
      activeTask.senderMessage ||
      activeTask.proposedReply
    ) {
      if (activeTask.personName) {
        const firstName = activeTask.personName.split(' ')[0];
        return `Tell Ollie how to respond to ${firstName} differently...`;
      }
      return "Tell Ollie how to respond differently...";
    }

    if (activeTask.sourceName && typeof activeTask.sourceName === 'string' && !activeTask.sourceName.toLowerCase().includes('google chat')) {
      const cleanName = activeTask.sourceName.replace(/\.[^/.]+$/, '').trim();
      if (cleanName.length > 0) {
        const shortName = cleanName.length > 25 ? cleanName.slice(0, 22) + '...' : cleanName;
        return `Tell Ollie how to edit "${shortName}" differently...`;
      }
    }

    if (activeTask.title) {
      const titleShort = activeTask.title.length > 28 ? `${activeTask.title.slice(0, 25)}...` : activeTask.title;
      return `Tell Ollie how to work on "${titleShort}" differently...`;
    }

    return "Tell Ollie how to respond differently...";
  };

  return (
    <div className="w-full h-full min-h-[560px] flex flex-col bg-transparent text-slate-900 dark:text-white select-none font-sans px-2 md:px-4 pt-1 pb-4 overflow-hidden relative">
      {/* 3 Cells Reel Feed inside current Home UI */}
      <div className="flex-1 w-full min-h-[460px] flex flex-col gap-3 overflow-hidden relative">
        {/* 1. Proceeding (Previous) Cell - Collapsed and scaling up into view */}
        <AnimatePresence mode="popLayout">
          {prevTask && (
            <motion.div
              key={prevTask.id || 'prev-' + (activeIndex - 1)}
              layout
              initial={{ height: 0, opacity: 0, scale: 0.92, y: -20 }}
              animate={{ height: 56, opacity: 1, scale: 0.98, y: 0 }}
              exit={{ height: 0, opacity: 0, scale: 0.92, y: -20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              onClick={handlePrev}
              className="w-full h-[56px] shrink-0 bg-[#F8FAFD] dark:bg-[#282A2D] hover:bg-[#EEF4FE] dark:hover:bg-[#35373A] rounded-[16px] px-4 cursor-pointer transition-all duration-200 select-none flex items-center justify-between gap-4 border border-slate-200/50 dark:border-neutral-800 shadow-2xs overflow-hidden"
            >
              <div className="flex-1 min-w-0 flex flex-col text-left">
                <h4 className="text-[14px] leading-[18px] font-medium font-sans text-slate-900 dark:text-white truncate">
                  {getAbbreviatedCellTitle(prevTask, completedTaskIds.has(prevTask.id))}
                </h4>
                <p className="text-[12px] leading-[15px] font-normal font-sans text-slate-500 dark:text-neutral-400 truncate">
                  {prevTask.description || prevTask.descriptionDone || prevTask.action || ''}
                </p>
              </div>
              <div className="shrink-0 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
                Previous task (click to skip back)
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Focused Cell - Expands and scales up as it comes into focus */}
        <div className="flex-1 min-h-[380px] relative flex flex-col overflow-hidden rounded-[24px] bg-[#F8FAFD] dark:bg-[#1E1F22] border border-slate-200/60 dark:border-[#2B2D31] shadow-md p-6 md:p-8 select-text">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTask?.id || activeIndex}
              layout
              initial={{ scale: 0.94, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: -30 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="w-full h-full flex flex-col min-h-0 overflow-y-auto relative"
            >
              {isChatReplyTask ? (
                <div className="w-full h-full flex flex-row items-center justify-between gap-6 md:gap-10 p-2 md:p-6 select-text font-['Google_Sans','Google_Sans_Text',sans-serif]">
                  {/* Left Column: Title, Meta, and Context Unit */}
                  <div className="w-1/2 h-full flex flex-col items-start justify-center pr-4 md:pr-6 min-w-0">
                    <h3 className="text-[28px] md:text-[34px] leading-[36px] font-normal text-slate-900 dark:text-white tracking-normal">
                      {canvasTitleText}
                    </h3>

                    <p className="text-[18px] md:text-[20px] leading-[26px] font-normal text-slate-600 dark:text-[#9AA0A6] mt-3 md:mt-4">
                      {canvasMetaText}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap mt-3.5 md:mt-4.5">
                      {activePersonName && (
                        <div 
                          onClick={() => handleOpenSourceChip(activePersonName)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/70 hover:bg-slate-300/80 dark:bg-[#28292D] dark:hover:bg-[#33353B] text-[13px] font-normal text-slate-800 dark:text-[#E3E3E3] transition-colors cursor-pointer"
                        >
                          {canvasAvatarElement}
                          <span className="truncate max-w-[140px]">{activePersonName}</span>
                        </div>
                      )}

                      {activeSourceName && (
                        <div 
                          onClick={() => handleOpenSourceChip(activeSourceName)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/70 hover:bg-slate-300/80 dark:bg-[#28292D] dark:hover:bg-[#33353B] text-[13px] font-normal text-slate-800 dark:text-[#E3E3E3] transition-colors cursor-pointer"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[13px] font-normal transition-colors"
                        >
                          {link.label || 'Open Link'}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Chat UI */}
                  <div className="w-1/2 h-full flex flex-col justify-center gap-6 pl-4 md:pl-6 min-w-0 select-text">
                    <div className="flex items-start gap-3 justify-start max-w-[85%]">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-md">
                        <img 
                          src={activeAvatar} 
                          alt={activePersonName} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>

                      <div className="bg-slate-200/80 dark:bg-[#2D2E30] text-slate-900 dark:text-white/90 text-[16px] md:text-[17px] leading-[24px] md:leading-[25px] font-normal px-5 py-3.5 rounded-[22px] shadow-sm max-w-[75%] font-['Google_Sans','Google_Sans_Text',sans-serif]">
                        {activeTask?.senderMessage || activeTask?.commentText || "hey dan, what was the conversation rate right after launch?"}
                      </div>
                    </div>

                    <div className="flex items-end gap-3 justify-end max-w-[85%] ml-auto mt-2">
                      <div className="bg-slate-300/70 dark:bg-[#45474A] text-slate-900 dark:text-white text-[16px] md:text-[17px] leading-[24px] md:leading-[25px] font-normal px-5 py-3.5 rounded-[22px] shadow-sm max-w-[75%] font-['Google_Sans','Google_Sans_Text',sans-serif] flex items-center justify-between gap-4 relative group">
                        {isEditingProposal ? (
                          <div className="flex flex-col gap-2 min-w-[220px] w-full">
                            <textarea
                              value={editableProposalText}
                              onChange={(e) => setEditableProposalText(e.target.value)}
                              className="w-full bg-white dark:bg-black/40 text-slate-900 dark:text-white text-[15px] leading-[22px] font-normal p-3 rounded-xl border border-slate-300 focus:outline-none resize-none font-['Google_Sans','Google_Sans_Text',sans-serif]"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setIsEditingProposal(false)}
                                className="px-3 py-1 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  if (activeTask) activeTask.proposedReply = editableProposalText;
                                  setIsEditingProposal(false);
                                }}
                                className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="whitespace-pre-wrap flex-1 min-w-0">
                              {editableProposalText || activeTask?.proposedReply || activeTask?.action || "hey alan!\nconversion is steady at 21%"}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingProposal(true);
                              }}
                              className="inline-flex items-center justify-center p-1 rounded-full text-slate-600 dark:text-white/90 hover:text-slate-900 hover:bg-slate-300/50 transition-all cursor-pointer shrink-0 self-center"
                              title="Edit proposed reply"
                            >
                              <Pencil size={18} className="stroke-[2.2]" />
                            </button>
                          </>
                        )}
                      </div>

                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-md">
                        <img 
                          src={userProfile?.picture || '/people/sarah_lin.jpg'} 
                          alt="User" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Title, Metaline, and Sources Unit */}
                  {activeTask && (
                    <div className="w-full shrink-0 flex flex-col items-start max-w-[65%] mb-[20px] font-['Google_Sans','Google_Sans_Text',sans-serif]">
                      <h3 className="text-[28px] md:text-[32px] leading-[36px] font-normal text-slate-900 dark:text-white">
                        {canvasTitleText}
                      </h3>

                      <p className="text-[18px] md:text-[20px] leading-normal font-normal text-slate-600 dark:text-neutral-300 mt-2 line-clamp-2 overflow-hidden text-ellipsis">
                        {canvasMetaText}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap mt-3">
                        {activePersonName && (
                          <div 
                            onClick={() => handleOpenSourceChip(activePersonName)}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/70 hover:bg-slate-300/80 dark:bg-[#28292D] dark:hover:bg-[#33353B] text-[12px] font-normal text-slate-800 dark:text-[#E3E3E3] transition-colors cursor-pointer"
                          >
                            {canvasAvatarElement}
                            <span className="truncate max-w-[140px]">{activePersonName}</span>
                          </div>
                        )}

                        {activeSourceName && (
                          <div 
                            onClick={() => handleOpenSourceChip(activeSourceName)}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/70 hover:bg-slate-300/80 dark:bg-[#28292D] dark:hover:bg-[#33353B] text-[12px] font-normal text-slate-800 dark:text-[#E3E3E3] transition-colors cursor-pointer"
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
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[12px] font-normal transition-colors"
                          >
                            {link.label || 'Open Link'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Artifacts in Diff View / NativeViewer */}
                  {activeFileObject ? (
                    <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
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
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                      No artifact preview available for this task.
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action Toast Overlay */}
          <AnimatePresence>
            {actionToast && (
              <motion.div
                key={actionToast.key}
                initial={{ opacity: 0, scale: 0.85, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -12 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-slate-900/90 text-white font-['Google_Sans','Google_Sans_Text',sans-serif] text-[26px] font-normal p-3 px-6 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md">
                  {actionToast.text === 'Approved' && <Check className="w-7 h-7 text-[#34A853] stroke-[2.5]" />}
                  {actionToast.text === 'Declined' && <X className="w-7 h-7 text-[#EA4335] stroke-[2.5]" />}
                  {actionToast.text === 'Skipped' && <ArrowRight className="w-7 h-7 text-white stroke-[2]" />}
                  <span>{actionToast.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Next Cell - Collapsed and scaling into view */}
        <AnimatePresence mode="popLayout">
          {nextTask && (
            <motion.div
              key={nextTask.id || 'next-' + (activeIndex + 1)}
              layout
              initial={{ height: 0, opacity: 0, scale: 0.92, y: 20 }}
              animate={{ height: 56, opacity: 1, scale: 0.98, y: 0 }}
              exit={{ height: 0, opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              onClick={handleNext}
              className="w-full h-[56px] shrink-0 bg-[#F8FAFD] dark:bg-[#282A2D] hover:bg-[#EEF4FE] dark:hover:bg-[#35373A] rounded-[16px] px-4 cursor-pointer transition-all duration-200 select-none flex items-center justify-between gap-4 border border-slate-200/50 dark:border-neutral-800 shadow-2xs overflow-hidden"
            >
              <div className="flex-1 min-w-0 flex flex-col text-left">
                <h4 className="text-[14px] leading-[18px] font-medium font-sans text-slate-900 dark:text-white truncate">
                  {getAbbreviatedCellTitle(nextTask, completedTaskIds.has(nextTask.id))}
                </h4>
                <p className="text-[12px] leading-[15px] font-normal font-sans text-slate-500 dark:text-neutral-400 truncate">
                  {nextTask.description || nextTask.descriptionDone || nextTask.action || ''}
                </p>
              </div>
              <div className="shrink-0 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
                Next task (click to skip forward)
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Bar styled identical to Composer input, with buttons animating out smoothly */}
      <div className="w-full h-[80px] shrink-0 flex items-center justify-center gap-3 relative z-20 pt-2">
        {/* Animated Previous Button - Animates out left from input pill */}
        <motion.button
          initial={{ opacity: 0, x: 80, scale: 0.2 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className="w-12 h-12 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/80 dark:border-[#2B2D31] hover:bg-slate-50 dark:hover:bg-[#282A2D] active:scale-95 text-slate-800 dark:text-white flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0 shadow-md"
          title="Previous task"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </motion.button>

        {/* Animated Decline X Button - Animates out left from input pill */}
        <motion.button
          initial={{ opacity: 0, x: 40, scale: 0.2 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          onClick={handleReject}
          className="w-14 h-14 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/80 dark:border-[#2B2D31] hover:bg-slate-50 dark:hover:bg-[#282A2D] active:scale-95 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-md"
          title="Decline"
        >
          <X className="w-6 h-6 text-[#EA4335] stroke-[2.5]" />
        </motion.button>

        {/* Center Steer Input Pill - Styled identical to Composer input pill */}
        <div 
          className={`rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/80 dark:border-[#2B2D31] flex items-center gap-3 transition-all duration-300 ease-in-out shadow-lg ${
            (isInputFocused || steerInput.trim().length > 0)
              ? 'h-[72px] w-[340px] md:w-[620px] px-4' 
              : 'h-14 w-[180px] px-4 cursor-pointer'
          }`}
          onClick={() => {
            const el = document.getElementById('optionc-steer-input');
            if (el) el.focus();
          }}
        >
          {(isInputFocused || steerInput.trim().length > 0) && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); }}
              className="w-11 h-11 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-400 flex items-center justify-center transition shrink-0 cursor-pointer border-none outline-none"
              title="Add attachment or context"
            >
              <Plus size={20} className="stroke-[2.5]" />
            </button>
          )}

          <input
            id="optionc-steer-input"
            type="text"
            value={steerInput}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onChange={(e) => setSteerInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (steerInput.trim()) {
                  handleSteerSubmit(steerInput);
                  setSteerInput('');
                } else {
                  handleApprove();
                }
              }
            }}
            placeholder={(isInputFocused || steerInput.trim().length > 0) ? getSteerPlaceholder() : "Do differently..."}
            className="w-full bg-transparent text-slate-900 dark:text-white text-[15px] font-normal placeholder-slate-500 dark:placeholder-neutral-400 focus:outline-none truncate px-1 border-none ring-0"
          />

          {(isInputFocused || steerInput.trim().length > 0) && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDockToSide();
                }}
                className="w-11 h-11 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-400 flex items-center justify-center transition cursor-pointer border-none outline-none"
                title="Snap to side chat"
              >
                <span className="material-symbols-rounded text-[22px] select-none">dock_to_right</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (steerInput.trim()) {
                    handleSteerSubmit(steerInput);
                    setSteerInput('');
                  } else {
                    handleApprove();
                  }
                }}
                disabled={!steerInput.trim()}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition border-none outline-none ${
                  steerInput.trim()
                    ? 'bg-[#0B57D0] text-white hover:bg-blue-600 cursor-pointer shadow-md'
                    : 'bg-black/10 dark:bg-white/10 text-slate-400 dark:text-neutral-500 cursor-not-allowed'
                }`}
                title={steerInput.trim() ? "Submit steer" : "Send"}
              >
                <ArrowUp size={18} className="stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>

        {/* Animated Approve Check Button - Animates out right from input pill */}
        <motion.button
          initial={{ opacity: 0, x: -40, scale: 0.2 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          onClick={() => {
            if (steerInput.trim()) {
              handleSteerSubmit(steerInput);
              setSteerInput('');
            } else {
              handleApprove();
            }
          }}
          className="w-14 h-14 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/80 dark:border-[#2B2D31] hover:bg-slate-50 dark:hover:bg-[#282A2D] active:scale-95 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-md"
          title={steerInput.trim() ? "Submit steer" : "Accept"}
        >
          <Check className="w-6 h-6 text-[#34A853] stroke-[2.5]" />
        </motion.button>

        {/* Animated Next Button - Animates out right from input pill */}
        <motion.button
          initial={{ opacity: 0, x: -80, scale: 0.2 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          onClick={handleNext}
          disabled={activeIndex === orderedTodoItems.length - 1}
          className="w-12 h-12 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/80 dark:border-[#2B2D31] hover:bg-slate-50 dark:hover:bg-[#282A2D] active:scale-95 text-slate-800 dark:text-white flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0 shadow-md"
          title="Next task"
        >
          <ArrowRight className="w-5 h-5 stroke-[2]" />
        </motion.button>
      </div>
    </div>
  );
}
