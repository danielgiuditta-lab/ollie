import React from 'react';

interface RainbowRimOverlayProps {
  active?: boolean;
  className?: string;
  borderRadiusClass?: string;
  variant?: 'default' | 'canvas';
}

export function RainbowRimOverlay({ 
  active = true, 
  className = "",
  borderRadiusClass = "rounded-full"
}: RainbowRimOverlayProps) {
  if (!active) return null;

  return (
    <div className={`absolute -inset-[1px] pointer-events-none transition-opacity duration-300 overflow-hidden ${borderRadiusClass} ${className}`}>
      {/* Blurred Outer Glow Layer */}
      <div className="absolute top-1/2 left-1/2 w-[1600px] h-[1600px] google-rainbow-rim animate-rainbow-trace blur-[2px] opacity-75 shrink-0" />
      {/* Sharp Crisp Rim Layer */}
      <div className="absolute top-1/2 left-1/2 w-[1600px] h-[1600px] google-rainbow-rim animate-rainbow-trace shrink-0" />
    </div>
  );
}
