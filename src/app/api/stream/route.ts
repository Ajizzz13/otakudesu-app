import { NextRequest, NextResponse } from 'next/server';
import { resolveStream } from '@/lib/stream';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ type: 'error', error: 'Missing url param.' }, { status: 400 });
  }
  const result = await resolveStream(url);
  return NextResponse.json(result);
}