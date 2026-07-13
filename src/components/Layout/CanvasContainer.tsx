import React from 'react';
import { AppView } from '../Canvas/AppView';
import { NativeViewer } from '../Canvas/NativeViewer';
import { SpaceDashboard } from '../Canvas/SpaceDashboard';
import { AISummaryView } from '../Canvas/AISummaryView';
import { HomeLanding } from '../Canvas/HomeLanding';
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
  pinnedArtifactIds?: string[];
  aiSummarySources?: any[];
  aiSummaryMessages?: any[];
  isAiSummaryLoading?: boolean;
  onSendMessage?: (text: string, aiMode?: boolean, contextFiles?: any[]) => void;
  onSnapAiSummary?: () => void;
  onSelectArtifact: (file: any) => void;
  onRemovePin: (fileId: string) => void;
  onPinArtifact?: (file: any) => void;
  onReorderPins: (newOrderedIds: string[]) => void;
  onCreateArtifact?: (type: 'doc' | 'slide' | 'sheet' | 'pix' | 'site' | 'upload') => void;
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
  aiSummarySources = [],
  aiSummaryMessages = [],
  isAiSummaryLoading = false,
  onSendMessage,
  onSnapAiSummary,
  onSelectArtifact,
  onRemovePin,
  onPinArtifact,
  onReorderPins,
  onCreateArtifact,
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
        onPinArtifact={onPinArtifact}
        onReorderPins={onReorderPins}
        onCreateArtifact={onCreateArtifact}
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

  if ((viewState === 'file_viewer' || viewState === 'files') && selectedFile) {
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
        sources={aiSummarySources}
        messages={aiSummaryMessages}
        onSendMessage={onSendMessage || (() => {})}
        isLoading={isAiSummaryLoading}
        onSnap={onSnapAiSummary || (() => {})}
        theme={appTheme}
      />
    );
  }

  return (
    <HomeLanding
      projectName={projectName}
      theme={appTheme}
      onOpenApp={onOpenApp}
    />
  );
}
