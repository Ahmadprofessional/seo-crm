'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { useKeywordsQuery } from '@/lib/hooks/use-keywords';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function BoardContent() {
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
    router.replace(`/board${query ? `?${query}` : ''}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#777] block mb-1">
            Workflow &amp; Production
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0E0E0E] font-normal tracking-tight">
            Content Lifecycle
          </h1>
          <p className="text-xs sm:text-sm text-[#666] mt-1.5 font-light max-w-xl">
            Drag search queries across editorial workflow stages to update Google Sheets in real-time.
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

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-6">
          <Skeleton className="h-96 w-80 bg-[#ECE8E1] rounded-none shrink-0" />
          <Skeleton className="h-96 w-80 bg-[#ECE8E1] rounded-none shrink-0" />
          <Skeleton className="h-96 w-80 bg-[#ECE8E1] rounded-none shrink-0" />
          <Skeleton className="h-96 w-80 bg-[#ECE8E1] rounded-none shrink-0" />
          <Skeleton className="h-96 w-80 bg-[#ECE8E1] rounded-none shrink-0" />
        </div>
      ) : isError ? (
        <div className="border border-red-300 bg-red-50/50 p-6 text-red-900 space-y-3 rounded-none">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-700" />
            <h3 className="font-serif text-lg">Error loading Lifecycle Board</h3>
          </div>
          <p className="text-xs font-mono text-red-800">
            {error instanceof Error ? error.message : 'Failed to retrieve keywords from Google Sheets.'}
          </p>
          <Button
            size="sm"
            onClick={() => refetch()}
            className="bg-red-700 hover:bg-red-800 text-white text-xs font-mono uppercase tracking-[0.1em] rounded-none"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <KanbanBoard
          initialKeywords={data?.keywords || []}
          settings={data?.settings}
          selectedKeywordId={keywordParam}
          onSelectKeyword={handleSelectKeyword}
        />
      )}
    </div>
  );
}

export default function BoardPage() {
  return (
    <AppShell>
      <main className="flex-1 p-6 lg:p-12">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-8 w-64 bg-[#ECE8E1]" />
              <div className="flex gap-4">
                <Skeleton className="h-96 w-80 bg-[#ECE8E1] shrink-0" />
                <Skeleton className="h-96 w-80 bg-[#ECE8E1] shrink-0" />
              </div>
            </div>
          }
        >
          <BoardContent />
        </Suspense>
      </main>
    </AppShell>
  );
}
