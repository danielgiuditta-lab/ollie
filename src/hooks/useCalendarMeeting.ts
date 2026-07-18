import { useState, useEffect } from 'react';

export interface NextMeetingInfo {
  title: string;
  startTime: Date | null;
  joinLink: string | null;
  relativeTimeText: string;
  isLoading: boolean;
  error: string | null;
  hasMeeting: boolean;
}

export function useCalendarMeeting(accessToken?: string | null, userProfile?: any): NextMeetingInfo {
  const [meeting, setMeeting] = useState<NextMeetingInfo>({
    title: 'New Drive',
    startTime: new Date(Date.now() + 10 * 60 * 1000),
    joinLink: 'https://meet.google.com',
    relativeTimeText: 'starts in 10 minutes',
    isLoading: false,
    error: null,
    hasMeeting: true,
  });

  useEffect(() => {
    // If not logged in via OAuth (mock mode), use baseline mock meeting data
    if (!accessToken) {
      setMeeting({
        title: 'New Drive',
        startTime: new Date(Date.now() + 10 * 60 * 1000),
        joinLink: 'https://meet.google.com',
        relativeTimeText: 'starts in 10 minutes',
        isLoading: false,
        error: null,
        hasMeeting: true,
      });
      return;
    }

    let isMounted = true;
    const fetchNextMeeting = async () => {
      setMeeting(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const nowIso = new Date().toISOString();
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(nowIso)}&singleEvents=true&orderBy=startTime&maxResults=10`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn("Calendar API fetch warning:", res.status, errText);
          if (res.status === 403 || res.status === 401) {
            if (isMounted) {
              setMeeting({
                title: 'New Drive',
                startTime: null,
                joinLink: null,
                relativeTimeText: 'Google Calendar API scope required (https://www.googleapis.com/auth/calendar.readonly)',
                isLoading: false,
                error: 'Calendar permission required.',
                hasMeeting: false,
              });
            }
            return;
          }
          throw new Error(`Calendar API returned ${res.status}`);
        }

        const data = await res.json();
        const items: any[] = data.items || [];

        // Filter valid non-cancelled events
        const upcoming = items.filter(event => {
          if (event.status === 'cancelled') return false;
          const start = event.start?.dateTime || event.start?.date;
          if (!start) return false;
          const endTimeStr = event.end?.dateTime || event.end?.date;
          const endTime = endTimeStr ? new Date(endTimeStr).getTime() : (new Date(start).getTime() + 30 * 60 * 1000);
          return endTime > Date.now();
        });

        if (upcoming.length === 0) {
          if (isMounted) {
            setMeeting({
              title: '',
              startTime: null,
              joinLink: null,
              relativeTimeText: 'No upcoming meetings scheduled.',
              isLoading: false,
              error: null,
              hasMeeting: false,
            });
          }
          return;
        }

        const nextEvent = upcoming[0];
        const eventTitle = nextEvent.summary || 'Untitled Meeting';
        const startTime = new Date(nextEvent.start.dateTime || nextEvent.start.date);
        
        // Resolve video/call link: hangoutLink, conferenceData entry point, or htmlLink
        const videoEntryPoint = nextEvent.conferenceData?.entryPoints?.find((ep: any) => 
          ep.entryPointType === 'video' || (ep.uri && (ep.uri.includes('meet.google') || ep.uri.includes('zoom') || ep.uri.includes('teams')))
        );
        const joinLink = nextEvent.hangoutLink || videoEntryPoint?.uri || nextEvent.htmlLink || null;

        // Calculate relative time string
        const diffMs = startTime.getTime() - Date.now();
        let relativeTimeText = '';
        if (diffMs > 0) {
          const diffMins = Math.round(diffMs / 60000);
          if (diffMins < 60) {
            relativeTimeText = `starts in ${diffMins <= 1 ? '1 minute' : `${diffMins} minutes`}`;
          } else if (diffMins < 24 * 60) {
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            relativeTimeText = `starts in ${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
          } else {
            relativeTimeText = `starts on ${startTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
          }
        } else {
          const minsAgo = Math.abs(Math.round(diffMs / 60000));
          relativeTimeText = `started ${minsAgo <= 1 ? 'just now' : `${minsAgo} minutes ago`}`;
        }

        if (isMounted) {
          setMeeting({
            title: eventTitle,
            startTime,
            joinLink,
            relativeTimeText,
            isLoading: false,
            error: null,
            hasMeeting: true,
          });
        }
      } catch (err: any) {
        console.error("Failed to fetch next meeting:", err);
        if (isMounted) {
          setMeeting(prev => ({
            ...prev,
            isLoading: false,
            error: err.message || 'Failed to load meeting'
          }));
        }
      }
    };

    fetchNextMeeting();

    // Refresh meeting relative time every 60 seconds
    const interval = setInterval(fetchNextMeeting, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [accessToken]);

  return meeting;
}
