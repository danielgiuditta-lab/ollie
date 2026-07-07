import React, { useState } from 'react';
import { 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { IconButton } from '../Shared/IconButton';
import { FileRow } from '../Shared/FileRow';
import { FolderRow } from '../Shared/FolderRow';

interface CanvasSidebarProps {
  files: any[];
  driveFiles?: any[];
  selectedFile: any;
  onFileSelect: (file: any) => void;
  indexFileSelected: boolean;
  activeSidebar: 'gemini' | 'comments' | 'history' | null;
  currentPath: string[];
  setCurrentPath: React.Dispatch<React.SetStateAction<string[]>>;
  theme?: 'light' | 'dark';
  directoryContentsMap?: Record<string, any[]>;
  onDirectoryNavigate?: (folderItem: any, targetPath: string[]) => void;
  loadingDirectories?: Record<string, boolean>;
  impactSpaceId?: string | null;
  animatingFileIds?: string[];
}

interface ExplorerItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  mimeType?: string;
  fileRef?: any;
}

export function CanvasSidebar({ 
  files, 
  driveFiles,
  selectedFile, 
  onFileSelect, 
  indexFileSelected,
  activeSidebar,
  currentPath,
  setCurrentPath,
  theme = 'light',
  directoryContentsMap,
  onDirectoryNavigate,
  loadingDirectories,
  impactSpaceId,
  animatingFileIds = []
}: CanvasSidebarProps) {



  const [singleColWidth, setSingleColWidth] = useState<number>(240);
  const [colWidths, setColWidths] = useState<Record<number, number>>({});

  const startResizeSingleCol = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = singleColWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(160, Math.min(500, startWidth + deltaX));
      setSingleColWidth(newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('is-resizing');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.classList.add('is-resizing');
  };

  const startResizeCol = (colIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[colIdx] || 260;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(160, startWidth + deltaX);
      setColWidths((prev) => ({
        ...prev,
        [colIdx]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('is-resizing');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.classList.add('is-resizing');
  };

  // Helper to extract folders and files inside a path prefix
  const getItemsAtPath = (prefix: string[]): ExplorerItem[] => {
    const itemsMap = new Map<string, ExplorerItem>();

    if (prefix.length === 0) {
      // Root column: combine both files (sandboxFiles) and driveFiles
      const sourceList = files || [];
      sourceList.forEach(file => {
        if (!file || !file.name) return;
        if (typeof file.content === 'string' && file.content.includes('Contents will load dynamically')) return;
        
        const parts = file.name.split('/').filter(Boolean);
        const name = parts[0];
        const isFolder = parts.length > 1 || file.type === 'folder' || (file.mimeType && file.mimeType.includes('folder'));
        
        if (!itemsMap.has(name)) {
          itemsMap.set(name, {
            name,
            path: name,
            type: isFolder ? 'folder' : 'file',
            mimeType: isFolder ? 'application/vnd.google-apps.folder' : file.mimeType,
            fileRef: isFolder ? file : (parts.length === 1 ? file : undefined)
          });
        }
      });
    } else {
      // Subfolder column for prefix (e.g. ["Project A"] or ["Project A", "Designs"])
      const pathKey = prefix.join('/');
      const currentFolderName = prefix[prefix.length - 1];

      let currentChildrenList: any[] = [];

      if (directoryContentsMap) {
        if (directoryContentsMap[pathKey]) {
          currentChildrenList = directoryContentsMap[pathKey];
        } else if (directoryContentsMap[currentFolderName]) {
          currentChildrenList = directoryContentsMap[currentFolderName];
        }
      }

      if (currentChildrenList.length === 0) {
        let parentItems: any[] = files || [];
        let targetNode: any = null;

        for (let i = 0; i < prefix.length; i++) {
          const folderSegment = prefix[i];
          const found = parentItems.find((f: any) => {
            if (!f) return false;
            const fName = (f.name || f.filename || '').split('/').filter(Boolean).pop();
            return fName === folderSegment || f.name === folderSegment || f.id === folderSegment;
          });
          if (found) {
            targetNode = found;
            const nodeKey = found.id || found.name;
            parentItems = (directoryContentsMap && directoryContentsMap[nodeKey]) || found.realChildren || found.children || found.filesToLoad || [];
          } else {
            parentItems = [];
          }
        }
        if (parentItems.length > 0) {
          currentChildrenList = parentItems;
        } else if (targetNode) {
          currentChildrenList = targetNode.realChildren || targetNode.children || targetNode.filesToLoad || [];
        }
      }

      currentChildrenList.forEach((child: any) => {
        if (!child || (!child.name && !child.filename)) return;
        if (typeof child.content === 'string' && child.content.includes('Contents will load dynamically')) return;
        
        const rawName = child.name || child.filename || '';
        const childName = rawName.split('/').filter(Boolean).pop() || rawName;
        if (!childName) return;

        if (!itemsMap.has(childName)) {
          const isFolder = child.type === 'folder' || (child.mimeType && child.mimeType.includes('folder'));
          itemsMap.set(childName, {
            name: childName,
            path: [...prefix, childName].join('/'),
            type: isFolder ? 'folder' : 'file',
            mimeType: child.mimeType,
            fileRef: child
          });
        }
      });

      // Also check virtual slash paths in files (e.g. "Project A/Designs/logo.png")
      files.forEach(file => {
        if (!file || !file.name) return;
        if (typeof file.content === 'string' && file.content.includes('Contents will load dynamically')) return;
        const parts = file.name.split('/').filter(Boolean);
        let matches = true;
        for (let i = 0; i < prefix.length; i++) {
          if (parts[i] !== prefix[i]) {
            matches = false;
            break;
          }
        }
        if (matches && parts.length > prefix.length) {
          const name = parts[prefix.length];
          const isLast = prefix.length === parts.length - 1;
          const fullPath = parts.slice(0, prefix.length + 1).join('/');
          if (!itemsMap.has(name)) {
            itemsMap.set(name, {
              name,
              path: fullPath,
              type: isLast ? ((file.mimeType && file.mimeType.includes('folder')) || file.type === 'folder' ? 'folder' : 'file') : 'folder',
              mimeType: isLast ? file.mimeType : 'application/vnd.google-apps.folder',
              fileRef: isLast ? file : undefined
            });
          }
        }
      });
    }

    const items = Array.from(itemsMap.values());
    
    return items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      const isAIndex = a.name.toLowerCase() === 'index.html';
      if (isAIndex) return -1;
      const isBIndex = b.name.toLowerCase() === 'index.html';
      if (isBIndex) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  const handleFolderClick = (colIdx: number, folderName: string, itemRef?: any) => {
    const newPath = [...currentPath.slice(0, colIdx), folderName];
    setCurrentPath(newPath);
    onFileSelect(null);
    if (onDirectoryNavigate) {
      onDirectoryNavigate(itemRef || { name: folderName }, newPath);
    }
  };

  const handleBackClick = () => {
    if (currentPath.length > 0) {
      setCurrentPath(prev => prev.slice(0, prev.length - 1));
    }
  };

  const isGeminiOpen = activeSidebar === 'gemini';
  const shouldCollapseToSingleCol = isGeminiOpen && !!selectedFile;

  if (shouldCollapseToSingleCol) {
    // Single column mode when Gemini is open
    const activeLevelItems = getItemsAtPath(currentPath);
    const activeFolderName = currentPath.length > 0 ? currentPath[currentPath.length - 1] : 'Files';

    return (
      <div className="flex items-center h-full shrink-0 relative z-20">
        <div 
          style={{ width: `${singleColWidth}px` }}
          className="flex flex-col h-full bg-white dark:bg-[#1E1F22] select-none shrink-0 rounded-[24px] overflow-hidden" 
          id="canvas-files-sidebar"
        >
          {/* Header Panel */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-4 shrink-0 select-none">
            {currentPath.length > 0 && (
              <IconButton 
                variant="borderless" 
                onClick={handleBackClick} 
                title="Go Back"
                theme={theme}
                id="canvas-files-sidebar-back"
              >
                <ChevronLeft size={18} className="text-[#5F6368] dark:text-[#E3E3E3]" />
              </IconButton>
            )}
            <h2 
              className="font-semibold tracking-tight text-gray-800 dark:text-white text-[16px] truncate"
              style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}
            >
              {currentPath.length > 0 ? activeFolderName : 'Files'}
            </h2>
          </div>

          {/* Scrollable contents */}
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
            {activeLevelItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                Empty folder
              </div>
            ) : (
              activeLevelItems.map(item => {
                const isIndex = item.name.toLowerCase() === 'index.html';
                const isSelected = item.type === 'file' 
                  ? (isIndex ? indexFileSelected : (selectedFile?.name === item.fileRef?.name && !indexFileSelected))
                  : false;
                const isRunnable = item.type === 'file' && (item.name.toLowerCase().endsWith('.html') || isIndex);
                const isAnimating = (animatingFileIds || []).some(id => 
                  id === item.name || 
                  id === item.fileRef?.id || 
                  id === item.fileRef?.name || 
                  id === (item.name || '').split('/').filter(Boolean).pop()
                );

                if (item.type === 'folder') {
                  return (
                    <FolderRow
                      key={item.name}
                      name={item.name}
                      dataId={item.fileRef?.id || item.name}
                      isSelected={isSelected}
                      isImpacted={impactSpaceId === item.name}
                      isAnimating={isAnimating}
                      theme={theme}
                      onClick={() => handleFolderClick(currentPath.length, item.name, item.fileRef)}
                    />
                  );
                }

                return (
                  <FileRow
                    key={item.name}
                    name={item.name}
                    dataId={item.fileRef?.id || item.fileRef?.name || item.name}
                    mimeType={item.mimeType}
                    isSelected={isSelected}
                    isAnimating={isAnimating}
                    theme={theme}
                    onClick={() => item.fileRef && onFileSelect(item.fileRef)}
                    rightElement={isRunnable ? (
                      <div className="ml-2 flex items-center justify-center w-6 h-6 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2B2D31] hover:bg-gray-50 dark:hover:bg-white/10 shadow-2xs shrink-0 select-none group/play transition-all">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover/play:text-gray-800 dark:group-hover/play:text-white leading-none select-none pl-0.5" style={{ fontFamily: 'sans-serif' }}>▶</span>
                      </div>
                    ) : undefined}
                  />
                );
              })
            )}
          </div>
        </div>
        <div 
          className="sidebar-resizer-grabber -mr-4" 
          onMouseDown={startResizeSingleCol}
          title="Drag to resize file sidebar"
        />
      </div>
    );
  }

  // Multi-column finder view mode (when Gemini is closed)
  const columnsToRender: string[][] = [[]]; // always start with the root list
  for (let i = 0; i < currentPath.length; i++) {
    columnsToRender.push(currentPath.slice(0, i + 1));
  }

  return (
    <div className={`flex items-center h-full relative z-20 ${selectedFile ? 'shrink-0' : 'flex-1 min-w-0'}`}>
      <div 
        className="flex h-full overflow-x-auto select-none scrollbar-thin items-stretch max-w-full" 
        id="canvas-files-columns"
      >
        {columnsToRender.map((prefixPath, colIdx) => {
          const items = getItemsAtPath(prefixPath);
          const selectedSubfolder = currentPath[colIdx]; // selected folder in this column if any

          const isFirst = colIdx === 0;
          const isLast = colIdx === columnsToRender.length - 1;

          const topLeft = isFirst ? '24px' : '8px';
          const bottomLeft = isFirst ? '24px' : '8px';
          const topRight = isLast ? '24px' : '8px';
          const bottomRight = isLast ? '24px' : '8px';

          const borderRadiusValue = `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`;
          const colWidth = colWidths[colIdx] || 260;

          return (
            <React.Fragment key={colIdx}>
              <div 
                className="shrink-0 bg-white dark:bg-[#1E1F22] flex flex-col h-full overflow-hidden border-0 border-none outline-none"
                style={{ 
                  width: `${colWidth}px`,
                  borderRadius: borderRadiusValue,
                  border: 'none',
                  outline: 'none',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03)'
                }}
              >
                {/* Column Header representing "Back" if not root */}
                {colIdx > 0 && (
                  <button 
                    onClick={() => {
                      setCurrentPath(currentPath.slice(0, colIdx));
                    }}
                    className="flex items-center gap-2 px-5 pt-6 pb-2 text-left bg-transparent border-0 outline-none transition-all select-none shrink-0 group hover:opacity-80 cursor-pointer"
                  >
                    <ChevronLeft 
                      size={18} 
                      className="text-gray-600 dark:text-[#E3E3E3] group-hover:text-[#202124] dark:group-hover:text-white transition-colors shrink-0 mr-1"
                    />
                    <span 
                      className="text-[16px] font-normal text-[#202124] dark:text-white truncate"
                      style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}
                    >
                      {prefixPath[prefixPath.length - 1]}
                    </span>
                  </button>
                )}

                {/* Column Items */}
                <div className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
                  {loadingDirectories && loadingDirectories[prefixPath.join('/')] ? (
                    <div className="py-8 text-center text-xs text-gray-400 font-medium whitespace-nowrap flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 font-medium whitespace-nowrap">
                      Empty folder
                    </div>
                  ) : (
                    items.map(item => {
                      const isIndex = item.name.toLowerCase() === 'index.html';
                      const isSelected = item.type === 'file' 
                        ? (isIndex ? indexFileSelected : (selectedFile?.name === item.fileRef?.name && !indexFileSelected))
                        : (selectedSubfolder === item.name); // folder selected if active path matches this column's selection
                      
                      const isRunnable = item.type === 'file' && (item.name.toLowerCase().endsWith('.html') || isIndex);
                      const isAnimating = (animatingFileIds || []).some(id => 
                        id === item.name || 
                        id === item.fileRef?.id || 
                        id === item.fileRef?.name || 
                        id === (item.name || '').split('/').filter(Boolean).pop()
                      );

                        if (item.type === 'folder') {
                          return (
                            <FolderRow
                              key={item.name}
                              name={item.name}
                              dataId={item.fileRef?.id || item.name}
                              isSelected={isSelected}
                              isImpacted={impactSpaceId === item.name}
                              isAnimating={isAnimating}
                              theme={theme}
                              onClick={() => handleFolderClick(colIdx, item.name, item.fileRef)}
                            />
                          );
                        }

                        return (
                          <FileRow
                            key={item.name}
                            name={item.name}
                            dataId={item.fileRef?.id || item.fileRef?.name || item.name}
                            mimeType={item.mimeType}
                            isSelected={isSelected}
                            isAnimating={isAnimating}
                            theme={theme}
                            onClick={() => item.fileRef && onFileSelect(item.fileRef)}
                            rightElement={isRunnable ? (
                              <div className="ml-2 flex items-center justify-center w-6 h-6 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2B2D31] hover:bg-gray-50 dark:hover:bg-white/10 shadow-2xs shrink-0 select-none group/play transition-all">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover/play:text-gray-800 dark:group-hover/play:text-white leading-none select-none pl-0.5" style={{ fontFamily: 'sans-serif' }}>▶</span>
                              </div>
                            ) : undefined}
                          />
                        );
                      })
                  )}
                </div>
              </div>
              {colIdx < columnsToRender.length - 1 && (
                <div 
                  className="column-resizer" 
                  onMouseDown={(e) => startResizeCol(colIdx, e)} 
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {selectedFile && (
        <div 
          className="sidebar-resizer-grabber -mr-4" 
          onMouseDown={(e) => startResizeCol(columnsToRender.length - 1, e)}
          title="Drag to resize file columns vs artifacts"
        />
      )}
    </div>
  );
}




