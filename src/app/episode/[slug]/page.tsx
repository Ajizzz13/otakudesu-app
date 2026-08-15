import { notFound } from 'next/navigation';
import { getAnimeDetail, getEpisodeStream } from '@/lib/scraper';
import VideoPlayer from '@/components/VideoPlayer';
import EpisodeNav from '@/components/EpisodeNav';
import EpisodeList from '@/components/EpisodeList';

export const dynamic = 'force-dynamic';

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ep = await getEpisodeStream(slug);
  if (!ep) notFound();

  let episodes: { title: string; slug: string; date?: string }[] = [];
  if (ep.navigation.all) {
    const detail = await getAnimeDetail(ep.navigation.all);
    episodes = detail?.episodes.map((e) => ({ title: e.title, slug: e.slug, date: e.date })) || [];
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl text-paper leading-tight">{ep.title}</h1>
        <div className="mt-4">
          <EpisodeNav prev={ep.navigation.prev} next={ep.navigation.next} all={ep.navigation.all} />
        </div>
      </div>

      {ep.servers.length === 0 ? (
        <div className="aspect-video bg-black border border-line rounded-lg flex items-center justify-center">
          <span className="font-mono text-sm text-accent">LOST FEED</span>
        </div>
      ) : (
        <VideoPlayer title={ep.title} servers={ep.servers} defaultUrl={ep.defaultStreamingUrl} />
      )}

      {episodes.length > 0 && (
        <aside className="mt-10">
          <EpisodeList episodes={episodes} activeSlug={slug} />
        </aside>
      )}
    </>
  );
}