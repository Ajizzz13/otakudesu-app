import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEpisode } from '@/lib/scraper';
import Player from '@/components/Player';
import SectionHead from '@/components/SectionHead';

export const revalidate = 300;

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = `https://otakudesu.blog/episode/${slug}/`;
  const ep = await getEpisode(url);
  if (!ep) notFound();

  const mirrorUrl = ep.downloads
    .slice()
    .reverse()
    .find((d) => d.links.length > 0)?.links[0]?.url;

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl text-paper leading-tight">{ep.title}</h1>
        <div className="flex flex-wrap gap-3 mt-3">
          {ep.prevUrl && (
            <Link
              href={`/episode/${ep.prevUrl.split('/episode/')[1]?.replace(/\/$/, '')}`}
              className="px-4 py-2 text-sm bg-panel border border-line rounded hover:border-accent transition-colors"
            >
              &larr; Prev
            </Link>
          )}
          {ep.animeUrl && (
            <Link
              href={`/anime/${ep.animeUrl.split('/anime/')[1]?.replace(/\/$/, '')}`}
              className="px-4 py-2 text-sm bg-panel border border-line rounded hover:border-accent transition-colors"
            >
              All Episodes
            </Link>
          )}
          {ep.nextUrl && (
            <Link
              href={`/episode/${ep.nextUrl.split('/episode/')[1]?.replace(/\/$/, '')}`}
              className="px-4 py-2 text-sm bg-panel border border-line rounded hover:border-accent transition-colors"
            >
              Next &rarr;
            </Link>
          )}
        </div>
      </div>

      <Player title={ep.title} downloadUrl={mirrorUrl} />

      <section className="mt-10">
        <SectionHead tag="MIRROR" title="DOWNLOAD LINKS" />
        {ep.downloads.length === 0 ? (
          <div className="border border-dashed border-line rounded p-10 text-center font-mono text-sm text-accent">
            NO LINK
          </div>
        ) : (
          <div className="space-y-6">
            {ep.downloads.map((d) => (
              <div key={d.quality} className="bg-panel border border-line rounded-lg p-4">
                <h3 className="font-mono text-sm text-accent mb-3">{d.quality}</h3>
                <ul className="flex flex-wrap gap-2">
                  {d.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-3 py-1.5 text-xs bg-panel-2 border border-line rounded hover:border-accent hover:text-accent transition-colors"
                      >
                        {l.label}
                        {l.size && <span className="text-muted ml-1.5">· {l.size}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <SectionHead tag="EPISODES" title="DAFTAR EPISODE" />
        {ep.episodes.length === 0 ? (
          <div className="border border-dashed border-line rounded p-10 text-center font-mono text-sm text-accent">
            NO EPISODE
          </div>
        ) : (
          <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ep.episodes.map((e) => (
              <li key={e.url}>
                <a
                  href={`/episode/${e.url.split('/episode/')[1]?.replace(/\/$/, '')}`}
                  className="block px-3.5 py-2.5 bg-panel border border-line rounded text-sm hover:border-accent hover:text-accent transition-colors"
                >
                  {e.title}
                </a>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}