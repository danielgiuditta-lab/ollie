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
  Play
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
    triggerActionToast('Skipped');
    setActiveIndex(prev => Math.max(0, prev - 1));
    setSteerInput('');
  };

  const handleNext = () => {
    triggerActionToast('Skipped');
    setActiveIndex(prev => Math.min(orderedTodoItems.length - 1, prev + 1));
    setSteerInput('');
  };

  const handleSelectPeekedCell = (idx: number) => {
    triggerActionToast('Skipped');
    setActiveIndex(idx);
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

  const getNativeToolLabel = () => {
    if (!activeTask) return 'Open in Drive';

    const sourceAndType = [
      activeTask.type,
      activeTask.sourceMimeType,
      activeTask.sourceName,
      activeTask.workspace,
      activeTask.title,
      activeTask.description
    ].filter(Boolean).join(' ').toLowerCase();

    if (sourceAndType.includes('chat') || sourceAndType.includes('message')) return 'Open in Chat';
    if (sourceAndType.includes('mail') || sourceAndType.includes('gmail')) return 'Open in Gmail';
    if (sourceAndType.includes('calendar') || sourceAndType.includes('schedule')) return 'Open in Calendar';
    if (sourceAndType.includes('slide') || sourceAndType.includes('presentation')) return 'Open in Slides';
    if (sourceAndType.includes('sheet') || sourceAndType.includes('csv')) return 'Open in Sheets';
    if (sourceAndType.includes('doc') || sourceAndType.includes('gdoc')) return 'Open in Docs';

    return 'Open in Drive';
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
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#121316] text-slate-900 dark:text-white select-none font-sans p-4 md:p-6 overflow-hidden relative">
      {/* Top Bar Header in Light Mode */}
      <div className="w-full shrink-0 flex items-center justify-between pb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[17px] font-normal text-slate-500 dark:text-neutral-400">
            <span 
              onClick={onClose}
              className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors font-medium text-slate-700 dark:text-neutral-300"
            >
              Home
            </span>
            <ChevronRight size={18} className="text-slate-400 dark:text-neutral-500 shrink-0" />
            <span className="text-slate-900 dark:text-white font-semibold">
              Option C (Feed Mode) <span className="text-slate-500 dark:text-neutral-400 font-normal">({orderedTodoItems.length > 0 ? activeIndex + 1 : 0} of {orderedTodoItems.length})</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenSourceChip(activeTask?.links?.[0]?.url || activeTask?.sourceName || activeTask?.title)}
            className="h-9 px-4 rounded-full bg-white hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-white/10 shadow-xs"
          >
            {getFileIcon(activeTask?.sourceName || activeTask?.title, activeTask?.sourceMimeType || activeTask?.type)}
            <span>{getNativeToolLabel()}</span>
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-200 dark:border-white/10 shadow-xs"
            title="Close Option C View"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Cells Feed Stack */}
      <div className="flex-1 w-full min-h-0 flex flex-col gap-3 overflow-y-auto pr-1">
        {orderedTodoItems.map((item, idx) => {
          const isActive = idx === activeIndex;
          const titleText = getAbbreviatedCellTitle(item, completedTaskIds.has(item.id));
          const descText = item.description || item.descriptionDone || item.action || '';

          if (!isActive) {
            {/* Peeked Non-Active Cell */}
            return (
              <motion.div
                key={item.id || idx}
                layout
                onClick={() => handleSelectPeekedCell(idx)}
                className="w-full h-16 shrink-0 bg-white dark:bg-[#1E1F22] hover:bg-slate-100 dark:hover:bg-[#25272B] border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 shadow-xs select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-semibold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <h4 className="text-[14px] leading-tight font-medium text-slate-900 dark:text-white truncate">
                      {titleText}
                    </h4>
                    <p className="text-[12px] leading-tight text-slate-500 dark:text-neutral-400 truncate">
                      {descText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40">
                    Click to Expand / Skip
                  </span>
                  {completedTaskIds.has(item.id) && (
                    <Check size={16} className="text-green-600 dark:text-green-400 stroke-[2.5]" />
                  )}
                </div>
              </motion.div>
            );
          }

          {/* Active Expanded Cell in Light Mode */}
          return (
            <motion.div
              key={item.id || idx}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full flex-1 min-h-[520px] max-h-[calc(100vh-210px)] bg-white dark:bg-[#1E1F22] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl flex flex-col p-6 md:p-8 overflow-hidden relative select-text"
            >
              {/* Header inside Artifact in Light Mode */}
              <div className="w-full shrink-0 flex flex-col items-start mb-6 font-sans">
                <div className="w-full flex items-center justify-between gap-4">
                  <h3 className="text-[28px] md:text-[32px] leading-tight font-semibold text-slate-900 dark:text-white">
                    {canvasTitleText}
                  </h3>
                </div>

                {canvasMetaText && (
                  <p className="text-[16px] md:text-[18px] leading-relaxed text-slate-600 dark:text-neutral-300 mt-2 line-clamp-2">
                    {canvasMetaText}
                  </p>
                )}

                {/* Source chips */}
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  {activePersonName && (
                    <div 
                      onClick={() => handleOpenSourceChip(activePersonName)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#28292D] dark:hover:bg-[#33353B] text-[13px] font-medium text-slate-700 dark:text-[#E3E3E3] transition-colors cursor-pointer border border-slate-200/60 dark:border-transparent"
                    >
                      {canvasAvatarElement}
                      <span className="truncate max-w-[140px]">{activePersonName}</span>
                    </div>
                  )}

                  {activeSourceName && (
                    <div 
                      onClick={() => handleOpenSourceChip(activeSourceName)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#28292D] dark:hover:bg-[#33353B] text-[13px] font-medium text-slate-700 dark:text-[#E3E3E3] transition-colors cursor-pointer border border-slate-200/60 dark:border-transparent"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[13px] font-medium transition-colors"
                    >
                      {link.label || 'Open Link'}
                    </a>
                  ))}
                </div>
              </div>

              {/* Artifact Body in Light Mode */}
              <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden relative">
                {isChatReplyTask ? (
                  <div className="w-full h-full flex flex-row items-center justify-between gap-6 md:gap-8 p-4 md:p-6 bg-slate-50 dark:bg-[#18191B] rounded-xl border border-slate-200/80 dark:border-white/5 font-sans">
                    {/* Left Column: Context Info */}
                    <div className="w-1/2 h-full flex flex-col justify-center pr-4">
                      <h4 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
                        {canvasTitleText}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-neutral-400">
                        {canvasMetaText}
                      </p>
                    </div>

                    {/* Right Column: Chat Bubbles */}
                    <div className="w-1/2 h-full flex flex-col justify-center gap-4 pl-4 min-w-0">
                      {/* Sender Message */}
                      <div className="flex items-start gap-3 justify-start">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-xs">
                          <img 
                            src={activeAvatar} 
                            alt={activePersonName} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                        <div className="bg-slate-200 dark:bg-[#2D2E30] text-slate-900 dark:text-white text-[15px] leading-relaxed p-4 rounded-2xl max-w-[80%] shadow-xs">
                          {activeTask?.senderMessage || activeTask?.commentText || "hey dan, what was the conversation rate right after launch?"}
                        </div>
                      </div>

                      {/* Proposed Reply */}
                      <div className="flex items-end gap-3 justify-end">
                        <div className="bg-blue-50 dark:bg-[#45474A] border border-blue-200 dark:border-transparent text-slate-900 dark:text-white text-[15px] leading-relaxed p-4 rounded-2xl max-w-[80%] shadow-xs flex items-center justify-between gap-4">
                          {isEditingProposal ? (
                            <div className="flex flex-col gap-2 w-full">
                              <textarea
                                value={editableProposalText}
                                onChange={(e) => setEditableProposalText(e.target.value)}
                                className="w-full bg-white dark:bg-black/40 text-slate-900 dark:text-white text-sm p-2 rounded-lg border border-slate-300 dark:border-white/30 focus:outline-none"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setIsEditingProposal(false)}
                                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => {
                                    if (activeTask) activeTask.proposedReply = editableProposalText;
                                    setIsEditingProposal(false);
                                  }}
                                  className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md font-medium"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="whitespace-pre-wrap flex-1">
                                {editableProposalText || activeTask?.proposedReply || activeTask?.action || "hey alan!\nconversion is steady at 21%"}
                              </div>
                              <button
                                onClick={() => setIsEditingProposal(true)}
                                className="p-1 text-slate-500 hover:text-slate-800 dark:text-white/80 dark:hover:text-white cursor-pointer"
                                title="Edit proposed reply"
                              >
                                <Pencil size={16} />
                              </button>
                            </>
                          )}
                        </div>

                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-xs">
                          <img 
                            src={userProfile?.picture || '/people/sarah_lin.jpg'} 
                            alt="User" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeFileObject ? (
                  <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-transparent rounded-xl">
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
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                    No preview available for this task.
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

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
            <div className="bg-slate-900/90 text-white font-sans text-[24px] font-medium p-3 px-6 rounded-full shadow-xl flex items-center gap-3 backdrop-blur-md">
              {actionToast.text === 'Approved' && <Check className="w-6 h-6 text-green-400 stroke-[2.5]" />}
              {actionToast.text === 'Declined' && <X className="w-6 h-6 text-red-400 stroke-[2.5]" />}
              {actionToast.text === 'Skipped' && <ArrowRight className="w-6 h-6 text-white stroke-[2]" />}
              <span>{actionToast.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Bar Below All Cells */}
      <div className="w-full shrink-0 pt-4 flex items-center justify-center gap-3 relative z-20">
        {/* Skip Previous */}
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className="w-12 h-12 rounded-full bg-white hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-white flex items-center justify-center cursor-pointer transition-all border border-slate-200 dark:border-white/10 shadow-md disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          title="Previous task (Skip)"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Decline Button */}
        <button
          onClick={handleReject}
          className="w-12 h-12 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center cursor-pointer transition-all border border-red-200 dark:border-red-900/30 shadow-md shrink-0"
          title="Decline task"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Approve Button */}
        <button
          onClick={handleApprove}
          className="w-12 h-12 rounded-full bg-green-50 hover:bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center cursor-pointer transition-all border border-green-200 dark:border-green-900/30 shadow-md shrink-0"
          title="Approve task"
        >
          <Check className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Steer Input Pill */}
        <div 
          className={`rounded-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 flex items-center gap-3 transition-all duration-300 ease-in-out shadow-md ${
            (isInputFocused || steerInput.trim().length > 0)
              ? 'h-[56px] w-[340px] md:w-[500px] px-4' 
              : 'h-12 w-[220px] md:w-[320px] px-4 cursor-pointer'
          }`}
          onClick={() => setIsInputFocused(true)}
        >
          <input
            type="text"
            value={steerInput}
            onChange={(e) => setSteerInput(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && steerInput.trim()) {
                handleSteerSubmit(steerInput.trim());
              }
            }}
            placeholder={getSteerPlaceholder()}
            className="w-full bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none placeholder-slate-400 dark:placeholder-neutral-400 font-sans"
          />
          {steerInput.trim().length > 0 && (
            <button
              onClick={() => handleSteerSubmit(steerInput.trim())}
              className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer"
            >
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        {/* Skip Next */}
        <button
          onClick={handleNext}
          disabled={activeIndex === orderedTodoItems.length - 1}
          className="w-12 h-12 rounded-full bg-white hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-white flex items-center justify-center cursor-pointer transition-all border border-slate-200 dark:border-white/10 shadow-md disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          title="Next task (Skip)"
        >
          <ArrowRight className="w-5 h-5 stroke-[2]" />
        </button>
      </div>
    </div>
  );
}
