import React from 'react';
import { LandingInput } from './LandingInput';

interface SearchJourneyProps {
  onSubmit?: (val: string, aiMode?: boolean, contextFiles?: any[]) => void;
  onChange?: (val: string) => void;
  onFileSelect?: (file: any) => void;
  theme?: 'light' | 'dark';
  accessToken?: string | null;
  recentItems?: any[];
}

export function SearchJourney({ 
  onSubmit, 
  onChange, 
  onFileSelect,
  theme = 'light',
  accessToken = null,
  recentItems = []
}: SearchJourneyProps) {
  return (
    <div className="w-full flex flex-col items-center select-none bg-transparent relative z-30">
      {/* Search Header */}
      <h1 
        id="home-search-title"
        className="font-sans text-[45px] leading-tight text-neutral-800 dark:text-[#E3E3E3] font-normal tracking-tight max-w-3xl mb-8 select-text"
        style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}
      >
        Search your drive
      </h1>

      {/* Landing Input for Search */}
      <LandingInput 
        mode="search"
        placeholder="Ask anything or search your Drive"
        onSubmit={onSubmit}
        onChange={onChange}
        onFileSelect={onFileSelect}
        theme={theme}
        accessToken={accessToken}
        recentItems={recentItems}
      />
    </div>
  );
}
