import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { NativeViewer } from '../Canvas/NativeViewer';
import { getAvatarForPerson } from '../../utils/personAvatars';

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
    type?: string;
    taskType?: string;
    driveId?: string;
    fileId?: string;
    draftData?: any;
    content?: string;
    isReal?: boolean;
    isOAuth?: boolean;
    category?: string;
    links?: Array<{ label: string; url: string }>;
  };
  getFileIcon: (mimeType?: string) => string;
  onClick: () => void;
  isNarrow?: boolean;
}

export const InferredTaskCard: React.FC<InferredTaskCardProps> = ({ item, getFileIcon, onClick, isNarrow }) => {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [selfNarrow, setSelfNarrow] = useState(false);

  React.useEffect(() => {
    if (!cardRef.current) return;
    const element = cardRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setSelfNarrow(entry.contentRect.width < 480);
        }
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const effectiveNarrow = Boolean(isNarrow || selfNarrow);

  const primaryFile = item.filesToLoad && item.filesToLoad.length > 0 ? item.filesToLoad[0] : null;

  const driveFilesList: any[] = (window as any).__DRIVE_FILES__ || [];
  const matchedInDrive = driveFilesList.find((f: any) => {
    if (!f || !f.name) return false;
    const fId = String(f.id || f.driveId || '').toLowerCase();
    const fNameClean = f.name.toLowerCase().replace(/\.[^/.]+$/, '').trim();
    const checkTerms = [item.sourceName, item.driveId, item.fileId, item.id, item.title, item.description]
      .filter(Boolean)
      .map((s: string) => String(s).toLowerCase());

    return checkTerms.some(term => 
      (fId && fId.length > 5 && term.includes(fId)) || 
      (fNameClean && fNameClean.length > 2 && (term.includes(fNameClean) || fNameClean.includes(term)))
    );
  });

  const fileToUse = matchedInDrive || primaryFile;

  const mimeLower = String(item.sourceMimeType || fileToUse?.mimeType || '').toLowerCase();
  const nameLower = String(item.sourceName || fileToUse?.name || item.title || '').toLowerCase();
  const typeLower = String(item.type || item.taskType || fileToUse?.type || fileToUse?.taskType || '').toLowerCase();
  const descLower = String(item.description || '').toLowerCase();

  const isSlideItem = Boolean(
    typeLower === 'slide' ||
    mimeLower.includes('presentation') ||
    mimeLower.includes('slide') ||
    nameLower.endsWith('.gslides') ||
    nameLower.endsWith('.pptx') ||
    nameLower.endsWith('.ppt') ||
    nameLower.includes('drive refresh') ||
    nameLower.includes('presentation') ||
    nameLower.includes('slide') ||
    nameLower.includes('talking point') ||
    nameLower.includes('deck') ||
    nameLower.includes('ux improvement') ||
    nameLower.includes('new drive') ||
    descLower.includes('drive refresh') ||
    descLower.includes('presentation') ||
    descLower.includes('slide')
  );

  const isSheetItem = Boolean(
    !isSlideItem && (
      typeLower === 'sheet' ||
      typeLower === 'spreadsheet' ||
      mimeLower.includes('spreadsheet') ||
      mimeLower.includes('excel') ||
      mimeLower.includes('csv') ||
      nameLower.endsWith('.csv') ||
      nameLower.endsWith('.gsheet') ||
      nameLower.endsWith('.xlsx') ||
      nameLower.endsWith('.xls') ||
      nameLower.includes('sheet') ||
      nameLower.includes('inventory') ||
      nameLower.includes('spend') ||
      nameLower.includes('analysis')
    )
  );

  const isDocItem = !isSlideItem && !isSheetItem;

  const [hydratedContent, setHydratedContent] = useState<string | null>(null);
  const targetDriveId = fileToUse?.driveId || fileToUse?.id || item.driveId || item.fileId || primaryFile?.driveId;

  React.useEffect(() => {
    if (!item.hasPreview) return;
    const existingContent = fileToUse?.content || fileToUse?.realDocText || item.draftData?.draftContent || item.previewContent || item.content;
    if (existingContent) {
      setHydratedContent(existingContent);
      return;
    }

    if (!targetDriveId || typeof targetDriveId !== 'string') return;
    const cleanId = targetDriveId.replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, '');
    if (cleanId.length < 5 || cleanId.includes('local') || cleanId.includes('mock')) return;

    const globalCache = (window as any).__DRIVE_CONTENT_CACHE__ || {};
    if (globalCache[cleanId]) {
      setHydratedContent(globalCache[cleanId]);
      return;
    }

    const token = (window as any).__GOOGLE_ACCESS_TOKEN__;
    if (!token) return;

    let isSubscribed = true;
    (async () => {
      try {
        const url = `https://www.googleapis.com/drive/v3/files/${cleanId}/export?mimeType=text/plain`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const text = await res.text();
          if (text && isSubscribed) {
            (window as any).__DRIVE_CONTENT_CACHE__ = { ...((window as any).__DRIVE_CONTENT_CACHE__ || {}), [cleanId]: text };
            setHydratedContent(text);
          }
        }
      } catch (e) {
        console.warn('Drive content pre-fetch skipped:', e);
      }
    })();

    return () => { isSubscribed = false; };
  }, [targetDriveId, item.hasPreview, isSlideItem, fileToUse?.content, fileToUse?.realDocText, item.draftData?.draftContent, item.previewContent, item.content]);

  const rawContent = (
    hydratedContent ||
    item.draftData?.draftContent ||
    (item as any).updatedMarkdown ||
    (item as any).originalMarkdown ||
    item.content ||
    fileToUse?.content ||
    fileToUse?.realDocText ||
    item.previewContent ||
    (item as any).summaryOfChanges ||
    item.description ||
    ''
  );

  const cleanHeader = (t: string) => {
    return t
      .replace(/^\[.*?\]\s*/, '')
      .replace(/-\s*\d{4}\/\d{2}\/\d{2}.*$/, '')
      .replace(/-\s*Notes by Gemini.*$/i, '')
      .trim();
  };

  const h1Match = typeof rawContent === 'string' ? rawContent.match(/^#\s+(.+)$/m) : null;
  const extractedHeading = h1Match && h1Match[1] ? cleanHeader(h1Match[1]) : null;

  const extractedName = extractedHeading || 
                        (fileToUse?.name ? cleanHeader(fileToUse.name) : null) || 
                        item.description?.match(/['"]([^'"]+)['"]/)?.[1] || 
                        item.title?.match(/['"]([^'"]+)['"]/)?.[1] || 
                        cleanHeader(item.sourceName || item.title || '') || 
                        (isSlideItem ? 'Drive Refresh: A New Drive' : 'Google Document');

  const resolvedName = cleanHeader(extractedName).replace(/\.[^/.]+$/, '');

  const formattedContent = (rawContent && rawContent.trim().startsWith('#'))
    ? rawContent
    : `# ${resolvedName}\n\n${rawContent}`;

  const resolvedMime = isSlideItem 
    ? 'application/vnd.google-apps.presentation' 
    : (isSheetItem ? 'application/vnd.google-apps.spreadsheet' : (fileToUse?.mimeType || item.sourceMimeType || 'application/vnd.google-apps.document'));

  const previewFile = {
    ...(fileToUse || {}),
    id: (fileToUse?.id || item.id) + '-preview',
    type: isSlideItem ? 'slide' : (isSheetItem ? 'sheet' : 'doc'),
    taskType: isSlideItem ? 'slide' : (isSheetItem ? 'sheet' : 'doc'),
    mimeType: resolvedMime,
    name: isSlideItem ? `${resolvedName}.gslides` : (isSheetItem ? `${resolvedName}.gsheet` : resolvedName),
    content: formattedContent
  };

  const isNonNativeEmailOrChat = Boolean(
    (item.sourceMimeType && (
      item.sourceMimeType.includes('chat') || 
      item.sourceMimeType.includes('email') || 
      item.sourceMimeType.includes('mail')
    )) ||
    (item.sourceName && (
      item.sourceName.toLowerCase().startsWith('email') ||
      item.sourceName.toLowerCase().includes('rsvp') ||
      item.sourceName.toLowerCase().includes('chat') ||
      item.sourceName.toLowerCase().includes('message')
    )) ||
    (item.title && (
      item.title.toLowerCase().includes('rsvp') ||
      item.title.toLowerCase().includes('email') ||
      item.title.toLowerCase().includes('manage your rsvp')
    ))
  );

  const showThumbnail = !isNonNativeEmailOrChat && !effectiveNarrow && item.category !== 'fyi';

  return (
    <div 
      ref={cardRef}
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 p-4 rounded-[4px] first:rounded-t-[16px] first:rounded-b-[4px] last:rounded-b-[16px] last:rounded-t-[4px] only:rounded-[16px] bg-[#F8FAFD] dark:bg-[#282A2D] hover:bg-[#EEF4FE] dark:hover:bg-[#35373A] cursor-pointer transition-colors duration-200 select-none min-w-0"
    >
      {/* Left Column: Status Indicator */}
      <div className="shrink-0 w-8 h-8 flex items-center justify-center">
        <StatusIndicator status={item.status} />
      </div>

      {/* Center Column: Text & Sources */}
      <div className="flex-1 min-w-0 flex flex-col text-left">
        <div className="flex flex-col min-w-0">
          <h4 className="text-[16px] leading-[22px] font-medium font-['Google_Sans_Text','Inter',sans-serif] text-[#1B1C1D] dark:text-white line-clamp-2">
            {item.title || item.description || 'Task'}
          </h4>
          <p className="text-[14px] leading-[20px] font-normal font-['Google_Sans_Text','Inter',sans-serif] text-[#575B5F] dark:text-neutral-400 line-clamp-2 mt-0.5">
            {item.description}
          </p>
          
          {/* Render links for FYI tasks if they exist */}
          {item.category === 'fyi' && item.links && item.links.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              {item.links.map((link: any, idx: number) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-colors"
                >
                  {link.label || 'Open Link'}
                </a>
              ))}
            </div>
          )}
        </div>
        {/* Source and Person capsule chips: single line truncation when narrow to prevent 4th line */}
        <div className={`flex items-center gap-2 mt-2 min-w-0 max-w-full ${effectiveNarrow ? 'flex-nowrap overflow-hidden' : 'flex-wrap'}`}>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1F22] text-[11px] font-semibold text-slate-650 dark:text-neutral-300 min-w-0 shrink max-w-[120px]">
            <img src={getFileIcon(resolvedMime)} alt="source icon" className="w-3.5 h-3.5 object-contain shrink-0" />
            <span className="truncate block">{item.sourceName}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1F22] text-[11px] font-semibold text-slate-650 dark:text-neutral-300 min-w-0 shrink max-w-[100px]">
            <img 
              src={item.personAvatar || getAvatarForPerson(item.personName)} 
              alt="avatar icon" 
              className="w-3.5 h-3.5 rounded-full object-cover shrink-0" 
              onError={(e) => { (e.target as HTMLImageElement).src = '/people/sarah_lin.jpg'; }}
            />
            <span className="truncate block">{item.personName}</span>
          </div>
        </div>
      </div>

      {/* Right Column: Preview of referenced artifact (hidden on narrow/2-col dashboard) */}
      {showThumbnail && (
        <div className={`shrink-0 ${isSlideItem ? 'w-[104px]' : 'w-[54px]'} h-[72px] rounded-[10px] overflow-hidden border border-slate-200/90 dark:border-[#3E4042] bg-white dark:bg-[#1E1F22] flex items-center justify-center relative group select-none transition-all duration-300 shadow-2xs`}>
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
