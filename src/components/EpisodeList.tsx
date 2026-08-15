'use client';

import { useMemo, useState } from 'react';

export default function EpisodeList({
  episodes,
  activeSlug,
}: {
  episodes: { title: string; slug: string; date?: string }[];
  activeSlug?: string;
}) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return episodes;
    return episodes.filter((e) => e.title.toLowerCase().includes(query) || e.slug.toLowerCase().includes(query));
  }, [episodes, q]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-xs text-accent tracking-[0.2em]">EPISODES</span>
        <span className="font-mono text-[10px] text-muted">{filtered.length}/{episodes.length}</span>
      </div>
      <input
        type="search"
        placeholder="Filter episodes…"
        aria-label="Filter episodes"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-panel border border-line rounded mb-3 placeholder:text-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      />
      {filtered.length === 0 ? (
        <p className="p-4 text-center font-mono text-xs text-muted border border-dashed border-line rounded">
          NO EPISODE
        </p>
      ) : (
        <ol className="max-h-[26rem] overflow-y-auto space-y-1.5 pr-1">
          {filtered.map((ep) => {
            const active = ep.slug === activeSlug;
            return (
              <li key={ep.slug || ep.title}>
                <a
                  href={`/episode/${ep.slug}`}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'flex items-center justify-between gap-2 px-3 py-2 text-sm bg-accent text-accent-ink rounded transition-colors'
                      : 'flex items-center justify-between gap-2 px-3 py-2 text-sm bg-panel border border-line rounded text-paper hover:border-accent hover:text-accent transition-colors'
                  }
                >
                  <span className="leading-snug">{ep.title}</span>
                  {ep.date && <span className="font-mono text-[10px] text-muted shrink-0">{ep.date}</span>}
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}