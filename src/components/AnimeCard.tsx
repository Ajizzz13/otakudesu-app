import Link from 'next/link';
import type { AnimeItem } from '@/lib/types';

export default function AnimeCard({ anime, eager }: { anime: AnimeItem; eager?: boolean }) {
  const href = anime.url.includes('/episode/')
    ? `/episode/${anime.url.split('/episode/')[1]?.replace(/\/$/, '')}`
    : `/anime/${anime.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col bg-panel border border-line rounded-lg p-2.5 hover:border-accent transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded bg-panel-2 mb-2.5">
        {anime.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anime.cover}
            alt={anime.title}
            className="w-full h-full object-cover"
            loading={eager ? 'eager' : 'lazy'}
            {...(eager ? { fetchPriority: 'high' } : {})}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-mono text-xs text-muted">NO COVER</div>
        )}
        {anime.episode && (
          <span className="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 text-[10px] font-mono bg-ink/85 text-accent rounded">
            {anime.episode}
          </span>
        )}
      </div>
      <h3 className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
        {anime.title}
      </h3>
      {anime.rating && (
        <p className="mt-1.5 pt-1.5 border-t border-line/50 font-mono text-[10px] text-muted">{anime.rating}</p>
      )}
    </Link>
  );
}