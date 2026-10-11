import { NextRequest, NextResponse } from 'next/server';
import { getActivities } from '@/lib/sheets';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const keywordId = searchParams.get('keyword_id') || undefined;

    const activities = await getActivities(keywordId);
    return NextResponse.json(
      { data: activities },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('Activity GET error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch activity';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

