import { getOngoing } from '@/lib/scraper';
import AnimeCard from '@/components/AnimeCard';
import SectionHead from '@/components/SectionHead';
import Pagination from '@/components/Pagination';

export const revalidate = 600;

export default async function OngoingPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const data = await getOngoing(page);

  return (
    <section>
      <SectionHead tag="LIVE" title="ON-GOING ANIME" />
      {data.items.length === 0 ? (
        <div className="border border-dashed border-line rounded p-12 text-center font-mono text-sm text-accent">
          NO SIGNAL
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {data.items.map((a, i) => (
            <AnimeCard key={a.url} anime={a} eager={i < 8} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={data.totalPages} base="/ongoing-anime/" />
    </section>
  );
}