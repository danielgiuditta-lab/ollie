import React from 'react';
import { CircularProgressIndicator } from '../Shared/CircularProgressIndicator';
import geminiIcon from '../../assets/gemini.png';

export function ThinkingAnimation() {
  return (
    <div className="relative inline-flex items-center justify-center w-6 h-6 mr-2">
      <CircularProgressIndicator 
        isIndeterminate 
        size={24} 
        strokeWidth={2}
        className="text-[#6c5bfa]" 
        secondaryClassName="text-[#e2dcfc]" 
      />
      <img src={geminiIcon} alt="Thinking..." className="absolute w-[14px] h-[14px] object-contain" />
    </div>
  );
}
