import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://otakudesu.blog';

// Scraper function to get anime episode details
export async function getEpisodeDetail(url: string) {
  try {
    const { data } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': BASE_URL
      }
    });
    
    const $ = cheerio.load(data);
    const episodeData: any = {
      title: $('h1').text(),
      mirror: []
    };
    
    // Extract download links
    $('.download h4').each((_, el) => {
      const quality = $(el).text();
      const links = $(el).next('ul').find('li').map((_, li) => ({
        provider: $(li).find('a').text(),
        url: $(li).find('a').attr('href')
      })).get();
      
      episodeData.mirror.push({ quality, links });
    });
    
    return episodeData;
  } catch (error) {
    console.error('Episode Scraper Error:', error);
    return null;
  }
}
