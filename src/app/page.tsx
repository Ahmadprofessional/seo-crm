'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { useKeywordsQuery } from '@/lib/hooks/use-keywords';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function DashboardContent() {
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
    router.replace(`/${query ? `?${query}` : ''}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {isLoading ? (
        <div className="space-y-6">
          <div className="h-28 w-full border border-[#E3DFD8] bg-[#FAF8F5] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E3DFD8] border border-[#E3DFD8] bg-[#FAF8F5]">
            <div className="h-32 p-6 animate-pulse" />
            <div className="h-32 p-6 animate-pulse" />
            <div className="h-32 p-6 animate-pulse" />
            <div className="h-32 p-6 animate-pulse" />
          </div>
          <div className="h-80 w-full border border-[#E3DFD8] bg-[#FAF8F5] animate-pulse" />
        </div>
      ) : isError ? (
        <div className="border border-[#B91C1C] bg-[#FEF2F2] p-6 text-[#991B1B] space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#B91C1C]" />
            <h3 className="font-serif font-medium text-base">Error accessing Google Sheets database</h3>
          </div>
          <p className="text-xs font-mono text-[#991B1B]">
            {error instanceof Error ? error.message : 'Database synchronization timed out.'}
          </p>
          <Button
            size="sm"
            onClick={() => refetch()}
            className="bg-[#0E0E0E] hover:bg-[#262626] text-[#F4F1EC] text-xs font-mono uppercase tracking-[0.16em] rounded-none"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Retry Connection
          </Button>
        </div>
      ) : (
        <DashboardView
          keywords={data?.keywords || []}
          settings={data?.settings}
          selectedKeywordId={keywordParam}
          onSelectKeyword={handleSelectKeyword}
        />
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      <main className="flex-1 p-6 lg:p-12">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-10 w-48 bg-[#ECE8E1]" />
              <Skeleton className="h-64 w-full bg-[#ECE8E1]" />
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </main>
    </AppShell>
  );
}
