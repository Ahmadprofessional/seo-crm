import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { parseKeywordsCsv } from './src/lib/csv-parser';
import { setupSheet, getAllData, batchImportKeywords } from './src/lib/sheets';

// Load environment variables from .env.local if present
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

async function runSeed() {
  console.log('🌱 Starting SEO CRM database seed...');

  const csvPath = path.resolve(process.cwd(), 'seed', 'keywords.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Seed file not found at: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const parsedItems = parseKeywordsCsv(csvContent);

  console.log(`📋 Read and parsed ${parsedItems.length} unique keywords from CSV.`);

  // Verify environment variables
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
    console.warn('\n⚠️  GOOGLE credentials not set in .env.local.');
    console.log('   The seed parser verified successfully! Here is a sample of parsed keywords:');
    parsedItems.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i + 1}. "${item.keyword}" - Vol: ${item.volume} [${item.category}]`);
    });
    console.log(`\nTo write directly to Google Sheets, configure .env.local and run "npm run seed" again.\n`);
    process.exit(0);
  }

  try {
    console.log('⚙️  Ensuring Google Sheets tabs and headers exist...');
    await setupSheet();

    console.log('🔍 Fetching existing keywords from Google Sheets to avoid duplicates...');
    const { keywords: existingKeywords } = await getAllData();
    const existingSet = new Set(existingKeywords.map((k) => k.keyword.trim().toLowerCase()));

    const toImport = parsedItems
      .filter((item) => !existingSet.has(item.keyword.trim().toLowerCase()))
      .map((item) => ({
        ...item,
        id: uuidv4(),
        status: 'Research',
        priority: 'Medium',
        target_url: '',
        assigned_to: '',
        content: '',
        meta_title: '',
        meta_description: '',
        notes: '',
      }));

    if (toImport.length === 0) {
      console.log('✨ All seed keywords already exist in the Google Sheet. Nothing to add.');
      return;
    }

    console.log(`🚀 Importing ${toImport.length} keywords to Google Sheet...`);
    const result = await batchImportKeywords(toImport, 'system-seed');

    console.log(`✅ Successfully seeded ${result.added} keywords into Google Sheets!`);
  } catch (error) {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  }
}

runSeed();
