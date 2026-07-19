import React from 'react';
import { X } from 'lucide-react';
import docsIcon from '../../assets/docs.png';
import sheetsIcon from '../../assets/sheets.png';
import slidesIcon from '../../assets/slides.png';
import formsIcon from '../../assets/forms.png';
import htmlIcon from '../../assets/html.png';
import imageIcon from '../../assets/image.png';
import videoIcon from '../../assets/video.png';
import commentsIcon from '../../assets/comments.svg';

interface SourceChipProps {
  href: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  sources?: any[];
}

export const getChipIcon = (fileName?: string, mimeType?: string) => {
  const nameLower = (fileName || '').toLowerCase();
  const mType = (mimeType || '').toLowerCase();
  
  if (
    mType.includes('mail') || 
    mType.includes('gmail') || 
    mType.includes('email') || 
    mType.includes('chat') ||
    nameLower.includes('gmail') || 
    nameLower.includes('email') || 
    nameLower.includes('mail') || 
    nameLower.includes('rsvp') ||
    nameLower.includes('thread')
  ) {
    return commentsIcon;
  }
  if (nameLower.endsWith('.html') || nameLower === 'index.html' || mType.includes('html') || mType.includes('site')) {
    return htmlIcon;
  }
  if (nameLower.endsWith('.mp4') || nameLower.endsWith('.mov') || nameLower.endsWith('.webm') || mType.includes('video')) {
    return videoIcon;
  }
  if (mType.includes('image') || nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.gif')) {
    return imageIcon;
  }
  if (
    nameLower.endsWith('.csv') || 
    nameLower.endsWith('.xls') || 
    nameLower.endsWith('.xlsx') || 
    nameLower.endsWith('.gsheet') ||
    mType.includes('spreadsheet') ||
    mType.includes('sheet') ||
    nameLower.includes('data') || 
    nameLower === 'suppliers' || 
    nameLower === 'fulfillment centers' ||
    nameLower === 'supply chain analysis' ||
    nameLower.includes('budget')
  ) {
    return sheetsIcon;
  }
  if (
    nameLower.endsWith('.ppt') || 
    nameLower.endsWith('.pptx') || 
    nameLower.endsWith('.gslides') ||
    mType.includes('presentation') ||
    mType.includes('slide') ||
    (nameLower.includes('proposal') && nameLower.includes('logistics')) ||
    nameLower.includes('slide') ||
    nameLower.includes('pitch') ||
    nameLower.includes('keynote') ||
    nameLower.includes('deck')
  ) {
    return slidesIcon;
  }
  if (nameLower.includes('form') || mType.includes('form')) {
    return formsIcon;
  }
  return docsIcon;
};

export function SourceChip({ href, children, onClick, sources = [] }: SourceChipProps) {
  let fileId = '';
  try {
    const urlObj = new URL(href);
    fileId = urlObj.searchParams.get('id') || '';
  } catch (e) {}

  const matched = sources.find(s => s.id === fileId || s.driveId === fileId);

  let textStr = typeof children === 'string' ? children : (Array.isArray(children) ? children.map(c => typeof c === 'string' ? c : '').join('') : '');
  textStr = textStr.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}📄\s]+/gu, '').trim();
  if (!textStr && matched) textStr = matched.name;

  const iconSrc = getChipIcon(matched?.name || textStr, matched?.mimeType);

  return (
    <a
      href={href}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 bg-[#F0F4F9] hover:bg-[#D3E3FD] dark:bg-[#2B2D31] dark:hover:bg-[#3E4042] text-slate-700 dark:text-[#E3E3E3] text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer border border-[#E9EEF6] dark:border-neutral-700 mx-1 select-none decoration-transparent shrink-0"
    >
      <img src={iconSrc} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
      <span>{textStr || children}</span>
    </a>
  );
}

interface ContextChipProps {
  name: string;
  mimeType?: string;
  type?: 'file' | 'person';
  onRemove?: () => void;
}

export function ContextChip({ name, mimeType, type = 'file', onRemove }: ContextChipProps) {
  const iconSrc = getChipIcon(name, mimeType);
  const displayName = (name || '').trim().split(/\s+/)[0] || name;
  return (
    <div className="inline-flex items-center gap-1.5 bg-[#F0F4F9] hover:bg-[#D3E3FD] dark:bg-[#2B2D31] dark:hover:bg-[#3E4042] text-slate-700 dark:text-[#E3E3E3] text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer border border-[#E9EEF6] dark:border-neutral-700 mr-2 my-1 select-none shrink-0">
      {type === 'person' ? (
        <div className="w-3.5 h-3.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 flex items-center justify-center text-[9px] font-bold shrink-0">
          {name.charAt(0)}
        </div>
      ) : (
        <img src={iconSrc} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
      )}
      <span className="truncate">{displayName}</span>
      {onRemove && (
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-red-500 transition ml-0.5 flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 dark:text-gray-400 shrink-0"
          title="Remove context"
        >
          <X size={14} className="stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
