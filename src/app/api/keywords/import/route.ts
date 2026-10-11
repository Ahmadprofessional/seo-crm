import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { batchImportKeywords, getAllData, findDuplicate } from '@/lib/sheets';
import { Keyword } from '@/lib/types';
import { getAuthenticatedUsername } from '@/lib/get-user';
import { z } from 'zod';

const importItemSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  volume: z.number().default(0),
  category: z.string().default('General'),
  status: z.string().optional(),
  priority: z.string().optional(),
  target_url: z.string().optional(),
  assigned_to: z.string().optional(),
  content: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  notes: z.string().optional(),
});

const importPayloadSchema = z.object({
  keywords: z.array(importItemSchema),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUsername();

    const body = await request.json();
    const parsed = importPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    // Server-side duplicate filter against existing database keywords
    const { keywords: existingKeywords } = await getAllData();
    const seen = new Set<string>();

    const validToImport: (Omit<Keyword, 'created_at' | 'updated_at'>)[] = [];
    let skippedDuplicates = 0;

    for (const item of parsed.data.keywords) {
      const normalized = item.keyword.trim().toLowerCase();

      // Skip intra-file duplicates
      if (seen.has(normalized)) {
        skippedDuplicates++;
        continue;
      }
      seen.add(normalized);

      // Skip database duplicates
      if (findDuplicate(item.keyword, existingKeywords)) {
        skippedDuplicates++;
        continue;
      }

      validToImport.push({
        id: uuidv4(),
        keyword: item.keyword.trim(),
        volume: item.volume ?? 0,
        category: item.category || 'General',
        status: item.status || 'Research',
        priority: item.priority || 'Medium',
        target_url: item.target_url || '',
        assigned_to: item.assigned_to || '',
        content: item.content || '',
        meta_title: item.meta_title || '',
        meta_description: item.meta_description || '',
        notes: item.notes || '',
      });
    }

    const result = await batchImportKeywords(validToImport, user);

    return NextResponse.json({
      data: {
        added: result.added,
        skippedDuplicates,
      },
    });
  } catch (error: unknown) {
    console.error('Import error:', error);
    const message = error instanceof Error ? error.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
