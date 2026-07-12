import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Trash2, Pin } from 'lucide-react';
import { AppView } from './AppView';
import { NativeViewer } from './NativeViewer';
import { InferredTaskCard } from '../Chat/InferredTaskCard';

interface SpaceDashboardProps {
  spaceId: string;
  spaceName: string;
  pinnedArtifactIds?: string[];
  sandboxFiles: any[];
  onSelectArtifact: (file: any) => void;
  onRemovePin: (fileId: string) => void;
  onReorderPins: (newOrderedIds: string[]) => void;
  sandboxUrl?: string;
  envId?: string | null;
  theme?: 'light' | 'dark';
  todoItems?: any[];
  getFileIcon?: (mimeType?: string) => string;
  onProactiveTaskClick?: (item: any) => void;
  setSandboxFiles?: (files: any[]) => void;
  setSelectedFile?: (file: any) => void;
  setProjectName?: (name: string) => void;
  setViewState?: (state: any) => void;
  setActiveSidebar?: (sidebar: any) => void;
}

export function SpaceDashboard({
  spaceId,
  spaceName,
  pinnedArtifactIds = [],
  sandboxFiles = [],
  onSelectArtifact,
  onRemovePin,
  onReorderPins,
  sandboxUrl,
  envId,
  theme = 'light',
  todoItems,
  getFileIcon,
  onProactiveTaskClick,
  setSandboxFiles,
  setSelectedFile,
  setProjectName,
  setViewState,
  setActiveSidebar
}: SpaceDashboardProps) {
  const [cardWidths, setCardWidths] = useState<Record<string, number>>({});
  const [activeMenuCardId, setActiveMenuCardId] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  
  // Resizing state
  const resizingRef = useRef<{
    activeId: string;
    adjacentId: string | null;
    startX: number;
    startWidthActive: number;
    startWidthAdjacent: number;
    containerWidth: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve synthetic or real To-dos artifact
  const hasTodoCard = Boolean(todoItems && todoItems.length > 0);
  const todoArtifact = sandboxFiles.find(f => f && (f.isInferredTask || f.name?.toLowerCase() === 'inferred_tasks.json' || f.id === 'todo-card')) || {
    id: 'todo-card',
    name: 'inferred_tasks.json',
    type: 'code',
    mimeType: 'application/json',
    isInferredTask: true,
    taskType: 'inferred'
  };

  const isTodoPinned = pinnedArtifactIds.length === 0 ? hasTodoCard : (
    pinnedArtifactIds.includes('todo-card') ||
    pinnedArtifactIds.includes('inferred-tasks') ||
    pinnedArtifactIds.some(id => String(id).toLowerCase().includes('todo') || String(id).toLowerCase().includes('inferred'))
  );

  // Combine regular pinned files with todo card if pinned
  const regularPinnedFiles = pinnedArtifactIds
    .map(id => sandboxFiles.find(f => f && (
      f.id === id || 
      f.driveId === id ||
      (f.id && id && String(f.id).toLowerCase() === String(id).toLowerCase()) ||
      (f.name && id && (String(id).toLowerCase().endsWith('-' + f.name.toLowerCase()) || String(id).toLowerCase().endsWith('_' + f.name.toLowerCase()) || String(id).toLowerCase() === f.name.toLowerCase()))
    )))
    .filter(Boolean);

  const pinnedFiles = [
    ...regularPinnedFiles,
    ...(isTodoPinned && !regularPinnedFiles.some(f => f.id === todoArtifact.id || f.name === todoArtifact.name) ? [todoArtifact] : [])
  ];

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuCardId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Proportional resize mouse listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { activeId, adjacentId, startX, startWidthActive, startWidthAdjacent, containerWidth } = resizingRef.current;
      const deltaX = e.clientX - startX;
      const deltaPercentage = (deltaX / containerWidth) * 100;

      let newActive = Math.max(20, Math.min(80, startWidthActive + deltaPercentage));
      let newAdjacent = adjacentId ? Math.max(20, Math.min(80, startWidthAdjacent - deltaPercentage)) : null;

      if (adjacentId && newAdjacent) {
        setCardWidths(prev => ({
          ...prev,
          [activeId]: newActive,
          [adjacentId]: newAdjacent!
        }));
      } else {
        setCardWidths(prev => ({
          ...prev,
          [activeId]: newActive
        }));
      }
    };

    const handleMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null;
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = (e: React.MouseEvent, activeId: string, index: number, direction: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();
    document.body.style.cursor = 'col-resize';

    const containerWidth = containerRef.current?.clientWidth || 1000;
    const adjacentIndex = direction === 'right' ? index + 1 : index - 1;
    const adjacentFile = pinnedFiles[adjacentIndex];
    const adjacentId = adjacentFile ? (adjacentFile.id || adjacentFile.driveId) : null;

    const startWidthActive = cardWidths[activeId] || (100 / Math.min(pinnedFiles.length, 2));
    const startWidthAdjacent = adjacentId ? (cardWidths[adjacentId] || (100 / Math.min(pinnedFiles.length, 2))) : 50;

    resizingRef.current = {
      activeId,
      adjacentId,
      startX: e.clientX,
      startWidthActive,
      startWidthAdjacent,
      containerWidth
    };
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedCardId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (id !== draggedCardId) {
      setDragOverCardId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCardId(null);
    if (!draggedCardId || draggedCardId === targetId) return;

    const currentIndex = pinnedArtifactIds.indexOf(draggedCardId);
    const targetIndex = pinnedArtifactIds.indexOf(targetId);
    if (currentIndex === -1 || targetIndex === -1) return;

    const newOrder = [...pinnedArtifactIds];
    newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, draggedCardId);
    onReorderPins(newOrder);
    setDraggedCardId(null);
  };

  const totalCardsCount = pinnedFiles.length;

  if (totalCardsCount === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-transparent text-center select-none animate-in fade-in duration-300">
        <div className="max-w-md p-8 rounded-3xl border border-dashed border-slate-300 dark:border-neutral-800 bg-white/50 dark:bg-[#18191B]/50 backdrop-blur-sm flex flex-col items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Pin size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white font-sans mb-1">
              No pinned artifacts yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-sans">
              Click the pin icon on any library item or inside an artifact's child chat to pin live previews directly to this dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex flex-wrap gap-4 p-6 overflow-y-auto content-start items-start select-none"
    >
      {pinnedFiles.map((file, idx) => {
        const fileId = file.id || file.driveId || 'file-' + idx;
        const widthPct = cardWidths[fileId] || (totalCardsCount === 1 ? 100 : 48);
        const isTodo = file.isInferredTask || file.id === 'todo-card' || file.name === 'inferred_tasks.json' || file.name === 'To-dos';
        const isHtml = !isTodo && file.name && (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase() === 'index.html');
        const isDragOver = dragOverCardId === fileId;
        let todoTitle = 'To-dos';
        if (isTodo && file.content) {
          try {
            const parsed = JSON.parse(file.content);
            if (parsed.title) todoTitle = parsed.title;
          } catch (e) {}
        }
        const cardTitle = isTodo ? todoTitle : file.name;

        return (
          <div
            key={fileId}
            style={{ width: `calc(${widthPct}% - 8px)` }}
            className={`min-w-[320px] h-[460px] rounded-3xl border relative group flex flex-col overflow-hidden transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-[#1E1F22] border-neutral-800 shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
                : 'bg-white border-slate-100/80 shadow-[0_8px_30px_rgba(220,225,235,0.45)]'
            } ${isDragOver ? 'ring-2 ring-blue-500 scale-[1.01]' : ''}`}
            onDragOver={(e) => handleDragOver(e, fileId)}
            onDragLeave={() => setDragOverCardId(null)}
            onDrop={(e) => handleDrop(e, fileId)}
          >
            {/* Header toolbar overlay (pointer-events-auto) */}
            <div className="h-11 px-4 border-b border-slate-100 dark:border-neutral-800/80 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-[#18191B]/80 backdrop-blur-sm z-20 pointer-events-auto">
              <div 
                className="flex items-center gap-1.5 min-w-0 cursor-pointer group/title"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectArtifact(file);
                }}
                title="Click to open artifact authoring chat"
              >
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors">
                  {cardTitle}
                </span>
                {isTodo && todoItems && todoItems.length > 0 && (
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 bg-slate-200/60 dark:bg-neutral-800 px-2 py-0.5 rounded-full ml-1">
                    {todoItems.length}
                  </span>
                )}
                <span className="text-slate-400 opacity-0 group-hover/title:opacity-100 transition-opacity text-[10px]">↗</span>
              </div>

              {/* 3 dots reorder & menu handle */}
              <div className="relative">
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => handleDragStart(e, fileId)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuCardId(activeMenuCardId === fileId ? null : fileId);
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-neutral-800 transition cursor-grab active:cursor-grabbing"
                  title="Drag to reorder or click for options"
                >
                  <MoreHorizontal size={16} />
                </button>

                {/* Dropdown Menu */}
                {activeMenuCardId === fileId && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-8 w-36 rounded-xl bg-white dark:bg-[#2B2D31] border border-slate-200 dark:border-white/10 shadow-xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <button
                      onClick={() => {
                        setActiveMenuCardId(null);
                        onSelectArtifact(file);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveMenuCardId(null);
                        onRemovePin(fileId);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Live Viewport */}
            <div className="flex-1 w-full h-full relative overflow-hidden pointer-events-auto select-auto bg-slate-50/30 dark:bg-black/20">
              <div className="absolute inset-0 w-full h-full">
                {isTodo ? (
                  isHtml ? (
                    <AppView
                      sandboxUrl={sandboxUrl}
                      files={sandboxFiles}
                      envId={envId}
                      selectedFile={file}
                      theme={theme}
                    />
                  ) : (
                    <div className="w-full h-full overflow-y-auto p-4 space-y-3">
                      {todoItems && todoItems.map((item) => (
                        <InferredTaskCard 
                          key={item.id}
                          item={item}
                          getFileIcon={getFileIcon || (() => '')}
                          onClick={() => {
                            if (onProactiveTaskClick) {
                              onProactiveTaskClick(item);
                            } else {
                              if (item.filesToLoad && setSandboxFiles && setSelectedFile) {
                                setSandboxFiles(item.filesToLoad);
                                setSelectedFile(item.filesToLoad[0]);
                              } else if (setSandboxFiles && setSelectedFile) {
                                setSandboxFiles([]);
                                setSelectedFile(null);
                              }
                              if (setProjectName) {
                                setProjectName(item.workspace.split(' · ')[0]);
                              }
                              if (setViewState) {
                                setViewState('files');
                              }
                              if (setActiveSidebar) {
                                setActiveSidebar('gemini');
                              }
                            }
                          }}
                        />
                      ))}
                    </div>
                  )
                ) : isHtml ? (
                  <AppView
                    sandboxUrl={sandboxUrl}
                    files={sandboxFiles}
                    envId={envId}
                    selectedFile={file}
                    theme={theme}
                  />
                ) : (
                  <NativeViewer
                    file={file}
                    hideHeader={true}
                    mode="preview"
                    theme={theme}
                  />
                )}
              </div>
            </div>

            {/* Vertical resize handles */}
            {idx > 0 && (
              <div
                onMouseDown={(e) => startResizing(e, fileId, idx, 'left')}
                className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-20 hover:bg-blue-500/40 transition-colors"
                title="Drag to resize width"
              />
            )}
            {idx < pinnedFiles.length - 1 && (
              <div
                onMouseDown={(e) => startResizing(e, fileId, idx, 'right')}
                className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-20 hover:bg-blue-500/40 transition-colors"
                title="Drag to resize width"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
