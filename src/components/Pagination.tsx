import Link from 'next/link';

export default function Pagination({
  page,
  totalPages,
  base,
}: {
  page: number;
  totalPages: number;
  base: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-10">
      {page > 1 ? (
        <Link
          href={`${base}${page - 1 > 1 ? `page/${page - 1}/` : ''}`}
          className="px-4 py-2 text-sm bg-panel border border-line rounded hover:border-accent transition-colors"
        >
          &larr; Prev
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm bg-panel border border-line rounded opacity-40">Prev</span>
      )}
      <span className="font-mono text-xs text-muted">
        PAGE <b className="text-accent font-normal">{page}</b> / {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={`${base}page/${page + 1}/`}
          className="px-4 py-2 text-sm bg-panel border border-line rounded hover:border-accent transition-colors"
        >
          Next &rarr;
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm bg-panel border border-line rounded opacity-40">Next</span>
      )}
    </div>
  );
}