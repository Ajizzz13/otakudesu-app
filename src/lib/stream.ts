import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,*/*',
  Referer: 'https://otakudesu.blog/',
};

const VIDEO_RE = /https?:\/\/[^"'\s]+\.(mp4|m3u8)(\?[^"'\s]*)?/gi;

export async function resolveStream(url: string): Promise<{ type: 'video' | 'embed' | 'error'; src?: string; error?: string }> {
  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 20000 });
    const $ = cheerio.load(data);

    const ogVideo = $('meta[property="og:video"]').attr('content');
    if (ogVideo) return { type: 'video', src: ogVideo };

    const html = data as string;
    const matches = html.match(VIDEO_RE);
    if (matches?.length) return { type: 'video', src: matches[matches.length - 1] };

    const iframe = $('iframe').first().attr('src');
    if (iframe) return { type: 'embed', src: iframe };

    const videoTag = $('video source').first().attr('src') || $('video').attr('src');
    if (videoTag) return { type: 'video', src: videoTag };

    return { type: 'error', error: 'No playable source found.' };
  } catch (e: any) {
    return { type: 'error', error: e?.message || 'Resolver failed.' };
  }
}