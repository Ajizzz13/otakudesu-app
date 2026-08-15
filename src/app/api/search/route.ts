import { NextRequest, NextResponse } from 'next/server';
import { searchAnime } from '@/lib/scraper';

export const revalidate = 0;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ items: [] });

  try {
    const items = await searchAnime(q);
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message || 'Search failed.' }, { status: 502 });
  }
}