import React, { useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { NativeViewer } from '../Canvas/NativeViewer';

interface InferredTaskCardProps {
  item: {
    id: string;
    title: string;
    description: string;
    workspace: string;
    sourceName: string;
    sourceMimeType: string;
    personName: string;
    personAvatar: string;
    status: string;
    hasPreview?: boolean;
    previewContent?: string;
    filesToLoad?: any[];
    driveId?: string;
    fileId?: string;
    draftData?: any;
    content?: string;
  };
  getFileIcon: (mimeType?: string) => string;
  onClick: () => void;
}

export const InferredTaskCard: React.FC<InferredTaskCardProps> = ({ item, getFileIcon, onClick }) => {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const explicitDoc = Boolean(
    (item.sourceMimeType && (item.sourceMimeType.includes('document') || item.sourceMimeType.includes('text'))) ||
    (item.sourceName && (item.sourceName.endsWith('.gdoc') || item.sourceName.endsWith('.docx') || item.sourceName.endsWith('.doc') || item.sourceName.endsWith('.txt'))) ||
    (item.title && (item.title.toLowerCase().includes('document') || item.title.toLowerCase().includes('doc'))) ||
    (item.description && (item.description.toLowerCase().includes('document') || item.description.toLowerCase().includes('doc')))
  );

  const explicitSlide = Boolean(
    (item.sourceMimeType && (item.sourceMimeType.includes('presentation') || item.sourceMimeType.includes('slide'))) ||
    (item.sourceName && (item.sourceName.endsWith('.gslides') || item.sourceName.endsWith('.pptx') || item.sourceName.endsWith('.ppt'))) ||
    (item.title && (
      item.title.toLowerCase().includes('slide') ||
      item.title.toLowerCase().includes('presentation') ||
      item.title.toLowerCase().includes('talking point') ||
      item.title.toLowerCase().includes('deck')
    ))
  );

  const isSlideItem = explicitSlide && !explicitDoc;
  const isDocItem = explicitDoc || !isSlideItem;

  const primaryFile = item.filesToLoad && item.filesToLoad.length > 0 ? item.filesToLoad[0] : null;

  const driveFilesList: any[] = (window as any).__DRIVE_FILES__ || [];
  const matchedInDrive = driveFilesList.find((f: any) => {
    if (!f || !f.name) return false;
    const fMime = (f.mimeType || '').toLowerCase();
    const fNameLower = f.name.toLowerCase();

    // Prevent cross-type matching
    if (isDocItem && (fMime.includes('presentation') || fNameLower.endsWith('.gslides'))) return false;
    if (isSlideItem && (fMime.includes('document') || fNameLower.endsWith('.gdoc'))) return false;

    const fNameClean = fNameLower.replace(/\.[^/.]+$/, '').trim();
    const fId = String(f.id || f.driveId || '').toLowerCase();

    const checkTerms = [
      item.sourceName,
      item.driveId,
      item.fileId,
      item.id,
      item.title,
      item.description
    ].filter(Boolean).map((s: string) => String(s).toLowerCase());

    return checkTerms.some(term => 
      (fId && fId.length > 5 && term.includes(fId)) || 
      (fNameClean && fNameClean.length > 2 && (term.includes(fNameClean) || fNameClean.includes(term)))
    );
  });

  const fileToUse = matchedInDrive || primaryFile;

  const rawContent = (
    item.draftData?.draftContent ||
    item.content ||
    fileToUse?.content ||
    fileToUse?.realDocText ||
    item.previewContent ||
    item.description ||
    item.title ||
    ''
  );

  const h1Match = typeof rawContent === 'string' ? rawContent.match(/^#\s+(.+)$/m) : null;
  const extractedHeading = h1Match && h1Match[1] ? h1Match[1].trim() : null;

  const extractedName = extractedHeading || 
                        fileToUse?.name || 
                        item.description?.match(/['"]([^'"]+)['"]/)?.[1] || 
                        item.title?.match(/['"]([^'"]+)['"]/)?.[1] || 
                        item.sourceName || 
                        item.title || 
                        (isSlideItem ? 'Slide Presentation' : 'Google Document');

  const resolvedName = extractedName.replace(/\.[^/.]+$/, '');

  const formattedContent = (rawContent && rawContent.trim().startsWith('#'))
    ? rawContent
    : `# ${resolvedName}\n\n${rawContent}`;

  const resolvedMime = isSlideItem 
    ? 'application/vnd.google-apps.presentation' 
    : (isDocItem ? 'application/vnd.google-apps.document' : (fileToUse?.mimeType || item.sourceMimeType || 'application/vnd.google-apps.document'));

  const previewFile = {
    ...(fileToUse || {}),
    id: (fileToUse?.id || item.id) + '-preview',
    type: isSlideItem ? 'slide' : 'doc',
    taskType: isSlideItem ? 'slide' : 'doc',
    mimeType: resolvedMime,
    name: isSlideItem ? `${resolvedName}.gslides` : resolvedName,
    content: formattedContent
  };

  return (
    <div 
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-4 py-2 rounded-[24px] bg-[#F8FAFD] dark:bg-[#1E1F22] hover:bg-[#F1F3F9] dark:hover:bg-[#2B2D31] cursor-pointer transition-all duration-200 select-none"
    >
      {/* Left Column: Status Indicator */}
      <div className="shrink-0 w-8 h-8 flex items-center justify-center">
        <StatusIndicator status={item.status} />
      </div>

      {/* Center Column: Text & Sources */}
      <div className="flex-1 min-w-0 flex flex-col text-left">
        <div className="flex flex-col min-w-0">
          <h4 className="text-[16px] leading-[24px] font-medium font-['Google_Sans_Text','Inter',sans-serif] text-[#1B1C1D] dark:text-white truncate">
            {item.title}
          </h4>
          <p className="text-[14px] leading-[20px] font-normal font-['Google_Sans_Text','Inter',sans-serif] text-[#575B5F] dark:text-neutral-400 truncate">
            {item.description}
          </p>
        </div>
        {/* Source and Person capsule chips */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/50 dark:border-[#3E4042] text-[11px] font-semibold text-slate-650 dark:text-neutral-300 min-w-0">
            <img src={getFileIcon(item.sourceMimeType)} alt="doc icon" className="w-3.5 h-3.5 object-contain shrink-0" />
            <span className="max-w-[100px] truncate block">{item.sourceName}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1F22] border border-slate-200/50 dark:border-[#3E4042] text-[11px] font-semibold text-slate-650 dark:text-neutral-300 min-w-0">
            {!avatarFailed ? (
              <img 
                src={item.personAvatar} 
                alt="avatar icon" 
                className="w-3.5 h-3.5 rounded-full object-cover shrink-0" 
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex flex-center items-center justify-center text-[7px] font-bold shrink-0">
                {(item.personName || 'U').substring(0, 1).toUpperCase()}
              </div>
            )}
            <span className="max-w-[80px] truncate block">{item.personName}</span>
          </div>
        </div>
      </div>

      {/* Right Column: Preview of proactive artifact if exists */}
      {item.hasPreview && (
        <div className="shrink-0 w-[110px] h-[72px] rounded-2xl overflow-hidden border border-slate-200/60 dark:border-neutral-700 bg-neutral-900 flex items-center justify-center shadow-2xs relative group select-none">
          <div className="w-full h-full relative group-hover:scale-[1.03] transition-transform duration-300 pointer-events-none">
            <NativeViewer
              file={previewFile}
              mode="preview"
              hideHeader={true}
              isPreviewCard={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
