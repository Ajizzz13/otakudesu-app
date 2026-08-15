'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

interface Result {
  title: string;
  cover: string;
  url: string;
  episode?: string;
  rating?: string;
}

export default function SearchBox() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function onInput(q: string) {
    const value = q.trim();
    if (timer.current) clearTimeout(timer.current);
    if (value.length < 2) {
      setOpen(false);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    setOpen(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data.items || []);
        setStatus('done');
      } catch {
        setStatus('error');
      }
    }, 300);
  }

  function go(url: string) {
    setOpen(false);
    const ep = url.split('/episode/')[1]?.replace(/\/$/, '');
    if (ep) return router.push(`/episode/${ep}`);
    const an = url.split('/anime/')[1]?.replace(/\/$/, '');
    if (an) return router.push(`/anime/${an}`);
    window.location.href = url;
  }

  return (
    <div className="relative">
      <input
        type="search"
        placeholder="Search titles…"
        aria-label="Search anime"
        onChange={(e) => onInput(e.target.value)}
        onFocus={() => onInput((document.activeElement as HTMLInputElement)?.value || '')}
        className="w-full px-3 py-2 text-sm bg-panel border border-line rounded focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 placeholder:text-muted"
      />
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto bg-panel-2 border border-line rounded shadow-lg z-20">
          {status === 'loading' && <p className="p-3 text-xs font-mono text-muted">SCANNING…</p>}
          {status === 'error' && <p className="p-3 text-xs font-mono text-accent">SEARCH ERROR</p>}
          {status === 'done' && results.length === 0 && (
            <p className="p-3 text-xs font-mono text-muted">NO RESULT</p>
          )}
          {status === 'done' &&
            results.map((r, i) => (
              <button
                key={i}
                onClick={() => go(r.url)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-panel transition-colors"
              >
                {r.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.cover} alt="" className="w-8 h-8 object-cover rounded" loading="lazy" />
                )}
                <span className="text-sm line-clamp-2 flex-1">{r.title}</span>
                {r.episode && <span className="font-mono text-[10px] text-muted whitespace-nowrap">{r.episode}</span>}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}