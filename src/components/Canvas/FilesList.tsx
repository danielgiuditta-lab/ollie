import React, { useState } from 'react';
import { getFileIcon } from '../Shared/FileIcon';
import { ContextMenu } from '../Shared/ContextMenu';

interface FilesListProps {
  files?: any[];
  onFileSelect: (file: any) => void;
  onFileRemove?: (file: any) => void;
  userProfile?: any;
  theme?: 'light' | 'dark';
}

export function FilesList({ files, onFileSelect, onFileRemove, userProfile, theme = 'light' }: FilesListProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: any } | null>(null);


  const formatSize = (bytesstr: string) => {
    if (!bytesstr) return '--';
    const bytes = parseInt(bytesstr, 10);
    if (isNaN(bytes)) return '--';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const displayFiles = files ? files.map(f => {
    const defaultOwner = userProfile ? { displayName: userProfile.name || userProfile.displayName, photoLink: userProfile.picture } : null;
    const activeOwner = f.owners?.[0] || defaultOwner || { displayName: 'System Agent', photoLink: null };
    return {
      ...f,
      icon: getFileIcon(f.name, f.type || f.mimeType, 20), // handle 'type' from sandbox, or mimeType from drive
      size: formatSize(f.content ? String(f.content.length) : f.size),
      modified: formatDate(f.modifiedTime || new Date().toISOString()),
      owner: activeOwner.displayName || 'System Agent',
      ownerPic: activeOwner.photoLink || null
    };
  }) : [];

  return (
    <div className="w-full flex-1 pt-4 pb-6 px-6 bg-white dark:bg-[#1E1F22] flex flex-col transition-colors duration-300">
      <div 
        className="grid grid-cols-12 gap-4 pb-3 text-base font-medium text-slate-900 dark:text-[#E3E3E3] select-none border-b border-gray-100 dark:border-white/10"
        style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
      >
        <div className="col-span-5">Name</div>
        <div className="col-span-3">Owner</div>
        <div className="col-span-2">Modified</div>
        <div className="col-span-2">Size</div>
      </div>
      
      {displayFiles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-xs py-8">
          No files in this directory.
        </div>
      ) : (
        <div className="flex flex-col mt-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {displayFiles.map(file => (
            <div 
              key={file.id || file.name} 
              className="grid grid-cols-12 gap-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer rounded-lg px-2 -mx-2 transition"
              onClick={() => onFileSelect(file)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({ x: e.clientX, y: e.clientY, file });
              }}
            >
              <div className="col-span-5 flex items-center gap-3 truncate pr-4">
                <div className="shrink-0 transition-transform hover:scale-105">{file.icon}</div>
                <span 
                  className="text-gray-950 dark:text-[#E3E3E3] font-normal text-sm truncate"
                  style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
                >
                  {file.name}
                </span>
              </div>
              <div className="col-span-3 flex items-center gap-2 truncate">
                <div className="w-5 h-5 border border-gray-200 dark:border-gray-800 rounded-full overflow-hidden shrink-0">
                  {file.ownerPic ? (
                    <img src={file.ownerPic} alt={file.owner} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-800"></div>
                  )}
                </div>
                <span 
                  className="text-sm text-gray-700 dark:text-gray-350 truncate"
                  style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
                >
                  {file.owner}
                </span>
              </div>
              <div 
                className="col-span-2 text-sm text-gray-600 dark:text-gray-400"
                style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
              >
                {file.modified}
              </div>
              <div 
                className="col-span-2 text-sm text-gray-600 dark:text-gray-400"
                style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
              >
                {file.size}
              </div>
            </div>
          ))}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRemove={() => {
            if (onFileRemove) onFileRemove(contextMenu.file);
          }}
        />
      )}
    </div>
  );
}
