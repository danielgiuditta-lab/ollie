import React from 'react';
import { LandingInput } from './LandingInput';

interface CreationJourneyProps {
  onSubmit?: (val: string, aiMode?: boolean, contextFiles?: any[]) => void;
  onChange?: (val: string) => void;
  onCreateArtifact?: (type: 'doc' | 'slide' | 'sheet' | 'pix' | 'site' | 'upload') => void;
  theme?: 'light' | 'dark';
}

export function CreationJourney({ 
  onSubmit, 
  onChange, 
  onCreateArtifact, 
  theme = 'light' 
}: CreationJourneyProps) {
  return (
    <div className="w-full flex flex-col items-center select-none bg-transparent relative z-30">
      {/* Creation Header */}
      <h1 
        id="home-creation-title"
        className="font-sans text-[45px] leading-tight text-neutral-800 dark:text-[#E3E3E3] font-normal tracking-tight max-w-3xl mb-8 select-text"
        style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}
      >
        What do you want to create?
      </h1>

      {/* Landing Input for Creation */}
      <LandingInput 
        mode="create"
        defaultDrawerOpen={true}
        placeholder="Create a new doc, sheet, slide or app"
        onSubmit={onSubmit}
        onChange={onChange}
        onCreateArtifact={onCreateArtifact}
        theme={theme}
      />
    </div>
  );
}
