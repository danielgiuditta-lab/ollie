export function slugifyPersonName(name: string): string {
  if (!name) return 'default_user';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// 1-to-1 Mapping Matrix between person names and local high-res avatar assets
export const PERSON_AVATAR_MAP: Record<string, string> = {
  'alan vance': '/people/david.jpg',
  'alan': '/people/david.jpg',
  'elena vance': '/people/elena_vance.jpg',
  'dr. marcus thorne': '/people/dr_marcus_thorne.jpg',
  'sarah lin': '/people/sarah_lin.jpg',
  'david ross': '/people/david_ross.jpg',
  'priya patel': '/people/priya_patel.jpg',
  'rachel chang': '/people/rachel_chang.jpg',
  'dr. jason miller': '/people/dr_jason_miller.jpg',
  'emily': '/people/emily.jpg',
  'david': '/people/david.jpg',
  'juyun': '/people/juyun.jpg',
  'simon': '/people/simon.jpg',
  'michelle': '/people/michelle.jpg',
  'robert': '/people/robert.jpg',
  'kishan': '/people/kishan.jpg',
  'kaushal': '/people/kaushal.jpg'
};

export function getAvatarForPerson(name: string = ''): string {
  if (!name) return '/people/sarah_lin.jpg';
  const clean = name.trim().toLowerCase();
  
  if (PERSON_AVATAR_MAP[clean]) {
    return PERSON_AVATAR_MAP[clean];
  }

  // Check slugified lookup
  const slug = slugifyPersonName(name);
  for (const [key, val] of Object.entries(PERSON_AVATAR_MAP)) {
    if (slugifyPersonName(key) === slug) {
      return val;
    }
  }

  // Deterministic fallback hash based on name characters so a name ALWAYS gets a real person photo asset
  const values = Array.from(new Set(Object.values(PERSON_AVATAR_MAP)));
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % values.length;
  return values[index];
}
