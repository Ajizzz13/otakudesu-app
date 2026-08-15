import { getGenres } from '@/lib/scraper';
import SectionHead from '@/components/SectionHead';

export const revalidate = 3600;

export default async function GenreListPage() {
  const genres = await getGenres();

  return (
    <section>
      <SectionHead tag="A–Z" title="GENRE LIST" />
      {genres.length === 0 ? (
        <div className="border border-dashed border-line rounded p-12 text-center font-mono text-sm text-accent">
          NO SIGNAL
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2.5">
          {genres.map((g) => (
            <li key={g.url}>
              <a
                href={`/genres/${g.url.split('/genres/')[1]?.replace(/\/$/, '')}`}
                className="inline-block px-4 py-2 text-sm bg-panel border border-line rounded hover:border-accent hover:text-accent transition-colors"
              >
                {g.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}