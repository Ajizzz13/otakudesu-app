import { getOngoingAnime } from '@/lib/scraper';

export default async function Home() {
  const ongoing = await getOngoingAnime();

  return (
    <div className="min-h-screen bg-ink text-paper p-6">
      <header className="border-b border-line pb-4 mb-6 flex justify-between items-center">
        <h1 className="text-xl font-display text-accent">OTAKUDESU <span className="text-paper">CLEAN</span></h1>
        <span className="osd-label">REC · LIVE FEED</span>
      </header>

      <section>
        <div className="mb-4">
          <span className="osd-label">CH·01</span>
          <h2 className="text-lg font-display">ONGOING RELEASES</h2>
          <div className="h-px bg-line mt-1" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ongoing.map((anime: any, idx: number) => (
            <div key={idx} className="bg-panel border border-line rounded p-2 hover:border-accent transition-colors">
              <img 
                src={anime.cover} 
                alt={anime.title} 
                className="w-full aspect-[3/4] object-cover mb-2 rounded"
                {...(idx < 8 ? { fetchPriority: 'high', loading: 'eager' } : { loading: 'lazy' })}
              />
              <h3 className="text-xs font-body line-clamp-2">{anime.title}</h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
