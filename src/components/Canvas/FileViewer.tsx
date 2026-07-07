import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, FileCode, HardDrive, Plus, File as FileIcon, Folder, Presentation, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';

interface FileViewerProps {
  selectedFile: any;
  files?: any[];
  onClose: () => void;
  onFileSelect?: (file: any) => void;
  onSave?: (file: any) => void;
  theme?: 'light' | 'dark';
}

export function FileViewer({ selectedFile, files, onClose, onFileSelect, onSave, theme = 'light' }: FileViewerProps) {
  const getIcon = (mimeType: string) => {
    if (!mimeType) return <FileIcon size={16} className="text-gray-400" />;
    if (mimeType.includes('folder')) return <Folder size={16} className="text-slate-500" />;
    if (mimeType.includes('document')) return <FileText size={16} className="text-blue-500" />;
    if (mimeType.includes('spreadsheet')) return <FileSpreadsheet size={16} className="text-green-500" />;
    if (mimeType.includes('presentation')) return <Presentation size={16} className="text-yellow-500" />;
    if (mimeType.includes('image')) return <ImageIcon size={16} className="text-red-400" />;
    if (mimeType.includes('pdf')) return <FileText size={16} className="text-red-500" />;
    return <FileIcon size={16} className="text-gray-400" />;
  };

  const displayFiles = files && files.length > 0 ? files.map(f => ({
    ...f,
    icon: getIcon(f.mimeType || f.type)
  })) : [];

  return (
    <div className="w-full h-full pt-16 px-4 pb-4 bg-white flex gap-4">
      
      {/* Narrow File List */}
      <div className="w-48 pl-2 flex flex-col gap-1 overflow-y-auto">
        <div className="flex items-center gap-2 px-2 py-2 mb-2 text-sm text-gray-500 font-medium shrink-0">
          Name
        </div>
        {displayFiles.map(file => (
          <div 
            key={file.id}
            onClick={() => onFileSelect && onFileSelect(file)}
            className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition ${
              selectedFile?.name === file.name 
                ? 'bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3 truncate pr-2">
              <div className="shrink-0">{file.icon}</div>
              <span className={`text-sm truncate ${selectedFile?.name === file.name ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                {file.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* File Content Card */}
      <div className="flex-1 bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="font-medium text-sm text-gray-800">{selectedFile?.name || 'File'}</span>
          <div className="flex items-center gap-3">
             {onSave && selectedFile && (
               <button
                  onClick={() => onSave(selectedFile)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition flex items-center gap-2"
               >
                 <HardDrive size={14} />
                 Save to Drive
               </button>
             )}
            <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded-full transition"><Plus size={18} className="text-gray-400 rotate-45" /></button>
          </div>
        </div>
        <div className="flex-1 p-8 overflow-y-auto">
          {selectedFile?.content ? (
            selectedFile.name.endsWith('.md') ? (
              <div className="markdown-body prose prose-slate">
                <ReactMarkdown>{selectedFile.content}</ReactMarkdown>
              </div>
            ) : (
              <pre className="p-4 bg-gray-50 rounded-lg text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
                <code>{selectedFile.content}</code>
              </pre>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 h-full">
              No content available.
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
