import React from 'react';
import { AppView } from '../Canvas/AppView';
import { NativeViewer } from '../Canvas/NativeViewer';
import { SpaceDashboard } from '../Canvas/SpaceDashboard';
import { AISummaryView } from '../Canvas/AISummaryView';
import { HomeLanding } from '../Canvas/HomeLanding';
import { ComponentsCatalog } from '../ComponentsCatalog';
import { ViewState } from '../../hooks/useCanvasState';

interface CanvasContainerProps {
  viewState: ViewState;
  selectedFile: any;
  activeSpaceId: string | null;
  projectName: string;
  sandboxFiles: any[];
  sandboxUrl: string;
  envId: string | null;
  appTheme: 'light' | 'dark';
  pinnedArtifactIds: string[];
  onSelectArtifact: (file: any) => void;
  onRemovePin: (fileId: string) => void;
  onReorderPins: (newOrderedIds: string[]) => void;
  onSelectSpaceMode?: (spaceId: string, mode: 'tracking' | 'tool') => void;
  onFinalizeSpace?: (name: string, selectedPeople: any[], selectedDocs?: any[]) => void;
  onSelectSuggestedItem?: (item: any) => void;
  onOpenApp?: () => void;
}

export function CanvasContainer({
  viewState,
  selectedFile,
  activeSpaceId,
  projectName,
  sandboxFiles,
  sandboxUrl,
  envId,
  appTheme,
  pinnedArtifactIds = [],
  onSelectArtifact,
  onRemovePin,
  onReorderPins,
  onSelectSuggestedItem,
  onOpenApp
}: CanvasContainerProps) {
  if (viewState === 'dashboard' && activeSpaceId) {
    return (
      <SpaceDashboard
        spaceId={activeSpaceId}
        spaceName={projectName}
        pinnedArtifactIds={pinnedArtifactIds}
        sandboxFiles={sandboxFiles}
        onSelectArtifact={onSelectArtifact}
        onRemovePin={onRemovePin}
        onReorderPins={onReorderPins}
        sandboxUrl={sandboxUrl}
        envId={envId}
        theme={appTheme}
      />
    );
  }

  if (viewState === 'app') {
    return (
      <AppView
        sandboxUrl={sandboxUrl}
        envId={envId}
      />
    );
  }

  if (viewState === 'file_viewer' && selectedFile) {
    return (
      <NativeViewer
        file={selectedFile}
        theme={appTheme}
      />
    );
  }

  if (viewState === 'ai_summary') {
    return (
      <AISummaryView
        theme={appTheme}
      />
    );
  }

  return (
    <HomeLanding
      projectName={projectName}
      theme={appTheme}
      onSelectSuggestedItem={onSelectSuggestedItem}
      onOpenApp={onOpenApp}
    />
  );
}
