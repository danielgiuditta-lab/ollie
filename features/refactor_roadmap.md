# Architectural Refactoring Roadmap & Verification Plan

**Baseline Commit:** `f6b42877525d72bdc57fdc7342f29e3648a6e80f`

## Overview
This roadmap details the systematic, zero-regression modularization of both the backend (`server.ts`) and the frontend (`src/App.tsx`). Each step includes mandatory automated pre-verification and post-verification testing, clear commit boundaries for safe rollback, and detailed progress logging.

---

## Progress Log & Milestone Status

- [x] **Milestone 0: Automated Verification Suite Setup**
  - [x] Task 0.1: Build API & persistence verification script (`tests/verificationSuite.js`).
  - [x] Task 0.2: Run initial verification baseline test suite.
  - [x] Task 0.3: Git commit baseline tests.

- [x] **Milestone 1: Backend Modularization (`server.ts`)**
  - [x] Task 1.1: Extract `storageService.ts` (flat-file + Cloud Firestore abstraction with locking & sync parity).
  - [x] Task 1.2: Extract `aiService.ts` (GenAI SDK, RAG ingestion, doc-journey, vibe-code, ai-summary streaming).
  - [x] Task 1.3: Extract Express routers (`routes/chats.ts`, `routes/sync.ts`, `routes/share.ts`).
  - [x] Task 1.4: Run full verification suite & commit Milestone 1.

- [ ] **Milestone 2: Frontend Utilities & Hook Extractions (`src/App.tsx`)**
  - [x] Task 2.1: Extract `src/utils/artifactResolver.ts` and `src/utils/chatUtils.ts`.
  - [ ] Task 2.2: Extract `useWorkspaceState.ts` hook.
  - [ ] Task 2.3: Extract `useDriveSync.ts` hook.
  - [ ] Task 2.4: Extract `useCanvasState.ts` hook.
  - [ ] Task 2.5: Extract `useVisualEffects.ts` hook.
  - [ ] Task 2.6: Run full verification suite & commit Milestone 2 steps.

- [ ] **Milestone 3: Component Decomposition & Final Verification**
  - [ ] Task 3.1: Decompose `App.tsx` into modular containers (`CanvasContainer`, `ChatContainer`, `NavigationContainer`).
  - [ ] Task 3.2: Run full build check & end-to-end verification suite.
  - [ ] Task 3.3: Final git commit & verification summary artifact.

---

## Rollback Protocol
If any milestone fails verification:
1. Revert to the previous checkpoint commit: `git reset --hard HEAD` (or specific commit hash recorded in log).
2. Inspect log failures and fix underlying logic before re-attempting the step.
