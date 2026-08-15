import { getHome } from '@/lib/scraper';
import AnimeCard from '@/components/AnimeCard';
import SectionHead from '@/components/SectionHead';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { ongoing, complete } = await getHome();

  return (
    <>
      <section>
        <SectionHead tag="CH·01" title="ONGOING RELEASES" />
        {ongoing.length === 0 ? (
          <div className="border border-dashed border-line rounded p-12 text-center">
            <span className="font-mono text-sm text-accent">NO SIGNAL</span>
            <p className="text-sm text-muted mt-2">Feed sedang diperbarui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {ongoing.map((a, i) => (
              <AnimeCard key={a.url} anime={a} eager={i < 8} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <SectionHead tag="CH·02" title="COMPLETE ANIME" />
        {complete.length === 0 ? (
          <div className="border border-dashed border-line rounded p-12 text-center text-sm text-muted">
            NO SIGNAL — feed sedang diperbarui.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {complete.map((a) => (
              <AnimeCard key={a.url} anime={a} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}