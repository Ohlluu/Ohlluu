import { createHash } from 'node:crypto';

// Best-effort protection per running instance; counters reset on cold starts.
// The Vercel Firewall can enforce a shared IP limit across instances as well.
const windows = new Map();
export function allowContact(ip, now = Date.now()) {
  const key = createHash('sha256').update(ip).digest('hex');
  if (windows.size >= 10_000) {
    for (const [id, entry] of windows) if (entry.expires <= now) windows.delete(id);
    if (windows.size >= 10_000 && !windows.has(key)) return false;
  }
  let entry = windows.get(key);
  if (!entry || entry.expires <= now) {
    entry = { count: 0, expires: now + 60_000 };
    windows.set(key, entry);
  }
  entry.count++;
  return entry.count <= 5;
}
export const localLimiter = {
  async limit({ key }) { return { success: allowContact(key) }; },
};
