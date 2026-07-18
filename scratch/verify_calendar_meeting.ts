import assert from 'assert';

function calculateRelativeMeetingTime(startTime: Date, nowMs: number = Date.now()): string {
  const diffMs = startTime.getTime() - nowMs;
  if (diffMs > 0) {
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) {
      return `starts in ${diffMins <= 1 ? '1 minute' : `${diffMins} minutes`}`;
    } else if (diffMins < 24 * 60) {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `starts in ${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    } else {
      return `starts on ${startTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
  } else {
    const minsAgo = Math.abs(Math.round(diffMs / 60000));
    return `started ${minsAgo <= 1 ? 'just now' : `${minsAgo} minutes ago`}`;
  }
}

function parseCalendarEvent(event: any, nowMs: number = Date.now()) {
  const eventTitle = event.summary || 'Untitled Meeting';
  const startTime = new Date(event.start.dateTime || event.start.date);
  
  const videoEntryPoint = event.conferenceData?.entryPoints?.find((ep: any) => 
    ep.entryPointType === 'video' || (ep.uri && (ep.uri.includes('meet.google') || ep.uri.includes('zoom') || ep.uri.includes('teams')))
  );
  const joinLink = event.hangoutLink || videoEntryPoint?.uri || event.htmlLink || null;
  const relativeTimeText = calculateRelativeMeetingTime(startTime, nowMs);

  return { title: eventTitle, startTime, joinLink, relativeTimeText };
}

// Test 1: 10 minutes from now
const fixedNow = new Date('2026-07-18T18:30:00Z').getTime();
const tenMinMeeting = new Date('2026-07-18T18:40:00Z');
const res1 = calculateRelativeMeetingTime(tenMinMeeting, fixedNow);
assert.strictEqual(res1, 'starts in 10 minutes');

// Test 2: Event parsing
const mockEvent = {
  summary: 'New Drive',
  start: { dateTime: '2026-07-18T18:40:00Z' },
  end: { dateTime: '2026-07-18T19:10:00Z' },
  hangoutLink: 'https://meet.google.com/abc-defg-hij'
};
const parsed = parseCalendarEvent(mockEvent, fixedNow);
assert.strictEqual(parsed.title, 'New Drive');
assert.strictEqual(parsed.relativeTimeText, 'starts in 10 minutes');
assert.strictEqual(parsed.joinLink, 'https://meet.google.com/abc-defg-hij');

console.log("All calendar meeting tests passed successfully!");
