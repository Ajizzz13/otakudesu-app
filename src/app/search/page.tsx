import { searchAnime } from '@/lib/scraper';
import AnimeCard from '@/components/AnimeCard';
import SectionHead from '@/components/SectionHead';
import SearchBox from '@/components/SearchBox';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: qParam } = await searchParams;
  const q = (qParam || '').trim();
  const items = q.length >= 2 ? await searchAnime(q) : [];

  return (
    <section>
      <SectionHead tag="SEARCH" title={`HASIL UNTUK “${q || '…'}”`} />
      <div className="max-w-xl mb-8">
        <SearchBox />
      </div>
      {q.length < 2 ? (
        <div className="border border-dashed border-line rounded p-12 text-center font-mono text-sm text-muted">
          MIN 2 CHARACTERS
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-line rounded p-12 text-center">
          <span className="font-mono text-sm text-accent">NO RESULT</span>
          <p className="text-sm text-muted mt-2">Coba judul lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((a, i) => (
            <AnimeCard key={a.url} anime={a} eager={i < 8} />
          ))}
        </div>
      )}
    </section>
  );
}