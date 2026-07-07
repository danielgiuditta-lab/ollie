import React, { useState } from 'react';
import { NativeViewer } from './NativeViewer';
import { ContextMenu } from '../Shared/ContextMenu';

import docsIcon from '../../assets/docs.png';
import sheetsIcon from '../../assets/sheets.png';
import slidesIcon from '../../assets/slides.png';
import formsIcon from '../../assets/forms.png';
import htmlIcon from '../../assets/html.png';
import imageIcon from '../../assets/image.png';
import videoIcon from '../../assets/video.png';

export interface CoverSlideItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  previewType?: 'marketing' | 'sales' | 'pricing' | 'ads' | 'branding' | 'support' | 'doc-proposal' | 'operations' | 'roadmap' | 'feedback' | 'legal' | 'investor' | 'engineering' | 'finance' | 'hr' | 'social';
  filesToLoad?: any[]; // optional, list of files inside this simulated workspace
  isReal?: boolean;
  realChildren?: Array<{ id: string; name: string; mimeType: string }>;
  realDocText?: string;
  realDocAuthor?: string;
  size?: string;
  modifiedTime?: string;
  owners?: any[];
}

interface CoverSlideProps {
  item: CoverSlideItem;
  onClick?: () => void;
  onRemove?: (item: CoverSlideItem) => void;
  sandboxUrl?: string;
  key?: string;
}

export function CoverSlide({ item, onClick, onRemove, sandboxUrl }: CoverSlideProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  // Helper to determine the leader icon based on item type and mimetype
  const renderIcon = () => {
    if (item.type === 'folder') {
      return (
        <span 
          className="material-symbols-rounded select-none text-[#444746] dark:text-[#C4C7C5] shrink-0 inline-flex items-center justify-center" 
          style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
        >
          folder
        </span>
      );
    }

    const mime = item.mimeType ? item.mimeType.toLowerCase() : '';
    let src = docsIcon;
    if (mime.includes('video') || mime.includes('mp4') || mime.includes('mov')) {
      src = videoIcon;
    } else if (mime.includes('sheet') || mime.includes('spreadsheet') || mime.includes('csv')) {
      src = sheetsIcon;
    } else if (mime.includes('presentation') || mime.includes('slide')) {
      src = slidesIcon;
    } else if (mime.includes('form')) {
      src = formsIcon;
    } else if (mime.includes('html')) {
      src = htmlIcon;
    } else if (mime.includes('image') || mime.includes('png') || mime.includes('jpg') || mime.includes('jpeg') || mime.includes('gif')) {
      src = imageIcon;
    } else if (mime.includes('pdf') || mime.includes('document') || mime.includes('word')) {
      src = docsIcon;
    }

    return (
      <img 
        src={src} 
        alt="file icon" 
        className="shrink-0 object-contain" 
        style={{ width: '24px', height: '24px' }} 
      />
    );
  };

  // Helper to render the customized premium nested preview inside each 3:4 card
  const renderInnerPreview = () => {
    const getFileIconLocal = (mimeType?: string) => {
      if (!mimeType) return docsIcon;
      const mime = mimeType.toLowerCase();
      if (mime.includes('sheet') || mime.includes('spreadsheet') || mime.includes('csv')) {
        return sheetsIcon;
      } else if (mime.includes('presentation') || mime.includes('slide')) {
        return slidesIcon;
      } else if (mime.includes('form')) {
        return formsIcon;
      } else if (mime.includes('html')) {
        return htmlIcon;
      } else if (mime.includes('image') || mime.includes('png') || mime.includes('jpg')) {
        return imageIcon;
      }
      return docsIcon;
    };

    if (item.isReal) {
      if (item.type === 'folder') {
        const children = item.realChildren || [];
        const files = item.filesToLoad || [];

        const getBestFolderChild = (filesList: any[]) => {
          if (!filesList || filesList.length === 0) return null;

          const isHtmlFile = (f: any) => {
            const nameLower = (f.name || '').toLowerCase();
            const mimeLower = (f.mimeType || '').toLowerCase();
            return nameLower.endsWith('.html') || nameLower.endsWith('.htm') || mimeLower.includes('html');
          };

          const isImgFile = (f: any) => {
            const nameLower = (f.name || '').toLowerCase();
            const mimeLower = (f.mimeType || '').toLowerCase();
            return (
              mimeLower.startsWith('image/') || 
              mimeLower.includes('image') || 
              mimeLower.includes('png') || 
              mimeLower.includes('jpg') || 
              mimeLower.includes('jpeg') ||
              nameLower.endsWith('.png') || 
              nameLower.endsWith('.jpg') || 
              nameLower.endsWith('.jpeg') || 
              nameLower.endsWith('.gif') || 
              nameLower.endsWith('.svg')
            );
          };

          const isDocOrSlideFile = (f: any) => {
            const nameLower = (f.name || '').toLowerCase();
            const mimeLower = (f.mimeType || '').toLowerCase();
            const isGoogleDoc = mimeLower.includes('vnd.google-apps.document') ||
              mimeLower.includes('officedocument.wordprocessingml') ||
              mimeLower.includes('msword') ||
              mimeLower.includes('gdoc') ||
              mimeLower.includes('document') ||
              nameLower.endsWith('.gdoc') ||
              nameLower.endsWith('.docx') ||
              nameLower.endsWith('.doc') ||
              nameLower.includes('proposal') ||
              nameLower.includes('report') ||
              nameLower.includes('contract');
            
            const isGoogleSlide = mimeLower.includes('vnd.google-apps.presentation') ||
              mimeLower.includes('officedocument.presentationml') ||
              mimeLower.includes('ms-powerpoint') ||
              mimeLower.includes('slides') ||
              mimeLower.includes('presentation') ||
              nameLower.endsWith('.gslides') ||
              nameLower.endsWith('.pptx') ||
              nameLower.endsWith('.ppt') ||
              nameLower.includes('deck') ||
              nameLower.includes('pitch') ||
              nameLower.includes('slides');

            return isGoogleDoc || isGoogleSlide;
          };

          const isSheetFile = (f: any) => {
            const nameLower = (f.name || '').toLowerCase();
            const mimeLower = (f.mimeType || '').toLowerCase();
            return mimeLower.includes('vnd.google-apps.spreadsheet') ||
              mimeLower.includes('officedocument.spreadsheetml') ||
              mimeLower.includes('ms-excel') ||
              mimeLower.includes('sheet') ||
              mimeLower.includes('csv') ||
              nameLower.endsWith('.gsheet') ||
              nameLower.endsWith('.xlsx') ||
              nameLower.endsWith('.xls') ||
              nameLower.endsWith('.csv') ||
              nameLower.includes('spend') ||
              nameLower.includes('analysis') ||
              nameLower.includes('breakdown') ||
              nameLower.includes('inventory');
          };

          // 1. html
          const html = filesList.find(isHtmlFile);
          if (html) return html;

          // 2. image
          const img = filesList.find(isImgFile);
          if (img) return img;

          // 3. doc, slide
          const docSlide = filesList.find(isDocOrSlideFile);
          if (docSlide) return docSlide;

          // 4. sheet
          const sheet = filesList.find(isSheetFile);
          if (sheet) return sheet;

          return filesList[0];
        };

        const bestChild = getBestFolderChild(files);

        if (bestChild) {
          return (
            <div className="w-full h-full overflow-hidden rounded-[20px] bg-white select-none pointer-events-none relative border border-[#E9EEF6] shadow-3xs">
              <NativeViewer file={bestChild} mode="preview" hideHeader={true} isPreviewCard={true} sandboxUrl={sandboxUrl} />
            </div>
          );
        }

        return (
          <div className="w-full h-full bg-[#EAEAEA]/25 hover:bg-[#EAEAEA]/40 transition-colors duration-200 rounded-[20px] p-4 flex flex-col gap-1.5 overflow-hidden select-none text-left border border-slate-100">
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5 block">
              Contents ({children.length})
            </span>
            <div className="flex flex-col gap-1 overflow-hidden flex-1">
              {children.length > 0 ? (
                <>
                  {children.slice(0, 3).map((child, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-xl border border-slate-100 shadow-3xs shrink-0 min-w-0">
                      <img src={getFileIconLocal(child.mimeType)} className="w-3.5 h-3.5 object-contain shrink-0" alt="" />
                      <span className="text-[11px] font-medium text-slate-700 truncate flex-1">{child.name}</span>
                    </div>
                  ))}
                  {children.length > 3 && (
                    <span className="text-[9px] text-slate-400 font-medium italic pl-1 block mt-0.5">
                      + {children.length - 3} more files
                    </span>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-xl py-3 text-slate-400 text-[10px]">
                  Empty folder
                </div>
              )}
            </div>
          </div>
        );
      } else {
        // Real Google Drive File - render standard native previews directly using NativeViewer
        const fileObj = item.filesToLoad?.[0] || {
          id: item.id,
          name: item.name,
          content: item.realDocText,
          driveId: item.id,
          mimeType: item.mimeType
        };

        return (
          <div className="w-full h-full overflow-hidden rounded-[20px] bg-white select-none pointer-events-none relative">
            <NativeViewer file={fileObj} mode="preview" hideHeader={true} isPreviewCard={true} />
          </div>
        );
      }
    }

    switch (item.previewType) {
      case 'marketing':
        return (
          <div className="w-full h-full bg-[#EAEAEA]/40 hover:bg-[#EAEAEA]/60 transition-colors duration-200 rounded-[20px] p-4 flex gap-2 overflow-hidden items-end select-none">
            {/* Box 1 */}
            <div className="flex-1 h-[90%] bg-[#FCDBDB] rounded-[14px] p-2 flex flex-col justify-between border border-white/20 shadow-xs relative">
              <span className="text-[7px] font-sans text-neutral-800 tracking-tight leading-3 font-semibold text-center select-none">ecopaws</span>
              <div className="flex-1 flex flex-col items-center justify-center -mt-1 scale-90">
                <div className="w-10 h-10 rounded-full border border-red-200/50 flex items-center justify-center bg-[#D23D3D] shadow-sm text-center font-bold text-white text-[6px]">
                  🐶
                </div>
              </div>
              <span className="text-[10px] sm:text-[7px] text-red-900 font-bold leading-tight tracking-tight text-center">Bon appétit, pup.</span>
            </div>
            {/* Box 2 */}
            <div className="flex-1 h-[90%] bg-[#DFF1FD] rounded-[14px] p-2 flex flex-col justify-between border border-white/20 shadow-xs relative">
              <span className="text-[7px] font-sans text-neutral-800 tracking-tight leading-3 font-semibold text-center">ecopaws</span>
              <div className="flex-1 flex flex-col items-center justify-center -mt-1 scale-90">
                <div className="w-10 h-10 rounded-xl bg-sky-200 border border-sky-300 flex items-center justify-center shadow-xs">
                  🐈
                </div>
              </div>
              <span className="text-[10px] sm:text-[7px] text-sky-900 font-bold leading-tight tracking-tight text-center">Playtime, elevated.</span>
            </div>
            {/* Box 3 */}
            <div className="flex-1 h-[90%] bg-white rounded-[14px] p-2 flex flex-col justify-between border border-gray-100 shadow-xs relative">
              <span className="text-[7px] font-sans text-neutral-800 tracking-tight leading-3 font-semibold text-center">ecopaws</span>
              <div className="flex-1 flex flex-col items-center justify-center gap-1 scale-[0.8]">
                <div className="flex items-center gap-0.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                </div>
                <div className="flex items-center gap-0.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                </div>
              </div>
              <span className="text-[10px] sm:text-[7px] text-slate-800 font-bold leading-tight tracking-tight text-center">Playtime, elevated.</span>
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="w-full h-full bg-[#E4ECFA]/40 hover:bg-[#E4ECFA]/60 transition-colors duration-200 rounded-[20px] p-5 flex flex-col justify-between overflow-hidden select-none">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">$32,550</span>
                <span className="block text-[11px] font-semibold text-blue-700 tracking-tight">Active Inflow</span>
              </div>
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-100">
                <span>📈 24.08% Growth</span>
              </div>
            </div>
            {/* Flowing SVG Area Chart */}
            <div id="cover-slide-chart" className="w-full h-14 relative mt-2 shrink-0">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#1a73e8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0 25 Q15 18 30 22 T60 12 T90 4 L100 2 L100 30 L0 30 Z" 
                  fill="url(#chart-grad)" 
                />
                <path 
                  d="M0 25 Q15 18 30 22 T60 12 T90 4 L100 2" 
                  fill="none" 
                  stroke="#1a73e8" 
                  strokeWidth="1.8" 
                  strokeLinecap="round"
                />
                <span className="absolute bottom-1 right-1 text-[8px] text-slate-400 font-mono tracking-wide uppercase">2026</span>
              </svg>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="w-full h-full bg-[#FFF2E0]/40 hover:bg-[#FFF2E0]/60 transition-colors duration-200 rounded-[20px] p-4 flex gap-3 overflow-hidden select-none">
            {/* Paper Document Preview style */}
            <div className="w-[45%] h-full bg-amber-50 rounded-lg shadow-xs p-2 flex flex-col justify-between border border-amber-100 shrink-0">
              <div className="space-y-1">
                <span className="text-[6px] font-sans font-bold text-amber-900 block tracking-tight">ecopaws</span>
                <span className="text-[8px] font-sans font-bold text-slate-800 leading-tight block">Market &amp; pricing</span>
              </div>
              <div className="border-t border-amber-200/50 pt-1">
                <span className="text-[4px] block text-slate-450 leading-3">Lorem ipsum dolor sit amet...</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-1">
              <span className="text-[12px] font-bold text-slate-800 leading-tight">Pricing Matrix</span>
              <span className="text-[9px] text-slate-500">Includes wholesale discounts and tier markups.</span>
              <div className="flex flex-wrap gap-1 pt-1">
                <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 font-bold text-[7px]">Doc</span>
                <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-bold text-[7px]">Sheet</span>
              </div>
            </div>
          </div>
        );

      case 'ads':
        return (
          <div className="w-full h-full bg-[#EAEEF6]/40 hover:bg-[#EAEEF6]/65 transition-colors duration-200 rounded-[20px] p-4 flex gap-2.5 overflow-hidden select-none">
            {/* Cell 1 */}
            <div className="flex-1 h-full bg-[#0F2144] rounded-[16px] p-3 text-white flex flex-col justify-between">
              <span className="text-[8px] font-normal uppercase tracking-wider text-slate-300">Estimated Profit</span>
              <span className="text-lg font-bold tracking-tight leading-none">$1,245</span>
              <span className="text-[8px] font-semibold text-emerald-400">Spend: $480</span>
            </div>
            {/* Cell 2 */}
            <div className="flex-1 h-full bg-[#183973] rounded-[16px] p-3 text-white flex flex-col justify-between">
              <span className="text-[8px] font-normal uppercase tracking-wider text-slate-300">Total Spend</span>
              <span className="text-lg font-bold tracking-tight leading-none">$2,080</span>
              <span className="text-[8px] font-semibold text-emerald-400">Convsn: 8.5%</span>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="w-full h-full bg-slate-100/50 hover:bg-slate-100/60 transition-colors duration-200 rounded-[20px] flex flex-col items-center justify-center p-6 text-center select-none border border-slate-200/20">
            <h1 className="text-3xl font-sans tracking-tight text-neutral-800 font-bold leading-normal lowercase">ecopaws</h1>
            <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold mt-1">Branding Kit</span>
          </div>
        );

      case 'support':
        return (
          <div className="w-full h-full bg-[#EBFDFF]/40 hover:bg-[#EBFDFF]/60 transition-colors duration-200 rounded-[20px] p-4 flex flex-col gap-2 overflow-hidden select-none">
            <span className="text-[11px] font-semibold text-sky-850 tracking-tight">Kibbles and Bits</span>
            {/* Request Block 1 */}
            <div className="bg-sky-50 rounded-xl p-2.5 border border-sky-100 flex justify-between items-center bg-white shadow-3xs">
              <span className="text-[10px] font-semibold text-slate-800">$98 Return request</span>
              <span className="text-[8px] px-1.5 py-0.5 bg-yellow-100 text-yellow-800 font-bold rounded">Pending</span>
            </div>
            {/* Request Block 2 */}
            <div className="bg-sky-50 rounded-xl p-2.5 border border-sky-100 flex justify-between items-center bg-white shadow-3xs">
              <span className="text-[10px] font-semibold text-slate-800">Defective product complaint</span>
              <span className="text-[8px] px-1.5 py-0.5 bg-green-100 text-green-800 font-bold rounded">Solved</span>
            </div>
          </div>
        );

      case 'doc-proposal':
        return (
          <div className="w-full h-full bg-amber-50/20 hover:bg-amber-50/40 transition-colors duration-200 border border-amber-200/20 rounded-[20px] p-5 flex flex-col justify-between overflow-hidden text-left select-none">
            <div>
              <h2 className="text-xl sm:text-xl md:text-2xl font-sans font-bold text-slate-800 leading-snug">
                Fall 2026 Marketing proposal
              </h2>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-800 font-semibold rounded-full">Author</span>
                <span className="text-[9px] font-medium text-slate-600">Sakura Okoro</span>
              </div>
            </div>
            <div className="border-t border-amber-100/60 pt-3 flex gap-2 justify-between items-center">
              <span className="text-[9px] text-slate-400">Proposal file details &amp; targets</span>
              <span className="text-[9px] text-amber-700 font-semibold hover:underline cursor-pointer">Preview Document</span>
            </div>
          </div>
        );

      case 'operations':
        return (
          <div className="w-full h-full bg-[#EEEDFC]/40 hover:bg-[#EEEDFC]/60 transition-colors duration-200 rounded-[20px] p-4 flex flex-col gap-2.5 justify-center overflow-hidden select-none">
            {/* Bar 1 */}
            <div>
              <div className="flex justify-between text-[9px] font-semibold text-indigo-950 mb-1">
                <span>Ads Channel Allocation</span>
                <span>80%</span>
              </div>
              <div className="w-full h-2 bg-indigo-100/60 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            {/* Bar 2 */}
            <div>
              <div className="flex justify-between text-[9px] font-semibold text-indigo-950 mb-1">
                <span>Sales Growth Performance</span>
                <span>45%</span>
              </div>
              <div className="w-full h-2 bg-indigo-100/60 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-550 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            {/* Bar 3 */}
            <div>
              <div className="flex justify-between text-[9px] font-semibold text-indigo-950 mb-1">
                <span>Finance &amp; Operations</span>
                <span>65%</span>
              </div>
              <div className="w-full h-2 bg-indigo-100/60 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-650 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        );

      case 'roadmap':
        return (
          <div className="w-full h-full bg-[#FAF9F5] hover:bg-[#F5F4EE] transition-colors duration-200 rounded-[20px] p-4 flex flex-col justify-between overflow-hidden select-none border border-amber-900/5">
            <span className="text-[10px] font-bold text-amber-900 tracking-wider uppercase">Product Roadmap</span>
            <div className="space-y-2 mt-1">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[8px] flex items-center justify-center">✓</span>
                <span className="text-[10px] font-medium text-slate-700">Phase 1: Local IDE & Shell API</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white font-bold text-[8px] flex items-center justify-center animate-pulse">●</span>
                <span className="text-[10px] font-semibold text-slate-800">Phase 2: Live Collab Sandbox</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-400 font-bold text-[8px] flex items-center justify-center">○</span>
                <span className="text-[10px] font-normal text-slate-450">Phase 3: Multi-region Deployment</span>
              </div>
            </div>
            <span className="text-[8px] text-slate-400 font-mono tracking-wide">Updated 2h ago</span>
          </div>
        );

      case 'feedback':
        return (
          <div className="w-full h-full bg-[#FCF5FC] hover:bg-[#F8EDF8] transition-colors duration-200 rounded-[20px] p-4 flex flex-col justify-between overflow-hidden select-none border border-purple-250/20">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-purple-900 tracking-wider uppercase">User Testimonials</span>
              <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100">★ 4.9 / 5</span>
            </div>
            <div className="bg-white/70 rounded-xl p-2.5 border border-purple-100 my-1 shadow-3xs">
              <p className="text-[9px] text-slate-700 italic font-medium leading-relaxed">
                "The typeahead searching and instant VM preview workspace is an absolute game-changer!"
              </p>
              <span className="text-[8px] text-purple-700 font-bold block mt-1 text-right">— Sarah K., VP of Design</span>
            </div>
            <span className="text-[8px] text-slate-400">Read all 142 enterprise reviews</span>
          </div>
        );

      case 'legal':
        return (
          <div className="w-full h-full bg-[#FAF6EE] hover:bg-[#F5F0E4] transition-colors duration-200 rounded-[20px] p-4 flex flex-col justify-between overflow-hidden select-none border border-amber-900/10">
            <div className="border-b border-amber-900/10 pb-2">
              <span className="text-[7px] text-slate-400 block font-sans tracking-widest uppercase">CONFIDENTIAL NDA</span>
              <h4 className="text-[12px] font-sans font-bold text-amber-950 mt-0.5 leading-tight">Mutual Non-Disclosure Agreement</h4>
            </div>
            <div className="py-2 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[5px] block text-slate-500">Party A: EcoPaws Inc.</span>
                <span className="text-[5px] block text-slate-500">Party B: Venturing Capital Corp</span>
              </div>
              <div className="w-10 h-10 border border-amber-800/40 rounded-full flex items-center justify-center bg-amber-50 shadow-3xs">
                <span className="text-[8px] text-amber-800 font-bold">SEAL</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-amber-900/10">
              <span className="text-[8px] text-amber-900 font-semibold uppercase tracking-wider">Signed & Validated</span>
              <span className="text-[8px] text-slate-450 font-mono">ID: 489-02X</span>
            </div>
          </div>
        );

      case 'investor':
        return (
          <div className="w-full h-full bg-[#080B10] hover:bg-[#0C1017] transition-colors duration-200 rounded-[20px] p-4 flex flex-col justify-between overflow-hidden select-none text-white border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Pitch Deck</span>
              <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold text-[8px] rounded border border-indigo-500/30">Seed Round</span>
            </div>
            <div className="my-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAF9F6] leading-none">$4.5M Raised</h1>
              <p className="text-[9px] text-slate-400 mt-1 leading-normal">Orchestrating cloud containers coupled with direct Gemini Live APIs.</p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[8px] text-slate-450 font-medium">Secured with General Catalyst Partner</span>
            </div>
          </div>
        );

      case 'engineering':
        return (
          <div className="w-full h-full bg-[#F3FDF5] hover:bg-[#EBF9EC] transition-colors duration-200 rounded-[20px] p-4 flex flex-col justify-between overflow-hidden select-none border border-emerald-200/30">
            <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase">System Architecture</span>
            <div className="flex items-center justify-center gap-2 my-1 scale-90">
              <div className="px-2 py-1 bg-white border border-slate-200/65 rounded-lg text-center shadow-3xs">
                <span className="text-[8px] font-bold text-slate-700 block">Client</span>
              </div>
              <span className="text-slate-400 text-[10px]">➜</span>
              <div className="px-2 py-1 bg-emerald-100 border border-emerald-200 rounded-lg text-center shadow-3xs animate-pulse">
                <span className="text-[8px] font-bold text-emerald-800 block">Gateway</span>
              </div>
              <span className="text-slate-400 text-[10px]">➜</span>
              <div className="px-2 py-1 bg-[#EAEEF6] border border-blue-200 rounded-lg text-center shadow-3xs">
                <span className="text-[8px] font-bold text-blue-800 block">Sandbox</span>
              </div>
            </div>
            <div className="flex justify-between text-[8px] text-emerald-900 border-t border-emerald-100 pt-2 font-mono">
              <span>Host: online</span>
              <span>Uptime: 99.98%</span>
            </div>
          </div>
        );

      case 'finance':
        return (
          <div className="w-full h-full bg-[#F4F9FA] hover:bg-[#EDF5F7] transition-colors duration-200 rounded-[20px] p-4 flex flex-col justify-between overflow-hidden select-none border border-sky-950/5">
            <span className="text-[10px] font-bold text-sky-900 tracking-wider uppercase">Budget Breakdown</span>
            <table className="w-full text-left text-[8px] border-collapse mt-1 flex-1">
              <thead>
                <tr className="border-b border-sky-100 text-sky-950/60 font-semibold">
                  <th className="py-1">Category</th>
                  <th className="py-1 text-right">Budget</th>
                  <th className="py-1 text-right">Actual</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 font-medium">
                <tr className="border-b border-sky-100/40">
                  <td className="py-1">Server Inflow</td>
                  <td className="py-1 text-right">$10,000</td>
                  <td className="py-1 text-right text-emerald-600 font-bold">$9,230</td>
                </tr>
                <tr className="border-b border-sky-100/40">
                  <td className="py-1">Ad Campaigns</td>
                  <td className="py-1 text-right">$5,000</td>
                  <td className="py-1 text-right text-red-500 font-bold">$5,450</td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-between items-center text-[9px] text-sky-900 font-bold border-t border-sky-100 pt-1">
              <span>Net Variance</span>
              <span className="text-emerald-700">+$320</span>
            </div>
          </div>
        );

      case 'hr':
        return (
          <div className="w-full h-full bg-[#FFFAFA] hover:bg-[#FFF2F2] transition-colors duration-200 rounded-[20px] p-4 flex flex-col justify-between overflow-hidden select-none border border-red-200/20">
            <span className="text-[10px] font-bold text-red-800 tracking-wider uppercase">Product Team</span>
            <div className="space-y-1 my-1">
              {/* Person 1 */}
              <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-red-50 shadow-3xs">
                <div className="w-5 h-5 rounded-full bg-[#FCDBDB] text-red-900 font-bold text-[8px] flex items-center justify-center">AS</div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-semibold text-slate-800 block truncate leading-none">Alice Smith</span>
                  <span className="text-[7px] text-slate-400 block truncate leading-none mt-0.5">Chief Product Officer</span>
                </div>
              </div>
              {/* Person 2 */}
              <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-red-50 shadow-3xs">
                <div className="w-5 h-5 rounded-full bg-[#DFF1FD] text-sky-900 font-bold text-[8px] flex items-center justify-center">ML</div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-semibold text-slate-800 block truncate leading-none">Marie Laurent</span>
                  <span className="text-[7px] text-slate-400 block truncate leading-none mt-0.5">Lead visual designer</span>
                </div>
              </div>
            </div>
            <span className="text-[8px] text-slate-455 font-medium">8 active members online</span>
          </div>
        );

      case 'social':
        return (
          <div className="w-full h-full bg-[#FAFBFD] hover:bg-[#F3F6FA] transition-colors duration-200 rounded-[20px] p-4 flex flex-col justify-between overflow-hidden select-none border border-blue-150/15">
            <span className="text-[10px] font-bold text-blue-900 tracking-wider uppercase">Social Media Calendar</span>
            <div className="grid grid-cols-3 gap-1.5 my-1 text-center font-sans">
              <div className="bg-indigo-50 border border-indigo-150 rounded p-1">
                <span className="text-[6px] text-indigo-800 font-bold block uppercase">Mon</span>
                <span className="text-[9px] font-semibold text-slate-700 block mt-0.5">IG Video</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-150 rounded p-1 animate-pulse">
                <span className="text-[6px] text-emerald-800 font-bold block uppercase">Wed</span>
                <span className="text-[9px] font-semibold text-slate-800 block mt-0.5">QA Live</span>
              </div>
              <div className="bg-orange-50 border border-orange-150 rounded p-1">
                <span className="text-[6px] text-orange-850 font-bold block uppercase">Fri</span>
                <span className="text-[9px] font-semibold text-slate-700 block mt-0.5">Blog kit</span>
              </div>
            </div>
            <span className="text-[8px] text-slate-400">Target frequency: 3 posts / wk</span>
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-slate-50 rounded-[20px] flex items-center justify-center p-4">
            <span className="text-xs text-slate-400">No render preview available</span>
          </div>
        );
    }
  };

  return (
    <>
      <div 
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        className="bg-white dark:bg-[#1E1F22] rounded-3xl border border-[#E9EEF6] dark:border-[#2B2D31] shadow-none hover:border-blue-400/70 dark:hover:border-blue-400/70 p-5 flex flex-col gap-5 transition-colors duration-200 overflow-hidden cursor-pointer relative select-none group"
      >
        {/* Upper row: Folder/File Leader icon + 24px label */}
        <div className="flex items-center gap-3.5 select-none text-left shrink-0">
          {renderIcon()}
          <span className="text-lg sm:text-[23px] font-sans font-normal text-slate-800 dark:text-[#E3E3E3] tracking-tight leading-normal truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150">
            {item.name}
          </span>
        </div>

        {/* Main Inner Preview area */}
        <div className="w-full aspect-[16/9] relative select-none overflow-hidden rounded-[20px] bg-[#f8f9fa] dark:bg-[#161719] border border-[#eef1f6] dark:border-[#2B2D31] shrink-0">
          {renderInnerPreview()}
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRemove={() => {
            if (onRemove) onRemove(item);
          }}
        />
      )}
    </>
  );
}
