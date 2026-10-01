// Resolve direct media URL from an otakudesu episode slug.
// Usage: node scripts/resolve-media.mjs <episode-slug> [quality]
// Prints JSON: { slug, quality, src, media, tried }
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const scraper = require('../lib/scraper.js');

const slug = process.argv[2];
const quality = process.argv[3] || '360p';

if (!slug) {
  console.error('usage: node scripts/resolve-media.mjs <episode-slug> [quality]');
  process.exit(1);
}

const ep = await scraper.getEpisodeStream(slug);
const all = ep.mirrors || [];
const sameQ = all.filter((m) => m.quality === quality);
const ordered = [...sameQ, ...all.filter((m) => m.quality !== quality)];

const tried = [];
let best = null;
for (const mirror of ordered) {
  if (!mirror || !mirror.payload) continue;
  try {
    const { src, media } = await scraper.deepResolveMirror(mirror.payload);
    tried.push({ server: mirror.server, quality: mirror.quality, src, media: media || '' });
    if (media) {
      const isMp4 = /\.mp4(\?|$)/i.test(media);
      if (!best || (isMp4 && !/\.mp4(\?|$)/i.test(best.media))) {
        best = { server: mirror.server, quality: mirror.quality, src, media };
      }
      if (isMp4 && mirror.quality === quality) break;
    }
  } catch (e) {
    tried.push({ server: mirror.server, quality: mirror.quality, error: e.message });
  }
}

if (!best) {
  console.error(JSON.stringify({ error: 'no resolvable media', slug, quality, tried }, null, 2));
  process.exit(3);
}

console.log(JSON.stringify({ slug, ...best, tried }, null, 2));