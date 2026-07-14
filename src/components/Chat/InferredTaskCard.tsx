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
    type?: string;
    taskType?: string;
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
    item.content ||
    fileToUse?.content ||
    fileToUse?.realDocText ||
    item.previewContent ||
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

  const showThumbnail = !isNonNativeEmailOrChat;

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

      {/* Right Column: Preview of referenced artifact (only native doc/slide/sheet/image) */}
      {showThumbnail && (
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
