import { cp, mkdir, readdir, rm } from 'node:fs/promises';

// Publish public assets only; backend code, tests and setup notes stay private.
await rm('public', { recursive: true, force: true });
await mkdir('public', { recursive: true });
for (const entry of await readdir('.', { withFileTypes: true })) {
  if (entry.isFile() && (/\.(html|css|js|png|ico|svg|webp|jpe?g)$/i.test(entry.name) || ['robots.txt', 'sitemap.xml'].includes(entry.name))) {
    await cp(entry.name, `public/${entry.name}`);
  }
}
await cp('assets', 'public/assets', { recursive: true, filter: (source) => !source.endsWith('.DS_Store') });
console.log('Public website assets prepared.');
