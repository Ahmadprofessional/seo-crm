import assert from 'node:assert';
import { test, describe } from 'node:test';
import { rowToKeyword, keywordToRow, findDuplicate } from '../src/lib/sheets';
import { parseKeywordsCsv } from '../src/lib/csv-parser';
import { Keyword, KEYWORD_HEADERS } from '../src/lib/types';

describe('1. Sheet Row Mapping Logic', () => {
  const sampleKeyword: Keyword = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    keyword: 'dermal fillers london',
    volume: 3600,
    category: 'Aesthetic Clinic',
    status: 'Planned',
    priority: 'High',
    target_url: 'https://yourhealthfirst.co.uk/fillers',
    assigned_to: 'Dr. Smith',
    content: 'Comprehensive guide to dermal fillers in London.',
    meta_title: 'Dermal Fillers London | YourHealthFirst Clinic',
    meta_description: 'Award-winning dermal fillers clinic in central London. Book consultation.',
    notes: 'High commercial intent search',
    created_at: '2026-10-11T10:00:00.000Z',
    updated_at: '2026-10-11T12:00:00.000Z',
  };

  test('keywordToRow produces an array with length matching KEYWORD_HEADERS', () => {
    const row = keywordToRow(sampleKeyword);
    assert.strictEqual(row.length, KEYWORD_HEADERS.length);
    assert.strictEqual(row[0], sampleKeyword.id);
    assert.strictEqual(row[1], 'dermal fillers london');
    assert.strictEqual(row[2], '3600');
    assert.strictEqual(row[3], 'Aesthetic Clinic');
  });

  test('rowToKeyword correctly reconstructs Keyword object from string array', () => {
    const row = keywordToRow(sampleKeyword);
    const reconstructed = rowToKeyword(row);

    assert.strictEqual(reconstructed.id, sampleKeyword.id);
    assert.strictEqual(reconstructed.keyword, sampleKeyword.keyword);
    assert.strictEqual(reconstructed.volume, sampleKeyword.volume);
    assert.strictEqual(reconstructed.category, sampleKeyword.category);
    assert.strictEqual(reconstructed.status, sampleKeyword.status);
    assert.strictEqual(reconstructed.priority, sampleKeyword.priority);
    assert.strictEqual(reconstructed.target_url, sampleKeyword.target_url);
    assert.strictEqual(reconstructed.assigned_to, sampleKeyword.assigned_to);
    assert.strictEqual(reconstructed.content, sampleKeyword.content);
    assert.strictEqual(reconstructed.meta_title, sampleKeyword.meta_title);
    assert.strictEqual(reconstructed.meta_description, sampleKeyword.meta_description);
    assert.strictEqual(reconstructed.notes, sampleKeyword.notes);
  });

  test('rowToKeyword handles empty or partial rows safely without throwing', () => {
    const partialRow = ['id-only'];
    const kw = rowToKeyword(partialRow);
    assert.strictEqual(kw.id, 'id-only');
    assert.strictEqual(kw.keyword, '');
    assert.strictEqual(kw.volume, 0);
  });
});

describe('2. Duplicate Detection Logic', () => {
  const existingList: Keyword[] = [
    {
      id: '1',
      keyword: 'Aesthetic Clinic London',
      volume: 3600,
      category: 'Aesthetic Clinic',
      status: 'Published',
      priority: 'High',
      target_url: '',
      assigned_to: '',
      content: '',
      meta_title: '',
      meta_description: '',
      notes: '',
      created_at: '',
      updated_at: '',
    },
    {
      id: '2',
      keyword: 'Botox London',
      volume: 8100,
      category: 'Botox & Anti-wrinkle',
      status: 'Research',
      priority: 'High',
      target_url: '',
      assigned_to: '',
      content: '',
      meta_title: '',
      meta_description: '',
      notes: '',
      created_at: '',
      updated_at: '',
    },
  ];

  test('finds exact duplicate', () => {
    const dup = findDuplicate('Aesthetic Clinic London', existingList);
    assert.notStrictEqual(dup, null);
    assert.strictEqual(dup?.id, '1');
  });

  test('finds duplicate case-insensitively', () => {
    const dup = findDuplicate('aesthetic clinic london', existingList);
    assert.notStrictEqual(dup, null);
    assert.strictEqual(dup?.id, '1');

    const dup2 = findDuplicate('BOTOX LONDON', existingList);
    assert.notStrictEqual(dup2, null);
    assert.strictEqual(dup2?.id, '2');
  });

  test('finds duplicate with leading and trailing whitespace', () => {
    const dup = findDuplicate('   Aesthetic Clinic London   ', existingList);
    assert.notStrictEqual(dup, null);
    assert.strictEqual(dup?.id, '1');
  });

  test('returns null for unique non-matching keywords', () => {
    const dup = findDuplicate('Lip Fillers London', existingList);
    assert.strictEqual(dup, null);
  });
});

describe('3. CSV Parsing Logic', () => {
  const sampleCsv = `keyword,volume,category
Aesthetic Clinic London,3600,Aesthetic Clinic
aesthetic clinic london,3600,Aesthetic Clinic
SECTION HEADER: Location Treatments,YES,
Botox South Kensington,720,Location
Zero Volume Treatment,0,Aesthetic Clinic
  Trimmed Keyword  ,150,Aesthetic Clinic
Invalid Non-Numeric Volume,INVALID,
`;

  test('parseKeywordsCsv eliminates duplicates case-insensitively keeping the first', () => {
    const items = parseKeywordsCsv(sampleCsv);
    const keywords = items.map((i) => i.keyword.toLowerCase());

    const aestheticMatches = keywords.filter((k) => k === 'aesthetic clinic london');
    assert.strictEqual(aestheticMatches.length, 1);
  });

  test('parseKeywordsCsv treats section headers (e.g. YES) as category for subsequent rows', () => {
    const items = parseKeywordsCsv(sampleCsv);
    // SECTION HEADER row should not be in the keyword list
    const hasSectionHeader = items.some((i) => i.keyword.includes('SECTION HEADER'));
    assert.strictEqual(hasSectionHeader, false);

    // Botox South Kensington should be parsed
    const botox = items.find((i) => i.keyword === 'Botox South Kensington');
    assert.notStrictEqual(botox, undefined);
    assert.strictEqual(botox?.volume, 720);
  });

  test('parseKeywordsCsv preserves volume 0 as valid', () => {
    const items = parseKeywordsCsv(sampleCsv);
    const zeroVolItem = items.find((i) => i.keyword === 'Zero Volume Treatment');
    assert.notStrictEqual(zeroVolItem, undefined);
    assert.strictEqual(zeroVolItem?.volume, 0);
  });

  test('parseKeywordsCsv trims whitespace from keyword names', () => {
    const items = parseKeywordsCsv(sampleCsv);
    const trimmedItem = items.find((i) => i.keyword === 'Trimmed Keyword');
    assert.notStrictEqual(trimmedItem, undefined);
    assert.strictEqual(trimmedItem?.keyword, 'Trimmed Keyword');
  });
});
