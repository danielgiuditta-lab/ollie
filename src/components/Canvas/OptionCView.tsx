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
import { IconButton } from '../Shared/IconButton';

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

  const proposalTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (proposalTextareaRef.current) {
      proposalTextareaRef.current.style.height = 'auto';
      proposalTextareaRef.current.style.height = `${proposalTextareaRef.current.scrollHeight}px`;
    }
  }, [editableProposalText, isEditingProposal]);

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
    <div className="w-full h-full min-h-[560px] flex flex-col gap-4 bg-transparent text-slate-900 dark:text-white select-none font-sans px-2 md:px-4 pt-1 pb-4 overflow-hidden relative">
      {/* Floating Close Button positioned absolutely at top right */}
      {isPlayMode && (
        <div className="absolute top-4 right-4 z-50">
          <IconButton
            variant="card"
            onClick={onClose}
            title="Close Play mode"
          >
            <X className="w-5 h-5 text-slate-800 dark:text-white" />
          </IconButton>
        </div>
      )}

      <LayoutGroup id="option-c-cells-reel">
        {!isPlayMode ? (
          /* Landing Page View: Section headers and task cards */
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
          /* Play Mode View: Cell reel layout with smooth Framer Motion morphing */
          <div className="w-full flex-1 min-h-0 flex flex-col gap-4 relative overflow-hidden pb-4">
            <AnimatePresence initial={false}>
              {orderedTodoItems.map((item, idx) => {
                const isFocused = isPlayMode && idx === activeIndex;
                const isTopPeek = isPlayMode && idx === activeIndex - 1;
                const isBottomPeek = isPlayMode && idx === activeIndex + 1;
                const isVisibleInPlay = isFocused || isTopPeek || isBottomPeek;

                const itemId = item.id || `cell-${idx}`;
                const isCurrentSignedOff = completedTaskIds.has(item.id);
                const cellTitle = isCurrentSignedOff 
                  ? (item.titleDone || item.title || item.description)
                  : (item.title || item.titleDone || item.description);

                const cellMeta = isCurrentSignedOff
                  ? (item.descriptionDone || item.description || item.action || 'Your tasks will be added to "My tasks" when notes are ready')
                  : (item.description || item.descriptionDone || item.action || 'Gemini will write a professional follow-up email for you...');

                return (
                  <motion.div
                    key={itemId}
                    layoutId={`cell-${item.id}`}
                    ref={(el) => { itemRefs.current[idx] = el; }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ 
                      opacity: isVisibleInPlay ? 1 : 0, 
                      y: 0,
                      height: isFocused ? '100%' : isVisibleInPlay ? 'auto' : 0
                    }}
                    exit={{ opacity: 0, y: -20 }}
                    onClick={() => {
                      if (!isFocused) {
                        setActiveIndex(idx);
                      }
                    }}
                    className={`w-full flex flex-col justify-start items-start select-none overflow-hidden origin-top transition-[background-color,border-radius] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isFocused
                        ? 'flex-1 h-full min-h-0 max-w-[1140px] w-full self-center rounded-[24px] bg-[#F8FAFD] dark:bg-[#1E1F22] p-6 md:p-8 select-text cursor-default shrink-0 shadow-sm'
                        : isVisibleInPlay
                          ? 'shrink-0 w-full max-w-4xl self-center rounded-[16px] bg-[#F8FAFD] dark:bg-[#282A2D] hover:bg-[#EEF4FE] dark:hover:bg-[#35373A] p-4 px-5 cursor-pointer flex items-center justify-between gap-4'
                          : 'h-0 p-0 m-0 opacity-0 pointer-events-none'
                    }`}
                    transition={{
                      height: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                      layout: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                      opacity: { duration: 0.25 },
                      y: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
                    }}
                  >
                    {!isFocused ? (
                      /* Collapsed Peek Cell - Exact match to Home card layout (title on top, metaline below) without action buttons */
                      <div className="w-full flex flex-col text-left shrink-0 min-w-0 select-text">
                        <h4 className="text-[16px] leading-[24px] font-medium font-sans text-slate-900 dark:text-white truncate">
                          {cellTitle}
                        </h4>
                        <p className="text-[14px] leading-[20px] font-normal font-sans text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                          {cellMeta}
                        </p>
                      </div>
                    ) : (
                      /* Focused Canvas Content - EXACT MATCH to Option B Layout */
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25, delay: 0.1 }}
                        className="w-full h-full flex flex-col min-h-0 overflow-hidden select-text"
                      >
                        {isChatReplyTask ? (
                          <div className="w-full h-full flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 select-text font-['Google_Sans','Google_Sans_Text',sans-serif]">
                            {/* Left Column: Title, Meta, and Context Unit (Half of Canvas) */}
                            <div className="w-full md:w-1/2 h-full flex flex-col items-start justify-center pr-0 md:pr-6 min-w-0">
                              {/* Title */}
                              <h3 className="text-[32px] md:text-[36px] leading-[40px] font-normal text-slate-900 dark:text-white tracking-normal font-['Google_Sans','Google_Sans_Text',sans-serif]">
                                {canvasTitleText}
                              </h3>

                              {/* Meta */}
                              <p className="text-[20px] md:text-[22px] leading-[28px] font-normal text-slate-600 dark:text-[#9AA0A6] mt-3 md:mt-4 font-['Google_Sans','Google_Sans_Text',sans-serif]">
                                {canvasMetaText}
                              </p>

                              {/* Context Unit (Chips) */}
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

                            {/* Right Column: Chat UI (Half of Canvas) */}
                            <div className="w-full md:w-1/2 h-full flex flex-col justify-center gap-6 pl-0 md:pl-6 min-w-0 select-text">
                              {/* Sender Message Row */}
                              <div className="flex items-start gap-3 justify-start max-w-[85%]">
                                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-md border border-slate-200 dark:border-white/10">
                                  <img 
                                    src={activeAvatar} 
                                    alt={activePersonName} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                  />
                                </div>

                                <div className="bg-slate-200/80 dark:bg-[#2D2E30] text-slate-900 dark:text-white/90 text-[17px] md:text-[18px] leading-[25px] md:leading-[26px] font-normal px-6 py-4 rounded-[26px] max-w-[70%] font-['Google_Sans','Google_Sans_Text',sans-serif]">
                                  {activeTask?.senderMessage || activeTask?.commentText || "hey dan, what was the conversation rate right after launch?"}
                                </div>
                              </div>

                              {/* Proposed Reply Row */}
                              <div className="flex items-end gap-3 justify-end max-w-[85%] ml-auto mt-2">
                                <div className="bg-slate-300/70 dark:bg-[#45474A] text-slate-900 dark:text-white text-[17px] md:text-[18px] leading-[25px] md:leading-[26px] font-normal px-6 py-4 rounded-[26px] max-w-[85%] font-['Google_Sans','Google_Sans_Text',sans-serif] flex items-start justify-between gap-3 relative group">
                                  <textarea
                                    ref={proposalTextareaRef}
                                    value={editableProposalText}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditableProposalText(val);
                                      if (activeTask) activeTask.proposedReply = val;
                                      e.target.style.height = 'auto';
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    onFocus={() => setIsEditingProposal(true)}
                                    onBlur={() => {
                                      if (activeTask) activeTask.proposedReply = editableProposalText;
                                      setIsEditingProposal(false);
                                    }}
                                    style={{ height: 'auto', minHeight: '26px' }}
                                    className="w-full bg-transparent text-slate-900 dark:text-white text-[17px] md:text-[18px] leading-[25px] md:leading-[26px] font-normal focus:outline-none resize-none overflow-hidden font-['Google_Sans','Google_Sans_Text',sans-serif] placeholder-slate-500 dark:placeholder-neutral-400"
                                    placeholder="Type reply..."
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isEditingProposal) {
                                        if (activeTask) activeTask.proposedReply = editableProposalText;
                                        setIsEditingProposal(false);
                                      } else {
                                        setIsEditingProposal(true);
                                      }
                                    }}
                                    className="inline-flex items-center justify-center p-1 rounded-full text-slate-700 dark:text-white/90 hover:text-slate-900 hover:bg-slate-300/50 transition-all cursor-pointer shrink-0 self-start mt-0.5"
                                    title={isEditingProposal ? "Save proposed reply" : "Edit proposed reply"}
                                  >
                                    {isEditingProposal ? (
                                      <Check size={20} className="stroke-[2.5] text-green-600 dark:text-green-400" />
                                    ) : (
                                      <Pencil size={20} className="stroke-[2.2]" />
                                    )}
                                  </button>
                                </div>

                                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 shadow-md border border-slate-200 dark:border-white/10">
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
                            {/* Title, Metaline (capped at 2 lines), and Sources Unit (matching Option B structure) */}
                            {activeTask && (
                              <div className="w-full shrink-0 flex flex-col items-start max-w-[70%] mb-[30px] font-['Google_Sans','Google_Sans_Text',sans-serif]">
                                {/* Title: 32px with leading-[38px] */}
                                <h3 className="text-[32px] leading-[38px] font-normal text-slate-900 dark:text-white">
                                  {canvasTitleText}
                                </h3>

                                {/* Metaline: 20px with auto line height, capped at 2 lines */}
                                <p className="text-[20px] leading-normal font-normal text-slate-600 dark:text-neutral-300 mt-2 line-clamp-2 overflow-hidden text-ellipsis">
                                  {canvasMetaText}
                                </p>

                                {/* Sources below that */}
                                <div className="flex items-center gap-2 flex-wrap mt-4">
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

                                  {activeTask?.links && activeTask.links.map((link: any, linkIdx: number) => (
                                    <a
                                      key={linkIdx}
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

                            {/* Artifact Viewer Container filling remaining height */}
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
                      </motion.div>
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
            className="w-full shrink-0 flex items-center justify-center gap-3 relative z-30"
          >
            {/* Standard Previous Button */}
            <IconButton
              variant="card"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              title="Previous task"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2]" />
            </IconButton>

            {/* Standard Decline X Button */}
            <IconButton
              variant="card"
              onClick={handleReject}
              title="Decline"
            >
              <X className="w-5 h-5 text-red-600 dark:text-red-400 stroke-[2.5]" />
            </IconButton>

            {/* Central Chat Input Pill matching LandingInput layout */}
            <motion.div 
              layoutId="landing-input-main"
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
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
                {(isInputFocused || steerInput.trim().length > 0) && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDockToSide();
                    }}
                    className="w-9 h-9 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-neutral-400 flex items-center justify-center transition cursor-pointer border-none outline-none"
                    title="Snap to side chat"
                  >
                    <span className="material-symbols-rounded text-[20px] select-none">dock_to_right</span>
                  </button>
                )}

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

            {/* Standard Approve Check Button */}
            <IconButton
              variant="card"
              onClick={() => {
                if (steerInput.trim()) {
                  handleSteerSubmit(steerInput);
                  setSteerInput('');
                } else {
                  handleApprove();
                }
              }}
              title={steerInput.trim() ? "Submit steer" : "Accept"}
            >
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 stroke-[2.5]" />
            </IconButton>

            {/* Standard Next Button */}
            <IconButton
              variant="card"
              onClick={handleNext}
              disabled={activeIndex === orderedTodoItems.length - 1}
              title="Next task"
            >
              <ArrowRight className="w-5 h-5 stroke-[2]" />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
