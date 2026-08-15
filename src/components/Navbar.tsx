import Link from 'next/link';
import SearchBox from './SearchBox';

const LINKS: [string, string][] = [
  ['/', 'Home'],
  ['/anime-list/', 'Anime List'],
  ['/jadwal-rilis/', 'Jadwal Rilis'],
  ['/ongoing-anime/', 'On-Going'],
  ['/complete-anime/', 'Complete'],
  ['/genre-list/', 'Genre List'],
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-ink/90 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 py-3">
          <Link href="/" className="font-display text-lg tracking-wider text-accent hover:text-paper transition-colors whitespace-nowrap">
            OTAKUDESU<span className="text-paper"> CLEAN</span>
          </Link>
          <div className="flex-1 max-w-sm ml-auto">
            <SearchBox />
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto pb-2.5 -mb-1" aria-label="Main">
          {LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 text-sm text-muted hover:text-accent hover:bg-panel rounded transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}