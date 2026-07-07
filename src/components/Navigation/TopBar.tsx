import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Users, Copy, Check, X, Shield, Globe, History } from 'lucide-react';
import driveLogo from '../../assets/driveLogo.png';
import { IconButton } from '../Shared/IconButton';
import { HeaderTabButton } from './HeaderTabButton';
import { themeTokens } from '../../utils/themeTokens';

export function TopBar({ 
  onLogin, 
  onLogout, 
  userProfile, 
  projectName = "New",
  envId,
  sandboxFiles = [],
  activeSidebar = null,
  setActiveSidebar,
  theme = 'light',
  onToggleTheme,
  onCloseProjector,
  isPublic = false,
  syncStatus = 'idle',
  viewState = 'home',
  isAiSummarySnapped = false,
  onHomeClick
}: { 
  onLogin?: () => void, 
  onLogout?: () => void, 
  userProfile?: any, 
  projectName?: string,
  envId?: string | null,
  sandboxFiles?: any[],
  activeSidebar?: 'gemini' | 'comments' | 'history' | null,
  setActiveSidebar?: (tab: 'gemini' | 'comments' | 'history' | null) => void,
  theme?: 'light' | 'dark',
  onToggleTheme?: () => void,
  onCloseProjector?: () => void,
  isPublic?: boolean,
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'failed',
  viewState?: string,
  isAiSummarySnapped?: boolean,
  onHomeClick?: () => void
}) {
  const [showLogout, setShowLogout] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [isCopiedPublic, setIsCopiedPublic] = useState(false);
  const [isCopiedDev, setIsCopiedDev] = useState(false);
  const [showOpenMenu, setShowOpenMenu] = useState(false);
  const isProjectorActive = !!onCloseProjector;
  const isSidebarVisible = viewState !== 'home' || isAiSummarySnapped;

  const handleGenerateShare = async () => {
    if (!envId) {
      setShowShareModal(true);
      return;
    }
    
    setIsSharing(true);
    setShowShareModal(true);
    
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          envId,
          workspaceName: projectName,
          owner: userProfile?.email || "Anonymous User",
          ownerId: userProfile?.sub || "",
          files: sandboxFiles
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.slug) {
          setShareSlug(data.slug);
        }
      }
    } catch (err) {
      console.error("Failed to generate share link", err);
    } finally {
      setIsSharing(false);
    }
  };

  const getShareUrl = () => {
    if (!shareSlug) return "";
    let origin = window.location.origin;
    if (window.location.hostname.startsWith('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    return `${origin}/?share=${shareSlug}`;
  };

  const getDevTestUrl = () => {
    if (!shareSlug) return "";
    return `${window.location.origin}/?share=${shareSlug}`;
  };

  const handleCopyPublic = () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsCopiedPublic(true);
      setTimeout(() => setIsCopiedPublic(false), 2500);
    });
  };

  const handleCopyDev = () => {
    const devUrl = getDevTestUrl();
    if (!devUrl) return;
    navigator.clipboard.writeText(devUrl).then(() => {
      setIsCopiedDev(true);
      setTimeout(() => setIsCopiedDev(false), 2500);
    });
  };

  return (
    <div className="flex items-center justify-between px-4 pb-2 pt-4 w-full h-[72px] z-20 relative bg-transparent dark:bg-[#0B0B0C] text-slate-800 dark:text-white">
      <div className="flex items-center gap-4">
        {isProjectorActive ? (
          <>
            {/* Close Button center-aligned with the LeftNav column (plus/search buttons) */}
            <div className="w-[56px] flex items-center justify-center shrink-0">
              {!isPublic && (
                <button 
                  id="btn-projector-close"
                  onClick={onCloseProjector}
                  className="w-12 h-12 flex items-center justify-center bg-[#282A2D] hover:bg-[#35373A] text-[#9E9E9E] hover:text-white rounded-full transition-all duration-300 cursor-pointer border-none outline-none"
                  title="Exit Presentation Mode"
                >
                  <X size={20} className="stroke-[2.2]" />
                </button>
              )}
            </div>

            {/* Same spacing gap as canvas on left side */}
            {/* The name of the artifact: type style and size matching My Drive & new folder in light mode (font-medium text-lg) aligned left of the canvas */}
            {viewState !== 'home' && (
              <div className="flex items-center text-[#E3E3E3] text-lg font-medium font-sans ml-2">
                <span className="truncate max-w-xs sm:max-w-md">
                  {projectName}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            {viewState !== 'home' ? (
              <div className="flex items-center text-slate-800 dark:text-white text-base font-normal select-none animate-in fade-in duration-200" style={{ fontFamily: '"Google Sans", "Product Sans", sans-serif' }}>
                <span 
                  onClick={onHomeClick} 
                  className="cursor-pointer hover:text-slate-900 dark:hover:text-white hover:underline text-slate-700 dark:text-slate-200 font-medium"
                  title="Go back to My Drive"
                >
                  My Drive
                </span>
                <ChevronRight size={16} className="mx-2 text-slate-400 dark:text-slate-400" />
                <span className="flex items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition px-2.5 py-1 rounded-xl text-slate-900 dark:text-white font-medium">
                  {projectName} <ChevronDown size={16} className="ml-1 text-slate-500 dark:text-slate-400" />
                </span>

                <div 
                  onClick={handleGenerateShare}
                  className="ml-4 hover:bg-black/5 dark:hover:bg-white/10 transition p-2 rounded-xl cursor-pointer flex items-center gap-1 text-slate-700 dark:text-[#E3E3E3] hover:text-slate-900 dark:hover:text-white"
                  title="Share Workspace"
                >
                  <Users size={18} />
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-[#2B2D31] text-slate-800 dark:text-[#E3E3E3] rounded-md">Share</span>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="flex items-center gap-4 relative">
        {isProjectorActive && !isPublic && (
          <div className="relative">
            <button 
              onClick={() => setShowOpenMenu(!showOpenMenu)}
              className="h-12 flex items-center gap-1.5 bg-[#282A2D] hover:bg-[#35373A] text-white px-5 rounded-full text-xs font-semibold tracking-wide transition duration-200 cursor-pointer border-none outline-none mr-1"
            >
              Open <ChevronDown size={14} className={`transition-transform duration-200 ${showOpenMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showOpenMenu && (
              <div className="absolute right-0 top-14 w-48 bg-[#1E1F22] border border-[#2B2D31] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                <button 
                  onClick={() => { onCloseProjector && onCloseProjector(); setShowOpenMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-[#E3E3E3] hover:bg-[#2B2D31] transition font-medium border-none bg-transparent cursor-pointer"
                >
                  Return to Edit Panel
                </button>
              </div>
            )}
          </div>
        )}

        <HeaderTabButton
          tabType="gemini"
          isSelected={isSidebarVisible && activeSidebar === 'gemini'}
          onClick={() => {
            if (setActiveSidebar) {
              setActiveSidebar(activeSidebar === 'gemini' ? null : 'gemini');
            }
          }}
          theme={theme}
          icon={
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 28C14 26.0633 13.6267 24.2433 12.88 22.54C12.1567 20.8367 11.165 19.355 9.905 18.095C8.645 16.835 7.16333 15.8433 5.46 15.12C3.75667 14.3733 1.93667 14 0 14C1.93667 14 3.75667 13.6383 5.46 12.915C7.16333 12.1683 8.645 11.165 9.905 9.905C11.165 8.645 12.1567 7.16333 12.88 5.46C13.6267 3.75667 14 1.93667 14 0C14 1.93667 14.3617 3.75667 15.085 5.46C15.8317 7.16333 16.835 8.645 18.095 9.905C19.355 11.165 20.8367 12.1683 22.54 12.915C24.2433 13.6383 26.0633 14 28 14C26.0633 14 24.2433 14.3733 22.54 15.12C20.8367 15.8433 19.355 16.835 18.095 18.095C16.835 19.355 15.8317 20.8367 15.085 22.54C14.3617 24.2433 14 26.0633 14 28Z" fill="currentColor"/>
            </svg>
          }
        />
        <HeaderTabButton
          tabType="comments"
          isSelected={isSidebarVisible && activeSidebar === 'comments'}
          onClick={() => {
            if (setActiveSidebar) {
              setActiveSidebar(activeSidebar === 'comments' ? null : 'comments');
            }
          }}
          theme={theme}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z" />
            </svg>
          }
        />
        <HeaderTabButton
          tabType="history"
          isSelected={isSidebarVisible && activeSidebar === 'history'}
          onClick={() => {
            if (setActiveSidebar) {
              setActiveSidebar(activeSidebar === 'history' ? null : 'history');
            }
          }}
          theme={theme}
          icon={<History size={22} className="stroke-[2.2]" />}
        />
        <button 
          className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300 rounded-full shrink-0 select-none ${
            theme === 'dark' 
              ? `${themeTokens.dark.filledBg} ${themeTokens.dark.filledHoverBg}` 
              : `${themeTokens.light.filledBg} ${themeTokens.light.filledHoverBg}`
          } text-[#11151A] dark:text-[#E3E3E3] outline-none border-none`}
          onClick={() => {
            if (userProfile) {
              setShowLogout(!showLogout);
            } else if (onLogin) {
              onLogin();
            }
          }}
          title={userProfile ? userProfile.name || userProfile.email : "Sign In"}
        >
          {userProfile?.picture ? (
            <img src={userProfile.picture} alt="avatar" className="w-8 h-8 object-cover rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <span className={`material-symbols-rounded text-[28px] leading-none select-none pointer-events-none ${theme === 'dark' ? 'text-white' : ''}`}>account_circle</span>
          )}
        </button>
        
        {showLogout && userProfile && (
          <div className="absolute top-12 right-0 bg-white dark:bg-[#1E1F22] border border-gray-200 dark:border-[#2B2D31] rounded-xl p-2 z-50 min-w-48 shadow-lg">
            <div className="px-4 py-2 text-sm text-gray-800 dark:text-[#E3E3E3] font-medium border-b border-gray-100 dark:border-b-[#2B2D31] mb-1 truncate">
              {userProfile.email}
            </div>
            
            {/* Theme Toggle Option */}
            <div className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-[#E3E3E3] hover:bg-gray-50 dark:hover:bg-white/5 rounded transition font-medium select-none">
              <span>Dark Mode</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleTheme) onToggleTheme();
                }}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 focus:outline-none ${
                  theme === 'dark' ? 'bg-[#1a73e8]' : 'bg-gray-200'
                }`}
                title="Toggle Dark Mode"
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <button 
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition font-medium"
              onClick={() => {
                if (onLogout) onLogout();
                setShowLogout(false);
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Share dialog modal overlay */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header controls */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Shield size={20} className="text-blue-500" />
                Share "{projectName}"
              </h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* In-app active model rules info */}
            {!envId ? (
              <div className="bg-amber-50 rounded-2xl p-4 text-amber-800 border border-amber-100 text-sm mb-4">
                <p className="font-semibold mb-1">Workspace is empty!</p>
                <p>Start a conversation with the In-App developer agent first to compile files and create an active sandbox environment before sharing.</p>
              </div>
            ) : isSharing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                <p className="text-slate-500 text-sm font-medium">Provisioning shared container...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Role specifications */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Globe className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">Anyone with Link</h4>
                      <p className="text-xxs text-slate-500">Can view, interact, and run the compiled widget in real-time Projector Mode.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Shield className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">Authorized Google Users</h4>
                      <p className="text-xxs text-slate-500">Can edit code, see the file navigator, and request changes from the model prompt.</p>
                    </div>
                  </div>
                </div>

                {/* Shared links container */}
                {shareSlug && (
                  <div className="mt-4 space-y-4 text-left">
                    {/* Direct Test Link */}
                    <div className="bg-amber-50/40 rounded-2xl p-3.5 border border-amber-200/50">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                          Internal Developer Link (Owner Only)
                        </label>
                        <span className="text-[9px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">Owner Session</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-amber-200 shadow-sm mt-1.5">
                        <input 
                          type="text" 
                          readOnly 
                          value={getDevTestUrl()} 
                          className="text-xs text-slate-500 font-mono bg-transparent flex-1 select-all outline-none"
                        />
                        <button 
                          onClick={handleCopyDev}
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-600 transition flex items-center justify-center shrink-0 cursor-pointer"
                          title="Copy Owner Link"
                        >
                          {isCopiedDev ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-700 mt-2 leading-relaxed font-medium">
                        ⚠️ <b>IMPORTANT:</b> This link ONLY works for you. If you send it to friends or colleagues, they will get a <b>404 Page Not Found</b> error because Google protects active development sessions.
                      </p>
                    </div>

                    {/* Public Shared link container */}
                    <div className="bg-emerald-50/40 rounded-2xl p-3.5 border border-emerald-200/50">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          Public Shareable Link (Send to Others!)
                        </label>
                        <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">Public / Shared</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-sm mt-1.5">
                        <input 
                          type="text" 
                          readOnly 
                          value={getShareUrl()} 
                          className="text-xs text-emerald-950 font-mono bg-transparent flex-1 select-all outline-none"
                        />
                        <button 
                          onClick={handleCopyPublic}
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-750 transition flex items-center justify-center shrink-0 cursor-pointer"
                          title="Copy Public Link"
                        >
                          {isCopiedPublic ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
                        ✅ <b>Send this link!</b> The <code>ais-pre-</code> path is mapped to the public Cloud Run container. It works globally for anyone once you deploy or publish your app in AI Studio.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 font-semibold text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

