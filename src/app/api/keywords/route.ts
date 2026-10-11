import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllData,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  bulkUpdateKeywords,
  bulkDeleteKeywords,
  findDuplicate,
} from '@/lib/sheets';
import {
  keywordCreateSchema,
  keywordUpdateSchema,
  keywordDeleteSchema,
  bulkActionSchema,
} from '@/lib/validation';

import { getAuthenticatedUsername } from '@/lib/get-user';

// GET /api/keywords — list all keywords + settings
export async function GET() {
  try {
    const data = await getAllData();
    return NextResponse.json(
      { data },
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
    console.error('Keywords GET error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch keywords';
    return NextResponse.json({ error: message }, { status: 500 });
  }

}

// POST /api/keywords — create a new keyword
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUsername();

    const body = await request.json();
    const parsed = keywordCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    // Duplicate check (unless client explicitly says force=true)
    const { keywords } = await getAllData();
    const duplicate = findDuplicate(parsed.data.keyword, keywords);
    if (duplicate && !body.force) {
      return NextResponse.json(
        {
          error: 'duplicate',
          data: {
            existingKeyword: duplicate.keyword,
            existingId: duplicate.id,
          },
        },
        { status: 409 }
      );
    }

    const id = uuidv4();
    const keyword = await createKeyword(
      {
        id,
        keyword: parsed.data.keyword.trim(),
        volume: parsed.data.volume,
        category: parsed.data.category,
        status: parsed.data.status || 'Research',
        priority: parsed.data.priority || 'Medium',
        target_url: parsed.data.target_url || '',
        assigned_to: parsed.data.assigned_to || '',
        content: parsed.data.content || '',
        meta_title: parsed.data.meta_title || '',
        meta_description: parsed.data.meta_description || '',
        notes: parsed.data.notes || '',
      },
      user
    );

    return NextResponse.json({ data: keyword }, { status: 201 });
  } catch (error: unknown) {
    console.error('Keywords POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create keyword';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/keywords — update a keyword
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUsername();

    const body = await request.json();
    const parsed = keywordUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const keyword = await updateKeyword(id, updates, user);

    return NextResponse.json({ data: keyword });
  } catch (error: unknown) {
    console.error('Keywords PATCH error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update keyword';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/keywords — delete a keyword
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUsername();

    const body = await request.json();
    const parsed = keywordDeleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    await deleteKeyword(parsed.data.id, user);

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    console.error('Keywords DELETE error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete keyword';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
