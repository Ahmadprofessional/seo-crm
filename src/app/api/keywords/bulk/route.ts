import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUsername } from '@/lib/get-user';
import { bulkUpdateKeywords, bulkDeleteKeywords } from '@/lib/sheets';
import { bulkActionSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUsername();

    const body = await request.json();
    const parsed = bulkActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { ids, action, field, value } = parsed.data;

    if (action === 'delete') {
      await bulkDeleteKeywords(ids, user);
      return NextResponse.json({ data: { deleted: ids.length } });
    }

    if (action === 'update' && field && value !== undefined) {
      await bulkUpdateKeywords(ids, field, value, user);
      return NextResponse.json({ data: { updated: ids.length } });
    }

    return NextResponse.json(
      { error: 'Invalid bulk action parameters' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Bulk action error:', error);
    const message = error instanceof Error ? error.message : 'Bulk action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
