import { getOngoingAnime } from '@/lib/scraper';

export default async function Home() {
  const ongoing = await getOngoingAnime();

  return (
    <div className="min-h-screen bg-ink text-paper p-6 max-w-7xl mx-auto">
      <header className="border-b border-line pb-4 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display text-accent tracking-wider">OTAKUDESU <span className="text-paper">CLEAN</span></h1>
          <p className="text-xs text-muted mt-1 font-mono">EDITION: EDITORIAL MINIMAL · NO ADS</p>
        </div>
        <span className="osd-label px-3 py-1 border border-line rounded bg-panel">REC · LIVE FEED</span>
      </header>

      <section className="mb-12">
        <div className="mb-6">
          <span className="osd-label">CH·01</span>
          <h2 className="text-xl font-display mt-1 text-paper">ONGOING RELEASES</h2>
          <div className="h-px w-full bg-gradient-to-r from-accent/50 to-transparent mt-2" />
        </div>

        {ongoing.length === 0 ? (
          <div className="border border-dashed border-line rounded p-12 text-center text-muted">
            <span className="osd-label block text-accent mb-2">NO SIGNAL</span>
            <p>Feed sedang diperbarui atau upstream mengalami gangguan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {ongoing.map((anime: any, idx: number) => (
              <div key={idx} className="bg-panel border border-line rounded-lg p-3 hover:border-accent transition-all group flex flex-col justify-between">
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
                  <span className="text-accent">STREAM</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-line pt-6 mt-12 flex justify-between items-center text-xs font-mono text-muted">
        <span>OTAKUDESU CLEAN STREAM · HALLMARK SYSTEM</span>
        <span>00:00:00</span>
      </footer>
    </div>
  );
}
