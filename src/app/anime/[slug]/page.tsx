import { getAnimeDetail } from '@/lib/scraper';
import Link from 'next/link';

export default async function AnimeDetail({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const anime = await getAnimeDetail(slug);

  if (!anime) return <div className="p-10 text-center">Anime tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-ink text-paper p-6 max-w-5xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-sm font-mono text-muted hover:text-accent">&larr; BACK TO GUIDE</Link>
        <span className="osd-label">CH·02 / DETAIL</span>
      </header>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="w-full md:w-1/3">
          <img src={anime.cover} alt={anime.title} className="w-full rounded-lg shadow-2xl border border-line" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-display text-paper mb-2">{anime.title}</h1>
          <div className="flex gap-4 mb-6 text-xs font-mono">
            <span className="px-2 py-1 bg-panel border border-line text-accent">SKOR: {anime.score}</span>
            <span className="px-2 py-1 bg-panel border border-line">{anime.status}</span>
          </div>
          <p className="text-muted text-sm leading-relaxed mb-8">{anime.synopsis}</p>
        </div>
      </div>

      <section>
        <div className="mb-6">
          <span className="osd-label">EP·LIST</span>
          <h2 className="text-xl font-display mt-1 text-paper">Daftar Episode</h2>
          <div className="h-px w-full bg-gradient-to-r from-accent/50 to-transparent mt-2" />
        </div>

        <div className="grid gap-2">
          {anime.episodes.map((ep: any, idx: number) => (
            <Link 
              key={idx} 
              href={`/episode/${ep.slug}`}
              className="flex justify-between items-center p-3 bg-panel border border-line rounded hover:border-accent group transition-colors"
            >
              <span className="text-sm group-hover:text-accent">{ep.title}</span>
              <span className="text-[10px] font-mono text-muted">{ep.date}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
