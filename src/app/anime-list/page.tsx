import { getAnimeList } from '@/lib/scraper';
import SectionHead from '@/components/SectionHead';
import Pagination from '@/components/Pagination';

export const revalidate = 600;

export default async function AnimeListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const data = await getAnimeList(page);

  return (
    <section>
      <SectionHead tag="A–Z" title="ANIME LIST" />
      {data.items.length === 0 ? (
        <div className="border border-dashed border-line rounded p-12 text-center font-mono text-sm text-accent">
          NO SIGNAL
        </div>
      ) : (
        <ol className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-1">
          {data.items.map((a) => (
            <li key={a.url}>
              <a
                href={`/anime/${a.slug}`}
                className="block py-1.5 text-sm text-muted hover:text-accent transition-colors border-b border-line/40 leading-snug"
              >
                {a.title}
              </a>
            </li>
          ))}
        </ol>
      )}
      <Pagination page={page} totalPages={data.totalPages} base="/anime-list/" />
    </section>
  );
}