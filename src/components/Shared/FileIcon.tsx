import React from 'react';
import docsIcon from '../../assets/docs.png';
import sheetsIcon from '../../assets/sheets.png';
import slidesIcon from '../../assets/slides.png';
import formsIcon from '../../assets/forms.png';
import htmlIcon from '../../assets/html.png';
import imageIcon from '../../assets/image.png';
import videoIcon from '../../assets/video.png';

interface FileIconProps {
  fileName?: string;
  mimeType?: string;
  size?: number;
  className?: string;
}

export function getFileIcon(fileName: string = '', mimeType?: string, size: number = 18) {
  const nameLower = fileName.toLowerCase();
  
  if (mimeType && mimeType.includes('folder')) {
    return (
      <span 
        className="material-symbols-rounded select-none text-[#444746] dark:text-[#C4C7C5] shrink-0 inline-flex items-center justify-center" 
        style={{ fontSize: `${size}px`, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
      >
        folder
      </span>
    );
  }

  if (
    nameLower.endsWith('.html') || nameLower === 'index.html' || nameLower.endsWith('/index.html') || nameLower.includes('custom tool') || nameLower.includes('kanban') || (mimeType && mimeType.includes('site'))
  ) {
    return <img src={htmlIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="site icon" referrerPolicy="no-referrer" />;
  }

  if (
    nameLower.includes('inferred') ||
    nameLower.includes('task') ||
    nameLower.includes('to do') ||
    nameLower.includes('roadmap') ||
    (mimeType && mimeType.includes('inferred'))
  ) {
    return <img src={formsIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="task icon" referrerPolicy="no-referrer" />;
  }
  
  if (
    nameLower.endsWith('.pdf') ||
    nameLower.endsWith('.md') || 
    nameLower.endsWith('.markdown') ||
    (nameLower.includes('proposal') && !nameLower.includes('logistics') && !nameLower.includes('presentation')) || 
    nameLower.endsWith('.doc') || 
    nameLower.endsWith('.docx') || 
    nameLower.endsWith('.txt') || 
    (mimeType && (mimeType.includes('document') || mimeType.includes('pdf')))
  ) {
    return <img src={docsIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="doc icon" referrerPolicy="no-referrer" />;
  }

  if (
    nameLower.endsWith('.mov') || 
    nameLower.endsWith('.mp4') || 
    nameLower.endsWith('.webm') || 
    nameLower.endsWith('.avi') || 
    nameLower.endsWith('.mkv') || 
    (mimeType && mimeType.includes('video'))
  ) {
    return <img src={videoIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="video icon" referrerPolicy="no-referrer" />;
  }
  
  if (
    nameLower.endsWith('.csv') || 
    nameLower.endsWith('.xls') || 
    nameLower.endsWith('.xlsx') || 
    (mimeType && mimeType.includes('spreadsheet')) ||
    nameLower.includes('data') || 
    nameLower === 'suppliers' || 
    nameLower === 'fulfillment centers' ||
    nameLower === 'supply chain analysis'
  ) {
    return <img src={sheetsIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="sheets icon" referrerPolicy="no-referrer" />;
  }
  
  if (
    nameLower.endsWith('.ppt') || 
    nameLower.endsWith('.pptx') || 
    (mimeType && mimeType.includes('presentation')) ||
    (nameLower.includes('proposal') && nameLower.includes('logistics')) ||
    nameLower.includes('slide') ||
    nameLower.includes('pitch')
  ) {
    return <img src={slidesIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="slides icon" referrerPolicy="no-referrer" />;
  }

  if (
    nameLower.includes('form') ||
    (mimeType && mimeType.includes('form'))
  ) {
    return <img src={formsIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="forms icon" referrerPolicy="no-referrer" />;
  }

  if (
    nameLower.endsWith('.png') || 
    nameLower.endsWith('.jpg') || 
    nameLower.endsWith('.jpeg') || 
    nameLower.endsWith('.gif') || 
    nameLower.endsWith('.svg') || 
    nameLower.endsWith('.webp') || 
    (mimeType && mimeType.includes('image'))
  ) {
    return <img src={imageIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="image icon" referrerPolicy="no-referrer" />;
  }
  
  return <img src={docsIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="file icon" referrerPolicy="no-referrer" />;
}

export function FileIcon({ fileName, mimeType, size = 18 }: FileIconProps) {
  return getFileIcon(fileName, mimeType, size);
}

