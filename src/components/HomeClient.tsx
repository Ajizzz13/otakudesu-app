'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomeClient({ ongoing }: { ongoing: any[] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen bg-ink text-paper p-6 max-w-7xl mx-auto">
      <header className="border-b border-line pb-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-display text-accent tracking-wider">OTAKUDESU <span className="text-paper">CLEAN</span></h1>
          <p className="text-xs text-muted mt-1 font-mono">EDITION: EDITORIAL MINIMAL · NO ADS · REALTIME SEARCH</p>
        </div>
        
        {/* Realtime Search Input */}
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari anime..." 
            className="w-full bg-panel border border-line rounded px-3 py-1.5 text-sm text-paper focus:outline-none focus:border-accent"
          />
          {loading && <span className="absolute right-3 top-2 text-xs font-mono text-accent">Cari...</span>}

          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-panel border border-line rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
              {results.map((item, idx) => (
                <Link 
                  key={idx} 
                  href={`/anime/${item.slug}`}
                  onClick={() => setQuery('')}
                  className="flex items-center gap-3 p-2 hover:bg-line border-b border-line last:border-0"
                >
                  <img src={item.cover} alt={item.title} className="w-10 h-12 object-cover rounded" />
                  <span className="text-xs font-medium text-paper line-clamp-2">{item.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      <section className="mb-12">
        <div className="mb-6">
          <span className="osd-label">CH·01</span>
          <h2 className="text-xl font-display mt-1 text-paper">ONGOING RELEASES</h2>
          <div className="h-px w-full bg-gradient-to-r from-accent/50 to-transparent mt-2" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {ongoing.map((anime: any, idx: number) => (
            <Link key={idx} href={`/anime/${anime.slug}`} className="bg-panel border border-line rounded-lg p-3 hover:border-accent transition-all group flex flex-col justify-between">
              <div>
                <div className="relative aspect-[3/4] overflow-hidden rounded mb-3 bg-panel2">
                  <img 
                    src={anime.cover} 
                    alt={anime.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    {...(idx < 8 ? { fetchPriority: 'high', loading: 'eager' } : { loading: 'lazy' })}
                  />
                </div>
                <h3 className="text-xs font-body font-medium line-clamp-2 text-paper group-hover:text-accent transition-colors">{anime.title}</h3>
              </div>
              <div className="mt-3 pt-3 border-t border-line/50 flex justify-between items-center text-[10px] font-mono text-muted">
                <span>ANIME</span>
                <span className="text-accent">WATCH</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-line pt-6 mt-12 flex justify-between items-center text-xs font-mono text-muted">
        <span>OTAKUDESU CLEAN STREAM · HALLMARK SYSTEM</span>
        <span>00:00:00</span>
      </footer>
    </div>
  );
}
