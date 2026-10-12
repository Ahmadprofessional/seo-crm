'use client';

import { useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Keyword, Settings, DEFAULT_CATEGORIES, DEFAULT_STATUSES } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ImportExportViewProps {
  existingKeywords: Keyword[];
  settings?: Settings;
}

type ColumnMapping = {
  keyword: string;
  volume: string;
  category: string;
  status: string;
  priority: string;
  target_url: string;
  assigned_to: string;
  notes: string;
};

export function ImportExportView({ existingKeywords, settings }: ImportExportViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const categories = settings?.categories || DEFAULT_CATEGORIES;
  const statuses = settings?.statuses || DEFAULT_STATUSES;

  // Import State
  const [file, setFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    keyword: '',
    volume: '',
    category: '',
    status: '',
    priority: '',
    target_url: '',
    assigned_to: '',
    notes: '',
  });

  const [defaultCategory, setDefaultCategory] = useState(categories[0] || 'Aesthetic Clinic');
  const [defaultStatus, setDefaultStatus] = useState(statuses[0] || 'Research');
  const [isImporting, setIsImporting] = useState(false);

  // Export State
  const [exportCategory, setExportCategory] = useState('all');
  const [exportStatus, setExportStatus] = useState('all');

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const headers = (results.meta.fields || []).map((h) => h.trim());
        const rawData = (results.data as Record<string, string>[]).filter((row) =>
          Object.values(row).some((val) => val && String(val).trim())
        );

        setParsedHeaders(headers);
        setParsedRows(rawData);

        // Auto-guess column mappings based on common header names
        const guess: ColumnMapping = {
          keyword: '',
          volume: '',
          category: '',
          status: '',
          priority: '',
          target_url: '',
          assigned_to: '',
          notes: '',
        };

        headers.forEach((header) => {
          const lower = header.toLowerCase();
          if (lower.includes('keyword') || lower.includes('query') || lower === 'term') {
            if (!guess.keyword) guess.keyword = header;
          } else if (lower.includes('vol') || lower.includes('search')) {
            if (!guess.volume) guess.volume = header;
          } else if (lower.includes('cat') || lower.includes('group') || lower.includes('topic')) {
            if (!guess.category) guess.category = header;
          } else if (lower.includes('stat') || lower.includes('stage')) {
            if (!guess.status) guess.status = header;
          } else if (lower.includes('prior')) {
            if (!guess.priority) guess.priority = header;
          } else if (lower.includes('url') || lower.includes('link') || lower.includes('page')) {
            if (!guess.target_url) guess.target_url = header;
          } else if (lower.includes('assign') || lower.includes('owner') || lower.includes('user')) {
            if (!guess.assigned_to) guess.assigned_to = header;
          } else if (lower.includes('note') || lower.includes('comment')) {
            if (!guess.notes) guess.notes = header;
          }
        });

        setMapping(guess);
      },
      error: (err) => {
        toast.error(`CSV Parsing error: ${err.message}`);
      },
    });
  };

  // Pre-import summary calculation
  const summary = useMemo(() => {
    if (!parsedRows.length || !mapping.keyword) {
      return { willAdd: 0, duplicateSkipped: 0, invalidRows: 0, validItems: [] };
    }

    const existingNormalized = new Set(
      existingKeywords.map((k) => k.keyword.trim().toLowerCase())
    );

    const intraFileSeen = new Set<string>();
    const validItems: Array<{
      keyword: string;
      volume: number;
      category: string;
      status: string;
      priority: string;
      target_url?: string;
      assigned_to?: string;
      notes?: string;
    }> = [];

    let duplicateSkipped = 0;
    let invalidRows = 0;

    // Track active category in case of section headers
    let currentCategory = defaultCategory;

    parsedRows.forEach((row) => {
      const rawKw = (row[mapping.keyword] || '').trim();
      const rawVol = mapping.volume ? (row[mapping.volume] || '').trim() : '';

      // Skip empty keyword
      if (!rawKw) {
        invalidRows++;
        return;
      }

      // Check section header rule:
      // If row has no numeric volume and non-numeric value like "YES", treat as category header
      const isHeaderRow =
        rawVol &&
        isNaN(Number(rawVol)) &&
        ['YES', 'SECTION', 'CATEGORY', 'HEADER'].includes(rawVol.toUpperCase());

      if (isHeaderRow) {
        currentCategory = rawKw;
        invalidRows++; // It's a category header, not a keyword
        return;
      }

      const normalizedKw = rawKw.toLowerCase();

      // Check intra-file duplicate
      if (intraFileSeen.has(normalizedKw)) {
        duplicateSkipped++;
        return;
      }

      // Check existing database duplicate
      if (existingNormalized.has(normalizedKw)) {
        duplicateSkipped++;
        return;
      }

      intraFileSeen.add(normalizedKw);

      // Parse volume: volume of 0 is valid and must be kept!
      let parsedVolume = 0;
      if (mapping.volume && row[mapping.volume] !== undefined && row[mapping.volume] !== '') {
        const num = Number(String(row[mapping.volume]).replace(/,/g, '').trim());
        parsedVolume = isNaN(num) ? 0 : num;
      }

      const cat = mapping.category ? (row[mapping.category] || '').trim() || currentCategory : currentCategory;
      const stat = mapping.status ? (row[mapping.status] || '').trim() || defaultStatus : defaultStatus;
      const prior = mapping.priority ? (row[mapping.priority] || '').trim() || 'Medium' : 'Medium';
      const targetUrl = mapping.target_url ? (row[mapping.target_url] || '').trim() : '';
      const assigned = mapping.assigned_to ? (row[mapping.assigned_to] || '').trim() : '';
      const notes = mapping.notes ? (row[mapping.notes] || '').trim() : '';

      validItems.push({
        keyword: rawKw,
        volume: parsedVolume,
        category: cat,
        status: stat,
        priority: prior,
        target_url: targetUrl,
        assigned_to: assigned,
        notes,
      });
    });

    return {
      willAdd: validItems.length,
      duplicateSkipped,
      invalidRows,
      validItems,
    };
  }, [parsedRows, mapping, existingKeywords, defaultCategory, defaultStatus]);

  // Execute Import
  const handleConfirmImport = async () => {
    if (!summary.validItems.length) return;

    setIsImporting(true);
    try {
      const res = await fetch('/api/keywords/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: summary.validItems }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to import keywords');
      }

      toast.success(
        `Import complete: ${json.data.added} keywords added (${json.data.skippedDuplicates} duplicates skipped).`
      );

      // Invalidate queries & reset file
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      setFile(null);
      setParsedRows([]);
      setParsedHeaders([]);

      router.push('/keywords');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  // Execute Export
  const handleExport = () => {
    let toExport = [...existingKeywords];

    if (exportCategory !== 'all') {
      toExport = toExport.filter((k) => k.category === exportCategory);
    }
    if (exportStatus !== 'all') {
      toExport = toExport.filter((k) => k.status === exportStatus);
    }

    if (toExport.length === 0) {
      toast.error('No keywords match your selected export filters.');
      return;
    }

    const exportRows = toExport.map((k) => ({
      ID: k.id,
      Keyword: k.keyword,
      'Monthly Volume': k.volume,
      Category: k.category,
      Status: k.status,
      Priority: k.priority,
      'Target URL': k.target_url,
      'Assigned To': k.assigned_to,
      'Meta Title': k.meta_title,
      'Meta Description': k.meta_description,
      'Word Count': k.content ? k.content.trim().split(/\s+/).filter(Boolean).length : 0,
      Notes: k.notes,
      'Created At': k.created_at,
      'Updated At': k.updated_at,
    }));

    const csvString = Papa.unparse(exportRows);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `yourhealthfirst_keywords_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${toExport.length} keywords to CSV`);
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          CSV Data Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Import new keywords from CSV spreadsheets with smart deduplication or export your CRM data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Import Wizard */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-gray-200/80 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-2 text-teal-700">
                <UploadCloud className="h-5 w-5" />
                <CardTitle className="text-lg font-bold text-gray-900">
                  Import Keywords from CSV
                </CardTitle>
              </div>
              <CardDescription>
                Upload your keyword research spreadsheet. The CRM will map columns, detect duplicates, and add the rows to Google Sheets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File upload zone */}
              <div className="border border-[#E5E0D8] rounded-none p-8 text-center hover:border-[#0E0E0E] transition-colors bg-[#FAF8F5]">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="csv-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="p-3 rounded-full bg-teal-50 text-teal-600 mb-1">
                    <FileSpreadsheet className="h-8 w-8" />
                  </div>
                  <span className="font-semibold text-sm text-gray-900">
                    {file ? file.name : 'Click to upload or drag and drop CSV file'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {file
                      ? `${(file.size / 1024).toFixed(1)} KB · ${parsedRows.length} rows loaded`
                      : 'Accepts standard CSV with headers (e.g. Keyword, Volume, Category)'}
                  </span>
                </label>
              </div>

              {/* Column Mapping Section (shows once file is parsed) */}
              {parsedHeaders.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Step 1: Map Columns
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                    {/* Keyword field (required) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Keyword Column <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={mapping.keyword}
                        onValueChange={(val) => setMapping({ ...mapping, keyword: val ?? '' })}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {parsedHeaders.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Volume field */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Monthly Volume Column
                      </Label>
                      <Select
                        value={mapping.volume}
                        onValueChange={(val) => setMapping({ ...mapping, volume: val ?? '' })}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="(Optional / None)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">(None - Default 0)</SelectItem>
                          {parsedHeaders.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category field */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Category Column
                      </Label>
                      <Select
                        value={mapping.category}
                        onValueChange={(val) => setMapping({ ...mapping, category: val ?? '' })}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="(Optional / None)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">(Use default category)</SelectItem>
                          {parsedHeaders.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status field */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Status Column
                      </Label>
                      <Select
                        value={mapping.status}
                        onValueChange={(val) => setMapping({ ...mapping, status: val ?? '' })}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="(Optional / None)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">(Use default status)</SelectItem>
                          {parsedHeaders.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Fallback Defaults */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Default Category (for unmapped or empty cells)
                      </Label>
                      <Select
                        value={defaultCategory}
                        onValueChange={(val) => setDefaultCategory(val ?? (categories[0] || ''))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Default Status (for unmapped or empty cells)
                      </Label>
                      <Select
                        value={defaultStatus}
                        onValueChange={(val) => setDefaultStatus(val ?? (statuses[0] || ''))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Preview first 10 rows */}
                  <div className="space-y-2 pt-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Step 2: Preview First 10 Rows
                    </h3>
                    <div className="rounded-lg border border-gray-200 overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50/80">
                          <TableRow>
                            <TableHead className="w-12 text-center text-xs">#</TableHead>
                            <TableHead className="text-xs font-bold text-gray-700">
                              Keyword ({mapping.keyword || 'Not mapped'})
                            </TableHead>
                            <TableHead className="text-xs font-bold text-gray-700 text-right">
                              Volume ({mapping.volume || 'Default'})
                            </TableHead>
                            <TableHead className="text-xs font-bold text-gray-700">
                              Category ({mapping.category || 'Default'})
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedRows.slice(0, 10).map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-center text-xs text-gray-400">
                                {i + 1}
                              </TableCell>
                              <TableCell className="text-xs font-medium text-gray-900">
                                {row[mapping.keyword] || <span className="text-red-400">(empty)</span>}
                              </TableCell>
                              <TableCell className="text-xs text-gray-600 text-right">
                                {mapping.volume ? row[mapping.volume] || '0' : '0'}
                              </TableCell>
                              <TableCell className="text-xs text-gray-600">
                                {mapping.category ? row[mapping.category] || defaultCategory : defaultCategory}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Pre-import summary box */}
                  <div className="rounded-none border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-3">
                    <h4 className="text-xs font-mono font-medium text-[#0E0E0E] uppercase tracking-wider flex items-center gap-1.5">
                      <FileSpreadsheet className="h-4 w-4 text-[#0F766E]" />
                      Pre-Import Analysis
                    </h4>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white rounded-lg p-3 border border-teal-100 shadow-2xs">
                        <span className="block text-xl font-extrabold text-teal-700">
                          {summary.willAdd}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">Will Add</span>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-amber-100 shadow-2xs">
                        <span className="block text-xl font-extrabold text-amber-700">
                          {summary.duplicateSkipped}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">Duplicates Skipped</span>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-2xs">
                        <span className="block text-xl font-extrabold text-gray-500">
                          {summary.invalidRows}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">Invalid/Headers</span>
                      </div>
                    </div>

                    <p className="text-xs text-teal-800">
                      Case-insensitive duplicate detection protects against re-adding terms that already exist in YourHealthFirst CRM or repeat in this CSV file.
                    </p>
                  </div>

                  {/* Confirm button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleConfirmImport}
                      disabled={isImporting || summary.willAdd === 0}
                      className="bg-teal-600 hover:bg-teal-700 text-white gap-2 h-10 px-6 font-semibold shadow-sm"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing to Google Sheets…
                        </>
                      ) : (
                        <>
                          Confirm & Import {summary.willAdd} Keywords
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Export Data & Guidelines */}
        <div className="space-y-6">
          {/* Export Card */}
          <Card className="border-gray-200/80 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-2 text-teal-700">
                <Download className="h-5 w-5" />
                <CardTitle className="text-lg font-bold text-gray-900">
                  Export to CSV
                </CardTitle>
              </div>
              <CardDescription>
                Download keywords, search volumes, workflow statuses, and meta drafts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Filter by Category
                </Label>
                <Select value={exportCategory} onValueChange={(val) => setExportCategory(val ?? 'all')}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories ({existingKeywords.length})</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Filter by Status
                </Label>
                <Select value={exportStatus} onValueChange={(val) => setExportStatus(val ?? 'all')}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleExport}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 h-10 font-semibold shadow-sm mt-2"
              >
                <Download className="h-4 w-4" />
                Download CSV Export
              </Button>
            </CardContent>
          </Card>

          {/* Seed Script Info Card */}
          <Card className="border-gray-200/80 shadow-xs bg-gray-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-gray-700">
                <HelpCircle className="h-4 w-4 text-teal-600" />
                <CardTitle className="text-sm font-bold text-gray-900">
                  Automated Seed Command
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-gray-600">
              <p>
                To populate your Google Sheet with the clinic's initial keyword portfolio, run:
              </p>
              <pre className="rounded bg-gray-900 p-2.5 text-teal-300 font-mono text-[11px] overflow-x-auto">
                npm run seed
              </pre>
              <p className="text-[11px] text-gray-400">
                This parses <code className="text-gray-600">/seed/keywords.csv</code>, eliminates duplicates case-insensitively, handles section headers, and imports rows to the sheet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
