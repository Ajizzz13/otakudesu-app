import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://otakudesu.blog';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Referer': BASE_URL
};

export async function getOngoingAnime() {
  try {
    const { data } = await axios.get(`${BASE_URL}/ongoing-anime/`, { headers: HEADERS });
    const $ = cheerio.load(data);
    const animeList: any[] = [];
    
    $('.venz ul li').each((_, el) => {
      const title = $(el).find('.jdlflm').text().trim();
      const cover = $(el).find('img').attr('src');
      const link = $(el).find('a').attr('href');
      const slug = link ? link.replace(`${BASE_URL}/anime/`, '').replace('/', '') : '';
      
      if (title && cover && link) {
        animeList.push({ title, cover, link, slug });
      }
    });
    
    return animeList;
  } catch (error) {
    console.error('Ongoing Scraper Error:', error);
    return [];
  }
}

export async function searchAnime(query: string) {
  try {
    const { data } = await axios.get(`${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=anime`, { headers: HEADERS });
    const $ = cheerio.load(data);
    const searchResults: any[] = [];
    
    $('.chlist li, .venz ul li').each((_, el) => {
      const title = $(el).find('h2 a, .jdlflm').text().trim();
      const link = $(el).find('h2 a, a').attr('href');
      const cover = $(el).find('img').attr('src');
      const slug = link ? link.replace(`${BASE_URL}/anime/`, '').replace('/', '') : '';
      
      if (title && link) {
        searchResults.push({ title, cover, link, slug });
      }
    });
    
    return searchResults;
  } catch (error) {
    console.error('Search Scraper Error:', error);
    return [];
  }
}

export async function getAnimeDetail(slug: string) {
  try {
    const { data } = await axios.get(`${BASE_URL}/anime/${slug}/`, { headers: HEADERS });
    const $ = cheerio.load(data);
    
    const title = $('.fotoanime .infoanime p:contains("Judul")').text().replace('Judul:', '').trim() || $('h1').text().trim();
    const cover = $('.fotoanime img').attr('src');
    const synopsis = $('.sinopsc').text().trim();
    const score = $('.fotoanime .infoanime p:contains("Skor")').text().replace('Skor:', '').trim();
    const status = $('.fotoanime .infoanime p:contains("Status")').text().replace('Status:', '').trim();
    
    const episodes: any[] = [];
    $('.episodelist ul li').each((_, el) => {
      const epTitle = $(el).find('a').text().trim();
      const epLink = $(el).find('a').attr('href');
      const epSlug = epLink ? epLink.replace(`${BASE_URL}/episode/`, '').replace('/', '') : '';
      const date = $(el).find('.zee-release').text().trim();
      
      if (epTitle && epLink) {
        episodes.push({ title: epTitle, link: epLink, slug: epSlug, date });
      }
    });
    
    return { title, cover, synopsis, score, status, episodes };
  } catch (error) {
    console.error('Detail Scraper Error:', error);
    return null;
  }
}

export async function getEpisodeStream(slug: string) {
  try {
    const { data } = await axios.get(`${BASE_URL}/episode/${slug}/`, { headers: HEADERS });
    const $ = cheerio.load(data);
    
    const title = $('h1').text().trim();
    const streamIframe = $('#stream1 iframe, .responsive-embed-stream iframe').attr('src');
    
    const mirrors: any[] = [];
    $('.mirrorstream ul li').each((_, el) => {
      const quality = $(el).parent().prev('h3').text().trim();
      const name = $(el).find('a').text().trim();
      const url = $(el).find('a').attr('href');
      
      mirrors.push({ quality, name, url });
    });
    
    return { title, streamIframe, mirrors };
  } catch (error) {
    console.error('Episode Stream Error:', error);
    return null;
  }
}
