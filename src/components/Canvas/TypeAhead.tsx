import React from 'react';
import { getFileIcon } from '../Shared/FileIcon';
import { getAvatarForPerson } from '../../utils/personAvatars';

interface TypeAheadProps {
  mode?: 'context' | 'open';
  variant?: 'attached' | 'standalone';
  filteredRecentFiles: any[];
  apiResults: any[];
  filteredRecentPeople: any[];
  isSearchingApi: boolean;
  onAddContext: (item: { id: string; name: string; mimeType?: string; type: 'file' | 'person' }) => void;
  onFileSelect?: (file: any) => void;
  userProfile?: any;
  hideHeader?: boolean;
}

export function TypeAhead({
  mode = 'context',
  variant = 'attached',
  filteredRecentFiles,
  apiResults,
  filteredRecentPeople,
  isSearchingApi,
  onAddContext,
  onFileSelect,
  userProfile,
  hideHeader = false
}: TypeAheadProps) {


  const combinedFiles = [...filteredRecentFiles].map(f => ({ ...f, isReal: true }));
  apiResults.forEach(apiFile => {
    if (!combinedFiles.some(f => f.id === apiFile.id)) {
      combinedFiles.push({
        id: apiFile.id,
        name: apiFile.name,
        mimeType: apiFile.mimeType,
        type: 'file',
        isReal: true
      });
    }
  });

  const hasFiles = combinedFiles.length > 0;
  const hasPeople = mode === 'context' && filteredRecentPeople.length > 0;

  if (!hasFiles && !hasPeople && !isSearchingApi) {
    return null;
  }

  const containerStyle = variant === 'standalone'
    ? "absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1E1F22] border border-gray-200 dark:border-[#2B2D31] rounded-[24px] shadow-[0_10px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.3)] z-50 max-h-80 overflow-y-auto p-2 text-left flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200"
    : `absolute top-full left-4 right-4 -mt-6 ${hideHeader ? 'pt-7' : 'pt-8'} bg-white dark:bg-[#1E1F22] border border-gray-200 dark:border-[#2B2D31] rounded-b-3xl shadow-xl z-20 max-h-80 overflow-y-auto p-4 text-left flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200`;

  return (
    <div className={containerStyle}>
      {/* TypeAhead Heading */}
      {!hideHeader && (
        <div className="px-2 pt-1 pb-1">
          <h3 
            className="text-base font-medium text-slate-800 dark:text-[#E3E3E3]"
            style={{ fontFamily: '"Google Sans", "Product Sans", "Segoe UI", sans-serif' }}
          >
            {mode === 'context' ? "Add files refine your AI summary" : "Files"}
          </h3>
        </div>
      )}

      {/* Files section */}
      {hasFiles && (
        <div className="flex flex-col gap-0.5">
          {combinedFiles.slice(0, 8).map(file => (
            <button
              key={file.id}
              type="button"
              onClick={() => {
                if (mode === 'open') {
                  if (onFileSelect) onFileSelect(file);
                } else {
                  onAddContext({ id: file.id, name: file.name, mimeType: file.mimeType || file.type, type: 'file' });
                }
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer bg-transparent border-none"
            >
              <div className="shrink-0 flex items-center justify-center">
                {getFileIcon(file.name, file.mimeType || file.type, 20)}
              </div>
              <span 
                className="text-sm font-normal text-gray-950 dark:text-[#E3E3E3] truncate"
                style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
              >
                {file.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* People section */}
      {mode === 'context' && filteredRecentPeople.length > 0 && (
        <div className="flex flex-col gap-0.5 pt-1 border-t border-gray-100 dark:border-white/5">
          {filteredRecentPeople.slice(0, 5).map(person => {
            const profilePic = person.photoLink || person.picture || person.avatar || (person.name === (userProfile?.name || userProfile?.displayName) ? userProfile?.picture : getAvatarForPerson(person.name));
            return (
              <button
                key={person.name}
                type="button"
                onClick={() => onAddContext({ id: `person-${person.name}`, name: person.name, type: 'person' })}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer bg-transparent border-none"
              >
                <div className="w-5 h-5 outline outline-1 outline-gray-200 dark:outline-gray-800 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  {profilePic ? (
                    <img src={profilePic} alt={person.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 dark:text-gray-300 leading-none">
                      {person.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span 
                    className="text-sm font-normal text-gray-950 dark:text-[#E3E3E3] truncate"
                    style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
                  >
                    {person.name}
                  </span>
                  {person.email && <span className="text-[11px] text-gray-400 truncate">{person.email}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* API Loading indicator */}
      {isSearchingApi && (
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-blue-550 font-sans">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-550"></div>
          <span>Searching Drive...</span>
        </div>
      )}
    </div>
  );
}
