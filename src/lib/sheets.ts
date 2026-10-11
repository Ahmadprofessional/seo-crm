import { google, sheets_v4 } from 'googleapis';
import {
  Keyword,
  ActivityRow,
  Settings,
  KEYWORD_HEADERS,
  ACTIVITY_HEADERS,
  SETTINGS_HEADERS,
  DEFAULT_STATUSES,
  DEFAULT_CATEGORIES,
} from './types';

// ─── Auth ────────────────────────────────────────────────────────────
function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !rawKey || !sheetId) {
    throw new Error('Missing Google Sheets environment variables');
  }

  // Handle surrounding quotes and escaped \n newlines in the private key
  const privateKey = rawKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return { auth, sheetId };
}

function getSheets(): sheets_v4.Sheets {
  const { auth } = getAuth();
  return google.sheets({ version: 'v4', auth });
}

function getSheetId(): string {
  return process.env.GOOGLE_SHEET_ID!;
}

// ─── Retry Logic ─────────────────────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const status = (error as { code?: number }).code;
      const isRetryable = status === 429 || (status && status >= 500);

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry exhausted'); // unreachable but TS needs it
}

// ─── Cache ───────────────────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 2_000; // 2 seconds burst deduplication
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(): void {
  cache.clear();
}

// ─── Row Mapping ─────────────────────────────────────────────────────
export function rowToKeyword(row: string[]): Keyword {
  return {
    id: row[0] || '',
    keyword: row[1] || '',
    volume: parseInt(row[2] || '0', 10) || 0,
    category: row[3] || '',
    status: row[4] || '',
    priority: row[5] || '',
    target_url: row[6] || '',
    assigned_to: row[7] || '',
    content: row[8] || '',
    meta_title: row[9] || '',
    meta_description: row[10] || '',
    notes: row[11] || '',
    created_at: row[12] || '',
    updated_at: row[13] || '',
  };
}

export function keywordToRow(keyword: Keyword): string[] {
  return [
    keyword.id,
    keyword.keyword,
    String(keyword.volume),
    keyword.category,
    keyword.status,
    keyword.priority,
    keyword.target_url,
    keyword.assigned_to,
    keyword.content,
    keyword.meta_title,
    keyword.meta_description,
    keyword.notes,
    keyword.created_at,
    keyword.updated_at,
  ];
}

function rowToActivity(row: string[]): ActivityRow {
  return {
    timestamp: row[0] || '',
    user: row[1] || '',
    keyword_id: row[2] || '',
    action: row[3] || '',
    old_value: row[4] || '',
    new_value: row[5] || '',
  };
}

// ─── Setup ───────────────────────────────────────────────────────────
export async function setupSheet(): Promise<{ created: string[] }> {
  const sheets = getSheets();
  const sheetId = getSheetId();
  const created: string[] = [];

  // Get existing sheet tabs
  const spreadsheet = await withRetry(() =>
    sheets.spreadsheets.get({ spreadsheetId: sheetId })
  );
  const existingTabs = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];

  const tabsToCreate = [
    { name: 'Keywords', headers: KEYWORD_HEADERS },
    { name: 'Activity', headers: ACTIVITY_HEADERS },
    { name: 'Settings', headers: SETTINGS_HEADERS },
  ];

  for (const tab of tabsToCreate) {
    if (!existingTabs.includes(tab.name)) {
      // Create tab
      await withRetry(() =>
        sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: tab.name },
                },
              },
            ],
          },
        })
      );
      created.push(tab.name);
    }

    // Check if header row exists
    const headerCheck = await withRetry(() =>
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${tab.name}!A1:${String.fromCharCode(64 + tab.headers.length)}1`,
      })
    );

    const existingHeader = headerCheck.data.values?.[0] || [];
    if (existingHeader.length === 0 || existingHeader[0] !== tab.headers[0]) {
      await withRetry(() =>
        sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${tab.name}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [Array.from(tab.headers)],
          },
        })
      );
    }
  }

  // Write default settings if Settings tab is empty (beyond header)
  const settingsCheck = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Settings!A2:C100',
    })
  );

  if (!settingsCheck.data.values || settingsCheck.data.values.length === 0) {
    const maxRows = Math.max(DEFAULT_STATUSES.length, DEFAULT_CATEGORIES.length);
    const settingsRows: string[][] = [];
    for (let i = 0; i < maxRows; i++) {
      settingsRows.push([
        DEFAULT_STATUSES[i] || '',
        DEFAULT_CATEGORIES[i] || '',
        '', // users column starts empty
      ]);
    }
    await withRetry(() =>
      sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Settings!A2',
        valueInputOption: 'RAW',
        requestBody: { values: settingsRows },
      })
    );
  }

  invalidateCache();
  return { created };
}

// ─── Read All Data ───────────────────────────────────────────────────
export async function getAllData(): Promise<{
  keywords: Keyword[];
  settings: Settings;
}> {
  const cacheKey = 'all_data';
  const cached = getCached<{ keywords: Keyword[]; settings: Settings }>(cacheKey);
  if (cached) return cached;

  const sheets = getSheets();
  const sheetId = getSheetId();

  const response = await withRetry(() =>
    sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges: ['Keywords!A2:N', 'Settings!A2:C'],
    })
  );

  const ranges = response.data.valueRanges || [];
  const keywordRows = ranges[0]?.values || [];
  const settingsRows = ranges[1]?.values || [];

  const keywords = keywordRows
    .filter((row) => row[0]) // Must have an id
    .map(rowToKeyword);

  const settings: Settings = {
    statuses: settingsRows.map((r) => r[0]).filter(Boolean) || DEFAULT_STATUSES,
    categories: settingsRows.map((r) => r[1]).filter(Boolean) || DEFAULT_CATEGORIES,
    users: settingsRows.map((r) => r[2]).filter(Boolean) || [],
  };

  // Use defaults if settings are empty
  if (settings.statuses.length === 0) settings.statuses = DEFAULT_STATUSES;
  if (settings.categories.length === 0) settings.categories = DEFAULT_CATEGORIES;

  const result = { keywords, settings };
  setCache(cacheKey, result);
  return result;
}

// ─── Get Activities ──────────────────────────────────────────────────
export async function getActivities(keywordId?: string): Promise<ActivityRow[]> {
  const cacheKey = `activities_${keywordId || 'all'}`;
  const cached = getCached<ActivityRow[]>(cacheKey);
  if (cached) return cached;

  const sheets = getSheets();
  const sheetId = getSheetId();

  const response = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Activity!A2:F',
    })
  );

  const rows = response.data.values || [];
  let activities = rows.map(rowToActivity);

  if (keywordId) {
    activities = activities.filter((a) => a.keyword_id === keywordId);
  }

  // Sort newest first
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  setCache(cacheKey, activities);
  return activities;
}

// ─── Find Row Index by ID ────────────────────────────────────────────
async function findRowIndexById(id: string): Promise<number | null> {
  const sheets = getSheets();
  const sheetId = getSheetId();

  const response = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Keywords!A:A',
    })
  );

  const values = response.data.values || [];
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === id) {
      return i + 1; // 1-indexed (header is row 1)
    }
  }
  return null;
}

// ─── Get Sheet GID ───────────────────────────────────────────────────
async function getTabSheetId(tabName: string): Promise<number> {
  const sheets = getSheets();
  const sheetId = getSheetId();

  const spreadsheet = await withRetry(() =>
    sheets.spreadsheets.get({ spreadsheetId: sheetId })
  );

  const tab = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === tabName
  );
  if (!tab?.properties?.sheetId && tab?.properties?.sheetId !== 0) {
    throw new Error(`Tab "${tabName}" not found`);
  }
  return tab.properties.sheetId;
}

// ─── Log Activity ────────────────────────────────────────────────────
export async function logActivity(
  user: string,
  keywordId: string,
  action: string,
  oldValue: string,
  newValue: string
): Promise<void> {
  const sheets = getSheets();
  const sheetId = getSheetId();

  // Truncate long values to 200 characters
  const truncate = (s: string) =>
    s.length > 200 ? s.substring(0, 200) + '…' : s;

  try {
    await withRetry(() =>
      sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Activity!A:F',
        valueInputOption: 'RAW',
        requestBody: {
          values: [
            [
              new Date().toISOString(),
              user,
              keywordId,
              action,
              truncate(oldValue),
              truncate(newValue),
            ],
          ],
        },
      })
    );
  } catch (error) {
    // Log failure server-side but never let it block the user's write
    console.error('Failed to log activity:', error);
  }
}

// ─── Create Keyword ──────────────────────────────────────────────────
export async function createKeyword(
  data: Omit<Keyword, 'id' | 'created_at' | 'updated_at'> & { id: string },
  user: string
): Promise<Keyword> {
  const sheets = getSheets();
  const sheetId = getSheetId();
  const now = new Date().toISOString();

  const keyword: Keyword = {
    ...data,
    volume: data.volume || 0,
    status: data.status || DEFAULT_STATUSES[0],
    priority: data.priority || 'Medium',
    target_url: data.target_url || '',
    assigned_to: data.assigned_to || '',
    content: data.content || '',
    meta_title: data.meta_title || '',
    meta_description: data.meta_description || '',
    notes: data.notes || '',
    created_at: now,
    updated_at: now,
  };

  await withRetry(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Keywords!A:N',
      valueInputOption: 'RAW',
      requestBody: {
        values: [keywordToRow(keyword)],
      },
    })
  );

  // Log activity (won't block on failure)
  await logActivity(user, keyword.id, 'Created', '', keyword.keyword);

  invalidateCache();
  return keyword;
}

// ─── Update Keyword ──────────────────────────────────────────────────
export async function updateKeyword(
  id: string,
  updates: Partial<Omit<Keyword, 'id' | 'created_at'>>,
  user: string
): Promise<Keyword> {
  const sheets = getSheets();
  const sheetId = getSheetId();

  // Find the row
  const rowIndex = await findRowIndexById(id);
  if (!rowIndex) {
    throw new Error(`Keyword with id ${id} not found`);
  }

  // Read current row
  const current = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `Keywords!A${rowIndex}:N${rowIndex}`,
    })
  );

  const currentRow = current.data.values?.[0];
  if (!currentRow) {
    throw new Error(`Keyword with id ${id} not found at row ${rowIndex}`);
  }

  const currentKeyword = rowToKeyword(currentRow);
  const now = new Date().toISOString();

  // Apply updates
  const updatedKeyword: Keyword = {
    ...currentKeyword,
    ...updates,
    updated_at: now,
  };

  // Write the updated row
  await withRetry(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Keywords!A${rowIndex}:N${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [keywordToRow(updatedKeyword)],
      },
    })
  );

  // Log activity for each changed field
  const fieldNames = Object.keys(updates) as (keyof typeof updates)[];
  for (const field of fieldNames) {
    const oldVal = String(currentKeyword[field as keyof Keyword] || '');
    const newVal = String(updates[field] || '');
    if (oldVal !== newVal) {
      await logActivity(user, id, `Updated ${field}`, oldVal, newVal);
    }
  }

  invalidateCache();
  return updatedKeyword;
}

// ─── Delete Keyword ──────────────────────────────────────────────────
export async function deleteKeyword(id: string, user: string): Promise<void> {
  const sheets = getSheets();
  const sheetId = getSheetId();

  // Find the row
  const rowIndex = await findRowIndexById(id);
  if (!rowIndex) {
    throw new Error(`Keyword with id ${id} not found`);
  }

  // Read keyword name for the activity log
  const current = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `Keywords!A${rowIndex}:N${rowIndex}`,
    })
  );
  const currentKeyword = rowToKeyword(current.data.values?.[0] || []);

  // Get the numeric sheet ID for the Keywords tab
  const tabSheetId = await getTabSheetId('Keywords');

  // Delete the row using batchUpdate deleteDimension
  await withRetry(() =>
    sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: tabSheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // 0-indexed
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    })
  );

  await logActivity(user, id, 'Deleted', currentKeyword.keyword, '');

  invalidateCache();
}

// ─── Bulk Operations ─────────────────────────────────────────────────
export async function bulkUpdateKeywords(
  ids: string[],
  field: string,
  value: string,
  user: string
): Promise<void> {
  for (const id of ids) {
    await updateKeyword(id, { [field]: value }, user);
  }
}

export async function bulkDeleteKeywords(
  ids: string[],
  user: string
): Promise<void> {
  // Delete in reverse order to avoid index shifting issues
  // We need to find all rows first, then delete from bottom to top
  const sheets = getSheets();
  const sheetId = getSheetId();

  const response = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Keywords!A:N',
    })
  );

  const allRows = response.data.values || [];
  const rowsToDelete: { index: number; keyword: Keyword }[] = [];

  for (let i = 1; i < allRows.length; i++) {
    if (ids.includes(allRows[i][0])) {
      rowsToDelete.push({ index: i, keyword: rowToKeyword(allRows[i]) });
    }
  }

  // Sort descending so we delete from bottom first
  rowsToDelete.sort((a, b) => b.index - a.index);

  const tabSheetId = await getTabSheetId('Keywords');

  for (const row of rowsToDelete) {
    await withRetry(() =>
      sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: tabSheetId,
                  dimension: 'ROWS',
                  startIndex: row.index,
                  endIndex: row.index + 1,
                },
              },
            },
          ],
        },
      })
    );

    await logActivity(user, row.keyword.id, 'Deleted (bulk)', row.keyword.keyword, '');
  }

  invalidateCache();
}

// ─── Batch Import Keywords ──────────────────────────────────────────
export async function batchImportKeywords(
  keywordsToImport: (Omit<Keyword, 'id' | 'created_at' | 'updated_at'> & { id: string })[],
  user: string
): Promise<{ added: number }> {
  if (keywordsToImport.length === 0) return { added: 0 };

  const sheets = getSheets();
  const sheetId = getSheetId();
  const now = new Date().toISOString();

  const rows: string[][] = [];
  const activities: { user: string; keywordId: string; action: string; oldValue: string; newValue: string }[] = [];

  for (const item of keywordsToImport) {
    const keyword: Keyword = {
      ...item,
      volume: item.volume || 0,
      status: item.status || DEFAULT_STATUSES[0],
      priority: item.priority || 'Medium',
      target_url: item.target_url || '',
      assigned_to: item.assigned_to || '',
      content: item.content || '',
      meta_title: item.meta_title || '',
      meta_description: item.meta_description || '',
      notes: item.notes || '',
      created_at: now,
      updated_at: now,
    };
    rows.push(keywordToRow(keyword));
    activities.push({
      user,
      keywordId: keyword.id,
      action: 'Imported (CSV)',
      oldValue: '',
      newValue: keyword.keyword,
    });
  }

  // Append all rows in one request
  await withRetry(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Keywords!A:N',
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    })
  );

  // Append activities in one request
  const activityRows = activities.map((a) => [
    now,
    a.user,
    a.keywordId,
    a.action,
    a.oldValue,
    a.newValue,
  ]);

  try {
    await withRetry(() =>
      sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Activity!A:F',
        valueInputOption: 'RAW',
        requestBody: { values: activityRows },
      })
    );
  } catch (err) {
    console.error('Failed to log batch import activities:', err);
  }

  invalidateCache();
  return { added: rows.length };
}

// ─── Duplicate Check ─────────────────────────────────────────────────
export function findDuplicate(
  keyword: string,
  existingKeywords: Keyword[]
): Keyword | null {
  const normalized = keyword.trim().toLowerCase();
  return (
    existingKeywords.find(
      (k) => k.keyword.trim().toLowerCase() === normalized
    ) || null
  );
}
