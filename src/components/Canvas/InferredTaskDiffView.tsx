import React from 'react';

interface InferredTaskDiffViewProps {
  file: any;
  theme?: 'light' | 'dark';
}

const GoogleDriveLogo = () => (
  <svg width="110" height="96" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm select-none pointer-events-none">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a8.9 8.9 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.85-3.2 7.4-12.8c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.15z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.4-.8-2.95-1.2-4.5-1.2h-18.5c-1.55 0-3.1.4-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53-16.15-28-16.15 28h32.3z" fill="#2684fc"/>
    <path d="m73.55 76.8 13.75-23.8c.8-1.4 1.2-2.95 1.2-4.501h-27.5l12.55 28.301z" fill="#ffba00"/>
  </svg>
);

const DriveArtifactCard = ({ 
  title = "New Drive", 
  subtext = "Drive", 
  isDark = false,
  content = []
}: { 
  title?: string; 
  subtext?: string; 
  isDark?: boolean;
  content?: string[];
}) => {
  return (
    <div className={`w-full aspect-[16/10] rounded-[24px] border shadow-sm p-8 flex flex-col justify-between relative overflow-hidden select-none transition-all duration-300 ${
      isDark ? 'border-[#3E4042] bg-[#282A2D] text-white' : 'border-slate-200/80 bg-white text-slate-800'
    }`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col justify-center min-w-0 pr-4">
          <span className={`text-[12px] font-medium tracking-wide ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            {subtext}
          </span>
          <h3 className={`text-[28px] sm:text-[32px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1F1F1F]'} truncate`}>
            {title}
          </h3>
        </div>
        <div className="shrink-0 flex items-center justify-center p-2">
          <GoogleDriveLogo />
        </div>
      </div>

      {content && content.length > 0 && (
        <div className="my-auto space-y-2 text-sm sm:text-base leading-relaxed font-sans font-medium">
          {content.map((bullet, idx) => (
            <p key={idx} className={isDark ? 'text-neutral-200' : 'text-slate-700'}>
              {bullet}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export const InferredTaskDiffView: React.FC<InferredTaskDiffViewProps> = ({ file, theme = 'light' }) => {
  const isDark = theme === 'dark';

  const rawTitle = file?.title || file?.name || file?.sourceName || 'New Drive';
  const cleanTitle = rawTitle.replace(/\.[^/.]+$/, "").replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, "").trim() || "New Drive";

  const col1Description = file?.originalContext || file?.draftData?.originalContext || file?.description || 'Simon gave feedback to make the problem framing more concise.';
  const col2Description = file?.summaryOfChanges || file?.draftData?.summaryOfChanges || file?.descriptionDone || 'I made the language more concise in the problem framing section.';

  const col1Content = file?.originalContentLines || file?.task?.originalContentLines || file?.originalSlide?.content;
  const col2Content = file?.updatedContentLines || file?.task?.updatedContentLines || file?.updatedSlide?.content;

  return (
    <div className={`w-full h-full flex flex-col items-stretch justify-start p-4 sm:p-6 overflow-y-auto transition-colors duration-300 ${
      isDark ? 'bg-[#18191B] text-white' : 'bg-white text-slate-800'
    }`}>
      {/* Full-width container with 16px gap and padding filling available canvas */}
      <div className="w-full grid grid-cols-2 gap-4 sm:gap-6 items-start py-4">
        
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
          <div className="mb-4">
            <DriveArtifactCard title={cleanTitle || "New Drive"} subtext="Drive" isDark={isDark} content={col1Content} />
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

        {/* Column 2: Suggested Update */}
        <div className="flex flex-col min-w-0">
          {/* Header Title: Google Sans Light 22/28 */}
          <h2 
            className={`font-['Google_Sans_Light','Google_Sans','Inter',sans-serif] text-[22px] leading-[28px] font-light mb-4 truncate ${
              isDark ? 'text-white' : 'text-[#1B1C1D]'
            }`}
          >
            Suggested Update
          </h2>

          {/* Artifact Container: 16px top & bottom margin padding surround */}
          <div className="mb-4">
            <DriveArtifactCard title={cleanTitle || "New Drive"} subtext="Drive" isDark={isDark} content={col2Content} />
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
