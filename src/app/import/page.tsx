'use client';

import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell';
import { ImportExportView } from '@/components/import/import-export-view';
import { useKeywordsQuery } from '@/lib/hooks/use-keywords';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ImportExportContent() {
  const { data, isLoading, isError, error, refetch } = useKeywordsQuery();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-base">Error loading CRM data</h3>
          </div>
          <p className="text-sm text-red-700">
            {error instanceof Error ? error.message : 'Failed to reach Google Sheets database.'}
          </p>
          <Button
            size="sm"
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white text-xs"
          >
            Retry
          </Button>
        </div>
      ) : (
        <ImportExportView
          existingKeywords={data?.keywords || []}
          settings={data?.settings}
        />
      )}
    </div>
  );
}

export default function ImportExportPage() {
  return (
    <AppShell>
      <main className="flex-1 p-6 lg:p-12">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-10 w-64 bg-[#ECE8E1]" />
              <Skeleton className="h-80 w-full bg-[#ECE8E1]" />
            </div>
          }
        >
          <ImportExportContent />
        </Suspense>
      </main>
    </AppShell>
  );
}
