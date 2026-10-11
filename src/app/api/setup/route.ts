import { NextResponse } from 'next/server';
import { setupSheet } from '@/lib/sheets';

export async function POST() {
  try {
    const result = await setupSheet();
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    console.error('Setup error:', error);
    const message = error instanceof Error ? error.message : 'Failed to set up sheet';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
