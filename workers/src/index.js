import { escapeXML } from 'ejs';
import tpls from './generated/templates/templates.cjs';
import { assets } from './generated/assets/assets.js';

const templates = tpls.templates;
import {
  getHome, getAnimeDetail, getEpisodeStream, searchAnime, resolveMirror,
  getOngoing, getComplete, getAnimeList, getSchedule, getGenres, getGenreAnime,
  resolveBloggerStreams,
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
  return async (req, params) => {
    try {
      return await fn(req, params);
    } catch (err) {
      return html(502, String(templates.error({ message: err.message === 'cf_challenge' ? 'cf_challenge' : err.message }, escapeXML, () => {}, (e) => { throw e; })));
    }
  };
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
  { pattern: /^\/anime\/([^/]+)$/, handler: safe(async (req, [slug]) => {
    const info = await getAnimeDetail(slug);
    return renderPage('anime', { info, title: info.title, active: null });
  }) },
  { pattern: /^\/episode\/([^/]+)$/, handler: safe(async (req, [slug]) => {
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
  { pattern: /^\/search$/, handler: safe(async (req) => {
    const q = (new URL(req.url).searchParams.get('q') || '').trim();
    const items = q.length >= 2 ? await searchAnime(q) : [];
    return renderPage('search', { q, items, title: 'Search', active: null });
  }) },
  { pattern: /^\/ongoing-anime(?:\/(\d+))?$/, handler: safe(async (req, [, p]) => {
    const page = Math.max(1, parseInt(p, 10) || 1);
    const data = await getOngoing(page);
    return renderPage('list', { ...data, title: 'Ongoing Anime', kind: 'ongoing', active: '/ongoing-anime/' });
  }) },
  { pattern: /^\/complete-anime(?:\/(\d+))?$/, handler: safe(async (req, [, p]) => {
    const page = Math.max(1, parseInt(p, 10) || 1);
    const data = await getComplete(page);
    return renderPage('list', { ...data, title: 'Complete Anime', kind: 'complete', active: '/complete-anime/' });
  }) },
  { pattern: /^\/anime-list(?:\/(\d+))?$/, handler: safe(async (req, [, p]) => {
    const page = Math.max(1, parseInt(p, 10) || 1);
    const data = await getAnimeList(page);
    return renderPage('alist', { ...data, title: 'Anime List', active: '/anime-list/' });
  }) },
  { pattern: /^\/jadwal-rilis$/, handler: safe(async () => {
    const days = await getSchedule();
    return renderPage('schedule', { days, title: 'Jadwal Rilis', active: '/jadwal-rilis/' });
  }) },
  { pattern: /^\/genre-list$/, handler: safe(async () => {
    const genres = await getGenres();
    return renderPage('genres', { genres, title: 'Genre List', active: '/genre-list/' });
  }) },
  { pattern: /^\/genres\/([^/]+)(?:\/(\d+))?$/, handler: safe(async (req, [genre, p]) => {
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
  { pattern: /^\/css\/tokens\.css$/, handler: () => new Response(assets['css/tokens.css'], { headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }) },
  { pattern: /^\/css\/style\.css$/, handler: () => new Response(assets['css/style.css'], { headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }) },
  { pattern: /^\/js\/app\.js$/, handler: () => new Response(assets['js/app.js'], { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }) },
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    for (const route of routes) {
      if (route.method && route.method !== request.method) continue;
      const m = path.match(route.pattern);
      if (!m) continue;
      return route.handler(request, m.slice(1));
    }
    return html(404, String(templates.error({ message: 'not found' }, escapeXML, () => {}, (e) => { throw e; })));
  },
};