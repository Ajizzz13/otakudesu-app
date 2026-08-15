const path = require('path');
const express = require('express');
const {
  getHome, getAnimeDetail, getEpisodeStream, searchAnime, resolveMirror,
  getOngoing, getComplete, getAnimeList, getSchedule, getGenres, getGenreAnime,
  resolveBloggerStreams,
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
  res.render('episode', { ep, episodes, title: ep.title, activeSlug: req.params.slug, active: null });
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

app.listen(PORT, () => console.log(`otakudesu-clean running on http://localhost:${PORT}`));