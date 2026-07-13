import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Trash2, Pin } from 'lucide-react';
import { AppView } from './AppView';
import { NativeViewer } from './NativeViewer';
import { InferredTaskCard } from '../Chat/InferredTaskCard';
import { Card } from '../Shared/Card';
import { CardHeader } from '../Shared/CardHeader';

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
  const [dragOverPosition, setDragOverPosition] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);
  const [dashboardLayoutMode, setDashboardLayoutMode] = useState<'auto' | 'rows' | 'cols'>('auto');
  
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
    const sourceId = draggedCardId || activeMenuCardId;
    if (id !== sourceId) {
      setDragOverCardId(id);
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const offsetX = e.clientX - rect.left;
      const relY = offsetY / rect.height;
      const relX = offsetX / rect.width;

      if (relY < 0.25) {
        setDragOverPosition('top');
      } else if (relY > 0.75) {
        setDragOverPosition('bottom');
      } else if (relX < 0.5) {
        setDragOverPosition('left');
      } else {
        setDragOverPosition('right');
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggedCardId || activeMenuCardId;
    if (!sourceId || sourceId === targetId) {
      setDragOverCardId(null);
      setDragOverPosition(null);
      return;
    }

    const currentIndex = pinnedArtifactIds.indexOf(sourceId);
    const targetIndex = pinnedArtifactIds.indexOf(targetId);
    if (currentIndex !== -1 && targetIndex !== -1) {
      const newOrder = [...pinnedArtifactIds];
      const temp = newOrder[currentIndex];
      newOrder[currentIndex] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      onReorderPins(newOrder);
    }

    if (dragOverPosition === 'top' || dragOverPosition === 'bottom') {
      setDashboardLayoutMode('rows');
    } else if (dragOverPosition === 'left' || dragOverPosition === 'right') {
      setDashboardLayoutMode('cols');
    }

    setDragOverCardId(null);
    setDragOverPosition(null);
    setDraggedCardId(null);
    setActiveMenuCardId(null);
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

  let gridLayoutClass = "grid-cols-1 md:grid-cols-2 grid-rows-1";
  if (dashboardLayoutMode === 'rows') {
    gridLayoutClass = "grid-cols-1 auto-rows-fr";
  } else if (dashboardLayoutMode === 'cols') {
    gridLayoutClass = "grid-cols-1 md:grid-cols-2 grid-rows-1";
  } else {
    if (totalCardsCount === 1) {
      gridLayoutClass = "grid-cols-1 grid-rows-1";
    } else if (totalCardsCount === 2) {
      gridLayoutClass = "grid-cols-1 md:grid-cols-2 grid-rows-1";
    } else if (totalCardsCount <= 4) {
      gridLayoutClass = "grid-cols-1 md:grid-cols-2 grid-rows-2";
    } else {
      gridLayoutClass = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr";
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full grid ${gridLayoutClass} gap-4 p-4 overflow-y-auto select-none items-stretch justify-stretch`}
    >
      {pinnedFiles.map((file, idx) => {
        const fileId = file.id || file.driveId || 'file-' + idx;
        const isTodo = file.isInferredTask || file.id === 'todo-card' || file.name === 'inferred_tasks.json' || file.name === 'To-dos';
        const isHtml = !isTodo && file.name && (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase() === 'index.html');
        const isDragOver = dragOverCardId === fileId;
        const isSelected = activeMenuCardId === fileId || draggedCardId === fileId;
        let todoTitle = 'To-dos';
        if (isTodo && file.content) {
          try {
            const parsed = JSON.parse(file.content);
            if (parsed.title) todoTitle = parsed.title;
          } catch (e) {}
        }
        let cardTitle = file.name;
        if (isTodo) {
          cardTitle = todoTitle;
        } else if (isHtml) {
          let extractedTitle = file.title;
          if (!extractedTitle && file.content && typeof file.content === 'string') {
            const titleMatch = file.content.match(/<title>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1] && titleMatch[1].trim() !== 'App' && titleMatch[1].trim() !== 'My Web Workspace') {
              extractedTitle = titleMatch[1].trim();
            }
          }
          if (!extractedTitle && file.chatName && file.chatName !== 'Custom Tool' && file.chatName !== 'New Site Workspace') {
            extractedTitle = file.chatName;
          }
          if (extractedTitle) {
            cardTitle = extractedTitle;
          } else if (file.name) {
            const cleaned = file.name.replace(/\.(html|htm)$/i, '');
            cardTitle = (cleaned.toLowerCase() === 'index' || cleaned.toLowerCase() === 'custom tool') ? 'Custom Tool' : cleaned;
          }
        }

        const isGhost = draggedCardId === fileId;

        return (
          <div 
            key={fileId} 
            className="card-container-item relative w-full h-full min-h-[340px] flex flex-col p-1 -m-1"
            onDragOver={(e) => handleDragOver(e, fileId)}
            onDragLeave={() => {
              setDragOverCardId(null);
              setDragOverPosition(null);
            }}
            onDrop={(e) => handleDrop(e, fileId)}
          >
            {/* Dynamic Destination Line Indicators */}
            {isDragOver && dragOverPosition === 'top' && (
              <div className="absolute -top-3 -left-1 -right-1 h-1.5 bg-[#3186FF] rounded-full shadow-[0_0_12px_rgba(49,134,255,0.9)] z-40 pointer-events-none animate-pulse" />
            )}
            {isDragOver && dragOverPosition === 'bottom' && (
              <div className="absolute -bottom-3 -left-1 -right-1 h-1.5 bg-[#3186FF] rounded-full shadow-[0_0_12px_rgba(49,134,255,0.9)] z-40 pointer-events-none animate-pulse" />
            )}
            {isDragOver && dragOverPosition === 'left' && (
              <div className="absolute -left-3 -top-1 -bottom-1 w-1.5 bg-[#3186FF] rounded-full shadow-[0_0_12px_rgba(49,134,255,0.9)] z-40 pointer-events-none animate-pulse" />
            )}
            {isDragOver && dragOverPosition === 'right' && (
              <div className="absolute -right-3 -top-1 -bottom-1 w-1.5 bg-[#3186FF] rounded-full shadow-[0_0_12px_rgba(49,134,255,0.9)] z-40 pointer-events-none animate-pulse" />
            )}
            <Card
              theme={theme}
              isSelected={isSelected}
              isGhost={isGhost}
              isDragOver={isDragOver}
              className="w-full h-full flex-1 flex flex-col overflow-hidden"
              header={
                <CardHeader
                  title={cardTitle}
                  count={isTodo && todoItems && todoItems.length > 0 ? todoItems.length : undefined}
                  onTitleClick={(e) => {
                    e.stopPropagation();
                    onSelectArtifact(file);
                  }}
                  titleTooltip="Click to open artifact authoring chat"
                  theme={theme}
                  actions={
                    <div className="relative">
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => handleDragStart(e, fileId)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuCardId(activeMenuCardId === fileId ? null : fileId);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-grab active:cursor-grabbing ${
                          isSelected
                            ? 'text-[#3186FF] bg-blue-50 dark:bg-blue-950/50'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-neutral-800'
                        }`}
                        title="Drag to reorder or click for options"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuCardId === fileId && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-9 w-36 rounded-xl bg-white dark:bg-[#2B2D31] border border-slate-200 dark:border-white/10 shadow-xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100"
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
                  }
                />
              }
            >
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
            </Card>
          </div>
        );
      })}
    </div>
  );
}
