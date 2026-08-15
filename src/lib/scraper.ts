import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://otakudesu.blog';

export async function getOngoingAnime() {
  const { data } = await axios.get(`${BASE_URL}/ongoing-anime/`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  
  const $ = cheerio.load(data);
  const animeList: any[] = [];
  
  $('.venz ul li').each((_, el) => {
    const title = $(el).find('.jdlflm').text();
    const cover = $(el).find('img').attr('src');
    const link = $(el).find('a').attr('href');
    
    animeList.push({ title, cover, link });
  });
  
  return animeList;
}
