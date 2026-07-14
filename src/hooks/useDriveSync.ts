import { useState, useMemo } from 'react';
import { SUGGESTED_ITEMS } from '../components/Canvas/HomeLanding';

export const MOCK_USER_PROFILE = {
  email: 'mock-user@example.com',
  name: 'Mock User',
  picture: ''
};

export function useDriveSync() {
  const [userProfileState, setUserProfile] = useState<any>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<any[]>([]);
  
  const [suggestedListCache, setSuggestedListCache] = useState<any[]>(SUGGESTED_ITEMS);
  const [isDriveSuggestLoading, setIsDriveSuggestLoading] = useState(false);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [bypassAuth, setBypassAuth] = useState(false);

  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestedFiles, setIngestedFiles] = useState<any[]>([]);

  const userProfile = useMemo(() => {
    if (userProfileState) return userProfileState;
    if (bypassAuth) return MOCK_USER_PROFILE;
    return null;
  }, [userProfileState, bypassAuth]);

  const isLoggedIn = useMemo(() => accessToken !== null || bypassAuth, [accessToken, bypassAuth]);

  return {
    userProfile,
    setUserProfile,
    driveFiles,
    setDriveFiles,
    isDriveLoading,
    setIsDriveLoading,
    selectedDriveFiles,
    setSelectedDriveFiles,
    suggestedListCache,
    setSuggestedListCache,
    isDriveSuggestLoading,
    setIsDriveSuggestLoading,
    accessToken,
    setAccessToken,
    bypassAuth,
    setBypassAuth,
    isLoggedIn,
    isIngesting,
    setIsIngesting,
    ingestedFiles,
    setIngestedFiles
  };
}
