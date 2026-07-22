import React from 'react';
import { SourceChip } from '../components/Shared/SourceChip';

export const renderTextWithSourceChips = (
  text: string, 
  sources: any[] = [], 
  onOpenSource?: (nameOrId: string) => void
) => {
  if (!text) return null;

  // Regex to match filenames ending in extensions (.gslides, .gdoc, .gsheet, .gform, .csv, .pdf, .html, .doc, .docx, .ppt, .pptx)
  const fileExtensionPattern = /([a-zA-Z0-9_\-&\s']+\.(?:gslides|gdoc|gsheet|gform|csv|pdf|html|doc|docx|ppt|pptx))/gi;

  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fileExtensionPattern.exec(text)) !== null) {
    const matchedStr = match[0];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    const fileName = matchedStr.trim();
    parts.push(
      <SourceChip
        key={`chip-${matchIndex}`}
        href="#"
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          if (onOpenSource) {
            onOpenSource(fileName);
          }
        }}
        sources={sources}
      >
        {fileName}
      </SourceChip>
    );

    lastIndex = matchIndex + matchedStr.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (parts.length === 1 && typeof parts[0] === 'string') {
    return text;
  }

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => (
        typeof part === 'string' ? part : <span key={i} className="inline-block align-middle my-1 ml-1 mr-1">{part}</span>
      ))}
    </span>
  );
};
