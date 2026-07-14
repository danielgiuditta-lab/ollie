import React from 'react';
import { NativeViewer } from './NativeViewer';

interface InferredTaskDiffViewProps {
  file: any;
  theme?: 'light' | 'dark';
}

export const InferredTaskDiffView: React.FC<InferredTaskDiffViewProps> = ({ file, theme = 'light' }) => {
  const isDark = theme === 'dark';

  // Resolve task fields from file object
  const taskTitle = file?.title || file?.draftData?.summary || file?.name || 'Updated problem framing & concise layout';
  const taskDesc = file?.description || file?.originalContent || file?.draftData?.originalContext || 'Simon gave feedback to make the problem framing more concise.';
  
  const driveFilesList: any[] = (window as any).__DRIVE_FILES__ || [];
  const matchedInDrive = driveFilesList.find((f: any) => {
    if (!f || !f.name) return false;
    const fId = String(f.id || f.driveId || '').toLowerCase();
    const fNameClean = f.name.toLowerCase().replace(/\.[^/.]+$/, '').trim();
    const checkTerms = [file?.sourceName, file?.driveId, file?.fileId, file?.id, file?.title, file?.description]
      .filter(Boolean)
      .map((s: string) => String(s).toLowerCase());

    return checkTerms.some(term => 
      (fId && fId.length > 5 && term.includes(fId)) || 
      (fNameClean && fNameClean.length > 2 && (term.includes(fNameClean) || fNameClean.includes(term)))
    );
  });

  const baseFile = matchedInDrive || file?.filesToLoad?.[0] || file;

  const mimeLower = String(file?.sourceMimeType || baseFile?.mimeType || '').toLowerCase();
  const nameLower = String(file?.sourceName || baseFile?.name || file?.title || '').toLowerCase();
  const typeLower = String(file?.type || file?.taskType || baseFile?.type || baseFile?.taskType || '').toLowerCase();

  const isSlideItem = Boolean(
    typeLower === 'slide' ||
    mimeLower.includes('presentation') ||
    mimeLower.includes('slide') ||
    nameLower.endsWith('.gslides') ||
    nameLower.endsWith('.pptx') ||
    nameLower.includes('drive refresh') ||
    nameLower.includes('presentation') ||
    nameLower.includes('slide') ||
    nameLower.includes('deck') ||
    nameLower.includes('new drive')
  );

  const isSheetItem = Boolean(
    !isSlideItem && (
      typeLower === 'sheet' ||
      typeLower === 'spreadsheet' ||
      mimeLower.includes('spreadsheet') ||
      mimeLower.includes('csv') ||
      nameLower.endsWith('.csv') ||
      nameLower.endsWith('.gsheet')
    )
  );

  const resolvedMime = isSlideItem 
    ? 'application/vnd.google-apps.presentation' 
    : (isSheetItem ? 'application/vnd.google-apps.spreadsheet' : (baseFile?.mimeType || 'application/vnd.google-apps.document'));

  // Construct Original file representation
  const originalFile = {
    ...(baseFile || {}),
    id: (baseFile?.id || file?.id || 'orig') + '-original-view',
    type: isSlideItem ? 'slide' : (isSheetItem ? 'sheet' : 'doc'),
    taskType: isSlideItem ? 'slide' : (isSheetItem ? 'sheet' : 'doc'),
    mimeType: resolvedMime,
    name: isSlideItem ? 'Drive Refresh: Original' : 'Original Document',
    content: baseFile?.content || `# Original Version\n\n${taskDesc}\n\nExisting section text before feedback incorporated.`
  };

  // Construct Proposal file representation
  const proposalFile = {
    ...(baseFile || {}),
    id: (baseFile?.id || file?.id || 'prop') + '-proposal-view',
    type: isSlideItem ? 'slide' : (isSheetItem ? 'sheet' : 'doc'),
    taskType: isSlideItem ? 'slide' : (isSheetItem ? 'sheet' : 'doc'),
    mimeType: resolvedMime,
    name: isSlideItem ? 'Drive Refresh: Proposal' : 'Proposed Document Update',
    content: file?.content || file?.draftData?.draftContent || `# Proposed Update\n\n${taskTitle}\n\nRefined problem framing with concise language applied.`
  };

  const col1Description = taskDesc.includes('Simon') ? taskDesc : 'Simon gave feedback to make the problem framing more concise.';
  const col2Description = taskTitle.includes('concise') ? taskTitle : 'I made the language more concise in the problem framing section.';

  return (
    <div className={`w-full h-full flex flex-col items-center justify-start p-4 overflow-y-auto transition-colors duration-300 ${
      isDark ? 'bg-[#18191B] text-white' : 'bg-white text-slate-800'
    }`}>
      {/* Centered container with 16px gap and 16px padding */}
      <div className="w-full max-w-[1080px] grid grid-cols-2 gap-4 items-start py-4">
        
        {/* Column 1: Original */}
        <div className="flex flex-col min-w-0">
          {/* Header Title: Google Sans Light 22/28 */}
          <h2 
            className={`font-['Google_Sans_Light','Google_Sans','Inter',sans-serif] text-[22px] leading-[28px] font-light mb-4 truncate ${
              isDark ? 'text-white' : 'text-[#1B1C1D]'
            }`}
          >
            Original
          </h2>

          {/* Artifact Container: 16px top & bottom margin padding surround */}
          <div className={`w-full aspect-[16/10] rounded-[24px] overflow-hidden border shadow-sm mb-4 relative select-none ${
            isDark ? 'border-[#3E4042] bg-[#282A2D]' : 'border-slate-200/80 bg-white'
          }`}>
            <NativeViewer 
              file={originalFile} 
              isPreviewCard={true} 
              hideHeader={true} 
              theme={theme}
            />
          </div>

          {/* Description: Google Sans Text Medium 16/24 */}
          <p 
            className={`font-['Google_Sans_Text','Inter',sans-serif] text-[16px] leading-[24px] font-medium ${
              isDark ? 'text-neutral-300' : 'text-[#3C4043]'
            }`}
          >
            {col1Description}
          </p>
        </div>

        {/* Column 2: Proposal */}
        <div className="flex flex-col min-w-0">
          {/* Header Title: Google Sans Light 22/28 */}
          <h2 
            className={`font-['Google_Sans_Light','Google_Sans','Inter',sans-serif] text-[22px] leading-[28px] font-light mb-4 truncate ${
              isDark ? 'text-white' : 'text-[#1B1C1D]'
            }`}
          >
            Proposal
          </h2>

          {/* Artifact Container: 16px top & bottom margin padding surround */}
          <div className={`w-full aspect-[16/10] rounded-[24px] overflow-hidden border shadow-sm mb-4 relative select-none ${
            isDark ? 'border-[#3E4042] bg-[#282A2D]' : 'border-slate-200/80 bg-white'
          }`}>
            <NativeViewer 
              file={proposalFile} 
              isPreviewCard={true} 
              hideHeader={true} 
              theme={theme}
            />
          </div>

          {/* Description: Google Sans Text Medium 16/24 */}
          <p 
            className={`font-['Google_Sans_Text','Inter',sans-serif] text-[16px] leading-[24px] font-medium ${
              isDark ? 'text-neutral-300' : 'text-[#3C4043]'
            }`}
          >
            {col2Description}
          </p>
        </div>

      </div>
    </div>
  );
};
