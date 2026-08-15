import { NextResponse } from 'next/server';
import { getHome } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getHome();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, data: null, error: err?.message || 'Home fetch failed.' },
      { status: 502 }
    );
  }
}