import { NextResponse } from 'next/server';
import { getEpisodeStream } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const data = await getEpisodeStream(slug);
    if (!data) {
      return NextResponse.json({ success: false, data: null, error: 'Episode not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, data: null, error: err?.message || 'Episode fetch failed.' },
      { status: 502 }
    );
  }
}