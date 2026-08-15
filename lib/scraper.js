const axios = require('axios');
const cheerio = require('cheerio');

const BASE = process.env.OTAKUDESU_BASE_URL || 'https://otakudesu.blog';

const UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];

let queue = Promise.resolve();
function throttled(fn) {
  const run = queue.then(fn);
  queue = run.catch(() => {});
  return run;
}

async function fetchHtml(url) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await throttled(() =>
        axios.get(url, {
          headers: {
            'User-Agent': UAS[attempt % UAS.length],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
          },
          timeout: 20000,
        })
      );
      const html = String(res.data);
      if (html.includes('Attention Required') || html.includes('Just a moment')) {
        throw new Error('cf_challenge');
      }
      return html;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr || new Error('fetch failed');
}

function load(url) {
  return fetchHtml(url).then((html) => cheerio.load(html));
}

function slugOf(url) {
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1] || null;
}

function parseThumbList($) {
  const items = [];
  $('.venz ul li').each((_, el) => {
    const $el = $(el);
    const $a = $el.find('.thumb a, a[href*="/anime/"]').first();
    const $img = $el.find('img').first();
    const url = $a.attr('href');
    if (!url) return;
    items.push({
      title: $el.find('.jdlflm').text().trim() || $a.attr('title') || '',
      cover: $img.attr('src') || '',
      slug: slugOf(url),
      url,
      episode: $el.find('.epz').text().trim() || undefined,
      rating: $el.find('.epztipe').text().trim() || undefined,
      date: $el.find('.newnime').text().trim() || undefined,
    });
  });
  return items;
}

async function getHome() {
  const [ongoing$, complete$] = await Promise.all([
    load(`${BASE}/ongoing-anime/`),
    load(`${BASE}/complete-anime/`),
  ]);
  return { ongoing: parseThumbList(ongoing$), complete: parseThumbList(complete$) };
}

async function getAnimeDetail(slug) {
  const $ = await load(`${BASE}/anime/${slug}/`);
  const info = { title: '', japanese: '', cover: '', score: '', producer: '', type: '', status: '', totalEpisodes: '', duration: '', releaseDate: '', studio: '', genres: [], synopsis: '', episodes: [] };

  info.title = $('.jdlrx h1, .posttl h1').first().text().trim() || slug;
  info.cover = $('.fotoanime img').attr('src') || '';

  $('.infozingle p').each((_, el) => {
    const text = $(el).text().trim();
    const idx = text.indexOf(':');
    if (idx === -1) return;
    const key = text.slice(0, idx).trim().toLowerCase();
    const value = text.slice(idx + 1).trim();
    const map = {
      japanese: 'japanese', skor: 'score', produser: 'producer', tipe: 'type',
      status: 'status', 'total episode': 'totalEpisodes', durasi: 'duration',
      'tanggal rilis': 'releaseDate', studio: 'studio',
    };
    const field = map[key];
    if (field) info[field] = value;
  });

  $('.genres li a').each((_, el) => {
    info.genres.push({ name: $(el).text().trim(), url: $(el).attr('href') || '' });
  });

  info.synopsis = $('.sinopc').text().trim();

  $('.episodelist ul li').each((_, el) => {
    const $a = $(el).find('a').first();
    const url = $a.attr('href');
    const epSlug = slugOf(url);
    if (!url) return;
    info.episodes.push({
      title: $a.text().trim() || $(el).find('span.zeebr').text().trim(),
      url,
      slug: epSlug,
      date: $(el).find('span.zeebr').text().trim() || '',
    });
  });
  info.episodes.reverse();

  return info;
}

async function getEpisodeStream(slug) {
  const pageUrl = `${BASE}/episode/${slug}/`;
  const $ = await load(pageUrl);
  const title = $('.posttl').first().text().trim() || slug;
  const defaultStreamingUrl = $('#pembed iframe').attr('src') || '';

  const mirrors = [];
  $('.mirrorstream ul').each((_, ul) => {
    const $ul = $(ul);
    const quality = ($ul.attr('class') || '').replace(/^m/, '').replace(/p$/, '') + 'p';
    $ul.find('li a[data-content]').each((_, a) => {
      mirrors.push({
        server: $(a).text().trim() || 'Mirror',
        quality,
        payload: $(a).attr('data-content') || '',
      });
    });
  });

  const nav = { prev: null, next: null, all: null };
  $('.flir a').each((_, a) => {
    const $a = $(a);
    const text = $a.text().toLowerCase();
    const titleAttr = ($a.attr('title') || '').toLowerCase();
    const link = $a.attr('href') || '';
    if (titleAttr.includes('prev') || text.includes('prev')) nav.prev = slugOf(link);
    if (titleAttr.includes('next') || text.includes('next')) nav.next = slugOf(link);
    if (text.includes('all')) nav.all = slugOf(link);
  });

  const sizes = [];
  $('.download ul li').each((_, li) => {
    const $li = $(li);
    const quality = $li.find('strong').first().text().trim();
    const size = $li.find('i').first().text().trim();
    if (quality && size) sizes.push({ quality, size });
  });

  const mp4 = sizes.filter((s) => !/mkv/i.test(s.quality));
  const shown = mp4.length ? mp4 : sizes;
  const seen = new Set();
  const uniqueSizes = [];
  for (const s of shown) {
    if (seen.has(s.quality)) continue;
    seen.add(s.quality);
    uniqueSizes.push(s);
  }

  return { title, defaultStreamingUrl, mirrors, navigation: nav, sizes: uniqueSizes };
}

let nonceCache = { value: null, at: 0 };
async function getNonce() {
  if (nonceCache.value && Date.now() - nonceCache.at < 5 * 60 * 1000) return nonceCache.value;
  const res = await axios.post(`${BASE}/wp-admin/admin-ajax.php`, 'action=aa1208d27f29ca340c92c66d1926f13f', {
    headers: { ...ajaxHeaders(), 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    timeout: 20000,
  });
  const nonce = res.data && res.data.data;
  if (!nonce) throw new Error('nonce failed');
  nonceCache = { value: nonce, at: Date.now() };
  return nonce;
}

function ajaxHeaders() {
  return {
    'User-Agent': UAS[0],
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': BASE + '/',
  };
}

async function resolveMirror(payload) {
  let parsed;
  try { parsed = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')); }
  catch { throw new Error('bad payload'); }
  const { id, i, q } = parsed;
  const nonce = await getNonce();
  const res = await axios.post(
    `${BASE}/wp-admin/admin-ajax.php`,
    `action=2a3505c93b0035d3f455df82bf976b84&nonce=${encodeURIComponent(nonce)}&id=${encodeURIComponent(id)}&i=${encodeURIComponent(i)}&q=${encodeURIComponent(q)}`,
    { headers: { ...ajaxHeaders(), 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, timeout: 25000 }
  );
  const html = Buffer.from(res.data.data || '', 'base64').toString('utf8');
  const src = (html.match(/<iframe[^>]+src="([^"]+)"/) || [])[1] || '';
  if (!src) throw new Error('resolve empty');
  return src;
}

async function searchAnime(q) {
  const $ = await load(`${BASE}/?s=${encodeURIComponent(q)}&post_type=anime`);
  const items = [];
  $('.chivsrc li').each((_, el) => {
    const $el = $(el);
    const $a = $el.find('h2 a, a[href*="/anime/"]').first();
    const url = $a.attr('href');
    if (!url) return;
    const sets = {};
    $el.find('.set').each((_, s) => {
      const text = $(s).text().trim();
      const idx = text.indexOf(':');
      if (idx === -1) return;
      sets[text.slice(0, idx).trim().toLowerCase()] = text.slice(idx + 1).trim();
    });
    items.push({
      title: $a.text().trim(),
      cover: $el.find('img').attr('src') || '',
      slug: slugOf(url),
      url,
      rating: sets.rating || undefined,
      status: sets.status || undefined,
    });
  });
  return items;
}

async function getOngoing(page = 1) {
  const $ = await load(`${BASE}/ongoing-anime/page/${page}/`);
  const items = parseThumbList($);
  let totalPages = Math.max(1, page);
  $('.pagination a').each((_, a) => {
    const href = $(a).attr('href') || '';
    const m = href.match(/page\/(\d+)/);
    if (m) totalPages = Math.max(totalPages, parseInt(m[1], 10));
  });
  return { items, page, totalPages };
}

async function getComplete(page = 1) {
  const $ = await load(`${BASE}/complete-anime/page/${page}/`);
  return { items: parseThumbList($), page, totalPages: page };
}

async function getAnimeList(page = 1) {
  const $ = await load(`${BASE}/anime-list/`);
  const items = [];
  $('.daftarkartun a[href*="/anime/"]').each((_, a) => {
    const url = $(a).attr('href') || '';
    const title = $(a).text().trim();
    if (!url || !title) return;
    items.push({ title, slug: slugOf(url), url });
  });
  return { items, page, totalPages: 1 };
}

async function getSchedule() {
  const $ = await load(`${BASE}/jadwal-rilis/`);
  const days = [];
  $('.kglist321').each((_, el) => {
    const $el = $(el);
    const day = $el.find('h2').first().text().trim() || 'Hari';
    const list = [];
    $el.find('ul li a').each((_, a) => {
      const url = $(a).attr('href') || '';
      list.push({ title: $(a).text().trim(), url });
    });
    if (list.length) days.push({ day, items: list });
  });
  return days;
}

async function getGenres() {
  const $ = await load(`${BASE}/genre-list/`);
  const items = [];
  $('.genres li a').each((_, a) => {
    const $a = $(a);
    const url = $a.attr('href') || '';
    items.push({ name: $a.text().trim(), slug: slugOf(url), url });
  });
  return items;
}

async function getGenreAnime(genre, page = 1) {
  const url = page > 1 ? `${BASE}/genres/${genre}/page/${page}/` : `${BASE}/genres/${genre}/`;
  const $ = await load(url);
  const items = [];
  $('.col-anime').each((_, el) => {
    const $a = $(el).find('a').first();
    const url = $a.attr('href');
    if (!url) return;
    items.push({
      title: $(el).find('.col-anime-title').text().trim() || $a.attr('title') || '',
      cover: $(el).find('img').attr('src') || '',
      slug: slugOf(url),
      url,
      episode: $(el).find('.episode').text().trim() || undefined,
      rating: $(el).find('.rating').text().trim() || undefined,
      status: $(el).find('.status').text().trim() || undefined,
    });
  });
  return { items, page, totalPages: page, genre };
}

module.exports = {
  BASE, getHome, getAnimeDetail, getEpisodeStream, searchAnime, resolveMirror,
  getOngoing, getComplete, getAnimeList, getSchedule, getGenres, getGenreAnime,
};