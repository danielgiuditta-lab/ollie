import React from 'react';
import docsIcon from '../../assets/docs.png';
import sheetsIcon from '../../assets/sheets.png';
import slidesIcon from '../../assets/slides.png';
import formsIcon from '../../assets/forms.png';
import htmlIcon from '../../assets/html.png';
import imageIcon from '../../assets/image.png';
import videoIcon from '../../assets/video.png';
import commentsIcon from '../../assets/comments.svg';
import chatIcon from '../../assets/chat.png';
import gmailIcon from '../../assets/gmail.png';

interface FileIconProps {
  fileName?: string;
  mimeType?: string;
  size?: number;
  className?: string;
}

export function getFileIcon(fileName: string = '', mimeType?: string, size: number = 18) {
  const nameLower = fileName.toLowerCase();
  const mimeLower = (mimeType || '').toLowerCase();
  
  if (mimeLower.includes('folder')) {
    return (
      <span 
        className="material-symbols-rounded select-none text-[#444746] dark:text-[#C4C7C5] shrink-0 inline-flex items-center justify-center" 
        style={{ fontSize: `${size}px`, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
      >
        folder
      </span>
    );
  }

  // Chat
  if (
    mimeLower.includes('chat') ||
    mimeLower.includes('message') ||
    nameLower.includes('chat') ||
    nameLower.includes('message') ||
    nameLower.includes('space chat')
  ) {
    return <img src={chatIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="chat icon" referrerPolicy="no-referrer" />;
  }

  // Gmail / Email / Mail / Gemail
  if (
    mimeLower.includes('mail') ||
    mimeLower.includes('gmail') ||
    mimeLower.includes('email') ||
    nameLower.includes('gmail') ||
    nameLower.includes('gemail') ||
    nameLower.includes('email') ||
    nameLower.includes('mail') ||
    nameLower.includes('rsvp') ||
    nameLower.includes('thread')
  ) {
    return <img src={gmailIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="mail icon" referrerPolicy="no-referrer" />;
  }

  // HTML / Sites / Kanban
  if (
    nameLower.endsWith('.html') || nameLower === 'index.html' || nameLower.endsWith('/index.html') || nameLower.includes('custom tool') || nameLower.includes('kanban') || mimeLower.includes('site') || mimeLower.includes('html')
  ) {
    return <img src={htmlIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="site icon" referrerPolicy="no-referrer" />;
  }

  // Slides / Presentation
  if (
    nameLower.endsWith('.ppt') || 
    nameLower.endsWith('.pptx') || 
    nameLower.endsWith('.gslides') ||
    mimeLower.includes('presentation') ||
    mimeLower.includes('slide') ||
    (nameLower.includes('proposal') && nameLower.includes('logistics')) ||
    nameLower.includes('slide') ||
    nameLower.includes('pitch') ||
    nameLower.includes('keynote') ||
    nameLower.includes('deck')
  ) {
    return <img src={slidesIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="slides icon" referrerPolicy="no-referrer" />;
  }

  // Sheets / Spreadsheet
  if (
    nameLower.endsWith('.csv') || 
    nameLower.endsWith('.xls') || 
    nameLower.endsWith('.xlsx') || 
    nameLower.endsWith('.gsheet') ||
    mimeLower.includes('spreadsheet') ||
    mimeLower.includes('sheet') ||
    mimeLower.includes('excel') ||
    nameLower.includes('data') || 
    nameLower === 'suppliers' || 
    nameLower === 'fulfillment centers' ||
    nameLower === 'supply chain analysis' ||
    nameLower.includes('budget')
  ) {
    return <img src={sheetsIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="sheets icon" referrerPolicy="no-referrer" />;
  }

  // Forms / Tasks / Roadmap
  if (
    nameLower.includes('form') ||
    mimeLower.includes('form') ||
    nameLower.includes('inferred') ||
    nameLower.includes('to do') ||
    nameLower.includes('roadmap') ||
    mimeLower.includes('inferred')
  ) {
    return <img src={formsIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="forms icon" referrerPolicy="no-referrer" />;
  }

  // Docs / Text / PDF / Markdown / Essay
  if (
    nameLower.endsWith('.pdf') ||
    nameLower.endsWith('.md') || 
    nameLower.endsWith('.markdown') ||
    nameLower.endsWith('.gdoc') ||
    nameLower.endsWith('.doc') || 
    nameLower.endsWith('.docx') || 
    nameLower.endsWith('.txt') || 
    mimeLower.includes('document') || 
    mimeLower.includes('pdf') ||
    nameLower.includes('essay') ||
    nameLower.includes('proposal') ||
    nameLower.includes('brief')
  ) {
    return <img src={docsIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="doc icon" referrerPolicy="no-referrer" />;
  }

  // Video
  if (
    nameLower.endsWith('.mov') || 
    nameLower.endsWith('.mp4') || 
    nameLower.endsWith('.webm') || 
    nameLower.endsWith('.avi') || 
    nameLower.endsWith('.mkv') || 
    mimeLower.includes('video')
  ) {
    return <img src={videoIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="video icon" referrerPolicy="no-referrer" />;
  }

  // Image
  if (
    nameLower.endsWith('.png') || 
    nameLower.endsWith('.jpg') || 
    nameLower.endsWith('.jpeg') || 
    nameLower.endsWith('.gif') || 
    nameLower.endsWith('.svg') || 
    nameLower.endsWith('.webp') || 
    mimeLower.includes('image')
  ) {
    return <img src={imageIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="image icon" referrerPolicy="no-referrer" />;
  }
  
  return <img src={docsIcon} className="w-4.5 h-4.5 object-contain select-none shrink-0" alt="file icon" referrerPolicy="no-referrer" />;
}

export function FileIcon({ fileName, mimeType, size = 18 }: FileIconProps) {
  return getFileIcon(fileName, mimeType, size);
}

