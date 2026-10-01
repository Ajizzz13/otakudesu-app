import { escapeXML } from 'ejs';
import tpls from './generated/templates/templates.cjs';
import { assets } from './generated/assets/assets.js';

const templates = tpls.templates;
import {
  getHome, getAnimeDetail, getEpisodeStream, searchAnime, resolveMirror,
  getOngoing, getComplete, getAnimeList, getSchedule, getGenres, getGenreAnime,
  resolveBloggerStreams, deepResolveMirror,
} from './scraper.js';

const TYPES = {
  'text/html': ['html'],
  'text/css': ['css'],
  'application/javascript': ['js'],
};

function html(status, body, headers = {}) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...headers },
  });
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function renderPage(name, data) {
  const fn = templates[name];
  try {
    const out = fn(data, escapeXML, () => { throw new Error('include not allowed'); }, (err) => { throw err; });
    return html(200, String(out));
  } catch (err) {
    return html(502, String(templates.error(data, escapeXML, () => {}, (e) => { throw e; })));
  }
}

function safe(fn) {
  return async (req, params, env) => {
    try {
      return await fn(req, params, env);
    } catch (err) {
      const isJson = /\/(?:api\/)?(?:ensure-compressed|compress-status)/.test(new URL(req.url).pathname);
      if (isJson) return json(502, { success: false, error: err.message });
      return html(502, String(templates.error({ message: err.message === 'cf_challenge' ? 'cf_challenge' : err.message }, escapeXML, () => {}, (e) => { throw e })));
    }
  };
}

const GH_REPO = 'Ajizzz13/otakudesu-app';
const GH_API = 'https://api.github.com';

function ghHeaders(token, extra = {}) {
  const h = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'otakudesu-worker',
    ...extra,
  };
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

async function findCompressedAsset(env, slug, quality) {
  const token = env.GH_TOKEN;
  const cacheKey = `asset:${slug}:${quality}`;
  if (env.COMPRESS_KV) {
    const hit = await env.COMPRESS_KV.get(cacheKey);
    if (hit) {
      try { return JSON.parse(hit); } catch { /* ignore */ }
    }
  }
  const assetName = `${slug}.${quality}.mp4`;
  let page = 1;
  let found = null;
  while (page <= 3 && !found) {
    const res = await fetch(`${GH_API}/repos/${GH_REPO}/releases?per_page=30&page=${page}`, {
      headers: ghHeaders(token),
    });
    if (!res.ok) break;
    const releases = await res.json();
    if (!Array.isArray(releases) || !releases.length) break;
    for (const rel of releases) {
      const asset = (rel.assets || []).find((a) => a.name === assetName);
      if (asset) {
        found = { url: asset.browser_download_url, size: asset.size, release: rel.tag_name };
        break;
      }
    }
    if (releases.length < 30) break;
    page += 1;
  }
  if (found && env.COMPRESS_KV) {
    await env.COMPRESS_KV.put(cacheKey, JSON.stringify(found), { expirationTtl: 86400 * 7 });
  }
  return found;
}

async function dispatchCompress(env, slug, quality, media, referer) {
  const token = env.GH_TOKEN;
  if (!token) return { ok: false, error: 'GH_TOKEN not configured' };
  const inputs = {
    slugs: slug,
    quality: quality || '360p',
    crf: '30',
    tag: 'compressed-' + slug + '-' + (quality || '360p'),
    media: media || '',
    referer: referer || '',
  };
  const res = await fetch(GH_API + '/repos/' + GH_REPO + '/actions/workflows/compress.yml/dispatches', {
    method: 'POST',
    headers: ghHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ref: 'main', inputs }),
  });
  if (res.status === 204) return { ok: true };
  const text = await res.text().catch(() => '');
  return { ok: false, error: 'gh dispatch ' + res.status + ': ' + text.slice(0, 200) };
}

async function resolveForCompress(slug, quality) {
  const ep = await getEpisodeStream(slug);
  const all = ep.mirrors || [];
  const sameQ = all.filter((m) => m.quality === quality);
  const ordered = [...sameQ, ...all.filter((m) => m.quality !== quality)];
  let best = null;
  for (const mirror of ordered) {
    if (!mirror || !mirror.payload) continue;
    let resolved;
    try { resolved = await deepResolveMirror(mirror.payload); }
    catch { continue; }
    const src = resolved.src;
    const media = resolved.media;
    if (!media) continue;
    const isMp4 = /\.mp4(\?|$)/i.test(media);
    if (!best || (isMp4 && !/\.mp4(\?|$)/i.test(best.media))) {
      best = { media, referer: src, server: mirror.server, quality: mirror.quality };
    }
    if (isMp4) break;
  }
  return best;
}

function groupMirrors(mirrors) {
  const groups = [];
  const order = [];
  for (const m of mirrors) {
    if (!order.includes(m.quality)) order.push(m.quality);
  }
  for (const q of order) {
    const options = [];
    const seen = new Set();
    for (const m of mirrors) {
      if (m.quality !== q || seen.has(m.server)) continue;
      seen.add(m.server);
      options.push({ server: m.server, payload: m.payload });
    }
    groups.push({ quality: q, options });
  }
  return groups;
}

const routes = [
  { pattern: /^\/(?:home)?$/, handler: safe(async () => {
    const { ongoing, complete } = await getHome();
    return renderPage('index', { ongoing, complete, title: 'Home', active: '/' });
  }) },
  { pattern: /^\/anime\/([^/]+)\/?$/, handler: safe(async (req, [slug]) => {
    const info = await getAnimeDetail(slug);
    return renderPage('anime', { info, title: info.title, active: null });
  }) },
  { pattern: /^\/episode\/([^/]+)\/?$/, handler: safe(async (req, [slug]) => {
    const ep = await getEpisodeStream(slug);
    let episodes = [];
    if (ep.navigation.all) {
      try {
        const detail = await getAnimeDetail(ep.navigation.all);
        episodes = detail.episodes;
      } catch { episodes = []; }
    }
    const groups = groupMirrors(ep.mirrors);
    return renderPage('episode', { ep, episodes, groups, title: ep.title, activeSlug: slug, active: null });
  }) },
  { pattern: /^\/search\/?$/, handler: safe(async (req) => {
    const q = (new URL(req.url).searchParams.get('q') || '').trim();
    const items = q.length >= 2 ? await searchAnime(q) : [];
    return renderPage('search', { q, items, title: 'Search', active: null });
  }) },
  { pattern: /^\/ongoing-anime(?:\/(\d+))?\/?$/, handler: safe(async (req, [, p]) => {
    const page = Math.max(1, parseInt(p, 10) || 1);
    const data = await getOngoing(page);
    return renderPage('list', { ...data, title: 'Ongoing Anime', kind: 'ongoing', active: '/ongoing-anime/' });
  }) },
  { pattern: /^\/complete-anime(?:\/(\d+))?\/?$/, handler: safe(async (req, [, p]) => {
    const page = Math.max(1, parseInt(p, 10) || 1);
    const data = await getComplete(page);
    return renderPage('list', { ...data, title: 'Complete Anime', kind: 'complete', active: '/complete-anime/' });
  }) },
  { pattern: /^\/anime-list(?:\/(\d+))?\/?$/, handler: safe(async (req, [, p]) => {
    const page = Math.max(1, parseInt(p, 10) || 1);
    const data = await getAnimeList(page);
    return renderPage('alist', { ...data, title: 'Anime List', active: '/anime-list/' });
  }) },
  { pattern: /^\/jadwal-rilis\/?$/, handler: safe(async () => {
    const days = await getSchedule();
    return renderPage('schedule', { days, title: 'Jadwal Rilis', active: '/jadwal-rilis/' });
  }) },
  { pattern: /^\/genre-list\/?$/, handler: safe(async () => {
    const genres = await getGenres();
    return renderPage('genres', { genres, title: 'Genre List', active: '/genre-list/' });
  }) },
  { pattern: /^\/genres\/([^/]+)(?:\/(\d+))?\/?$/, handler: safe(async (req, [genre, p]) => {
    const page = Math.max(1, parseInt(p, 10) || 1);
    const data = await getGenreAnime(genre, page);
    return renderPage('list', { ...data, title: `Genre: ${data.genre}`, kind: `genres/${data.genre}`, active: null });
  }) },
  { pattern: /^\/api\/search$/, handler: safe(async (req) => {
    const q = (new URL(req.url).searchParams.get('q') || '').trim();
    if (q.length < 2) return json(200, { success: true, data: { items: [] } });
    const items = await searchAnime(q);
    return json(200, { success: true, data: { items } });
  }) },
  { pattern: /^\/api\/stream-resolve$/, method: 'POST', handler: safe(async (req) => {
    const body = await req.json().catch(() => ({}));
    const { payload } = body;
    if (!payload) return json(400, { success: false, error: 'payload required' });
    const src = await resolveMirror(payload);
    return json(200, { success: true, data: { src } });
  }) },
  { pattern: /^\/api\/stream-direct$/, method: 'POST', handler: safe(async (req) => {
    const body = await req.json().catch(() => ({}));
    const { url } = body;
    if (!url) return json(400, { success: false, error: 'url required' });
    const streams = await resolveBloggerStreams(url);
    return json(200, { success: true, data: { streams } });
  }) },
  { pattern: /^\/api\/stream-direct-mirror$/, method: 'POST', handler: safe(async (req) => {
    const body = await req.json().catch(() => ({}));
    const list = Array.isArray(body.payloads) ? body.payloads : (body.payload ? [body.payload] : []);
    if (!list.length) return json(400, { success: false, error: 'payload required' });
    const tried = [];
    for (const payload of list) {
      try {
        const { src, media } = await deepResolveMirror(payload);
        tried.push({ src, media: media || '' });
        if (media) return json(200, { success: true, data: { src, media } });
      } catch (e) { tried.push({ error: e.message }); }
    }
    return json(200, { success: true, data: { src: (tried[0] && tried[0].src) || '', media: '', tried } });
  }) },
  { pattern: /^\/api\/compress-status$/, method: 'GET', handler: safe(async (req, params, env) => {
    const u = new URL(req.url);
    const slug = (u.searchParams.get('slug') || '').trim();
    const quality = (u.searchParams.get('quality') || '360p').trim();
    if (!slug) return json(400, { success: false, error: 'slug required' });
    const asset = await findCompressedAsset(env, slug, quality);
    if (asset) return json(200, { success: true, status: 'ready', url: asset.url, size: asset.size });
    return json(200, { success: true, status: 'processing' });
  }) },
  { pattern: /^\/api\/ensure-compressed$/, method: 'POST', handler: safe(async (req, params, env) => {
    const body = await req.json().catch(() => ({}));
    const slug = (body.slug || '').trim();
    const quality = (body.quality || '360p').trim();
    if (!slug) return json(400, { success: false, error: 'slug required' });
    const asset = await findCompressedAsset(env, slug, quality);
    if (asset) return json(200, { success: true, status: 'ready', url: asset.url, size: asset.size });
    const resolved = await resolveForCompress(slug, quality);
    if (!resolved || !resolved.media) return json(200, { success: true, status: 'unresolvable' });
    const dispatched = await dispatchCompress(env, slug, quality, resolved.media, resolved.referer);
    if (!dispatched.ok) return json(502, { success: false, error: dispatched.error });
    if (env.COMPRESS_KV) await env.COMPRESS_KV.put(`pending:${slug}:${quality}`, '1', { expirationTtl: 3600 });
    return json(200, { success: true, status: 'processing' });
  }) },
  { pattern: /^\/css\/tokens\.css$/, handler: () => new Response(assets['css/tokens.css'], { headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }) },
  { pattern: /^\/css\/style\.css$/, handler: () => new Response(assets['css/style.css'], { headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }) },
  { pattern: /^\/js\/app\.js$/, handler: () => new Response(assets['js/app.js'], { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }) },
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    for (const route of routes) {
      if (route.method && route.method !== request.method) continue;
      const m = path.match(route.pattern);
      if (!m) continue;
      return route.handler(request, m.slice(1), env);
    }
    return html(404, String(templates.error({ message: 'not found' }, escapeXML, () => {}, (e) => { throw e })));
  },
};