import { useState } from 'react';

export function useVisualEffects() {
  const [geminiCursor, setGeminiCursor] = useState<{
    x: number;
    y: number;
    visible: boolean;
    label: string;
    status: 'pointing' | 'grabbing' | 'idle';
  }>({
    x: 0,
    y: 0,
    visible: false,
    label: 'Ollie Agent',
    status: 'pointing'
  });

  const [flyingClones, setFlyingClones] = useState<Array<{
    id: string;
    fileName: string;
    iconType: string;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
  }>>([]);

  const [particleBursts, setParticleBursts] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [animatingFileIds, setAnimatingFileIds] = useState<string[]>([]);
  const [isOrganizingFiles, setIsOrganizingFiles] = useState<boolean>(false);

  return {
    geminiCursor,
    setGeminiCursor,
    flyingClones,
    setFlyingClones,
    particleBursts,
    setParticleBursts,
    animatingFileIds,
    setAnimatingFileIds,
    isOrganizingFiles,
    setIsOrganizingFiles
  };
}
