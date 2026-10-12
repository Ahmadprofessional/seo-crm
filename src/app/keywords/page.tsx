'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { KeywordsTable } from '@/components/keywords/keywords-table';
import { useKeywordsQuery } from '@/lib/hooks/use-keywords';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function KeywordsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keywordParam = searchParams.get('keyword');

  const { data, isLoading, isError, error, refetch } = useKeywordsQuery();

  const handleSelectKeyword = (keywordId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (keywordId) {
      params.set('keyword', keywordId);
    } else {
      params.delete('keyword');
    }
    const query = params.toString();
    router.replace(`/keywords${query ? `?${query}` : ''}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#777] block mb-1">
            Clinic Keyword CRM
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0E0E0E] font-normal tracking-tight">
            All Keywords
          </h1>
          <p className="text-xs sm:text-sm text-[#666] mt-1.5 font-light max-w-xl">
            Live search demand, content lifecycle stages, and metadata synchronized directly with Google Sheets.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="self-start sm:self-auto h-9 px-3.5 border-[#E5E0D8] bg-[#F4F1EC] hover:bg-[#EAE5DC] text-[#0E0E0E] text-xs font-mono uppercase tracking-[0.1em] gap-2 rounded-none transition-colors"
        >
          <RefreshCw className="h-3 w-3 text-[#0F766E]" />
          Sync Sheets
        </Button>
      </div>

      {/* Main state handlers */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-base">Error loading keywords</h3>
          </div>
          <p className="text-sm text-red-700">
            {error instanceof Error ? error.message : 'Failed to communicate with Google Sheets.'}
          </p>
          <p className="text-xs text-red-600">
            Please make sure your Google Sheets credentials and permissions are correctly configured in your environment.
          </p>
          <Button
            size="sm"
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white text-xs"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <KeywordsTable
          initialKeywords={data?.keywords || []}
          settings={data?.settings}
          selectedKeywordId={keywordParam}
          onSelectKeyword={handleSelectKeyword}
        />
      )}
    </div>
  );
}

export default function KeywordsPage() {
  return (
    <AppShell>
      <main className="flex-1 p-6 lg:p-12">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-8 w-64 bg-[#ECE8E1]" />
              <Skeleton className="h-64 w-full bg-[#ECE8E1]" />
            </div>
          }
        >
          <KeywordsContent />
        </Suspense>
      </main>
    </AppShell>
  );
}
