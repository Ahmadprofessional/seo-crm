import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export interface ParsedSeedItem {
  keyword: string;
  volume: number;
  category: string;
}

/**
 * Parses keywords CSV according to project rules:
 * - Section headers (rows with no numeric volume or a non-numeric value like "YES") are NOT keywords.
 *   They are treated as categories for rows that follow, or skipped.
 * - Volume of 0 is valid and must be kept.
 * - Trim whitespace.
 * - Deduplicate case-insensitively, keeping the first occurrence.
 */
export function parseKeywordsCsv(csvContent: string, defaultCategory = 'Aesthetic Clinic'): ParsedSeedItem[] {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  const rows = result.data;
  const seen = new Set<string>();
  const parsedItems: ParsedSeedItem[] = [];

  let currentCategory = defaultCategory;

  for (const row of rows) {
    // Find fields regardless of column name casing
    const kwKey = Object.keys(row).find((k) => k.toLowerCase().includes('keyword') || k.toLowerCase() === 'term') || Object.keys(row)[0];
    const volKey = Object.keys(row).find((k) => k.toLowerCase().includes('volume') || k.toLowerCase().includes('search')) || Object.keys(row)[1];
    const catKey = Object.keys(row).find((k) => k.toLowerCase().includes('category') || k.toLowerCase().includes('group')) || Object.keys(row)[2];

    const rawKw = (row[kwKey] || '').trim();
    const rawVol = volKey ? (row[volKey] || '').trim() : '';
    const rawCat = catKey ? (row[catKey] || '').trim() : '';

    if (!rawKw) continue;

    // Check if this row is a section header:
    // e.g., rawVol is empty, non-numeric like "YES", "HEADER", etc.
    const isNumericVolume = rawVol !== '' && !isNaN(Number(rawVol));
    if (!isNumericVolume) {
      // Row has no numeric volume -> treat rawKw as the category for subsequent rows
      currentCategory = rawKw.replace(/^SECTION HEADER:?\s*/i, '').trim() || defaultCategory;
      continue;
    }

    // Deduplicate case-insensitively, keeping the first occurrence
    const normalized = rawKw.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);

    // Volume of 0 is valid and must be kept
    const volume = Number(rawVol) || 0;
    const category = rawCat || currentCategory || defaultCategory;

    parsedItems.push({
      keyword: rawKw,
      volume,
      category,
    });
  }

  return parsedItems;
}
