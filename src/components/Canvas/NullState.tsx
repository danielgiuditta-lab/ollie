import React, { useState, useRef } from 'react';
import { Upload, Plus, FolderPlus, Check } from 'lucide-react';
import { NullTitle } from '../Shared/NullTitle';
import { Button } from '../Shared/Button';
import { ContextMenu } from '../Shared/ContextMenu';

import docsIcon from '../../assets/docs.png';
import sheetsIcon from '../../assets/sheets.png';
import slidesIcon from '../../assets/slides.png';
import formsIcon from '../../assets/forms.png';
import htmlIcon from '../../assets/html.png';
import imageIcon from '../../assets/image.png';
import videoIcon from '../../assets/video.png';

interface SuggestedFile {
  name: string;
  mimeType: string;
}

const SUGGESTED_FILES: SuggestedFile[] = [
  { name: 'preferred suppliers', mimeType: 'application/vnd.google-apps.document' },
  { name: 'supply chain analysis', mimeType: 'application/vnd.google-apps.spreadsheet' },
  { name: 'ad spend', mimeType: 'application/vnd.google-apps.spreadsheet' },
  { name: 'meta ads manager conversion breakdown', mimeType: 'application/vnd.google-apps.spreadsheet' },
  { name: 'Bark Pet Supply Asset Inventory Report (Fixed Assets Doc)', mimeType: 'application/vnd.google-apps.document' },
  { name: 'Bark Pet Supply Asset Inventory Report (Fixed Assets Sheet)', mimeType: 'application/vnd.google-apps.spreadsheet' },
];

interface NullStateProps {
  accessToken?: string | null;
  driveFiles?: any[];
  onFileClick?: (file: any) => void;
  onAddSuggestedFile?: (file: { name: string; content: string; driveId?: string; mimeType?: string }) => void;
  onUploadFile?: (file: File) => void;
  selectedDriveFiles?: any[];
  onToggleDriveFile?: (file: any) => void;
  onCreateSpaceWithSelected?: () => void;
  isCreatingSpace?: boolean;
  onLogin?: () => void;
  isDriveLoading?: boolean;
  onFileRemove?: (file: any) => void;
}

export function NullState({ 
  accessToken, 
  driveFiles, 
  onFileClick, 
  onAddSuggestedFile, 
  onUploadFile,
  selectedDriveFiles = [],
  onToggleDriveFile,
  onCreateSpaceWithSelected,
  isCreatingSpace = false,
  onLogin,
  isDriveLoading = false,
  onFileRemove
}: NullStateProps) {
  const [bypassLogin, setBypassLogin] = useState(false);
  const [addingNames, setAddingNames] = useState<Record<string, boolean>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (mimeType: string) => {
    if (!mimeType) return docsIcon;
    const lower = mimeType.toLowerCase();
    
    if (lower === 'application/vnd.google-apps.document' || lower.includes('document') || lower.includes('word') || lower.includes('pdf')) {
      return docsIcon;
    }
    if (lower.startsWith('video/') || lower.includes('video') || lower.includes('mp4') || lower.includes('mov')) {
      return videoIcon;
    }
    if (lower === 'application/vnd.google-apps.spreadsheet' || lower.includes('sheet') || lower.includes('spreadsheet') || lower.includes('excel') || lower.includes('csv')) {
      return sheetsIcon;
    }
    if (lower === 'application/vnd.google-apps.presentation' || lower.includes('presentation') || lower.includes('powerpoint') || lower.includes('slides')) {
      return slidesIcon;
    }
    if (lower === 'application/vnd.google-apps.form' || lower.includes('form')) {
      return formsIcon;
    }
    if (lower === 'text/html' || lower.includes('html')) {
      return htmlIcon;
    }
    if (lower.startsWith('image/') || lower.includes('png') || lower.includes('jpg') || lower.includes('jpeg') || lower.includes('gif') || lower.includes('image')) {
      return imageIcon;
    }
    return docsIcon; // default fallback
  };

  const filesToDisplay = (accessToken && driveFiles && driveFiles.length > 0)
    ? driveFiles
    : SUGGESTED_FILES;

  const handleAddFile = async (file: any) => {
    const name = file.name;
    const mimeType = file.mimeType;
    if (addingNames[name]) return;
    setAddingNames(prev => ({ ...prev, [name]: true }));
    
    let content = "";
    if (accessToken && file.id) {
      try {
        let url = '';
        const lowerType = (mimeType || '').toLowerCase().trim();
        if (lowerType.includes('google-apps.document')) {
          url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
        } else if (lowerType.includes('google-apps.spreadsheet')) {
          url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
        } else if (lowerType.includes('google-apps.presentation')) {
          url = `https://www.googleapis.com/drive/v3/files/${file.id}?fields=description,name,mimeType`;
        } else {
          url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!res.ok) {
          if (lowerType.includes('google-apps.presentation')) {
            content = `# Presentation: ${name}\n\nType: Google Slides\nFile ID: ${file.id}`;
          } else {
            throw new Error(`Failed to fetch file content, status: ${res.status}`);
          }
        } else {
          if (lowerType.includes('google-apps.presentation')) {
            const metadata = await res.json();
            content = `# Presentation: ${metadata.name || name}\n\nType: Google Slides\nFile ID: ${file.id}`;
          } else {
            content = await res.text();
          }
        }
      } catch (err) {
        console.error('Failed to fetch real drive file content:', err);
        content = `# ${name}\n\n[Google Drive File]\nID: ${file.id}\nMIME Type: ${mimeType}\n\n(Click to preview/edit)`;
      }
    } else {
      // Aesthetic loading delay for mock/static suggested files
      await new Promise(resolve => setTimeout(resolve, 800));
      content = "/* Mock generated content for " + name + " */\n\n";
      if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        content = "Row,Column,Value\n1,A,Data source for " + name + "\n2,B,Generated Value";
      } else {
        content = `# ${name}\n\nThis is a template document for ${name}.\nIt is dynamically ingested as a core asset context.`;
      }
    }

    if (onAddSuggestedFile) {
      onAddSuggestedFile({ name, content, driveId: file.id, mimeType: file.mimeType || mimeType });
    }

    setAddingNames(prev => ({ ...prev, [name]: false }));
  };

  const handleAddAll = async () => {
    // Sequentially trigger add files for smooth animations
    for (const file of filesToDisplay) {
      if (!addingNames[file.name]) {
        await handleAddFile(file);
      }
    }
  };

  const isFileChecked = (file: any) => {
    return selectedDriveFiles.some(f => f.name === file.name || (file.id && f.id === file.id));
  };

  const handleRowClick = (file: any, e: React.MouseEvent) => {
    // Prevent triggering row toggle if they click the individual "Plus" button explicitly
    if ((e.target as HTMLElement).closest('.plus-btn')) return;
    
    if (onToggleDriveFile) {
      onToggleDriveFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (onUploadFile) {
        onUploadFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (onUploadFile) {
        onUploadFile(file);
      }
    }
  };

  const handleBottomAddFilesClick = () => {
    if (selectedDriveFiles.length === 0) return;
    if (accessToken) {
      if (onCreateSpaceWithSelected) {
        onCreateSpaceWithSelected();
      }
    } else {
      selectedDriveFiles.forEach(file => {
        handleAddFile(file);
      });
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if ((!accessToken || isDriveLoading) && !bypassLogin) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center glass-panel rounded-[32px] overflow-hidden relative p-10 bg-white dark:bg-[#1E1F22] border dark:border-[#2B2D31]">
        <div className="max-w-md w-full flex flex-col items-center gap-10 text-center">
          <NullTitle>Login to Drive</NullTitle>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Button
              variant="primary"
              onClick={onLogin}
              disabled={isDriveLoading}
              className="w-full sm:w-[160px] cursor-pointer"
            >
              {isDriveLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Syncing...
                </>
              ) : (
                "Login"
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setBypassLogin(true)}
              disabled={isDriveLoading}
              className="w-full sm:w-[160px] cursor-pointer"
            >
              Use Mock Data
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center glass-panel rounded-[32px] overflow-hidden relative spring-transition pb-4 px-10">
      {/* Centered Top Title (exactly upper 1/3rd of the viewport) */}
      <div className="w-full h-[28%] flex items-center justify-center shrink-0">
        <NullTitle>Add files</NullTitle>
      </div>

      {/* Split/Grid Layout: takes the middle section with 16px margin from title above */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] w-full max-w-4xl flex-1 mt-4 min-h-0">
        
        {/* Left container: Suggested files stack */}
        <div className="flex flex-col gap-[2px] h-full w-full min-h-0">
          {/* Header row (cell) */}
          <div className="bg-f8fafd border-b border-slate-200 rounded-t-[16px] h-[50px] px-4 flex items-center justify-between shrink-0 select-none">
            <span className="font-semibold text-sm text-slate-800 dark:text-white tracking-tight">
              {accessToken ? "Recent Drive Files" : "Suggested Files"}
            </span>
            <button 
              onClick={handleAddAll}
              className="text-xs font-semibold text-[#3186FF] hover:text-[#256fd4] dark:text-blue-400 dark:hover:text-blue-300 transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-blue-50/70 dark:hover:bg-white/5"
            >
              Add all
            </button>
          </div>

          {/* Suggested/Drive Files rows with scroll for overflow */}
          <div className="flex-1 flex flex-col gap-[2px] overflow-y-auto scrollbar-hide min-h-0 rounded-b-[16px]">
            {filesToDisplay.map((file, idx) => {
              const checked = isFileChecked(file);
              const isAdding = addingNames[file.name];
              const isLast = idx === filesToDisplay.length - 1;
              return (
                <div 
                  key={file.id || file.name}
                  onClick={(e) => handleRowClick(file, e)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, file });
                  }}
                  className={`flex items-center justify-between px-4 h-[50px] transition-colors duration-200 shrink-0 cursor-pointer ${
                    checked 
                      ? 'bg-slate-150' 
                      : 'bg-f8fafd hover:bg-f0f4f9'
                  } ${
                    isLast ? 'rounded-b-[16px]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img 
                      src={getFileIcon(file.mimeType)} 
                      alt="icon" 
                      className="w-5 h-5 object-contain flex-shrink-0" 
                    />
                    <span className="text-xs text-slate-700 dark:text-[#E3E3E3] font-medium truncate pr-2">{file.name}</span>
                  </div>
                  
                  <button
                    onClick={() => handleAddFile(file)}
                    disabled={isAdding}
                    className="plus-btn text-slate-400 hover:text-[#3186FF] transition-colors flex-shrink-0 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center p-1"
                  >
                    {isAdding ? (
                      <div className="w-3.5 h-3.5 border-2 border-[#3186FF] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus size={20} className="stroke-[2.5px]" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right container: Drag & Drop zone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`flex flex-col items-center justify-center rounded-[16px] border-none p-6 transition-all duration-300 cursor-pointer h-full min-h-0 ${
            isDragOver 
              ? 'bg-[#3186FF]/5 scale-[0.99] shadow-inner' 
              : 'bg-f8fafd hover:bg-f0f4f9 hover:shadow-xs'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            onChange={handleFileSelect}
          />
          <div className="flex flex-col items-center gap-3 text-center">
            <Upload size={28} className="text-slate-500 dark:text-gray-400 stroke-[2px]" />
            <span className="text-sm font-semibold text-slate-700 dark:text-[#E3E3E3] tracking-tight">Drop files here</span>
          </div>
        </div>

      </div>

      {/* Bottom Bar: Number of files selected & Add files button */}
      <div className="w-full max-w-4xl flex items-center justify-between pt-4 pb-0 shrink-0">
        <span className="text-[14px] font-normal text-[#444746] dark:text-[#A9ABB0]">
          {selectedDriveFiles.length > 0 ? `${selectedDriveFiles.length} selected` : ""}
        </span>
        <Button
          variant="primary"
          onClick={handleBottomAddFilesClick}
          disabled={selectedDriveFiles.length === 0 || isCreatingSpace}
        >
          {isCreatingSpace ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Space...
            </>
          ) : (
            "Add files"
          )}
        </Button>
      </div>

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

