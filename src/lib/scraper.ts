import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://otakudesu.blog';

export async function getOngoingAnime() {
  try {
    const { data } = await axios.get(`${BASE_URL}/ongoing-anime/`, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://otakudesu.blog/'
      }
    });
    
    const $ = cheerio.load(data);
    const animeList: any[] = [];
    
    $('.venz ul li').each((_, el) => {
      const title = $(el).find('.jdlflm').text();
      const cover = $(el).find('img').attr('src');
      const link = $(el).find('a').attr('href');
      
      if (title && cover && link) {
        animeList.push({ title, cover, link });
      }
    });
    
    return animeList;
  } catch (error) {
    console.error('Scraper Error:', error);
    return [];
  }
}
