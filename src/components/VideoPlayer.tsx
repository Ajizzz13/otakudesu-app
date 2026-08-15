'use client';

import { useEffect, useState } from 'react';
import type { ServerStream } from '@/lib/types';

export default function VideoPlayer({
  title,
  servers,
  defaultUrl,
}: {
  title: string;
  servers: ServerStream[];
  defaultUrl: string;
}) {
  const [current, setCurrent] = useState<string>(defaultUrl);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    setStatus('loading');
    const t = setTimeout(() => setStatus(current ? 'ready' : 'error'), 500);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <div>
      <div className="aspect-video bg-black border border-line rounded-lg overflow-hidden">
        {status === 'loading' && (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-mono text-sm text-accent animate-pulse">LOADING FEED…</span>
          </div>
        )}
        {status === 'error' && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="font-mono text-sm text-accent">LOST FEED</span>
            <p className="text-xs text-muted px-4 text-center">Coba ganti server di bawah.</p>
          </div>
        )}
        {status === 'ready' && current && (
          <iframe
            key={current}
            src={current}
            title={title}
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      {servers.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Server">
          {servers.map((s, i) => {
            const active = s.url === current;
            return (
              <button
                key={i}
                onClick={() => setCurrent(s.url)}
                aria-pressed={active}
                className={
                  active
                    ? 'px-3 py-1.5 text-xs font-mono bg-accent text-accent-ink border border-accent rounded transition-colors'
                    : 'px-3 py-1.5 text-xs font-mono bg-panel border border-line rounded text-muted hover:border-accent hover:text-accent transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2'
                }
              >
                {s.server}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}