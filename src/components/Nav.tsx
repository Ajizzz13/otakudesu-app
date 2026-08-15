import Link from 'next/link';
import SearchBox from './SearchBox';

export default function Nav() {
  return (
    <>
      <header className="border-b border-line pb-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="font-display text-xl tracking-wider text-accent hover:text-paper transition-colors">
          OTAKUDESU<span className="text-paper"> CLEAN</span>
        </Link>
        <span className="font-mono text-xs text-muted px-3 py-1 border border-line rounded bg-panel">
          REC · LIVE FEED
        </span>
      </header>

      <nav className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-line pb-4 mb-8" aria-label="Main">
        {[
          ['/', 'Home'],
          ['/anime-list/', 'Anime List'],
          ['/jadwal-rilis/', 'Jadwal Rilis'],
          ['/ongoing-anime/', 'On-Going'],
          ['/complete-anime/', 'Complete'],
          ['/genre-list/', 'Genre List'],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="px-3 py-1.5 text-sm text-muted hover:text-accent hover:bg-panel rounded transition-colors"
          >
            {label}
          </Link>
        ))}
        <div className="ml-auto min-w-[200px] flex-1 sm:flex-none">
          <SearchBox />
        </div>
      </nav>
    </>
  );
}