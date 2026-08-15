import Link from 'next/link';

export default function EpisodeNav({
  prev,
  next,
  all,
}: {
  prev: string | null;
  next: string | null;
  all: string | null;
}) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Episode navigation">
      {prev ? (
        <Link
          href={`/episode/${prev}`}
          className="px-4 py-2 text-sm bg-panel border border-line rounded hover:border-accent hover:text-accent transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          &larr; Prev
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm bg-panel border border-line rounded opacity-40">Prev</span>
      )}
      {all && (
        <Link
          href={`/anime/${all}`}
          className="px-4 py-2 text-sm bg-panel border border-line rounded hover:border-accent hover:text-accent transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          All Episodes
        </Link>
      )}
      {next ? (
        <Link
          href={`/episode/${next}`}
          className="px-4 py-2 text-sm bg-panel border border-line rounded hover:border-accent hover:text-accent transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Next &rarr;
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm bg-panel border border-line rounded opacity-40">Next</span>
      )}
    </nav>
  );
}