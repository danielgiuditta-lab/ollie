import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
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
import { InferredTaskCardExperimental } from '../Chat/InferredTaskCardExperimental';

interface OptionCViewProps {
  todoItems: any[];
  initialIndex?: number;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean, index?: number) => void;
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

  const raw = isSignedOff 
    ? (item.titleDone || item.title || item.description || '')
    : (item.title || item.titleDone || item.description || '');

  if (!raw) return item.sourceName || 'Task';
  return raw.trim();
}

export function OptionCView({
  todoItems = [],
  initialIndex = 0,
  isOpen = true,
  onToggleOpen,
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

  const isPlayMode = Boolean(isOpen);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (isPlayMode && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex, isPlayMode]);

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

  const needsApprovalItems = useMemo(() => {
    return orderedTodoItems.filter(t => t.category === 'needs_approval' || t.type === 'chat');
  }, [orderedTodoItems]);

  const continueWorkingItems = useMemo(() => {
    return orderedTodoItems.filter(t => t.category === 'needs_input' || t.category === 'continue_working' || (t.type !== 'chat' && t.type !== 'fyi' && t.category !== 'needs_approval' && t.category !== 'fyi'));
  }, [orderedTodoItems]);

  const fyiItemsList = useMemo(() => {
    return orderedTodoItems.filter(t => t.type === 'fyi' || t.category === 'fyi');
  }, [orderedTodoItems]);

  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < orderedTodoItems.length) {
      setActiveIndex(initialIndex);
      setSteerInput('');
    }
  }, [initialIndex, orderedTodoItems.length]);

  const activeTask = orderedTodoItems[activeIndex] || orderedTodoItems[0] || null;

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
    <div className="w-full h-full min-h-[560px] flex flex-col bg-transparent text-slate-900 dark:text-white select-none font-sans px-2 md:px-4 pt-1 pb-1 overflow-hidden relative">

      <LayoutGroup id="option-c-cells-reel">
        {!isPlayMode ? (
          /* Landing Page View: Section headers and task cards with exact commit 96a1ee0 styling */
          <div className="w-full flex-1 flex flex-col gap-6 max-w-4xl mx-auto overflow-y-auto custom-scrollbar py-2 text-left">
            {needsApprovalItems.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="text-[20px] font-medium text-slate-800 dark:text-neutral-200 mt-2 mb-1 text-left">
                  Needs your approval...
                </h2>
                <div className="w-full flex flex-col gap-[4px] py-1 bg-transparent">
                  {needsApprovalItems.map((item) => {
                    const origIdx = orderedTodoItems.findIndex(t => t.id === item.id);
                    return (
                      <InferredTaskCardExperimental
                        key={item.id}
                        item={{
                          id: item.id,
                          title: item.title || item.description || 'Task',
                          description: item.description || '',
                          links: item.links
                        }}
                        sectionType="decision"
                        onClick={() => {
                          if (onToggleOpen) onToggleOpen(true, origIdx >= 0 ? origIdx : 0);
                          setActiveIndex(origIdx >= 0 ? origIdx : 0);
                        }}
                        onApprove={() => {
                          triggerActionToast('Approved');
                          if (onUpdateTaskStatus) onUpdateTaskStatus(item.id, 'done');
                        }}
                        onReject={() => {
                          triggerActionToast('Declined');
                          if (onUpdateTaskStatus) onUpdateTaskStatus(item.id, 'rejected');
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {continueWorkingItems.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="text-[20px] font-medium text-slate-800 dark:text-neutral-200 mt-2 mb-1 text-left">
                  Continue working on...
                </h2>
                <div className="w-full flex flex-col gap-[4px] py-1 bg-transparent">
                  {continueWorkingItems.map((item) => {
                    const origIdx = orderedTodoItems.findIndex(t => t.id === item.id);
                    return (
                      <InferredTaskCardExperimental
                        key={item.id}
                        item={{
                          id: item.id,
                          title: item.title || item.description || 'Task',
                          description: item.description || '',
                          links: item.links
                        }}
                        sectionType="generative"
                        onClick={() => {
                          if (onToggleOpen) onToggleOpen(true, origIdx >= 0 ? origIdx : 0);
                          setActiveIndex(origIdx >= 0 ? origIdx : 0);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {fyiItemsList.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="text-[20px] font-medium text-slate-800 dark:text-neutral-200 mt-2 mb-1 text-left">
                  For your information...
                </h2>
                <div className="w-full flex flex-col gap-[4px] py-1 bg-transparent">
                  {fyiItemsList.map((item) => {
                    const origIdx = orderedTodoItems.findIndex(t => t.id === item.id);
                    return (
                      <InferredTaskCardExperimental
                        key={item.id}
                        item={{
                          id: item.id,
                          title: item.title || item.description || 'Task',
                          description: item.description || '',
                          links: item.links
                        }}
                        sectionType="fyi"
                        onClick={() => {
                          if (onToggleOpen) onToggleOpen(true, origIdx >= 0 ? origIdx : 0);
                          setActiveIndex(origIdx >= 0 ? origIdx : 0);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Play Mode View: Cell reel positioned within 16px of top without drop shadows or x-axis bounce */
          <div className="w-full flex-1 min-h-0 flex flex-col gap-2 relative overflow-hidden pt-1 pb-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {orderedTodoItems.map((item, idx) => {
                const isFocused = idx === activeIndex;
                const isTopPeek = idx === activeIndex - 1;
                const isBottomPeek = idx === activeIndex + 1;
                const isVisibleInPlay = isFocused || isTopPeek || isBottomPeek;

                const itemId = item.id || `cell-${idx}`;
                const isCurrentSignedOff = completedTaskIds.has(item.id);
                const cellTitle = isFocused 
                  ? (isCurrentSignedOff 
                      ? (item.titleDone || item.title || item.description)
                      : (item.title || item.titleDone || item.description))
                  : getAbbreviatedCellTitle(item, isCurrentSignedOff);

                const cellMeta = isFocused
                  ? (isCurrentSignedOff
                      ? (item.descriptionDone || item.description || item.action || 'Your tasks will be added to "My tasks" when notes are ready')
                      : (item.description || item.descriptionDone || item.action || 'Gemini will write a professional follow-up email for you...'))
                  : (item.description || item.descriptionDone || item.action || '');

                return (
                  <motion.div
                    key={itemId}
                    layoutId={`cell-${item.id}`}
                    ref={(el) => { itemRefs.current[idx] = el; }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: isVisibleInPlay ? 1 : 0, 
                      y: 0,
                      height: isFocused ? '100%' : isVisibleInPlay ? 48 : 0
                    }}
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.2, ease: 'easeInOut' } }}
                    onClick={() => {
                      if (!isFocused) {
                        setActiveIndex(idx);
                      }
                    }}
                    className={`flex flex-col justify-start items-start select-none overflow-hidden origin-top transition-[background-color,border-radius,padding,max-width] duration-300 ease-in-out ${
                      isFocused
                        ? 'flex-1 h-full min-h-0 w-full max-w-[1140px] self-center rounded-[24px] bg-[#F8FAFD] dark:bg-[#1E1F22] p-6 md:p-8 select-text cursor-default shrink-0'
                        : isVisibleInPlay
                          ? 'shrink-0 h-[48px] w-full max-w-[720px] self-center rounded-[14px] bg-[#F8FAFD] dark:bg-[#282A2D] hover:bg-[#EEF4FE] dark:hover:bg-[#35373A] px-5 py-2.5 cursor-pointer flex items-center justify-between'
                          : 'h-0 p-0 m-0 opacity-0 pointer-events-none'
                    }`}
                    transition={{
                      height: { duration: 0.3, ease: 'easeInOut' },
                      layout: { duration: 0.3, ease: 'easeInOut' },
                      opacity: { duration: 0.2 },
                      y: { duration: 0.3, ease: 'easeInOut' }
                    }}
                  >
                  {/* Cell Header and Content Layout */}
                  {!isFocused ? (
                    <div className="w-full flex flex-col text-left shrink-0 min-w-0 select-text">
                      <motion.h3 
                        layout="position"
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="font-sans text-slate-900 dark:text-white tracking-normal text-[16px] leading-[22px] font-medium truncate"
                      >
                        {cellTitle}
                      </motion.h3>

                      <motion.p 
                        layout="position"
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="font-sans text-slate-600 dark:text-[#9AA0A6] text-[13px] leading-[18px] font-normal mt-0.5 truncate"
                      >
                        {cellMeta}
                      </motion.p>
                    </div>
                  ) : (
                    <div className="w-full flex-1 min-h-[340px] overflow-hidden flex flex-col select-text">
                      {isChatReplyTask ? (
                        <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 select-text font-['Google_Sans','Google_Sans_Text',sans-serif]">
                          {/* Left Column: Title, Subtitle, and Sources centered vertically */}
                          <div className="w-full md:w-1/2 h-full flex flex-col items-start justify-center pr-0 md:pr-6 min-w-0 select-text">
                            <motion.h3 
                              layout="position"
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="font-sans text-slate-900 dark:text-white tracking-normal text-[26px] md:text-[30px] leading-[32px] md:leading-[36px] font-normal"
                            >
                              {cellTitle}
                            </motion.h3>

                            <motion.p 
                              layout="position"
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="font-sans text-slate-600 dark:text-[#9AA0A6] text-[16px] md:text-[18px] leading-[24px] md:leading-[26px] font-normal mt-2 line-clamp-3"
                            >
                              {cellMeta}
                            </motion.p>

                            {/* Chips / Context Unit inside Left Column */}
                            <div className="flex items-center gap-2 flex-wrap mt-4 md:mt-6">
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

                              {activeTask?.links && activeTask.links.map((link: any, linkIdx: number) => (
                                <a
                                  key={linkIdx}
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
                          <div className="w-full md:w-1/2 h-full flex flex-col justify-center gap-6 pl-0 md:pl-6 min-w-0 select-text">
                            {/* Sender Message Row */}
                            <div className="flex items-start gap-3 justify-start max-w-[85%]">
                              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-md">
                                <img 
                                  src={activeAvatar} 
                                  alt={activePersonName} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              </div>

                              <div className="bg-slate-200/80 dark:bg-[#2D2E30] text-slate-900 dark:text-white/90 text-[16px] md:text-[17px] leading-[24px] md:leading-[25px] font-normal px-5 py-3.5 rounded-[22px] max-w-[75%] font-['Google_Sans','Google_Sans_Text',sans-serif]">
                                {activeTask?.senderMessage || activeTask?.commentText || "hey dan, what was the conversation rate right after launch?"}
                              </div>
                            </div>

                            {/* Proposed Reply Row */}
                            <div className="flex items-end gap-3 justify-end max-w-[85%] ml-auto mt-2">
                              <div className="bg-slate-300/70 dark:bg-[#45474A] text-slate-900 dark:text-white text-[16px] md:text-[17px] leading-[24px] md:leading-[25px] font-normal px-5 py-3.5 rounded-[22px] max-w-[75%] font-['Google_Sans','Google_Sans_Text',sans-serif] flex items-center justify-between gap-4 relative group">
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
                        <div className="w-full h-full flex flex-col min-h-0">
                          {/* Header Block: Title, Subtitle, Badges restricted to Column 1 (w-full md:w-1/2 md:max-w-[50%]) on wide screen */}
                          <div className="w-full md:w-1/2 md:max-w-[50%] md:pr-4 flex flex-col items-start shrink-0 min-w-0 mb-4 select-text">
                            <motion.h3 
                              layout="position"
                              transition={{ duration: 3.5, ease: [0.16, 1, 0.3, 1] }}
                              className="font-sans text-slate-900 dark:text-white tracking-normal text-[22px] md:text-[26px] leading-[28px] md:leading-[32px] font-normal"
                            >
                              {cellTitle}
                            </motion.h3>

                            <motion.p 
                              layout="position"
                              transition={{ duration: 3.5, ease: [0.16, 1, 0.3, 1] }}
                              className="font-sans text-slate-600 dark:text-[#9AA0A6] text-[14px] md:text-[16px] leading-[20px] md:leading-[22px] font-normal mt-1.5 line-clamp-2"
                            >
                              {cellMeta}
                            </motion.p>

                            {/* Chips / Metadata Row */}
                            <div className="flex items-center gap-2 flex-wrap mt-3">
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

                              {activeTask?.links && activeTask.links.map((link: any, linkIdx: number) => (
                                <a
                                  key={linkIdx}
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

                          {/* Viewer Container */}
                          <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
                            {activeFileObject ? (
                              activeFileObject.originalMarkdown || activeFileObject.updatedMarkdown ? (
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
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                                No artifact preview available for this task.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      </LayoutGroup>

      {/* Action Toast Overlay */}
      <AnimatePresence>
        {actionToast && (
          <motion.div
            key={actionToast.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-slate-900/90 text-white font-['Google_Sans','Google_Sans_Text',sans-serif] text-[26px] font-normal p-3 px-6 rounded-full flex items-center gap-3 backdrop-blur-md border border-slate-700/50">
              {actionToast.text === 'Approved' && <Check className="w-7 h-7 text-[#34A853] stroke-[2.5]" />}
              {actionToast.text === 'Declined' && <X className="w-7 h-7 text-[#EA4335] stroke-[2.5]" />}
              {actionToast.text === 'Skipped' && <ArrowRight className="w-7 h-7 text-white stroke-[2]" />}
              <span>{actionToast.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Bar: Main chat input pill with action buttons in play mode */}
      <AnimatePresence>
        {isPlayMode && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full shrink-0 flex items-center justify-center gap-3 relative z-30 mt-auto pb-4 pt-1"
          >
            {/* Animated Previous Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="w-12 h-12 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/80 dark:border-[#2B2D31] hover:bg-slate-50 dark:hover:bg-[#282A2D] active:scale-95 text-slate-800 dark:text-white flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              title="Previous task"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2]" />
            </motion.button>

            {/* Animated Decline X Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              onClick={handleReject}
              className="w-13 h-13 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/80 dark:border-[#2B2D31] hover:bg-slate-50 dark:hover:bg-[#282A2D] active:scale-95 flex items-center justify-center cursor-pointer transition-all shrink-0"
              title="Decline"
            >
              <X className="w-6 h-6 text-[#EA4335] stroke-[2.5]" />
            </motion.button>

            {/* Central Chat Input Pill matching LandingInput layout */}
            <motion.div 
              layoutId="landing-input-main"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full max-w-[560px] h-[58px] rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/80 dark:border-[#2B2D31] flex items-center gap-3 px-5 relative z-20 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950 transition-all cursor-text"
              onClick={() => {
                const el = document.getElementById('optionc-steer-input');
                if (el) el.focus();
              }}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0 transition cursor-pointer flex items-center justify-center p-1 rounded-full border-none outline-none"
                title="Add attachment or context"
              >
                <Plus size={20} className="stroke-[2.5]" />
              </button>

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
                placeholder={getSteerPlaceholder()}
                className="flex-1 bg-transparent text-slate-900 dark:text-white text-[15px] font-normal placeholder-slate-400 focus:outline-none truncate border-none ring-0 h-full"
              />

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDockToSide();
                  }}
                  className="w-9 h-9 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-neutral-400 flex items-center justify-center transition cursor-pointer border-none outline-none"
                  title="Snap to side chat"
                >
                  <span className="material-symbols-rounded text-[20px] select-none">dock_to_right</span>
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
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition border-none outline-none ${
                    steerInput.trim()
                      ? 'bg-[#0B57D0] text-white hover:bg-blue-600 cursor-pointer'
                      : 'bg-black/10 dark:bg-white/10 text-slate-400 dark:text-neutral-500 cursor-not-allowed'
                  }`}
                  title={steerInput.trim() ? "Submit steer" : "Send"}
                >
                  <ArrowUp size={16} className="stroke-[2.5]" />
                </button>
              </div>
            </motion.div>

            {/* Animated Approve Check Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              onClick={() => {
                if (steerInput.trim()) {
                  handleSteerSubmit(steerInput);
                  setSteerInput('');
                } else {
                  handleApprove();
                }
              }}
              className="w-13 h-13 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/80 dark:border-[#2B2D31] hover:bg-slate-50 dark:hover:bg-[#282A2D] active:scale-95 flex items-center justify-center cursor-pointer transition-all shrink-0"
              title={steerInput.trim() ? "Submit steer" : "Accept"}
            >
              <Check className="w-6 h-6 text-[#34A853] stroke-[2.5]" />
            </motion.button>

            {/* Animated Next Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              onClick={handleNext}
              disabled={activeIndex === orderedTodoItems.length - 1}
              className="w-12 h-12 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/80 dark:border-[#2B2D31] hover:bg-slate-50 dark:hover:bg-[#282A2D] active:scale-95 text-slate-800 dark:text-white flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              title="Next task"
            >
              <ArrowRight className="w-5 h-5 stroke-[2]" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
