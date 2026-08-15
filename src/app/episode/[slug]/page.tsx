import { getEpisodeStream } from '@/lib/episodeScraper';
import Link from 'next/link';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EpisodePage({ params }: Props) {
  const { slug } = await params;
  const ep = await getEpisodeStream(slug);

  if (!ep) return <div className="p-10 text-center">Data episode tidak tersedia</div>;

  return (
    <div className="min-h-screen bg-ink text-paper p-6 max-w-5xl mx-auto">
      <header className="mb-6">
        <Link href="/" className="text-sm font-mono text-muted hover:text-accent">&larr; BACK TO GUIDE</Link>
        <h1 className="text-2xl font-display text-paper mt-4">{ep.title}</h1>
      </header>

      {/* Player Section */}
      <div className="bg-black aspect-video w-full rounded-lg overflow-hidden border border-line mb-8">
        {ep.streamIframe ? (
          <iframe 
            src={ep.streamIframe} 
            className="w-full h-full"
            allowFullScreen
          />
        ) : (
          <div className="h-full flex items-center justify-center text-accent">
            <span className="osd-label">NO SIGNAL</span>
          </div>
        )}
      </div>

      {/* Mirror List */}
      <section className="bg-panel border border-line rounded-lg p-6">
        <h3 className="text-sm font-mono text-accent mb-4">MIRROR DOWNLOAD</h3>
        <div className="space-y-4">
          {ep.mirrors.map((mirror: any, i: number) => (
            <div key={i}>
              <h4 className="text-xs font-bold mb-2">{mirror.quality}</h4>
              <div className="flex gap-2 flex-wrap">
                {mirror.links.map((link: any, j: number) => (
                  <a 
                    key={j} 
                    href={link.url} 
                    target="_blank"
                    className="text-[10px] bg-ink border border-line px-2 py-1 rounded hover:bg-accent hover:text-ink"
                  >
                    {link.provider}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
