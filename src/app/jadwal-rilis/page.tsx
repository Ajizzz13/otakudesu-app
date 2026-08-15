import { getSchedule } from '@/lib/scraper';
import SectionHead from '@/components/SectionHead';

export const revalidate = 3600;

export default async function JadwalRilisPage() {
  const days = await getSchedule();

  return (
    <section>
      <SectionHead tag="WEEK" title="JADWAL RILIS" />
      {days.length === 0 ? (
        <div className="border border-dashed border-line rounded p-12 text-center font-mono text-sm text-accent">
          NO SIGNAL
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {days.map((d) => (
            <div key={d.day} className="bg-panel border border-line rounded-lg p-5">
              <h3 className="font-mono text-xs text-accent tracking-[0.2em] mb-3">{d.day.toUpperCase()}</h3>
              <ul className="space-y-1.5">
                {d.items.map((it) => (
                  <li key={it.url}>
                    <a
                      href={`/anime/${it.url.split('/anime/')[1]?.replace(/\/$/, '')}`}
                      className="text-sm text-paper hover:text-accent transition-colors leading-snug"
                    >
                      {it.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}