import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://otakudesu.blog';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Referer': BASE_URL
};

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
