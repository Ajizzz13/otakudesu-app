// Resolve direct media URL from an otakudesu episode slug.
// Usage: node scripts/resolve-media.mjs <episode-slug> [quality]
// Prints JSON: { slug, quality, src, media, referer, tried }
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const scraper = require('../lib/scraper.js');

// Support direct JSON candidate list via MEDIA_JSON env (worker payload)
if (process.env.MEDIA_JSON) {
  try {
    const arr = JSON.parse(process.env.MEDIA_JSON);
    process.stdout.write(JSON.stringify(Array.isArray(arr) ? { candidates: arr } : arr));
    process.exit(0);
  } catch { /* fall through */ }
}
const slug = process.argv[2];
const quality = process.argv[3] || '360p';

if (!slug) {
  console.error('usage: node scripts/resolve-media.mjs <episode-slug> [quality]');
  process.exit(1);
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// CDN hosts yang dikonfirmasi 403 dari egress datacenter (Cloudflare/GitHub).
// Host lain dianggap reachable.
const BLOCKED_HOSTS = [/acek-cdn\.com/i];

function hostOf(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}

function isBlocked(url) {
  const h = hostOf(url);
  return BLOCKED_HOSTS.some((re) => re.test(h));
}

async function probe(url, referer) {
  if (!url) return false;
  if (isBlocked(url)) return false;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': UA,
        'Referer': referer || '',
        'Range': 'bytes=0-1',
      },
      redirect: 'follow',
    });
    return res.status === 200 || res.status === 206;
  } catch {
    return false;
  }
}

const ep = await scraper.getEpisodeStream(slug);
const all = ep.mirrors || [];
const sameQ = all.filter((m) => m.quality === quality);
const ordered = [...sameQ, ...all.filter((m) => m.quality !== quality)];

const tried = [];
let best = null;

for (const mirror of ordered) {
  if (!mirror || !mirror.payload) continue;
  let resolved;
  try {
    resolved = await scraper.deepResolveMirror(mirror.payload);
  } catch (e) {
    tried.push({ server: mirror.server, quality: mirror.quality, error: e.message });
    continue;
  }
  const { src, media } = resolved;
  const referer = src || '';
  const ok = await probe(media, referer);
  tried.push({ server: mirror.server, quality: mirror.quality, src, media: media || '', reachable: ok });
  if (!media || !ok) continue;

  const isMp4 = /\.mp4(\?|$)/i.test(media);
  if (!best) {
    best = { server: mirror.server, quality: mirror.quality, src, media, referer };
  } else {
    const bestMp4 = /\.mp4(\?|$)/i.test(best.media);
    if (isMp4 && !bestMp4) best = { server: mirror.server, quality: mirror.quality, src, media, referer };
  }
  if (isMp4 && mirror.quality === quality) break;
}

if (!best) {
  console.error(JSON.stringify({ error: 'no reachable media', slug, quality, tried }, null, 2));
  process.exit(3);
}

console.log(JSON.stringify({ slug, quality, src: best.src, media: best.media, referer: best.referer, server: best.server, tried }, null, 2));