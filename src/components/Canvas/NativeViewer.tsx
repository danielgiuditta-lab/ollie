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
}

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
  onProactiveTaskClick
}: NativeViewerProps) {
  const [internalMode, setInternalMode] = useState<'file' | 'preview'>('preview');

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

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
            <div className="flex flex-col gap-3">
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

  const nameLower = file.name.toLowerCase();
  
  const isGoogleSlide = 
    file.type === 'slide' ||
    file.taskType === 'slide' ||
    nameLower.endsWith('.gslides') ||
    nameLower.endsWith('.pptx') ||
    nameLower.endsWith('.ppt') ||
    (file.mimeType && (
      file.mimeType.toLowerCase().includes('vnd.google-apps.presentation') ||
      file.mimeType.toLowerCase().includes('officedocument.presentationml') ||
      file.mimeType.toLowerCase().includes('ms-powerpoint') ||
      file.mimeType.toLowerCase().includes('presentation') ||
      file.mimeType.toLowerCase().includes('slide')
    )) ||
    (file.isProactiveDraft && (file.type === 'slide' || file.taskType === 'slide' || nameLower.endsWith('.gslides') || nameLower.includes('slide') || nameLower.includes('presentation')));

  const isGoogleSheet = 
    (file.mimeType && (
      file.mimeType.toLowerCase().includes('vnd.google-apps.spreadsheet') ||
      file.mimeType.toLowerCase().includes('officedocument.spreadsheetml') ||
      file.mimeType.toLowerCase().includes('ms-excel') ||
      file.mimeType.toLowerCase().includes('sheet')
    )) ||
    nameLower.endsWith('.gsheet') ||
    nameLower.endsWith('.xlsx') ||
    nameLower.endsWith('.xls') ||
    nameLower.endsWith('.csv') ||
    nameLower.includes('spend') ||
    nameLower.includes('analysis') ||
    nameLower.includes('breakdown') ||
    nameLower.includes('inventory');

  const isGoogleDoc = 
    !isGoogleSlide && 
    !isGoogleSheet && (
      file.type === 'doc' ||
      file.taskType === 'doc' ||
      (file.mimeType && (
        file.mimeType.toLowerCase().includes('vnd.google-apps.document') ||
        file.mimeType.toLowerCase().includes('wordprocessingml') ||
        file.mimeType.toLowerCase().includes('msword') ||
        file.mimeType.toLowerCase().includes('gdoc')
      )) ||
      nameLower.endsWith('.gdoc') ||
      nameLower.endsWith('.docx') ||
      nameLower.endsWith('.doc') ||
      nameLower.endsWith('.txt') ||
      nameLower.includes('suppliers') ||
      nameLower.includes('proposal') ||
      nameLower.includes('report') ||
      nameLower.includes('contract') ||
      nameLower.includes('document')
    );

  const isDoc = 
    isGoogleDoc ||
    (!isGoogleSlide && !isGoogleSheet && (
      nameLower.endsWith('.doc') || 
      nameLower.endsWith('.docx') || 
      nameLower.endsWith('.gdoc') ||
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
  const driveId = rawId ? String(rawId).replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, '') : undefined;

  const isRealDriveId = (id: string | undefined | null) => {
    if (!id) return false;
    const str = String(id).replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, '');
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
  
  // Google Docs, Slides, and Sheets block iframe embedding on localhost (X-Frame-Options/auth).
  // Always use our interactive high-fidelity simulated native viewers (renderGoogleDocSim, etc.).
  const isIframeViewer = false;

  const isRunnable = nameLower.endsWith('.html') || nameLower.endsWith('.md') || nameLower.endsWith('.markdown');

  const isDocFile = 
    !isGoogleSlide &&
    !isSlide &&
    !isGoogleSheet && (
      isDoc || 
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
    !nameLower.endsWith('.md') &&
    !nameLower.endsWith('.markdown') &&
    !nameLower.endsWith('.txt') &&
    (nameLower.endsWith('.csv') || 
    nameLower.endsWith('.xls') || 
    nameLower.endsWith('.xlsx') ||
    (file.mimeType && file.mimeType.includes('spreadsheet')) ||
    nameLower === 'suppliers' || 
    nameLower === 'fulfillment centers' ||
    nameLower === 'supply chain analysis' ||
    (file.content && (file.content.includes(',') || file.content.includes(';') || file.content.includes('\t')))) &&
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

  // Google Docs High fidelity mock viewer
  const renderGoogleDocSim = () => {
    const lines = file.content ? file.content.split('\n') : [];
    
    // Extract title
    let title = file.name.replace(/\.[a-zA-Z]+$/, '');
    title = title.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const bodyParagraphs: string[] = [];
    let hasExtractedH1 = false;
    lines.forEach((line: string, idx: number) => {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();
      if (!lower.startsWith('author:') && !lower.startsWith('contributors:') && !lower.startsWith('related files:')) {
        if (trimmed.startsWith('# ') && !hasExtractedH1) {
          title = trimmed.replace(/^#\s+/, '').trim();
          hasExtractedH1 = true;
        } else if (idx === 0 && trimmed.length > 0 && !trimmed.startsWith('#') && trimmed.length < 100) {
          title = trimmed;
        } else {
          bodyParagraphs.push(line);
        }
      }
    });

    const parsedContent = bodyParagraphs.join('\n');

    const isNewUnauthoredDoc = !file.content || 
      file.content.trim() === '' || 
      file.content.includes('Tell me what') || 
      file.content.includes('New document');

    if (isNewUnauthoredDoc && !isPreviewCard) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-transparent text-center select-none animate-in fade-in duration-300">
          <NullTitle theme={theme}>
            Tell me what <br /> you want to create
          </NullTitle>
        </div>
      );
    }

    if (hideHeader && isPreviewCard) {
      const cleanParagraphs = bodyParagraphs
        .map((p: string) => p.replace(/^[#*\-\d.\s]+/, '').trim())
        .filter((p: string) => p.length > 0);
      return (
        <div className="w-full h-full bg-white dark:bg-[#1E1F22] p-2 flex flex-col justify-between text-left select-none overflow-hidden border border-slate-100 dark:border-neutral-800 font-sans">
          <div className="flex justify-between items-center w-full min-w-0">
            <span className="text-[8.5px] font-bold text-slate-900 dark:text-white tracking-wide truncate pr-1">
              {title}
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <CheckCircle2 size={7} className="text-white" />
            </div>
          </div>
          
          <div className="space-y-0.5 my-auto overflow-hidden">
            {cleanParagraphs.slice(0, 2).map((para: string, idx: number) => (
              <p key={idx} className="text-[7.5px] leading-tight text-slate-600 dark:text-slate-300 truncate font-sans">
                {para}
              </p>
            ))}
            {cleanParagraphs.length === 0 && (
              <p className="text-[7.5px] text-slate-400 italic">Document draft</p>
            )}
          </div>

          <div className="flex items-center justify-between w-full pt-1 border-t border-slate-100 dark:border-neutral-800 text-[7px] text-slate-400">
            <span className="truncate">Google Doc</span>
            <span className="shrink-0 text-blue-500 font-medium">Updated</span>
          </div>
        </div>
      );
    }

    if (isCreatedDocFromSpace) {
      return (
        <div className="w-full h-full bg-white dark:bg-[#18191B] flex flex-col overflow-y-auto p-8 md:p-12 select-text font-sans">
          <div className="w-full max-w-4xl mx-auto text-left leading-[1.8] text-[16px] text-2c3e50 font-sans">
            <div className="markdown-body prose max-w-none text-slate-800 dark:text-slate-100 focus:outline-none font-sans">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white border-none pb-4 mb-6 leading-tight tracking-normal text-left font-sans">
                {title}
              </h1>
              <div className="text-[16px] text-slate-700 dark:text-slate-200 space-y-6 font-sans">
                <ReactMarkdown>{parsedContent}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-[#f8f9fa] dark:bg-[#161719] flex flex-col overflow-y-auto p-8 select-text font-sans">
        {/* Centered White Document Page */}
        <div className="w-[794px] min-h-[1024px] mx-auto bg-white dark:bg-[#1E1F22] shadow-[0_1px_3px_1px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] border border-slate-200 dark:border-[#2B2D31] rounded-[2px] p-[80px] text-left relative leading-[1.8] text-[16px] text-2c3e50 font-sans">
          <div className="markdown-body prose max-w-none text-slate-800 dark:text-slate-100 focus:outline-none font-sans">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white border-none pb-4 mb-6 leading-tight tracking-normal text-left font-sans">
              {title}
            </h1>
            <div className="text-[16px] text-slate-700 dark:text-slate-200 space-y-6 font-sans">
              <ReactMarkdown>{parsedContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const parseSpreadsheetContent = (content: string) => {
    const rowLines = content ? content.split(/\r?\n/) : [];
    
    // Smart delimiter detection (comma, semicolon, or tab)
    let separator = ',';
    if (content) {
      const firstLine = content.split(/\r?\n/)[0] || '';
      const commas = (firstLine.match(/,/g) || []).length;
      const semicolons = (firstLine.match(/;/g) || []).length;
      const tabs = (firstLine.match(/\t/g) || []).length;
      
      if (semicolons > commas && semicolons > tabs) {
        separator = ';';
      } else if (tabs > commas && tabs > semicolons) {
        separator = '\t';
      }
    }

    const parsedLines = rowLines
      .map((line: string) => {
        // Smart quote-aware parser
        if (line.includes('"')) {
          const parts: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === separator && !inQuotes) {
              parts.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          parts.push(current);
          return parts;
        }
        return line.split(separator);
      })
      .filter((row: string[]) => row.length > 0 && row.some(cell => cell && cell.trim().length > 0));

    const headers = parsedLines[0] || [];
    const rows = parsedLines.slice(1);

    return { headers, rows };
  };

  // Google Sheets High fidelity mock viewer
  const renderGoogleSheetSim = () => {
    let title = file.name.replace(/\.[a-zA-Z]+$/, '');
    title = title.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const { headers, rows } = parseSpreadsheetContent(file.content || '');

    if (hideHeader && isPreviewCard) {
      return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden text-slate-800 select-none">
          <div 
            className={`flex-1 ${isPreviewCard ? 'overflow-hidden p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : 'overflow-auto p-2.5'} bg-white relative`}
          >
            <div className={`bg-white border ${isPreviewCard ? 'border-none rounded-none shadow-none' : 'border-slate-150 rounded-[4px] shadow-3xs'} max-w-full inline-block min-w-full overflow-hidden`}>
              <table className="w-full border-collapse text-left text-[10px] text-slate-700 border-spacing-0">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-250 divide-x divide-slate-150 select-none">
                    <th className="w-8 text-center bg-slate-50 border-r border-slate-250 py-1 px-1 text-[9px] font-bold text-slate-400"></th>
                    {headers.slice(0, 4).map((hdr: string, i: number) => (
                      <th 
                        key={i} 
                        className="px-2 py-1 font-semibold text-slate-600 font-sans text-[9px] text-center bg-slate-50 border-r border-slate-200"
                        style={{ minWidth: '70px' }}
                      >
                        <div className="flex flex-col items-center justify-center leading-none">
                          <span className="text-[8px] font-bold text-slate-400 block mb-0.5 select-none">{String.fromCharCode(65 + (i % 26))}</span>
                          <span className="text-slate-850 truncate font-semibold block">{hdr.trim().replace(/^["']|["']$/g, '')}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {rows.slice(0, 8).map((row: string[], rowIndex: number) => (
                    <tr 
                      key={rowIndex} 
                      className="divide-x divide-slate-150 border-b border-slate-150 hover:bg-slate-50/50"
                    >
                      <td className="w-8 text-center bg-slate-50 border-r border-slate-200 font-bold text-slate-400 py-1 text-[9px] select-none">
                        {rowIndex + 1}
                      </td>
                      {row.slice(0, 4).map((cell: string, cellIndex: number) => {
                        return (
                          <td 
                            key={cellIndex} 
                            className="px-2 py-1 truncate max-w-[120px] font-medium font-mono text-[9px]"
                          >
                            {cell.trim().replace(/^["']|["']$/g, '')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-f8f9fa flex flex-col overflow-hidden text-slate-850 select-text font-sans">
        {/* Mock Sheets Ribbon Header */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex flex-col gap-1 select-none">
          {/* Row 1: Title & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Sheets Green Icon */}
              <div className="bg-[#0f9d58] p-1.5 rounded-sm shadow-sm shrink-0">
                <FileSpreadsheet size={18} className="text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900 leading-none">{file.name}</span>
                  <div className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">Simulated Spreadsheet</div>
                </div>
                {/* Menu items */}
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium mt-1">
                  <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">File</span>
                  <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">Edit</span>
                  <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">View</span>
                  <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">Insert</span>
                  <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">Format</span>
                  <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">Data</span>
                  <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">Tools</span>
                  <span className="hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer">Help</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Autosaved to workspace
              </span>
              {onSave && (
                <button
                  onClick={() => onSave(file)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0f9d58] hover:bg-emerald-700 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <HardDrive size={13} />
                  Save to Drive
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Standard Google Sheets Toolbar */}
          <div className="flex items-center gap-1 py-1 mt-1 border-t border-slate-100 text-slate-600 overflow-x-auto scrollbar-hide shrink-0">
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer"><Undo size={14} /></button>
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer"><Redo size={14} /></button>
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer"><Printer size={14} /></button>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center hover:bg-slate-150 px-2 py-1 rounded cursor-pointer text-[11px] font-bold bg-slate-100 border border-slate-200 text-emerald-800">$</div>
            <div className="flex items-center hover:bg-slate-150 px-2 py-1 rounded cursor-pointer text-[11px] font-bold bg-slate-100 border border-slate-200 text-emerald-800">%</div>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center hover:bg-slate-100 px-1.5 py-1 rounded cursor-pointer text-[11px] gap-1 font-medium">
              <span>Arial</span>
              <ChevronDown size={10} />
            </div>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-150 px-1 py-0.5 rounded">
              <span className="text-[11px] font-bold px-1 select-none">10</span>
            </div>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <button className="p-1 hover:bg-[#E6F4EA] text-emerald-700 rounded cursor-pointer font-bold"><Bold size={13} /></button>
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer italic"><Italic size={13} /></button>
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer underline"><Underline size={13} /></button>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer bg-slate-100 border border-slate-200"><TableIcon size={13} /></button>
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer"><Highlighter size={13} /></button>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer"><AlignLeft size={13} /></button>
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer"><AlignCenter size={13} /></button>
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer"><AlignRight size={13} /></button>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer"><Link size={13} /></button>
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer"><ImageIcon size={13} /></button>
            <button className="p-1 hover:bg-slate-100 rounded cursor-pointer text-emerald-700 font-bold text-xs px-1 hover:underline">Σ</button>
          </div>
        </div>

        {/* Formula Bar */}
        <div className="shrink-0 h-9 bg-white border-b border-slate-200 flex items-center px-4 gap-2 select-none">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
            <span className="text-xs font-semibold text-slate-400 font-mono tracking-wide">A1</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-500 font-mono italic text-xs pl-2 shrink-0">
            <span className="text-emerald-700 font-bold not-italic select-none">fx</span>
            <span className="text-slate-350 select-none">|</span>
          </div>
          <div className="flex-1 text-left text-xs font-mono text-slate-800 bg-slate-50/50 px-2 py-1 rounded truncate">
            {headers[0] || 'Sum of workspace records'}
          </div>
        </div>

        {/* Grid Workspace */}
        <div className="flex-1 overflow-auto bg-f8f9fa p-4 relative pr-16 pb-12">
          <div className="bg-white border border-slate-200 rounded-[2px] shadow-xs max-w-full inline-block min-w-full">
            <table className="w-full border-collapse text-left text-xs text-slate-700 border-spacing-0">
              <thead>
                <tr className="bg-f8f9fa border-b border-slate-300 divide-x divide-slate-200 select-none">
                  <th className="w-11 text-center bg-f8f9fa sticky left-0 z-10 border-r border-slate-300 py-1.5 px-1 text-[11px] font-bold text-slate-400 select-none"></th>
                  {headers.map((hdr: string, i: number) => (
                    <th 
                      key={i} 
                      className="px-4 py-1.5 font-semibold text-slate-600 font-mono text-[11px] text-center bg-f8f9fa border-r border-slate-250"
                      style={{ minWidth: '130px' }}
                    >
                      <div className="flex flex-col items-center justify-center leading-none">
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5 select-none">{String.fromCharCode(65 + (i % 26))}</span>
                        <span className="text-slate-800 truncate font-sans font-semibold block">{hdr.trim().replace(/^["']|["']$/g, '')}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-1.5 font-bold text-slate-400 text-center bg-f8f9fa" style={{ minWidth: '100px' }}>
                    <span className="text-[10px] select-none">{String.fromCharCode(65 + (headers.length % 26))}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.length > 0 ? (
                  rows.map((row: string[], rowIndex: number) => (
                    <tr 
                      key={rowIndex} 
                      className="divide-x divide-slate-200 border-b border-slate-200 hover:bg-emerald-500/10 transition-colors"
                    >
                      <td className="w-11 text-center bg-f8f9fa border-r border-slate-300 font-bold text-slate-400 sticky left-0 z-10 py-1.5 text-[11px] select-none">
                        {rowIndex + 1}
                      </td>
                      {row.map((cell: string, cellIndex: number) => {
                        const isFirstCell = rowIndex === 0 && cellIndex === 0;
                        return (
                          <td 
                            key={cellIndex} 
                            className={`px-4 py-1.5 truncate max-w-[250px] font-medium font-sans relative ${
                              isFirstCell 
                                ? 'outline outline-2 outline-[#0f9d58] bg-[#e6f4ea]/5' 
                                : ''
                            }`}
                          >
                            {cell.trim().replace(/^["']|["']$/g, '')}
                            {isFirstCell && (
                              <div className="absolute bottom-[-1.5px] right-[-1.5px] w-1.5 h-1.5 bg-[#0f9d58] border border-white z-10"></div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-1.5 bg-slate-50/10" />
                    </tr>
                  ))
                ) : (
                  [...Array(15)].map((_, rowIndex) => (
                    <tr key={rowIndex} className="divide-x divide-slate-200 border-b border-gray-100">
                      <td className="w-11 text-center bg-f8f9fa border-r border-slate-300 font-bold text-slate-400 sticky left-0 z-10 py-1.5 text-[11px] select-none">
                        {rowIndex + 1}
                      </td>
                      {[...Array(headers.length || 4)].map((__, colIdx) => (
                        <td key={colIdx} className="px-4 py-1.5 text-transparent">Row {rowIndex} col {colIdx}</td>
                      ))}
                      <td className="px-4 py-1.5" />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Sheets tabs bar */}
        <div className="shrink-0 h-9 bg-f8f9fa border-t border-slate-200 flex items-center px-4 justify-between select-none">
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer text-sm font-bold">+</button>
            <button className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer text-xs">☰</button>
            <div className="h-4 w-px bg-slate-300 mx-1"></div>
            <div className="bg-white border-x border-t border-slate-300 px-4 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5 -mb-2 relative z-10 rounded-t-sm shadow-3xs cursor-pointer">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0f9d58]"></span>
              <span>Sheet1</span>
            </div>
            <div className="px-4 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200 rounded-t-sm cursor-pointer">
              <span>Sheet2</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono pr-12">100% Calculated</span>
        </div>
      </div>
    );
  };

  // Google Slides High fidelity mock viewer
  const renderGoogleSlidesSim = () => {
    let title = file.name.replace(/\.[a-zA-Z]+$/, '');
    title = title.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const rowLines = file.content ? file.content.split('\n') : [];
    
    // Parse slides out of markdown tags or numbered points
    const slides: Array<{ title: string; bullets: string[] }> = [];
    let currentSlide: { title: string; bullets: string[] } | null = null;

    rowLines.forEach((line: string) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed.startsWith('##')) {
        if (currentSlide) {
          slides.push(currentSlide);
        }
        currentSlide = {
          title: trimmed.replace(/^[#\s]+/, ''),
          bullets: []
        };
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
        if (!currentSlide) {
          currentSlide = { title: title, bullets: [] };
        }
        currentSlide.bullets.push(trimmed.replace(/^[-*\d.\s]+/, ''));
      } else if (trimmed.length > 5 && !trimmed.toLowerCase().startsWith('author:') && !trimmed.toLowerCase().startsWith('contributors:')) {
        if (!currentSlide) {
          currentSlide = { title: title, bullets: [] };
        }
        currentSlide.bullets.push(trimmed);
      }
    });

    if (currentSlide) {
      slides.push(currentSlide);
    }

    if (slides.length === 0) {
      slides.push({
        title: title,
        bullets: ["Integrated slide deck workspace", "Real-time context presentation", "Synchronized assets with Drive"]
      });
    }

    const activeSlide = slides[activeSlideIndex] || slides[0] || { title: title, bullets: [] };

    if (hideHeader && isPreviewCard) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-[#12141D] to-[#1C1F2E] p-2 flex flex-col justify-between text-left relative overflow-hidden text-white select-none font-sans">
          <div className="flex justify-between items-center w-full min-w-0">
            <span className="text-[8.5px] font-bold text-white tracking-wide truncate pr-1">
              {activeSlide.title || title}
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90 flex items-center justify-center shrink-0">
              <CheckCircle2 size={7} className="text-white" />
            </div>
          </div>
          
          <ul className="space-y-0.5 w-full my-auto pl-0.5 list-none">
            {activeSlide.bullets.slice(0, 3).map((bullet: string, idx: number) => (
              <li key={idx} className="flex items-center gap-1 min-w-0">
                <span className="w-1 h-1 rounded-full bg-[#fbbc05] shrink-0"></span>
                <span className="text-[7.5px] leading-tight text-slate-200 truncate font-normal">{bullet}</span>
              </li>
            ))}
            {activeSlide.bullets.length === 0 && (
              <li className="text-[7.5px] text-slate-400 italic">No notes on slide</li>
            )}
          </ul>

          <div className="flex items-center justify-between w-full pt-1 border-t border-white/10 text-[7px] text-slate-400">
            <span className="truncate">{title}</span>
            <span className="shrink-0 text-amber-300 font-medium">Slide 1</span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-white dark:bg-[#18191B] p-8 flex items-center justify-center relative select-none font-sans">
        {/* Pure Clean Widescreen 16:9 Presentation slide container - NO CHROME AT ALL */}
        <div className="aspect-[16/9] w-full max-w-[880px] bg-white dark:bg-[#1E1F22] rounded-2xl shadow-xl border border-slate-150 dark:border-neutral-800 p-12 flex flex-col justify-center text-left relative overflow-hidden text-neutral-850">
          
          {/* Slide Content */}
          <div className="flex-1 flex flex-col justify-center max-w-[90%]">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight border-none pb-0 mb-6 tracking-tight font-sans text-left" style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}>
              {activeSlide.title}
            </h1>
            
            <ul className="space-y-4 text-sm text-slate-700 dark:text-slate-200 font-sans leading-relaxed text-left list-none pl-2">
              {activeSlide.bullets.map((bullet, idx) => (
                <li key={idx} className="flex gap-3.5 items-start">
                  <span className="w-2 h-2 rounded-full bg-[#fbbc05] shrink-0 mt-2 shadow-xs"></span>
                  <span className="text-[15px] text-slate-700 dark:text-slate-200 leading-normal font-sans font-medium">{bullet}</span>
                </li>
              ))}
              {activeSlide.bullets.length === 0 && (
                <li className="text-sm text-slate-400 italic">No notes or bullets on this slide.</li>
              )}
            </ul>
          </div>

          {/* Clean Overlay Navigation Arrows with NO extra chrome or text */}
          {slides.length > 1 && (
            <div className="absolute inset-y-0 left-3 right-3 flex items-center justify-between pointer-events-none">
              <button
                type="button"
                disabled={activeSlideIndex === 0}
                onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                className="pointer-events-auto p-2 rounded-full bg-slate-100/80 hover:bg-slate-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-200 disabled:opacity-0 transition cursor-pointer border-none shadow-sm"
                aria-label="Previous Slide"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                disabled={activeSlideIndex >= slides.length - 1}
                onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))}
                className="pointer-events-auto p-2 rounded-full bg-slate-100/80 hover:bg-slate-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-200 disabled:opacity-0 transition cursor-pointer border-none shadow-sm"
                aria-label="Next Slide"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmailThreadSim = () => {
    const subject = file.subject || 'No Subject';
    const from = file.from || 'Unknown Sender';
    const snippet = file.snippet || '';
    const date = file.date || 'Recent';

    return (
      <div className="w-full h-full bg-[#F6F8FC] dark:bg-[#0B0B0C] flex flex-col overflow-hidden text-slate-800 dark:text-white font-sans">
        <div className="shrink-0 bg-white dark:bg-[#1E1F22] border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-650 dark:text-blue-450 flex items-center justify-center text-lg shadow-3xs shrink-0">
              ✉️
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white leading-none mb-1">{subject}</h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-sans">Google Mail Thread</p>
            </div>
          </div>
          <span className="text-[10px] text-blue-800 bg-blue-100/65 dark:bg-blue-950/40 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 font-sans">
            Inbox
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-3xl mx-auto bg-white dark:bg-[#1E1F22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-3xs text-left">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 select-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#2B2D31] text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs shadow-3xs shrink-0">
                  {from.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1 font-sans">{from}</h3>
                  <p className="text-[10px] text-slate-400 font-sans">to me</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold font-sans">{date}</span>
            </div>

            <div className="text-xs text-slate-750 dark:text-neutral-350 leading-relaxed space-y-4 whitespace-pre-wrap select-text font-normal font-sans">
              {snippet}
            </div>
          </div>

          <div className="max-w-3xl mx-auto bg-white dark:bg-[#1E1F22] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-3xs flex flex-col gap-3 text-left">
            <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-400 uppercase tracking-wider block font-sans">Draft a Quick Reply</span>
            <textarea 
              placeholder="Type your reply here..." 
              className="w-full h-24 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs leading-normal outline-none focus:border-blue-500/50 bg-transparent text-slate-800 dark:text-white font-sans"
            />
            <div className="flex justify-end gap-2.5 shrink-0 select-none">
              <button 
                onClick={() => alert("Drafting with AI...")}
                className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-[#2B2D31] dark:hover:bg-[#3E4042] dark:border-transparent dark:text-white rounded-xl text-[10px] font-bold cursor-pointer font-sans"
              >
                Draft with Gemini
              </button>
              <button 
                onClick={() => { alert("Reply sent!"); if (onClose) onClose(); }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold cursor-pointer font-sans"
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChatSpaceSim = () => {
    const spaceName = file.spaceName || file.name || 'Chat Space';
    const messages = file.messages || [
      { sender: 'Malik Harold', text: file.content || 'Hi! Let me know if you need help with this layout.', time: 'Recent' }
    ];

    return (
      <div className="w-full h-full bg-[#FAF9F5] dark:bg-[#0B0B0C] flex flex-col overflow-hidden text-slate-800 dark:text-white font-sans">
        <div className="shrink-0 bg-white dark:bg-[#1E1F22] border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-650 dark:text-emerald-450 flex items-center justify-center text-lg shadow-3xs shrink-0">
              💬
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-900 dark:text-white leading-none mb-1">{spaceName}</h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-sans">Google Chat Space</p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-800 bg-emerald-100/60 dark:bg-emerald-950/40 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 font-sans">
            Active
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-start">
          {messages.map((m: any, idx: number) => {
            const isMe = m.sender === 'me';
            return (
              <div key={idx} className={`flex items-start gap-3 max-w-xl text-left ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#2B2D31] text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] shadow-3xs shrink-0 select-none">
                  {m.sender.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className={`flex items-baseline gap-2 select-none ${isMe ? 'justify-end' : ''}`}>
                    <span className="text-[10px] font-bold text-slate-900 dark:text-white font-sans">{m.sender}</span>
                    <span className="text-[8px] text-slate-400 font-sans">{m.time}</span>
                  </div>
                  <div className={`p-3.5 rounded-[18px] text-xs font-normal leading-relaxed select-text ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-[#1E1F22] border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-neutral-300 rounded-tl-none shadow-3xs'
                  }`}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="shrink-0 bg-white dark:bg-[#1E1F22] border-t border-slate-200 dark:border-slate-800 p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3 bg-slate-50 dark:bg-[#2B2D31] border border-slate-200 dark:border-[#3E4042] rounded-full px-4 py-2">
            <input 
              type="text" 
              placeholder={`Message ${spaceName}...`}
              className="flex-1 text-xs bg-transparent border-none outline-none text-slate-800 dark:text-white font-sans"
            />
            <button 
              onClick={() => { alert("Message sent!"); if (onClose) onClose(); }}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[10px] font-bold cursor-pointer font-sans"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (file.type === 'email_thread') {
      return renderEmailThreadSim();
    }
    if (file.type === 'chat_space') {
      return renderChatSpaceSim();
    }

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

    // 1b. Premium Native / High-Fidelity Simulated Editors for Google Workspace files
    if (mode === 'preview') {
      if (isGoogleSlide || isSlide) {
        if (!isPreviewCard) {
          const slideDriveId = driveId || (file.id ? String(file.id).replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, '') : undefined);
          const hasNativeUrl = slideDriveId && isRealDriveId(slideDriveId);
          const nativeSlideUrl = hasNativeUrl 
            ? `https://docs.google.com/presentation/d/${slideDriveId}/preview?rm=minimal` 
            : (file.embedUrl || file.previewUrl || file.url);

          if (nativeSlideUrl) {
            return (
              <div className="w-full h-full bg-white flex flex-col items-center justify-center overflow-hidden relative select-none">
                <iframe 
                  src={nativeSlideUrl}
                  className="w-full h-full border-none bg-white shadow-none"
                  allow="autoplay; fullscreen"
                  title={file.name}
                />
              </div>
            );
          }
        }

        return renderGoogleSlidesSim();
      }
      if (isGoogleDoc) {
        return renderGoogleDocSim();
      }
      if (isGoogleSheet) {
        return renderGoogleSheetSim();
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

    // 4. Spreadsheet View (.csv or similar)
    if (isCsvFile && file.content) {
      const { headers, rows } = parseSpreadsheetContent(file.content);

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

    // 5. Document/Markdown Premium Reader View
    if (isDocFile && file.content && mode === 'preview') {
      const lines = file.content.split('\n');
      let title = file.name.replace(/\.[a-zA-Z]+$/, '');
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
    if (hideHeader) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none pointer-events-none rounded-2xl">
          {renderContent()}
        </div>
      );
    }

    const virtualWidth = 600;
    const virtualHeight = 350;
    const activeWidth = previewDims.width > 0 ? previewDims.width : 240;
    const activeHeight = previewDims.height > 0 ? previewDims.height : 140;
    const scale = activeWidth / virtualWidth;
    const scaledHeight = activeHeight / scale;

    return (
      <div 
        ref={previewRef} 
        className="w-full h-full relative overflow-hidden bg-white select-none pointer-events-none rounded-[20px]"
      >
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
        <div 
          style={{
            width: `${virtualWidth}px`,
            height: `${scaledHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            left: 0,
            top: 0,
            overflow: 'hidden',
          }}
          className="select-none pointer-events-none rounded-[20px]"
        >
          {renderContent()}
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
      {!isDocFile && !isImageFile && !isVideoFile && onClose && (
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
