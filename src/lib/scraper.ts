import axios from 'axios';
import * as cheerio from 'cheerio';
import { LRU } from './cache';
import type { AnimeInfo, AnimeItem, EpisodeStream, Paginated, ScheduleDay } from './types';

const BASE = (process.env.OTAKUDESU_BASE_URL || 'https://otakudesu.blog').replace(/\/$/, '');

const cache = new LRU<any>();

const HEADERS = [
  {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en;q=0.5',
    Referer: BASE + '/',
  },
  {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: BASE + '/ongoing-anime/',
  },
];

let lastFetch = 0;
const MIN_GAP = 500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function throttle() {
  const wait = MIN_GAP - (Date.now() - lastFetch);
  if (wait > 0) await sleep(wait);
  lastFetch = Date.now();
}

async function fetchHtml(url: string): Promise<string> {
  const hit = cache.get(url);
  if (hit) return hit;

  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    await throttle();
    try {
      const headers = HEADERS[attempt % HEADERS.length];
      const { data } = await axios.get(url, { headers, timeout: 20000 });
      cache.set(url, data);
      return data;
    } catch (err: any) {
      lastErr = err;
      if (err?.response?.status === 403 || err?.response?.status === 429) {
        await sleep(800 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function parseLastPage($: cheerio.CheerioAPI): number {
  const pages = $('.pagination a')
    .map((_, el) => parseInt($(el).text().trim(), 10))
    .get()
    .filter((n) => !isNaN(n));
  return pages.length ? Math.max(...pages) : 1;
}

function parseThumbList($: cheerio.CheerioAPI): AnimeItem[] {
  const items: AnimeItem[] = [];
  $('.venz ul li').each((_, el) => {
    const li = $(el);
    const a = li.find('a').first();
    const url = a.attr('href') || '';
    const slug = url.split('/anime/')[1]?.replace(/\/$/, '') || '';
    items.push({
      title: li.find('.jdlflm').text().trim() || a.text().trim(),
      cover: li.find('img').attr('src') || '',
      url,
      slug,
      episode: li.find('.epz').text().trim(),
      rating: li.find('.epztipe').text().trim() || li.find('.star').text().trim(),
      upload: li.find('.newnime').text().trim() || li.find('.dtl').text().trim(),
    });
  });
  return items;
}

/* ── home ─────────────────────────────────────────── */

export async function getHome(): Promise<{ ongoing: AnimeItem[]; complete: AnimeItem[] }> {
  try {
    const [ongoingHtml, completeHtml] = await Promise.all([
      fetchHtml(`${BASE}/ongoing-anime/`),
      fetchHtml(`${BASE}/complete-anime/`),
    ]);
    return {
      ongoing: parseThumbList(cheerio.load(ongoingHtml)),
      complete: parseThumbList(cheerio.load(completeHtml)),
    };
  } catch (err) {
    console.error('getHome:', err);
    return { ongoing: [], complete: [] };
  }
}

/* ── paginated lists ───────────────────────────────── */

export async function getOngoing(page = 1): Promise<Paginated<AnimeItem>> {
  try {
    const url = `${BASE}/ongoing-anime/${page > 1 ? `page/${page}/` : ''}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    return { items: parseThumbList($), page, totalPages: parseLastPage($) };
  } catch (err) {
    console.error('getOngoing:', err);
    return { items: [], page, totalPages: 1 };
  }
}

export async function getComplete(page = 1): Promise<Paginated<AnimeItem>> {
  try {
    const url = `${BASE}/complete-anime/${page > 1 ? `page/${page}/` : ''}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    return { items: parseThumbList($), page, totalPages: parseLastPage($) };
  } catch (err) {
    console.error('getComplete:', err);
    return { items: [], page, totalPages: 1 };
  }
}

export async function getAnimeList(page = 1): Promise<Paginated<AnimeItem>> {
  try {
    const url = `${BASE}/anime-list/${page > 1 ? `page/${page}/` : ''}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const items: AnimeItem[] = [];
    $('.listblk ul li').each((_, el) => {
      const a = $(el).find('a').first();
      const url = a.attr('href') || '';
      items.push({
        title: a.text().trim(),
        url,
        slug: url.split('/anime/')[1]?.replace(/\/$/, '') || '',
        cover: '',
      });
    });
    return { items, page, totalPages: parseLastPage($) };
  } catch (err) {
    console.error('getAnimeList:', err);
    return { items: [], page, totalPages: 1 };
  }
}

/* ── schedule & genres ─────────────────────────────── */

export async function getSchedule(): Promise<ScheduleDay[]> {
  try {
    const html = await fetchHtml(`${BASE}/jadwal-rilis/`);
    const $ = cheerio.load(html);
    const days: ScheduleDay[] = [];
    $('.kgjdwl').each((_, el) => {
      const day = $(el).find('h4').text().trim();
      const items: { title: string; url: string }[] = [];
      $(el).find('.kglist321 ul li').each((_, li) => {
        const a = $(li).find('a').first();
        items.push({ title: a.text().trim(), url: a.attr('href') || '' });
      });
      if (day) days.push({ day, items });
    });
    return days;
  } catch (err) {
    console.error('getSchedule:', err);
    return [];
  }
}

export async function getGenres(): Promise<{ name: string; url: string }[]> {
  try {
    const html = await fetchHtml(`${BASE}/genre-list/`);
    const $ = cheerio.load(html);
    const genres: { name: string; url: string }[] = [];
    $('.genres ul li').each((_, el) => {
      const a = $(el).find('a').first();
      genres.push({ name: a.text().trim(), url: a.attr('href') || '' });
    });
    return genres;
  } catch (err) {
    console.error('getGenres:', err);
    return [];
  }
}

export async function getGenreAnime(slug: string, page = 1): Promise<Paginated<AnimeItem>> {
  try {
    const url = `${BASE}/genres/${slug}/${page > 1 ? `page/${page}/` : ''}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    return { items: parseThumbList($), page, totalPages: parseLastPage($) };
  } catch (err) {
    console.error('getGenreAnime:', err);
    return { items: [], page, totalPages: 1 };
  }
}

/* ── search ────────────────────────────────────────── */

export async function searchAnime(query: string): Promise<AnimeItem[]> {
  try {
    const url = `${BASE}/?s=${encodeURIComponent(query)}&post_type=anime`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const items: AnimeItem[] = [];
    $('.chivsrc li').each((_, el) => {
      const li = $(el);
      const a = li.find('a').first();
      const url = a.attr('href') || '';
      items.push({
        title: li.find('h2').text().trim() || a.text().trim(),
        cover: li.find('img').attr('src') || '',
        url,
        slug: url.split('/anime/')[1]?.replace(/\/$/, '') || '',
        rating: li.find('.set').text().trim(),
        episode: li.find('.epz').text().trim(),
      });
    });
    return items;
  } catch (err) {
    console.error('searchAnime:', err);
    return [];
  }
}

/* ── anime detail ──────────────────────────────────── */

export async function getAnimeDetail(slug: string): Promise<AnimeInfo | null> {
  try {
    const html = await fetchHtml(`${BASE}/anime/${slug}/`);
    const $ = cheerio.load(html);

    const getInfo = (label: string) => {
      const p = $('.infozingle p').filter((_, el) =>
        $(el).find('.infozingle-title').text().includes(label)
      );
      return p.find('span:last-child').text().trim();
    };

    const episodes: AnimeInfo['episodes'] = [];
    $('.episodelist ul li').each((_, el) => {
      const a = $(el).find('a').first();
      episodes.push({
        title: a.text().trim(),
        url: a.attr('href') || '',
        slug: (a.attr('href') || '').split('/episode/')[1]?.replace(/\/$/, '') || '',
        date: $(el).find('.zeebr').text().trim() || $(el).find('i').text().trim(),
      });
    });

    return {
      title: $('.jdlrx').text().trim() || $('h1').text().trim(),
      japanese: getInfo('Japanese'),
      cover: $('.fotoanime img').attr('src') || '',
      score: getInfo('Skor'),
      producer: getInfo('Produser'),
      type: getInfo('Tipe'),
      status: getInfo('Status'),
      totalEpisodes: getInfo('Total Episode'),
      duration: getInfo('Durasi'),
      releaseDate: getInfo('Tanggal Rilis'),
      studio: getInfo('Studio'),
      genres: $('.infozingle p')
        .filter((_, el) => $(el).find('.infozingle-title').text().includes('Genre'))
        .find('a')
        .map((_, el) => ({ name: $(el).text().trim(), url: $(el).attr('href') || '' }))
        .get(),
      synopsis: $('.sinopc p').text().trim(),
      episodes: episodes.reverse(),
    };
  } catch (err) {
    console.error('getAnimeDetail:', err);
    return null;
  }
}

/* ── episode stream ────────────────────────────────── */

export async function getEpisodeStream(slug: string): Promise<EpisodeStream | null> {
  try {
    const html = await fetchHtml(`${BASE}/episode/${slug}/`);
    const $ = cheerio.load(html);

    const servers: { server: string; url: string }[] = [];
    $('.mirrorstream iframe').each((_, el) => {
      const iframe = $(el);
      const src = iframe.attr('src') || '';
      if (!src) return;
      const label = iframe
        .closest('.mirrorstream')
        .prevAll('h4, h3')
        .first()
        .text()
        .trim();
      const serverName = label || `SERVER ${servers.length + 1}`;
      servers.push({ server: serverName, url: src });
    });

    if (servers.length === 0) {
      $('.download h4').each((_, el) => {
        const quality = $(el).text().trim();
        const first = $(el).next('ul').find('li a').first();
        const url = first.attr('href') || '';
        if (url) servers.push({ server: `${quality} · ${first.text().trim()}`, url });
      });
    }

    const allHref = $('.flir a[href*="/anime/"]').first().attr('href') || '';
    const prevHref = $('.flir .prev a').attr('href') || '';
    const nextHref = $('.flir .next a').attr('href') || '';

    return {
      title: $('h1').text().trim(),
      defaultStreamingUrl: servers[0]?.url || '',
      servers,
      navigation: {
        prev: prevHref.split('/episode/')[1]?.replace(/\/$/, '') || null,
        next: nextHref.split('/episode/')[1]?.replace(/\/$/, '') || null,
        all: allHref.split('/anime/')[1]?.replace(/\/$/, '') || null,
      },
    };
  } catch (err) {
    console.error('getEpisodeStream:', err);
    return null;
  }
}