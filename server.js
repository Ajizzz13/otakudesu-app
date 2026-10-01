const path = require('path');
const express = require('express');
const {
  getHome, getAnimeDetail, getEpisodeStream, searchAnime, resolveMirror,
  getOngoing, getComplete, getAnimeList, getSchedule, getGenres, getGenreAnime,
  resolveBloggerStreams, deepResolveMirror,
} = require('./lib/scraper');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));
app.use(express.static(path.join(__dirname, 'public')));

const safe = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    res.status(502).render('error', { message: err.message === 'cf_challenge' ? 'cf_challenge' : err.message });
  }
};

app.get('/', safe(async (req, res) => {
  const { ongoing, complete } = await getHome();
  res.render('index', { ongoing, complete, title: 'Home', active: '/' });
}));

app.get('/anime/:slug', safe(async (req, res) => {
  const info = await getAnimeDetail(req.params.slug);
  res.render('anime', { info, title: info.title, active: null });
}));

app.get('/episode/:slug', safe(async (req, res) => {
  const ep = await getEpisodeStream(req.params.slug);
  let episodes = [];
  if (ep.navigation.all) {
    try {
      const detail = await getAnimeDetail(ep.navigation.all);
      episodes = detail.episodes;
    } catch { episodes = []; }
  }
  const groups = [];
  const order = [];
  for (const m of ep.mirrors) {
    if (!order.includes(m.quality)) order.push(m.quality);
  }
  for (const q of order) {
    const options = [];
    const seen = new Set();
    for (const m of ep.mirrors) {
      if (m.quality !== q || seen.has(m.server)) continue;
      seen.add(m.server);
      options.push({ server: m.server, payload: m.payload });
    }
    groups.push({ quality: q, options });
  }
  res.render('episode', { ep, episodes, groups, title: ep.title, activeSlug: req.params.slug, active: null });
}));

app.get('/search', safe(async (req, res) => {
  const q = (req.query.q || '').trim();
  const items = q.length >= 2 ? await searchAnime(q) : [];
  res.render('search', { q, items, title: 'Search', active: null });
}));

app.get('/ongoing-anime', safe(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const data = await getOngoing(page);
  res.render('list', { ...data, title: 'Ongoing Anime', kind: 'ongoing', active: '/ongoing-anime/' });
}));

app.get('/complete-anime', safe(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const data = await getComplete(page);
  res.render('list', { ...data, title: 'Complete Anime', kind: 'complete', active: '/complete-anime/' });
}));

app.get('/anime-list', safe(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const data = await getAnimeList(page);
  res.render('alist', { ...data, title: 'Anime List', active: '/anime-list/' });
}));

app.get('/jadwal-rilis', safe(async (req, res) => {
  const days = await getSchedule();
  res.render('schedule', { days, title: 'Jadwal Rilis', active: '/jadwal-rilis/' });
}));

app.get('/genre-list', safe(async (req, res) => {
  const genres = await getGenres();
  res.render('genres', { genres, title: 'Genre List', active: '/genre-list/' });
}));

app.get('/genres/:genre', safe(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const data = await getGenreAnime(req.params.genre, page);
  res.render('list', { ...data, title: `Genre: ${data.genre}`, kind: `genres/${data.genre}`, active: null });
}));

app.get('/api/search', safe(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ success: true, data: { items: [] } });
  const items = await searchAnime(q);
  res.json({ success: true, data: { items } });
}));

app.post('/api/stream-resolve', express.json(), safe(async (req, res) => {
  const { payload } = req.body || {};
  if (!payload) return res.status(400).json({ success: false, error: 'payload required' });
  const src = await resolveMirror(payload);
  res.json({ success: true, data: { src } });
}));

app.post('/api/stream-direct', express.json(), safe(async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ success: false, error: 'url required' });
  const streams = await resolveBloggerStreams(url);
  res.json({ success: true, data: { streams } });
}));

app.post('/api/stream-direct-mirror', express.json(), safe(async (req, res) => {
  const body = req.body || {};
  const list = Array.isArray(body.payloads) ? body.payloads : (body.payload ? [body.payload] : []);
  if (!list.length) return res.status(400).json({ success: false, error: 'payload required' });
  const tried = [];
  for (const payload of list) {
    try {
      const { src, media } = await deepResolveMirror(payload);
      tried.push({ src, media: media || '' });
      if (media) return res.json({ success: true, data: { src, media } });
    } catch (e) { tried.push({ error: e.message }); }
  }
  res.json({ success: true, data: { src: (tried[0] && tried[0].src) || '', media: '', tried } });
}));

const GH_REPO = process.env.GH_REPO || 'Ajizzz13/otakudesu-app';
const GH_TOKEN = process.env.GH_TOKEN || '';
const assetCache = new Map();

function ghHeaders(extra = {}) {
  const h = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'otakudesu-local',
    ...extra,
  };
  if (GH_TOKEN) h['Authorization'] = 'Bearer ' + GH_TOKEN;
  return h;
}

async function findCompressedAsset(slug, quality) {
  const cacheKey = `${slug}:${quality}`;
  const hit = assetCache.get(cacheKey);
  if (hit && hit.exp > Date.now()) return hit.value;
  const assetName = `${slug}.${quality}.mp4`;
  let page = 1;
  let found = null;
  while (page <= 3 && !found) {
    const res = await fetch(`https://api.github.com/repos/${GH_REPO}/releases?per_page=30&page=${page}`, { headers: ghHeaders() });
    if (!res.ok) break;
    const releases = await res.json();
    if (!Array.isArray(releases) || !releases.length) break;
    for (const rel of releases) {
      const asset = (rel.assets || []).find((a) => a.name === assetName);
      if (asset) { found = { url: asset.browser_download_url, size: asset.size, release: rel.tag_name }; break; }
    }
    if (releases.length < 30) break;
    page += 1;
  }
  if (found) assetCache.set(cacheKey, { value: found, exp: Date.now() + 86400000 });
  return found;
}

async function dispatchCompress(slug, quality) {
  if (!GH_TOKEN) return { ok: false, error: 'GH_TOKEN not set (export GH_TOKEN=... before running)' };
  const res = await fetch(`https://api.github.com/repos/${GH_REPO}/actions/workflows/compress.yml/dispatches`, {
    method: 'POST',
    headers: ghHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ref: 'main', inputs: { slugs: slug, quality: quality || '360p', crf: '30', tag: `compressed-${slug}-${quality || '360p'}` } }),
  });
  if (res.status === 204) return { ok: true };
  const text = await res.text().catch(() => '');
  return { ok: false, error: `gh dispatch ${res.status}: ${text.slice(0, 200)}` };
}

app.get('/api/compress-status', safe(async (req, res) => {
  const slug = String(req.query.slug || '').trim();
  const quality = String(req.query.quality || '360p').trim();
  if (!slug) return res.status(400).json({ success: false, error: 'slug required' });
  const asset = await findCompressedAsset(slug, quality);
  if (asset) return res.json({ success: true, status: 'ready', url: asset.url, size: asset.size });
  res.json({ success: true, status: 'processing' });
}));

app.post('/api/ensure-compressed', express.json(), safe(async (req, res) => {
  const slug = String((req.body || {}).slug || '').trim();
  const quality = String((req.body || {}).quality || '360p').trim();
  if (!slug) return res.status(400).json({ success: false, error: 'slug required' });
  const asset = await findCompressedAsset(slug, quality);
  if (asset) return res.json({ success: true, status: 'ready', url: asset.url, size: asset.size });
  const dispatched = await dispatchCompress(slug, quality);
  if (!dispatched.ok) return res.status(502).json({ success: false, error: dispatched.error });
  res.json({ success: true, status: 'processing' });
}));

app.listen(PORT, () => console.log(`otakudesu-clean running on http://localhost:${PORT}`));