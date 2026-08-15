import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAnimeDetail } from '@/lib/scraper';
import EpisodeList from '@/components/EpisodeList';

export const dynamic = 'force-dynamic';

export default async function AnimeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await getAnimeDetail(slug);
  if (!info) notFound();

  const rows: [string, string][] = [
    ['Japanese', info.japanese],
    ['Skor', info.score],
    ['Produser', info.producer],
    ['Tipe', info.type],
    ['Status', info.status],
    ['Total Episode', info.totalEpisodes],
    ['Durasi', info.duration],
    ['Tanggal Rilis', info.releaseDate],
    ['Studio', info.studio],
  ];

  return (
    <>
      <div className="grid md:grid-cols-[240px_1fr] gap-8">
        <div>
          {info.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={info.cover}
              alt={info.title}
              className="w-full aspect-[3/4] object-cover rounded-lg border border-line"
              fetchPriority="high"
            />
          ) : (
            <div className="w-full aspect-[3/4] rounded-lg border border-line flex items-center justify-center font-mono text-xs text-muted">
              NO COVER
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {info.genres.map((g) => (
              <Link
                key={g.url}
                href={`/genres/${g.url.split('/genres/')[1]?.replace(/\/$/, '')}`}
                className="px-2.5 py-1 text-xs bg-panel border border-line rounded hover:border-accent hover:text-accent transition-colors"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h1 className="font-display text-2xl text-paper leading-tight">{info.title}</h1>
          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
            {rows.map(
              ([k, v]) =>
                v && (
                  <div key={k} className="flex gap-3 border-b border-line/40 pb-2">
                    <dt className="font-mono text-xs text-muted shrink-0 w-28">{k.toUpperCase()}</dt>
                    <dd className="text-sm text-paper">{v}</dd>
                  </div>
                )
            )}
          </dl>
          <div className="mt-6">
            <h2 className="font-mono text-xs text-accent tracking-[0.2em] mb-2">SINOPSIS</h2>
            <p className="text-sm text-muted leading-relaxed">{info.synopsis}</p>
          </div>
        </div>
      </div>

      <section className="mt-14">
        <EpisodeList
          episodes={info.episodes.map((e) => ({ title: e.title, slug: e.slug, date: e.date }))}
        />
      </section>
    </>
  );
}