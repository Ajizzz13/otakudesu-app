import { NextResponse } from 'next/server';
import { searchAnime } from '@/lib/scraper';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) return NextResponse.json([]);
  
  const results = await searchAnime(q);
  return NextResponse.json(results);
}
