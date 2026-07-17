import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  FileText, 
  User, 
  HardDrive, 
  FileSpreadsheet, 
  FileCode, 
  Info,
  CheckCircle2,
  Plus,
  Undo,
  Redo,
  Printer,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Image as ImageIcon,
  Table as TableIcon,
  Eye,
  Link,
  Highlighter,
  ChevronLeft,
  ChevronRight,
  Play,
  Video,
  Music,
  FileJson
} from 'lucide-react';
import { InferredTaskCard } from '../Chat/InferredTaskCard';
import { NullTitle } from '../Shared/NullTitle';
import { RenderSlideMarkdown, RenderDocMarkdown } from './InferredTaskDiffView';

interface NativeViewerProps {
  file: any;
  onSave?: (file: any) => void;
  onClose?: () => void;
  sandboxUrl?: string;
  hideHeader?: boolean;
  mode?: 'file' | 'preview';
  isPreviewCard?: boolean;
  theme?: 'light' | 'dark';
  todoItems?: any[];
  onProactiveTaskClick?: (task: any) => void;
  activeSlideIndex?: number;
  onActiveSlideIndexChange?: (index: number) => void;
}

const isIframeViewer = false;

export function NativeViewer({ 
  file, 
  onSave, 
  onClose, 
  sandboxUrl,
  hideHeader = false,
  mode: propMode,
  isPreviewCard = false,
  theme = 'light',
  todoItems,
  onProactiveTaskClick,
  activeSlideIndex: propActiveSlideIndex,
  onActiveSlideIndexChange
}: NativeViewerProps) {
  if (isPreviewCard && isIframeViewer) {
    const rawId = file.driveId || file.id || '';
    const cleanId = String(rawId)
      .replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, '')
      .replace(/(-preview)+$/, '');

    const nameLower = (file.name || '').toLowerCase();
    const mimeLower = (file.mimeType || '').toLowerCase();
    const typeLower = (file.type || file.taskType || '').toLowerCase();

    const isSlide = typeLower === 'slide' || mimeLower.includes('presentation') || mimeLower.includes('slide') || nameLower.endsWith('.gslides') || nameLower.endsWith('.pptx');
    const isSheet = typeLower === 'sheet' || mimeLower.includes('spreadsheet') || mimeLower.includes('excel') || mimeLower.includes('csv') || nameLower.endsWith('.csv') || nameLower.endsWith('.gsheet') || nameLower.endsWith('.xlsx');

    let liveEmbedUrl = file.embedUrl || file.previewUrl || file.url;

    if (cleanId && cleanId.length > 5 && !cleanId.includes('local') && !cleanId.includes('mock')) {
      if (isSlide) {
        liveEmbedUrl = `https://docs.google.com/presentation/d/${cleanId}/preview?rm=minimal`;
      } else if (isSheet) {
        liveEmbedUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/preview`;
      } else {
        liveEmbedUrl = `https://docs.google.com/document/d/${cleanId}/preview`;
      }
    } else if (file.content && !liveEmbedUrl) {
      liveEmbedUrl = `data:text/html;charset=utf-8,${encodeURIComponent(file.content)}`;
    }

    if (isSlide) {
      return (
        <div className="w-full h-full bg-white dark:bg-[#1E1F22] flex items-center justify-center overflow-hidden relative select-none">
          <div style={{ width: '110px', height: '72px', position: 'relative', overflow: 'hidden' }}>
            <iframe 
              src={liveEmbedUrl}
              className="border-none bg-white dark:bg-[#1E1F22] shadow-none pointer-events-none"
              style={{
                width: '960px',
                height: '628px',
                transform: 'scale(0.1146)',
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              allow="autoplay; fullscreen"
              title={file.name || 'Live Slide Preview'}
            />
          </div>
        </div>
      );
    }

    // Docs & Sheets: Square container scaling
    return (
      <div className="w-full h-full bg-white dark:bg-[#1E1F22] flex items-center justify-center overflow-hidden relative select-none">
        <div style={{ width: '72px', height: '72px', position: 'relative', overflow: 'hidden' }}>
          <iframe 
            src={liveEmbedUrl}
            className="border-none bg-white dark:bg-[#1E1F22] shadow-none pointer-events-none"
            style={{
              width: '600px',
              height: '600px',
              transform: 'scale(0.12)',
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0
            }}
            allow="autoplay; fullscreen"
            title={file.name || 'Live Doc Preview'}
          />
        </div>
      </div>
    );
  }

  const [internalMode, setInternalMode] = useState<'file' | 'preview'>('preview');

  const [localActiveSlideIndex, setLocalActiveSlideIndex] = useState(0);
  const activeSlideIndex = propActiveSlideIndex !== undefined ? propActiveSlideIndex : localActiveSlideIndex;
  const handleSelectSlide = (idx: number) => {
    if (onActiveSlideIndexChange) {
      onActiveSlideIndexChange(idx);
    }
    setLocalActiveSlideIndex(idx);
  };

  const previewRef = React.useRef<HTMLDivElement>(null);
  const [previewDims, setPreviewDims] = useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!isPreviewCard || !previewRef.current) return;
    const element = previewRef.current;
    
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setPreviewDims({ width: rect.width, height: rect.height });
      }
    };

    // Use a small delay as well to ensure rendering is settled
    updateSize();
    const timer = setTimeout(updateSize, 50);

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(element);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [isPreviewCard, file?.id, file?.name]);

  React.useEffect(() => {
    if (propMode === undefined) {
      setInternalMode('preview');
    }
  }, [file?.name, file?.id, file?.driveId, propMode]);

  if (!file) {
    const isDark = theme === 'dark';
    return (
      <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-[#1E1F22] text-gray-400' : 'bg-white text-gray-500'}`}>
        <div className="text-center">
          <Info size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Select an artifact to view content</p>
        </div>
      </div>
    );
  }

  const isTodoArtifact = file && Boolean(
    file.isInferredTask || 
    file.taskType === 'inferred' || 
    file.id === 'todo-card' || 
    (file.name && file.name.toLowerCase() === 'inferred_tasks.json') || 
    file.name === 'To-dos'
  );

  if (isTodoArtifact) {
    const getTaskIcon = (mimeType?: string) => {
      const m = (mimeType || '').toLowerCase();
      if (m.includes('presentation') || m.includes('slide')) return 'https://ssl.gstatic.com/docs/doclist/images/icon_11_slides_list.png';
      if (m.includes('spreadsheet') || m.includes('sheet') || m.includes('csv')) return 'https://ssl.gstatic.com/docs/doclist/images/icon_11_sheets_list.png';
      if (m.includes('comment')) return 'https://ssl.gstatic.com/docs/doclist/images/icon_10_generic_list.png';
      return 'https://ssl.gstatic.com/docs/doclist/images/icon_11_document_list.png';
    };

    let parsedConfig: any = {};
    try {
      if (file.content) {
        parsedConfig = JSON.parse(file.content);
      }
    } catch (e) {}

    const title = parsedConfig.title || 'To-dos';
    const headerHeight = parsedConfig.headerHeight || parsedConfig.height;
    const headerTitleSize = parsedConfig.headerTitleSize || parsedConfig.titleSize;
    const sourceScope = parsedConfig.sourceScope || parsedConfig.sourceBadgeText || parsedConfig.sources;

    const rawItems = (todoItems && todoItems.length > 0) ? todoItems : (() => {
      if (Array.isArray(parsedConfig)) return parsedConfig;
      return parsedConfig.immediateActions || parsedConfig.items || [];
    })();

    let filteredItems = rawItems;
    if (sourceScope) {
      const scopeStr = String(typeof sourceScope === 'string' ? sourceScope : (Array.isArray(sourceScope) ? sourceScope.join(' ') : '')).toLowerCase();
      if (scopeStr.includes('email') || scopeStr.includes('gmail') || scopeStr.includes('mail')) {
        filteredItems = rawItems.filter((it: any) => {
          const s = ((it.sourceName || '') + ' ' + (it.sourceMimeType || '') + ' ' + (it.type || '')).toLowerCase();
          return s.includes('gmail') || s.includes('email') || s.includes('mail') || s.includes('thread');
        });
      } else if (scopeStr.includes('workspace') || scopeStr.includes('drive') || scopeStr.includes('doc')) {
        filteredItems = rawItems.filter((it: any) => {
          const s = ((it.sourceName || '') + ' ' + (it.sourceMimeType || '') + ' ' + (it.type || '')).toLowerCase();
          return s.includes('doc') || s.includes('sheet') || s.includes('slide') || s.includes('drive');
        });
      }
    }

    if (parsedConfig.filterText || parsedConfig.filterWorkspace) {
      const filterTerm = String(parsedConfig.filterText || parsedConfig.filterWorkspace).toLowerCase();
      filteredItems = filteredItems.filter((it: any) => {
        const text = ((it.title || '') + ' ' + (it.description || '') + ' ' + (it.workspace || '')).toLowerCase();
        return text.includes(filterTerm);
      });
    }

    const isDark = theme === 'dark';

    return (
      <div className={`w-full h-full p-8 overflow-y-auto ${isDark ? 'bg-[#18191B] text-white' : 'bg-[#F8FAFD] text-slate-800'} select-text font-sans flex flex-col items-center`}>
        <div className="w-full max-w-3xl flex flex-col gap-6">
          <div 
            className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-neutral-800"
            style={headerHeight ? { height: typeof headerHeight === 'number' ? `${headerHeight}px` : headerHeight } : undefined}
          >
            <div className="flex items-center gap-3">
              <h2 className={`${headerTitleSize ? (headerTitleSize.startsWith('text-') ? headerTitleSize : `text-[${headerTitleSize}]`) : 'text-2xl'} font-bold tracking-tight`}>
                {title}
              </h2>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-200/80 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
                {filteredItems.length} items
              </span>
              {sourceScope && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                  {typeof sourceScope === 'string' ? sourceScope : 'Scoped Sources'}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 dark:text-neutral-500 font-medium">Inferred Workspace Agenda</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-neutral-500 text-sm font-medium">
              No matching inferred tasks found for this workspace.
            </div>
          ) : (
            <div className="flex flex-col gap-[4px]">
              {filteredItems.map((item: any, idx: number) => (
                <InferredTaskCard
                  key={item.id || idx}
                  item={item}
                  getFileIcon={getTaskIcon}
                  onClick={() => onProactiveTaskClick && onProactiveTaskClick(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const nameLower = (file.name || '').toLowerCase();
  
  const isGoogleSlide = 
    file.type === 'slide' ||
    file.taskType === 'slide' ||
    nameLower.endsWith('.gslides') ||
    nameLower.endsWith('.pptx') ||
    nameLower.endsWith('.ppt') ||
    nameLower.includes('drive refresh') ||
    nameLower.includes('big rock') ||
    nameLower.includes('presentation') ||
    nameLower.includes('slide') ||
    nameLower.includes('deck') ||
    nameLower.includes('talking point') ||
    (file.mimeType && (
      file.mimeType.toLowerCase().includes('vnd.google-apps.presentation') ||
      file.mimeType.toLowerCase().includes('officedocument.presentationml') ||
      file.mimeType.toLowerCase().includes('ms-powerpoint') ||
      file.mimeType.toLowerCase().includes('presentation') ||
      file.mimeType.toLowerCase().includes('slide')
    )) ||
    (file.isProactiveDraft && (file.type === 'slide' || file.taskType === 'slide' || nameLower.endsWith('.gslides') || nameLower.includes('slide') || nameLower.includes('presentation') || nameLower.includes('drive refresh')));

  const isGoogleSheet = 
    !isGoogleSlide &&
    file.type !== 'doc' &&
    file.taskType !== 'doc' &&
    !nameLower.endsWith('.doc') &&
    !nameLower.endsWith('.docx') &&
    !nameLower.endsWith('.gdoc') &&
    !nameLower.endsWith('.md') &&
    !nameLower.endsWith('.markdown') &&
    !nameLower.endsWith('.txt') &&
    !file.createdFromComposer &&
    !file.isDocJourney &&
    ((file.mimeType && (
      file.mimeType.toLowerCase().includes('vnd.google-apps.spreadsheet') ||
      file.mimeType.toLowerCase().includes('officedocument.spreadsheetml') ||
      file.mimeType.toLowerCase().includes('ms-excel') ||
      file.mimeType.toLowerCase().includes('sheet')
    )) ||
    nameLower.endsWith('.gsheet') ||
    nameLower.endsWith('.xlsx') ||
    nameLower.endsWith('.xls') ||
    nameLower.endsWith('.csv') ||
    ((nameLower.includes('spend') || nameLower.includes('inventory')) && !nameLower.includes('doc') && !nameLower.includes('report')));

  const isGoogleDoc = 
    !isGoogleSlide && 
    !isGoogleSheet && (
      file.type === 'doc' ||
      file.taskType === 'doc' ||
      file.createdFromComposer ||
      file.isDocJourney ||
      (file.mimeType && (
        file.mimeType.toLowerCase().includes('vnd.google-apps.document') ||
        file.mimeType.toLowerCase().includes('wordprocessingml') ||
        file.mimeType.toLowerCase().includes('msword') ||
        file.mimeType.toLowerCase().includes('gdoc') ||
        file.mimeType.toLowerCase().includes('text/plain')
      )) ||
      nameLower.endsWith('.gdoc') ||
      nameLower.endsWith('.docx') ||
      nameLower.endsWith('.doc') ||
      nameLower.endsWith('.txt') ||
      nameLower.endsWith('.md') ||
      nameLower.endsWith('.markdown') ||
      nameLower.includes('suppliers') ||
      nameLower.includes('proposal') ||
      nameLower.includes('report') ||
      nameLower.includes('contract') ||
      nameLower.includes('document')
    );

  const isDoc = 
    isGoogleDoc ||
    (!isGoogleSlide && !isGoogleSheet && (
      file.type === 'doc' ||
      file.taskType === 'doc' ||
      file.createdFromComposer ||
      file.isDocJourney ||
      nameLower.endsWith('.doc') || 
      nameLower.endsWith('.docx') || 
      nameLower.endsWith('.gdoc') ||
      nameLower.endsWith('.md') ||
      nameLower.endsWith('.markdown') ||
      nameLower.endsWith('.txt') ||
      (file.mimeType && (
        file.mimeType.toLowerCase().includes('document') || 
        file.mimeType.toLowerCase().includes('gdoc')
      )) ||
      nameLower.includes('proposal') ||
      nameLower.includes('doc')
    ));

  const isSlide = isGoogleSlide || nameLower.includes('presentation') || file.type === 'slide' || file.taskType === 'slide';
  
  const isNativeGoogleFile = isGoogleDoc || isGoogleSlide || isSlide || isGoogleSheet;
  
  const mode = propMode !== undefined ? propMode : (isNativeGoogleFile ? 'preview' : internalMode);
  const setMode = propMode !== undefined || isNativeGoogleFile ? () => {} : setInternalMode;
  
  // Safe Drive ID resolution - strip internal wrapper prefixes
  const rawId = file.driveId || file.id;
  const driveId = rawId ? String(rawId).replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, '').replace(/(-preview)+$/, '') : undefined;

  const isRealDriveId = (id: string | undefined | null) => {
    if (!id) return false;
    const str = String(id).replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, '').replace(/(-preview)+$/, '');
    return str.length > 5 && !str.includes('local') && !str.includes('mock');
  };
  
  const isComposerDoc = !!(file.createdFromComposer || 
                           nameLower === 'document.doc' || 
                           nameLower === 'presentation.gslides' || 
                           nameLower === 'spreadsheet.gsheet');

  const isCreatedDocFromSpace = Boolean(
    !file.isProactiveDraft &&
    !file.isInferredTask &&
    (
      file.createdFromComposer ||
      file.isDocJourney ||
      file.createdFromSpace ||
      (file.id && String(file.id).startsWith('created-artifact-')) ||
      (file.name && file.name.toLowerCase() === 'document.doc')
    )
  );
  
  const isRunnable = nameLower.endsWith('.html') || nameLower.endsWith('.md') || nameLower.endsWith('.markdown');

  const isDocFile = 
    !isGoogleSlide &&
    !isSlide &&
    !isGoogleSheet && (
      isDoc || 
      isGoogleDoc ||
      file.type === 'doc' ||
      file.taskType === 'doc' ||
      file.createdFromComposer ||
      file.isDocJourney ||
      nameLower.endsWith('.doc') ||
      nameLower.endsWith('.docx') ||
      nameLower.endsWith('.gdoc') ||
      nameLower.endsWith('.md') || 
      nameLower.endsWith('.markdown') || 
      nameLower.endsWith('.txt') || 
      nameLower.includes('proposal') || 
      nameLower.includes('spec') || 
      nameLower.includes('notes') || 
      nameLower.includes('report') || 
      (file.mimeType && (
        file.mimeType.includes('document')
      )) ||
      (file.content && (
        file.content.trim().startsWith('#') || 
        file.content.includes('\n# ') ||
        file.content.trim().startsWith('---')
      ))
    );

  const isCsvFile = 
    !isDocFile &&
    !isGoogleDoc &&
    !isDoc &&
    file.type !== 'doc' &&
    file.taskType !== 'doc' &&
    !file.createdFromComposer &&
    !file.isDocJourney &&
    !nameLower.endsWith('.doc') &&
    !nameLower.endsWith('.docx') &&
    !nameLower.endsWith('.gdoc') &&
    !nameLower.endsWith('.md') &&
    !nameLower.endsWith('.markdown') &&
    !nameLower.endsWith('.txt') &&
    (
      nameLower.endsWith('.csv') || 
      nameLower.endsWith('.xls') || 
      nameLower.endsWith('.xlsx') ||
      (file.mimeType && (file.mimeType.includes('spreadsheet') || file.mimeType.includes('csv'))) ||
      nameLower === 'suppliers.csv' ||
      nameLower === 'fulfillment centers.csv'
    ) &&
    !(isIframeViewer && mode === 'preview');

  const isImageFile = 
    (file.mimeType && (file.mimeType.toLowerCase().startsWith('image/') || file.mimeType.toLowerCase().includes('image'))) ||
    nameLower.endsWith('.png') ||
    nameLower.endsWith('.jpg') ||
    nameLower.endsWith('.jpeg') ||
    nameLower.endsWith('.gif') ||
    nameLower.endsWith('.svg') ||
    nameLower.endsWith('.webp') ||
    nameLower.endsWith('.bmp') ||
    nameLower.endsWith('.ico') ||
    (typeof file.content === 'string' && file.content.startsWith('data:image/'));

  const isVideoFile = 
    (file.mimeType && (file.mimeType.toLowerCase().startsWith('video/') || file.mimeType.toLowerCase().includes('video'))) ||
    nameLower.endsWith('.mp4') ||
    nameLower.endsWith('.webm') ||
    nameLower.endsWith('.ogg') ||
    nameLower.endsWith('.mov') ||
    nameLower.endsWith('.m4v') ||
    nameLower.endsWith('.avi') ||
    nameLower.endsWith('.mkv') ||
    (typeof file.content === 'string' && file.content.startsWith('data:video/'));

  const isAudioFile = 
    (file.mimeType && (file.mimeType.toLowerCase().startsWith('audio/') || file.mimeType.toLowerCase().includes('audio'))) ||
    nameLower.endsWith('.mp3') ||
    nameLower.endsWith('.wav') ||
    nameLower.endsWith('.ogg') ||
    nameLower.endsWith('.m4a') ||
    nameLower.endsWith('.aac') ||
    nameLower.endsWith('.flac') ||
    (typeof file.content === 'string' && file.content.startsWith('data:audio/'));

  const isPdfFile = 
    (file.mimeType && file.mimeType.toLowerCase().includes('pdf')) ||
    nameLower.endsWith('.pdf') ||
    (typeof file.content === 'string' && file.content.startsWith('data:application/pdf'));

  const isJsonFile = 
    (file.mimeType && file.mimeType.toLowerCase().includes('json')) ||
    nameLower.endsWith('.json') ||
    nameLower.endsWith('.json5') ||
    nameLower.endsWith('.geojson');

  const renderContent = () => {

    // Image view support
    if (isImageFile) {
      const isLocalContent = typeof file.content === 'string' && (file.content.startsWith('data:image/') || file.content.startsWith('blob:'));
      const localSrc = isLocalContent ? file.content : (file.url || (file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+/, '=s2000') : null));
      const embedUrl = (driveId && isRealDriveId(driveId)) ? `https://drive.google.com/file/d/${driveId}/preview` : null;

      return (
        <div className="w-full h-full bg-slate-950/90 flex flex-col overflow-hidden relative items-center justify-center">
          {!hideHeader && (
            <div className="shrink-0 w-full flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-purple-500/20 text-purple-400">
                  <ImageIcon size={16} />
                </div>
                <span className="font-semibold text-xs text-slate-200">{file.name}</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">Image View</span>
              </div>
              {onSave && (
                <button
                  onClick={() => onSave(file)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2"
                >
                  <HardDrive size={13} />
                  Save to Drive
                </button>
              )}
            </div>
          )}
          <div className="flex-1 w-full h-full p-2 flex items-center justify-center overflow-hidden">
            {embedUrl ? (
              <div className="w-full h-full relative overflow-hidden rounded-xl bg-slate-900">
                <iframe 
                  src={embedUrl} 
                  className="w-full h-[calc(100%+56px)] -mt-[56px] border-none rounded-xl bg-slate-900 shadow-2xl" 
                  title={file.name}
                />
              </div>
            ) : localSrc ? (
              <img 
                src={localSrc} 
                alt={file.name} 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-slate-800"
              />
            ) : (
              <div className="text-xs text-slate-400 flex flex-col items-center gap-2">
                <ImageIcon size={32} className="text-slate-600" />
                <span>No image preview available</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Video view support
    if (isVideoFile) {
      const isLocalContent = typeof file.content === 'string' && (file.content.startsWith('data:video/') || file.content.startsWith('blob:'));
      const localSrc = isLocalContent ? file.content : (file.url || file.webContentLink);
      const embedUrl = (driveId && isRealDriveId(driveId)) ? `https://drive.google.com/file/d/${driveId}/preview` : null;

      return (
        <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden relative items-center justify-center">
          {!hideHeader && (
            <div className="shrink-0 w-full flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-white animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-indigo-500/20 text-indigo-400">
                  <Video size={16} />
                </div>
                <span className="font-semibold text-xs text-slate-200">{file.name}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">Video Player</span>
              </div>
              {onSave && (
                <button
                  onClick={() => onSave(file)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2"
                >
                  <HardDrive size={13} />
                  Save to Drive
                </button>
              )}
            </div>
          )}
          <div className="flex-1 w-full h-full p-2 flex items-center justify-center overflow-hidden">
            {embedUrl ? (
              <div className="w-full h-full relative overflow-hidden rounded-xl bg-black">
                <iframe 
                  src={embedUrl} 
                  className="w-full h-[calc(100%+56px)] -mt-[56px] border-none rounded-xl bg-black shadow-2xl" 
                  title={file.name}
                  allow="autoplay; encrypted-media; fullscreen"
                />
              </div>
            ) : localSrc ? (
              <video 
                src={localSrc} 
                controls 
                className="max-w-full max-h-full rounded-xl shadow-2xl border border-slate-800 bg-black"
              />
            ) : (
              <div className="text-xs text-slate-400 flex flex-col items-center gap-2">
                <Video size={32} className="text-slate-600" />
                <span>No video source available</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Audio view support
    if (isAudioFile) {
      const src = (typeof file.content === 'string' && (file.content.startsWith('data:audio/') || file.content.startsWith('http') || file.content.startsWith('/') || file.content.startsWith('blob:')))
        ? file.content 
        : (file.webContentLink || file.url || (driveId ? `https://www.googleapis.com/drive/v3/files/${driveId}?alt=media` : ""));

      return (
        <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden relative items-center justify-center p-8">
          {!hideHeader && (
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3.5 bg-slate-900/90 backdrop-blur border-b border-slate-800 pr-16 text-white z-10 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-400">
                  <Music size={16} />
                </div>
                <span className="font-semibold text-xs text-slate-200">{file.name}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Audio Track</span>
              </div>
              {onSave && (
                <button
                  onClick={() => onSave(file)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2"
                >
                  <HardDrive size={13} />
                  Save to Drive
                </button>
              )}
            </div>
          )}
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center backdrop-blur">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg mb-6 text-white animate-pulse">
              <Music size={48} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 truncate max-w-full">{file.name}</h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">Audio Recording</p>
            {src ? (
              <audio controls src={src} className="w-full rounded-lg accent-emerald-500" />
            ) : (
              <div className="text-xs text-slate-500">Audio playback unavailable</div>
            )}
          </div>
        </div>
      );
    }

    // PDF view support
    if (isPdfFile) {
      const pdfUrl = (typeof file.content === 'string' && (file.content.startsWith('data:application/pdf') || file.content.startsWith('http') || file.content.startsWith('/') || file.content.startsWith('blob:')))
        ? file.content 
        : (file.webContentLink || file.url || (driveId ? `https://drive.google.com/file/d/${driveId}/preview` : ""));

      return (
        <div className="w-full h-full bg-slate-100 flex flex-col overflow-hidden relative">
          {!hideHeader && (
            <div className="shrink-0 flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-200 pr-16 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-red-50 text-red-600">
                  <FileText size={16} />
                </div>
                <span className="font-semibold text-xs text-gray-800">{file.name}</span>
                <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold">PDF Document</span>
              </div>
              {onSave && (
                <button
                  onClick={() => onSave(file)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2"
                >
                  <HardDrive size={13} />
                  Save to Drive
                </button>
              )}
            </div>
          )}
          <div className="flex-1 w-full h-full bg-slate-200 p-4">
            {pdfUrl ? (
              <div className="w-full h-full relative overflow-hidden rounded-xl bg-white">
                <iframe 
                  src={pdfUrl} 
                  className="w-full h-[calc(100%+56px)] -mt-[56px] border border-gray-300 rounded-xl bg-white shadow-md"
                  title={file.name}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-xs gap-2">
                <FileText size={32} className="text-gray-400" />
                <span>PDF Preview unavailable</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // JSON view support
    if (isJsonFile) {
      let formattedJson = file.content;
      if (typeof file.content === 'object') {
        formattedJson = JSON.stringify(file.content, null, 2);
      } else if (typeof file.content === 'string') {
        try {
          formattedJson = JSON.stringify(JSON.parse(file.content), null, 2);
        } catch (e) {
          formattedJson = file.content;
        }
      }

      return (
        <div className="w-full h-full bg-[#0A0D14] flex flex-col overflow-hidden text-gray-300 relative">
          {!hideHeader && (
            <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-[#141A29] bg-[#0C101A] pr-16 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-amber-500/20 text-amber-400">
                  <FileJson size={16} />
                </div>
                <span className="font-semibold text-xs text-gray-200">{file.name}</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">JSON Data</span>
              </div>
              {onSave && (
                <button
                  onClick={() => onSave(file)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2"
                >
                  <HardDrive size={13} />
                  Save to Drive
                </button>
              )}
            </div>
          )}
          <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-5 pr-16">
            <div className="max-w-4xl mx-auto bg-[#07090E] border border-[#141A29] rounded-xl p-6 overflow-x-auto select-text shadow-xl">
              <pre className="whitespace-pre text-emerald-400">
                <code>{formattedJson || '// Empty JSON object'}</code>
              </pre>
            </div>
          </div>
        </div>
      );
    }

    // 1. Iframe Viewer for Docs/Slides/Sheets on Google Drive (Real Authenticated GDrive uploads)
    if (isIframeViewer && driveId && mode === 'preview') {
      let embedUrl = `https://drive.google.com/file/d/${driveId}/preview`;
      if (isGoogleDoc) {
        embedUrl = `https://docs.google.com/document/d/${driveId}/preview`;
      } else if (isGoogleSlide) {
        embedUrl = `https://docs.google.com/presentation/d/${driveId}/preview?rm=minimal`;
      } else if (isGoogleSheet) {
        embedUrl = `https://docs.google.com/spreadsheets/d/${driveId}/preview`;
      }

      if (isPreviewCard) {
        let cleanEmbedUrl = embedUrl;
        let artifactType: 'doc' | 'slide' | 'sheet' = 'doc';

        if (isGoogleDoc) {
          cleanEmbedUrl = `https://docs.google.com/document/d/${driveId}/preview`;
          artifactType = 'doc';
        } else if (isGoogleSlide) {
          cleanEmbedUrl = `https://docs.google.com/presentation/d/${driveId}/preview?rm=minimal`;
          artifactType = 'slide';
        } else if (isGoogleSheet) {
          cleanEmbedUrl = `https://docs.google.com/spreadsheets/d/${driveId}/preview`;
          artifactType = 'sheet';
        }

        return (
          <ScaledIframe 
            src={cleanEmbedUrl}
            title={file.name}
            type={artifactType}
          />
        );
      }

      return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden relative">
          {/* Document Action bar */}
          {!hideHeader && (
            <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-gray-150 bg-white pr-16 animate-fade-in animate-duration-200">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${isGoogleDoc ? 'bg-blue-50 text-blue-600' : isGoogleSlide ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <FileText size={16} />
                </div>
                <span className="font-semibold text-xs text-gray-800">{file.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isGoogleDoc ? 'bg-blue-50 text-blue-700' : isGoogleSlide ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {isGoogleDoc ? 'Google Doc' : isGoogleSlide ? 'Google Slides' : 'Google Sheet'}
                </span>
              </div>

              {onSave && (
                <button
                  onClick={() => onSave(file)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10 mr-12"
                >
                  <HardDrive size={13} />
                  Save to Drive
                </button>
              )}
            </div>
          )}
          <div className="flex-1 bg-transparent relative overflow-hidden">
            <div className="w-full h-full relative overflow-hidden rounded-none bg-white">
              <iframe 
                src={embedUrl}
                className="w-full h-[calc(100%+56px)] -mt-[56px] border-none rounded-none bg-white"
                allow="autoplay"
                title={file.name}
              />
            </div>
          </div>
        </div>
      );
    }

    // 1b. Premium Native Editors / Embed Viewers for Google Workspace files
    if (mode === 'preview') {
      if (isGoogleSlide || isSlide) {
        const slideDriveId = (driveId || (file.id ? String(file.id) : '')).replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, '').replace(/(-preview)+$/, '');
        const hasNativeUrl = slideDriveId && isRealDriveId(slideDriveId);
        const nativeSlideUrl = hasNativeUrl 
          ? `https://docs.google.com/presentation/d/${slideDriveId}/preview?rm=minimal` 
          : (file.embedUrl || file.previewUrl || file.url);

        if (isIframeViewer && nativeSlideUrl) {
          return (
            <div className="w-full h-full bg-white flex flex-col items-center justify-center overflow-hidden relative select-none">
              <iframe 
                src={nativeSlideUrl}
                className="w-full h-full border-none bg-white shadow-none pointer-events-none"
                allow="autoplay; fullscreen"
                title={file.name}
              />
            </div>
          );
        }

        const contentStr = file.content || '';
        let rawSlides = contentStr.split(/(?=\n# )|(?=^# )|\n---|(?=\n---\n)/g).map((s: string) => s.trim()).filter((s: string) => s.length > 0 && s !== '---');

        if (rawSlides.length <= 1) {
          const cleanName = (file.name || '').replace(/\.[^/.]+$/, '');
          const lowerName = cleanName.toLowerCase();
          const lowerDesc = (file.description || '').toLowerCase();
          const lowerContent = contentStr.toLowerCase();

          if (lowerName.includes('new drive') || lowerName.includes('drive') || lowerDesc.includes('new drive') || lowerContent.includes('new drive')) {
            rawSlides = [
              `# Drive\n\n# New Drive`,
              `Hopefully everyone here has used Claude code...\n\nIt really feels magic.`,
              `## Interactive Workspace Canvas\n\n- Real-time multi-session chat persistence\n- Direct Google Drive API integration\n- Custom tool & app environment sandboxing`,
              `## Inferred Proactive Tasks\n\n> 100% Seamless Execution\n\n- Autonomous email & document drafting\n- Immediate action list tracking`,
              `## Native Workspace Viewer\n\n- Zero-latency native slides & document rendering\n- Interactive thumbnail gallery navigation`
            ];
          } else {
            const baseText = rawSlides[0] || `# ${cleanName}\n\n${file.description || 'Presentation deck'}`;
            rawSlides = [
              baseText,
              `## Overview & Scope\n\n- Key objectives and project milestones\n- Cross-functional team alignment`,
              `## Key Metrics & Impact\n\n> 98% Positive Feedback\n\n- Accelerated preview rendering\n- Enhanced gallery slide navigation`,
              `## Implementation Details\n\n- Modular component architecture\n- High-fidelity visual styling`,
              `## Next Steps & Summary\n\n- Finalize workspace review\n- Export updated presentation deck`
            ];
          }
        }

        const safeIndex = Math.min(activeSlideIndex, rawSlides.length - 1);
        const currentSlideContent = rawSlides[safeIndex] || rawSlides[0] || '';
        const isDark = theme === 'dark';

        return (
          <div className={`w-full h-full flex flex-col overflow-hidden relative select-text font-sans ${isDark ? 'bg-[#121315] text-white' : 'bg-white dark:bg-[#121315] text-slate-900'}`}>
            {!hideHeader && (
              <div className={`shrink-0 flex items-center justify-between px-6 py-3.5 border-b ${isDark ? 'border-neutral-800 bg-[#1E1F22] text-white' : 'border-slate-150 bg-white text-slate-800'}`}>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-amber-500/20 text-amber-500">
                    <FileText size={16} />
                  </div>
                  <span className="font-semibold text-xs text-slate-800 dark:text-gray-200">{file.name}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-bold">Google Slides</span>
                </div>
                {onSave && (
                  <button
                    onClick={() => onSave(file)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2 cursor-pointer"
                  >
                    <HardDrive size={13} />
                    Save to Drive
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 w-full h-full p-4 sm:p-6 flex flex-col items-center justify-between overflow-y-auto">
              {/* Active Main Viewport Slide Card - Full Width with 16px (px-4) canvas side padding */}
              <div className="w-full px-4 flex-1 flex flex-col items-center justify-center max-w-full">
                <div className={`w-full aspect-[16/9] max-h-[62vh] rounded-[24px] sm:rounded-[28px] p-8 sm:p-12 flex flex-col justify-between border relative overflow-hidden transition-all duration-300 ${
                  isDark ? 'border-neutral-800 bg-[#1E1F22] text-white shadow-none' : 'border-slate-200/90 bg-white text-slate-900 shadow-sm'
                }`}>
                  <div className="w-full text-slate-800 dark:text-slate-100 text-[16px] sm:text-[18px] leading-relaxed flex-1 flex flex-col justify-center overflow-y-auto">
                    <RenderSlideMarkdown text={currentSlideContent} isDark={isDark} />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-neutral-800 text-xs text-slate-400 font-medium shrink-0">
                    <span className="truncate max-w-[70%]">{file.name}</span>
                    <span className="shrink-0">Slide {safeIndex + 1} of {rawSlides.length}</span>
                  </div>
                </div>
              </div>

              {/* Slide Thumbnail Gallery Strip Below - Left-aligned to prevent left-edge clipping */}
              <div className="w-full flex items-center justify-start gap-3.5 mt-5 sm:mt-6 overflow-x-auto py-2 px-4 sm:px-6 select-none scrollbar-none shrink-0">
                {rawSlides.map((slideText: string, idx: number) => {
                  const isActive = idx === safeIndex;
                  return (
                    <div key={idx} className="flex flex-col items-start gap-1 shrink-0">
                      <span className={`text-[11px] font-medium pl-0.5 font-sans ${isActive ? 'text-slate-800 dark:text-white font-bold' : 'text-slate-400 dark:text-neutral-500'}`}>
                        {idx + 1}
                      </span>
                      <button
                        onClick={() => handleSelectSlide(idx)}
                        className={`w-[164px] h-[104px] rounded-xl border transition-all duration-200 overflow-hidden relative cursor-pointer text-left p-2 flex flex-col justify-start ${
                          isActive
                            ? 'ring-2 ring-blue-500 border-blue-500 dark:border-blue-400 bg-white dark:bg-[#1E1F22] shadow-md scale-[1.02]'
                            : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#1E1F22] hover:border-slate-300 dark:hover:border-neutral-700 opacity-90 hover:opacity-100'
                        }`}
                        title={`Slide ${idx + 1}`}
                      >
                        {/* Scaled Mini Preview */}
                        <div 
                          style={{
                            width: '380px',
                            height: '240px',
                            transform: 'scale(0.40)',
                            transformOrigin: 'top left',
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            pointerEvents: 'none'
                          }}
                          className="font-sans text-slate-800 dark:text-slate-100 select-none overflow-hidden"
                        >
                          <RenderSlideMarkdown text={slideText} isDark={isDark} />
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      if (isGoogleDoc && isIframeViewer) {
        const docDriveId = (driveId || (file.id ? String(file.id) : '')).replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, '').replace(/(-preview)+$/, '');
        const hasNativeUrl = docDriveId && isRealDriveId(docDriveId);
        const nativeDocUrl = hasNativeUrl 
          ? `https://docs.google.com/document/d/${docDriveId}/preview` 
          : (file.embedUrl || file.previewUrl || file.url);

        if (nativeDocUrl) {
          return (
            <div className="w-full h-full bg-white flex flex-col items-center justify-center overflow-hidden relative select-none">
              <iframe 
                src={nativeDocUrl}
                className="w-full h-full border-none bg-white shadow-none pointer-events-none"
                allow="autoplay"
                title={file.name}
              />
            </div>
          );
        }
      }

      if (isGoogleSheet && isIframeViewer) {
        const sheetDriveId = (driveId || (file.id ? String(file.id) : '')).replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, '').replace(/(-preview)+$/, '');
        const hasNativeUrl = sheetDriveId && isRealDriveId(sheetDriveId);
        const nativeSheetUrl = hasNativeUrl 
          ? `https://docs.google.com/spreadsheets/d/${sheetDriveId}/preview` 
          : (file.embedUrl || file.previewUrl || file.url);

        if (nativeSheetUrl) {
          return (
            <div className="w-full h-full bg-white flex flex-col items-center justify-center overflow-hidden relative select-none">
              <iframe 
                src={nativeSheetUrl}
                className="w-full h-full border-none bg-white shadow-none pointer-events-none"
                allow="autoplay"
                title={file.name}
              />
            </div>
          );
        }
      }
    }

    // 2. Runnable FILE View (Source Code / Raw)
    if (isRunnable && mode === 'file') {
      return (
        <div className="w-full h-full bg-[#0A0D14] flex flex-col overflow-hidden text-gray-300 relative">
          {!hideHeader && (
            <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-[#141A29] bg-[#0C101A] pr-16 animate-fade-in animate-duration-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-gray-900 text-gray-400">
                  <FileCode size={16} />
                </div>
                <span className="font-semibold text-xs text-gray-200">{file.name}</span>
                <span className="px-2 py-0.5 rounded bg-[#152033] text-blue-400 text-[10px] font-bold">Source Raw</span>
              </div>

              {/* Segmented control */}
              <div className="flex bg-[#141A29] p-0.5 rounded-lg border border-[#232F4A]">
                <button
                  onClick={() => setMode('file')}
                  className="px-3 py-1 text-xs font-semibold rounded-md transition-all bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                >
                  File (raw code)
                </button>
                <button
                  onClick={() => setMode('preview')}
                  className="px-3 py-1 text-xs font-semibold rounded-md transition-all text-gray-400 hover:text-gray-200"
                >
                  Preview (rendered code)
                </button>
              </div>

              {onSave && (
                <button
                  onClick={() => onSave(file)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10 mr-12 animate-fade-in animate-duration-205"
                >
                  <HardDrive size={13} />
                  Save to Drive
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-5">
            <div className="max-w-4xl mx-auto bg-[#07090E] border border-[#141A29] rounded-xl p-6 overflow-x-auto select-text shadow-xl">
              {file.content ? (
                <pre className="whitespace-pre">
                  <code>{file.content}</code>
                </pre>
              ) : (
                <div className="py-20 text-center text-gray-500">
                  Empty file
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 3. HTML Preview View
    if (nameLower.endsWith('.html') && mode === 'preview') {
      const previewUrl = nameLower === 'index.html' ? sandboxUrl : `${sandboxUrl}/${file.name}`;
      return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden relative">
          {!hideHeader && (
            <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-gray-150 bg-white pr-16 animate-fade-in animate-duration-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-orange-50 text-orange-600">
                  <FileCode size={16} />
                </div>
                <span className="font-semibold text-xs text-gray-800">{file.name}</span>
                <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 text-[10px] font-bold">HTML Preview</span>
              </div>

              {/* Segmented control */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setMode('file')}
                  className="px-3 py-1 text-xs font-semibold rounded-md transition-all text-slate-500 hover:text-slate-850"
                >
                  File (raw code)
                </button>
                <button
                  onClick={() => setMode('preview')}
                  className="px-3 py-1 text-xs font-semibold rounded-md transition-all bg-white text-slate-800 shadow-sm"
                >
                  Preview (rendered code)
                </button>
              </div>

              {onSave && (
                <button
                  onClick={() => onSave(file)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10 mr-12"
                >
                  <HardDrive size={13} />
                  Save to Drive
                </button>
              )}
            </div>
          )}

          <div className="flex-1 bg-transparent overflow-hidden">
            {sandboxUrl ? (
              <iframe 
                src={previewUrl}
                className="w-full h-full bg-white border-none rounded-none"
                allow="camera; microphone; geolocation"
                title={file.name}
              />
            ) : (file.content && !file.content.includes('Contents will load dynamically')) ? (
              <iframe 
                srcDoc={file.content}
                className="w-full h-full bg-white border-none rounded-none"
                allow="camera; microphone; geolocation"
                title={file.name}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white border-none rounded-none p-6 text-center text-gray-500">
                <Info size={24} className="mb-1.5 text-gray-400" />
                <p className="text-[11px] font-semibold text-slate-700">HTML Preview</p>
                {!isPreviewCard && (
                  <p className="text-xs text-gray-400 mt-1">Please start the active environment to view the responsive iframe.</p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // 4. Document/Markdown Premium Reader View
    if (isDocFile && mode === 'preview') {
      const isDocNullState = Boolean(
        (file.createdFromComposer || file.isDocJourney || isCreatedDocFromSpace || file.name === 'document.doc') &&
        (!file.content || file.content.trim() === '' || file.content.includes('Tell me what'))
      );

      if (isDocNullState) {
        return (
          <div className="w-full h-full bg-white dark:bg-[#1E1F22] flex flex-col items-center justify-center select-none p-8 animate-fade-in">
            <NullTitle theme={theme}>
              Tell me what <br /> you want to create
            </NullTitle>
          </div>
        );
      }

      const lines = (file.content || '').split('\n');
      let title = (file.name || 'Document').replace(/\.[a-zA-Z]+$/, '');
      title = title.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      let author = '';
      let contributors: string[] = [];
      let relatedFiles: string[] = [];
      const bodyParagraphs: string[] = [];

      let hasExtractedH1 = false;
      lines.forEach((line: string, idx: number) => {
        const trimmed = line.trim();
        const lower = trimmed.toLowerCase();

        // Remove quick notes section or dropdown content from document representations
        if (lower.includes('quick notes') || lower.includes('quick_notes') || lower.includes('✍️ quick notes')) {
          return;
        }

        if (trimmed.startsWith('# ') && !hasExtractedH1) {
          title = trimmed.replace(/^#\s+/, '').trim();
          hasExtractedH1 = true;
        } else if (lower.startsWith('author:')) {
          author = trimmed.substring(trimmed.indexOf(':') + 1).trim();
        } else if (lower.startsWith('contributors:')) {
          const rest = trimmed.substring(trimmed.indexOf(':') + 1).trim();
          contributors = rest.split(',').map(s => s.trim()).filter(Boolean);
        } else if (lower.startsWith('related files:')) {
          const rest = trimmed.substring(trimmed.indexOf(':') + 1).trim();
          relatedFiles = rest.split(',').map(s => s.trim()).filter(Boolean);
        } else if (idx === 0 && trimmed.length > 0 && !trimmed.startsWith('#') && trimmed.length < 100) {
          title = trimmed;
        } else {
          if (trimmed !== title || idx !== 0) {
            bodyParagraphs.push(line);
          }
        }
      });

      if (hideHeader) {
        return (
          <div className="w-full h-full bg-white p-8 text-left leading-[1.65] text-[16px] text-2c3e50 font-sans overflow-y-auto select-text" style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}>
            <h1 className="text-3xl font-extrabold text-slate-850 tracking-tight mb-4 font-sans" style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}>
              {title}
            </h1>
            {author && (
              <div className="text-xs text-slate-400 font-sans uppercase font-bold tracking-wider mb-3">
                By {author}
              </div>
            )}
            <div className="markdown-body prose max-w-none text-[16px] text-slate-700 space-y-4 font-sans" style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}>
              <ReactMarkdown>{bodyParagraphs.join('\n')}</ReactMarkdown>
            </div>
          </div>
        );
      }

      return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden relative">
          {!hideHeader && (
            <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-gray-150 bg-white pr-16 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50 text-blue-600">
                  <FileText size={16} />
                </div>
                <span className="font-semibold text-xs text-gray-800">{file.name}</span>
                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-bold">Document</span>
              </div>

              {/* Segmented control for Runnable markdown or Iframe Google Docs */}
              {(isRunnable || isIframeViewer) && !isNativeGoogleFile && (
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setMode('file')}
                    className="px-3 py-1 text-xs font-semibold rounded-md transition-all bg-white text-slate-800 shadow-sm"
                  >
                    File (raw text)
                  </button>
                  <button
                    onClick={() => setMode('preview')}
                    className="px-3 py-1 text-xs font-semibold rounded-md transition-all text-slate-500 hover:text-slate-850"
                  >
                    {isIframeViewer ? 'Preview (rendered document)' : 'Preview (rendered code)'}
                  </button>
                </div>
              )}

              {onSave && (
                <button
                  onClick={() => onSave(file)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10 mr-12"
                >
                  <HardDrive size={13} />
                  Save to Drive
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-8 bg-f4f5f7 pr-16">
            <div className="max-w-[800px] mx-auto bg-white border border-gray-100 rounded-lg p-14 pr-16 shadow-sm min-h-full">
              <div className="mb-10 pb-8 flex flex-col gap-5">
                <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight font-sans" style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}>
                  {title}
                </h1>

                <div className="flex flex-col gap-3.5 text-sm pt-2 text-slate-700 font-medium">
                  {author && (
                    <div className="flex items-center gap-6">
                      <span className="w-24 text-slate-400 text-xs uppercase font-bold tracking-wider shrink-0">Author</span>
                      <span className="px-2.5 py-1 rounded bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-100">
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold uppercase select-none shrink-0">
                          {author.charAt(0)}
                        </div>
                        {author}
                      </span>
                    </div>
                  )}

                  {contributors.length > 0 && (
                    <div className="flex items-center gap-6">
                      <span className="w-24 text-slate-400 text-xs uppercase font-bold tracking-wider shrink-0">Contributors</span>
                      <div className="flex flex-wrap gap-1.5">
                        {contributors.map((contrib, i) => (
                          <span key={i} className="px-2.5 py-0.5 rounded bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-100 inline-flex items-center gap-1">
                            <User size={10} className="text-gray-400" />
                            {contrib}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {relatedFiles.length > 0 && (
                    <div className="flex items-center gap-6">
                      <span className="w-24 text-slate-400 text-xs uppercase font-bold tracking-wider shrink-0">Related files</span>
                      <div className="flex flex-wrap gap-1.5">
                        {relatedFiles.map((rFile, i) => {
                          const fileColor = rFile.toLowerCase().includes('marketing') 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100';
                          return (
                            <span 
                              key={i} 
                              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border inline-flex items-center gap-1.5 transition ${fileColor}`}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></div>
                              {rFile}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="markdown-body prose prose-slate max-w-none text-[16px] text-slate-700 leading-7 pr-4 focus:outline-none native-serif-viewer">
                <ReactMarkdown>{bodyParagraphs.join('\n')}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 5. Spreadsheet View (.csv or similar)
    if (isCsvFile && file.content) {
      const rowLines = file.content.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
      const parsedLines = rowLines.map((line: string) => line.split(/[,;\t]/).map((c: string) => c.trim().replace(/^["']|["']$/g, '')));
      const headers = parsedLines[0] || [];
      const rows = parsedLines.slice(1);

      return (
        <div className="w-full h-full bg-f8f9fa flex flex-col overflow-hidden relative">
          {!hideHeader && (
            <div className="shrink-0 flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-150 pr-16 animate-fade-in animate-duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet size={16} />
                </div>
                <span className="font-semibold text-xs text-gray-800">{file.name}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">CSV Grid</span>
              </div>
              {onSave && (
                <button
                  onClick={() => onSave(file)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10 mr-12"
                >
                  <HardDrive size={13} />
                  Save to Drive
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-auto bg-transparent">
            <div className="bg-white border-none w-full h-full max-w-full rounded-none">
              <table className="w-full border-collapse text-left text-xs text-gray-700">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-250 select-none">
                    <th className="w-10 text-center border-r border-gray-200 font-bold text-gray-400 bg-gray-50/50 py-2.5 px-1 text-[10px]">#</th>
                    {headers.map((hdr: string, i: number) => (
                      <th 
                        key={i} 
                        className="px-4 py-2.5 border-r border-gray-200 font-semibold text-gray-950 uppercase tracking-wider text-[11px]"
                      >
                        <div className="flex items-center justify-between">
                          <span>{hdr.trim().replace(/^["']|["']$/g, '')}</span>
                          <span className="text-[10px] text-gray-350 font-normal ml-3">{String.fromCharCode(65 + (i % 26))}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: string[], rowIndex: number) => (
                    <tr 
                      key={rowIndex} 
                      className="border-b border-gray-150 hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="w-10 text-center border-r border-gray-200 font-bold text-gray-400 bg-gray-50/30 py-2 text-[10px] select-none">
                        {rowIndex + 1}
                      </td>
                      {row.map((cell: string, cellIndex: number) => (
                        <td 
                          key={cellIndex} 
                          className="px-4 py-2 border-r border-gray-200 truncate max-w-[250px] font-medium"
                        >
                          {cell.trim().replace(/^["']|["']$/g, '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 6. Generic/Monospace Fallback code editor viewer
    if (hideHeader) {
      return (
        <div className="w-full h-full bg-[#0A0D14] p-4 overflow-hidden select-none text-left">
          <div className="text-[9px] text-gray-500 font-mono mb-1.5 truncate">{file.name}</div>
          <pre className="text-[8px] font-mono text-gray-300 leading-normal select-none pointer-events-none truncate whitespace-pre overflow-hidden">
            <code>{file.content || '// No code content'}</code>
          </pre>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-[#0A0D14] flex flex-col overflow-hidden text-gray-300 relative">
        {!hideHeader && (
          <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-[#141A29] bg-[#0C101A] pr-16 animate-fade-in animate-duration-200">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-gray-900 text-gray-400">
                <FileCode size={16} />
              </div>
              <span className="font-semibold text-xs text-gray-200">{file.name}</span>
              <span className="px-2 py-0.5 rounded bg-[#152033] text-blue-400 text-[10px] font-bold">Code Raw</span>
            </div>
            {onSave && (
              <button
                onClick={() => onSave(file)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10 mr-12"
              >
                <HardDrive size={13} />
                Save to Drive
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-5 pr-16 animate-fade-in animate-duration-200">
          <div className="max-w-4xl mx-auto bg-[#07090E] border border-[#141A29] rounded-xl p-6 overflow-x-auto select-text shadow-xl">
            {file.content ? (
              <pre className="whitespace-pre">
                <code>{file.content}</code>
              </pre>
            ) : (
              <div className="py-20 text-center text-gray-500">
                Empty file
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isTargetIframe = isIframeViewer && driveId && mode === 'preview';

  if (isPreviewCard && !isTargetIframe) {
    const nameLower = (file?.name || '').toLowerCase();
    const mimeLower = (file?.mimeType || '').toLowerCase();
    const typeLower = (file?.type || file?.taskType || '').toLowerCase();
    const cleanTitle = (file?.name || file?.title || 'Artifact').replace(/\.[^/.]+$/, '').replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, '').trim();

    const isSlide = Boolean(
      typeLower === 'slide' ||
      mimeLower.includes('presentation') ||
      mimeLower.includes('slide') ||
      nameLower.endsWith('.gslides') ||
      nameLower.endsWith('.pptx') ||
      nameLower.endsWith('.ppt') ||
      nameLower.includes('deck') ||
      nameLower.includes('presentation') ||
      nameLower.includes('slide')
    );

    const rawText = file.content || file.realDocText || `# ${cleanTitle}\n\n- Preview content`;

    if (isSlide) {
      const slidesList = rawText.split(/(?=\n# )|(?=^# )|\n---/g).filter((s: string) => s.trim().length > 0);
      const activeSlideText = slidesList[0] || rawText;

      return (
        <div 
          ref={previewRef}
          className="w-full h-full relative overflow-hidden bg-[#FAFAFC] select-none pointer-events-none rounded-[8px]"
        >
          <div 
            style={{
              width: '520px',
              height: '360px',
              transform: 'scale(0.2)',
              transformOrigin: 'top left',
              position: 'absolute',
              left: 0,
              top: 0,
              overflow: 'hidden'
            }}
            className="p-5 bg-[#FAFAFC] text-slate-800 flex flex-col justify-start rounded-[16px] border border-slate-200/90 shadow-2xs"
          >
            <RenderSlideMarkdown text={activeSlideText} isDark={false} />
          </div>
        </div>
      );
    }

    // Doc Card Thumbnail Preview (Scaled 1:1 RenderDocMarkdown on 300x400 canvas)
    return (
      <div 
        ref={previewRef}
        className="w-full h-full relative overflow-hidden bg-white select-none pointer-events-none rounded-[8px]"
      >
        <div 
          style={{
            width: '300px',
            height: '400px',
            transform: 'scale(0.18)',
            transformOrigin: 'top left',
            position: 'absolute',
            left: 0,
            top: 0,
            overflow: 'hidden'
          }}
          className="p-4 bg-white text-slate-800 flex flex-col justify-start rounded-[14px] border border-slate-200/90 shadow-2xs"
        >
          <RenderDocMarkdown text={rawText} isDark={false} />
        </div>
      </div>
    );
  }

  if (file.isCommDraft && file.commData) {
    const isCal = file.commData.draftType === 'calendar' || file.commData.calDraft;
    const comm = isCal ? file.commData.calDraft : file.commData.emailDraft;
    return (
      <div className="w-full h-full bg-[#F8FAFD] dark:bg-[#1E1F22] p-8 flex flex-col items-center justify-center overflow-y-auto select-text">
        <div className="w-full max-w-2xl bg-white dark:bg-[#2B2D31] rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-neutral-700 flex flex-col gap-6 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{isCal ? 'Calendar Invite Update Draft' : 'Email Reply Draft'}</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">{file.commData.summaryOfChanges || 'Proactively synthesized communication'}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Draft Ready
            </span>
          </div>
          
          {isCal ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Event Title</label>
                <input type="text" defaultValue={comm?.title || 'Meeting Check-in'} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Proposed Time</label>
                <input type="text" defaultValue={comm?.proposedTime || '2026-07-10T15:00:00Z'} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Agenda / Notes</label>
                <textarea rows={5} defaultValue={comm?.agenda || 'Updated agenda items'} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">To</label>
                <input type="text" defaultValue={comm?.to || 'team@company.com'} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Subject</label>
                <input type="text" defaultValue={comm?.subject || 'Re: Workspace update'} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Body</label>
                <textarea rows={6} defaultValue={comm?.body || 'Hi Team,\n\nI have addressed the requested changes.\n\nBest,\nOllie'} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-neutral-700">
            {onClose && (
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-semibold text-sm transition-all cursor-pointer">
                Discard
              </button>
            )}
            <button onClick={() => { if (onSave) onSave(file); }} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer flex items-center gap-2">
              <CheckCircle2 size={16} />
              {isCal ? 'Update Calendar Invite' : 'Send Email Reply'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden">
      <style>{`
        .native-serif-viewer,
        .native-serif-viewer *,
        .native-serif-viewer p,
        .native-serif-viewer h1,
        .native-serif-viewer h2,
        .native-serif-viewer h3,
        .native-serif-viewer h4,
        .native-serif-viewer h5,
        .native-serif-viewer h6,
        .native-serif-viewer li,
        .native-serif-viewer span,
        .native-serif-viewer div {
          font-family: "Google Sans", "Product Sans", "Inter", sans-serif !important;
        }
      `}</style>
      {!isDocFile && !isImageFile && !isVideoFile && !isGoogleSlide && !isSlide && onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-3.5 right-4 z-50 hover:bg-gray-100 p-1.5 rounded-full transition duration-200 cursor-pointer text-gray-400 hover:text-gray-600 bg-white shadow-sm border border-gray-150 animate-fade-in"
          title="Close file viewer"
        >
          <Plus size={16} className="rotate-45" />
        </button>
      )}
      {renderContent()}
    </div>
  );
}

function ScaledIframe({ 
  src, 
  title, 
  type 
}: { 
  src: string; 
  title: string; 
  type: 'doc' | 'slide' | 'sheet';
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!containerRef.current) return;
    
    const element = containerRef.current;
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateSize();

    // Use a standard ResizeObserver to track container width & height changes dynamically
    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Determine styles for the wrapper and scaled document/slide representation
  let iframeStyle: React.CSSProperties = {
    position: 'absolute',
    border: 'none',
    outline: 'none',
    left: '0px',
    top: '0px',
  };

  let wrapperStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  };

  if (dimensions.width > 0 && dimensions.height > 0) {
    if (type === 'doc') {
      const virtualWidth = 960;
      const desiredPaperWidth = 630; // 630px represents standard Google Doc paper page width on preview
      const leftMargin = (virtualWidth - desiredPaperWidth) / 2; // (960 - 630)/2 = 165px left crop
      const currentScale = dimensions.width / desiredPaperWidth;
      const topCrop = 75; // crops top Google Doc banner perfectly
      
      iframeStyle = {
        ...iframeStyle,
        width: `${virtualWidth}px`,
        height: `${(dimensions.height / currentScale) + topCrop + 100}px`,
        transform: `scale(${currentScale}) translate(${-leftMargin}px, ${-topCrop}px)`,
        transformOrigin: 'top left',
        overflow: 'hidden',
        display: 'block',
      };

      wrapperStyle = {
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        position: 'relative',
        overflow: 'hidden',
      };
    } else if (type === 'slide') {
      // 16:9 Slide standards
      const virtualWidth = 960;
      const virtualHeight = 540;
      const currentScale = dimensions.width / virtualWidth; // fits standard centered presentation width exactly

      iframeStyle = {
        ...iframeStyle,
        width: `${virtualWidth}px`,
        height: `${virtualHeight}px`,
        transform: `scale(${currentScale})`,
        transformOrigin: 'top left',
        overflow: 'hidden',
        display: 'block',
      };

      wrapperStyle = {
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`, // Make wrapper match the actual container height (no top/bottom gaps!)
        position: 'relative',
        overflow: 'hidden',
      };
    } else {
      // spreadsheet (sheet)
      const virtualWidth = 1000;
      const currentScale = dimensions.width / virtualWidth;
      const cropExtra = 60; // 60 physical pixels to absolutely crop scrollbars out
      
      iframeStyle = {
        ...iframeStyle,
        width: `${virtualWidth + (cropExtra / currentScale)}px`, // extra space to push scrollbar off right
        height: `${(dimensions.height / currentScale) + (cropExtra / currentScale)}px`, // extra space to push scrollbar off bottom
        transform: `scale(${currentScale})`,
        transformOrigin: 'top left',
        overflow: 'hidden',
        display: 'block',
      };

      wrapperStyle = {
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        position: 'relative',
        overflow: 'hidden',
      };
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full bg-white overflow-hidden select-none pointer-events-none flex items-center justify-center"
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <div style={wrapperStyle}>
          <iframe 
            src={src} 
            style={iframeStyle} 
            scrolling="no" 
            title={title} 
          />
        </div>
      )}
    </div>
  );
}


