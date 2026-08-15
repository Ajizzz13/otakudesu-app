import { NextRequest, NextResponse } from 'next/server';
import { searchAnime } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ success: true, data: { items: [] } });
  try {
    const items = await searchAnime(q);
    return NextResponse.json({ success: true, data: { items } });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, data: null, error: err?.message || 'Search failed.' },
      { status: 502 }
    );
  }
}