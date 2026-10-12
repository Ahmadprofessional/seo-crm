'use client';

/**
 * Aesthetic SEO Keyword CRM Dashboard
 * - Oversized count-up numerals in Fraunces serif
 * - Interactive 3D keyword skyline visualization with R3F
 * - Architectural hairline metric grid
 * - Precision horizontal status & category breakdown bars
 * - Archival index of top 10 keywords by volume with side panel trigger
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Keyword, Settings } from '@/lib/types';
import { CountUpNumber } from './count-up-number';
import { DashboardSkylineInteractive } from './dashboard-skyline-interactive';
import { AddKeywordDialog } from '@/components/keywords/add-keyword-dialog';
import { KeywordSidePanel } from '@/components/keywords/keyword-side-panel';
import { DeleteKeywordDialog } from '@/components/keywords/delete-keyword-dialog';

interface DashboardViewProps {
  keywords: Keyword[];
  settings?: Settings;
  selectedKeywordId?: string | null;
  onSelectKeyword?: (keywordId: string | null) => void;
}

export function DashboardView({
  keywords,
  settings,
  selectedKeywordId,
  onSelectKeyword,
}: DashboardViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [keywordToDelete, setKeywordToDelete] = useState<Keyword | null>(null);

  const activeKeyword = useMemo(() => {
    if (!selectedKeywordId) return null;
    return keywords.find((k) => k.id === selectedKeywordId) || null;
  }, [selectedKeywordId, keywords]);

  // Metric Aggregations
  const stats = useMemo(() => {
    const totalKeywords = keywords.length;
    const totalVolume = keywords.reduce((sum, k) => sum + (Number(k.volume) || 0), 0);
    const publishedCount = keywords.filter((k) => k.status === 'Published').length;
    const researchCount = keywords.filter((k) => k.status === 'Research').length;

    // Status counts and volumes
    const statusMap: Record<string, { count: number; volume: number }> = {};
    const categoryMap: Record<string, { count: number; volume: number }> = {};

    keywords.forEach((k) => {
      const s = k.status || 'Research';
      const c = k.category || 'General';
      const vol = Number(k.volume) || 0;

      if (!statusMap[s]) statusMap[s] = { count: 0, volume: 0 };
      statusMap[s].count += 1;
      statusMap[s].volume += vol;

      if (!categoryMap[c]) categoryMap[c] = { count: 0, volume: 0 };
      categoryMap[c].count += 1;
      categoryMap[c].volume += vol;
    });

    // Top 10 keywords sorted by search volume
    const topKeywords = [...keywords]
      .sort((a, b) => (Number(b.volume) || 0) - (Number(a.volume) || 0))
      .slice(0, 10);

    return {
      totalKeywords,
      totalVolume,
      publishedCount,
      researchCount,
      statusMap,
      categoryMap,
      topKeywords,
    };
  }, [keywords]);

  return (
    <div className="space-y-10 pb-16">
      {/* 1. Masthead & Quick Actions */}
      <section className="border-b border-[#E3DFD8] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#0F766E] font-medium">
              Aesthetic SEO & Keyword CRM · Harley St.
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-[#0F766E] border border-[#0F766E]/30 bg-[#F0FDF4]/50">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0F766E] animate-pulse" />
              Sheets Synced
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0E0E0E] font-normal tracking-[-0.02em]">
            Overview & Keyword CRM
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6A64] mt-1 max-w-xl">
            Central dashboard tracking organic search positions, monthly demand volumes, and clinic content pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="h-10 px-5 bg-[#0E0E0E] hover:bg-[#262626] text-[#F4F1EC] text-xs font-mono uppercase tracking-[0.18em] font-medium transition-colors cursor-pointer"
          >
            + Add Keyword
          </button>
          <Link
            href="/keywords"
            className="h-10 px-4 border border-[#D5CFC4] hover:border-[#0E0E0E] text-[#0E0E0E] text-xs font-mono uppercase tracking-[0.18em] inline-flex items-center transition-colors bg-[#FAF8F5]"
          >
            All Keywords →
          </Link>
        </div>
      </section>

      {/* 2. Oversized 4-Metric Hairline Grid */}
      <section>
        <div className="border border-[#E3DFD8] bg-[#FAF8F5] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E3DFD8]">
          {/* Total Keywords */}
          <div className="p-6 sm:p-7 flex flex-col justify-between space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6E6A64]">
              Tracked Keywords
            </span>
            <div>
              <div className="font-serif text-4xl sm:text-5xl text-[#0E0E0E] font-normal tracking-tight">
                <CountUpNumber value={stats.totalKeywords} />
              </div>
              <p className="text-[11px] font-mono text-[#8C877F] mt-1">
                Unique clinical search targets
              </p>
            </div>
          </div>

          {/* Total Search Volume */}
          <div className="p-6 sm:p-7 flex flex-col justify-between space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6E6A64]">
              Total Monthly Demand
            </span>
            <div>
              <div className="font-serif text-4xl sm:text-5xl text-[#0E0E0E] font-normal tracking-tight">
                <CountUpNumber value={stats.totalVolume} />
              </div>
              <p className="text-[11px] font-mono text-[#8C877F] mt-1">
                UK monthly Google queries
              </p>
            </div>
          </div>

          {/* Keywords Published */}
          <div className="p-6 sm:p-7 flex flex-col justify-between space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#0F766E]">
              Published Pages
            </span>
            <div>
              <div className="font-serif text-4xl sm:text-5xl text-[#0F766E] font-normal tracking-tight">
                <CountUpNumber value={stats.publishedCount} />
              </div>
              <p className="text-[11px] font-mono text-[#8C877F] mt-1">
                {stats.totalKeywords > 0
                  ? `${Math.round((stats.publishedCount / stats.totalKeywords) * 100)}% live in index`
                  : 'Live on clinical portal'}
              </p>
            </div>
          </div>

          {/* Keywords in Research */}
          <div className="p-6 sm:p-7 flex flex-col justify-between space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6E6A64]">
              In Pipeline / Research
            </span>
            <div>
              <div className="font-serif text-4xl sm:text-5xl text-[#0E0E0E] font-normal tracking-tight">
                <CountUpNumber value={stats.researchCount} />
              </div>
              <p className="text-[11px] font-mono text-[#8C877F] mt-1">
                {stats.totalKeywords > 0
                  ? `${Math.round((stats.researchCount / stats.totalKeywords) * 100)}% awaiting production`
                  : 'Early discovery'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive 3D Keyword Skyline Visual */}
      <section>
        <DashboardSkylineInteractive
          keywords={keywords}
          onSelectKeyword={(id) => onSelectKeyword?.(id)}
        />
      </section>

      {/* 4. Status & Category Breakdowns (Hairline Editorial Progress Bars) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Breakdown */}
        <div className="border border-[#E3DFD8] bg-[#FAF8F5] p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-[#E3DFD8] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6E6A64] block">
                Workflow Distribution
              </span>
              <h3 className="font-serif text-lg text-[#0E0E0E] font-normal tracking-tight">
                Keywords by Status
              </h3>
            </div>
            <Link
              href="/board"
              className="text-xs font-mono uppercase tracking-[0.14em] text-[#0F766E] hover:underline"
            >
              Open Lifecycle →
            </Link>
          </div>

          <div className="space-y-4 pt-1">
            {Object.entries(stats.statusMap).map(([statusName, data]) => {
              const pct = stats.totalKeywords > 0
                ? Math.round((data.count / stats.totalKeywords) * 100)
                : 0;

              return (
                <div key={statusName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0E0E0E]" />
                      <span className="font-medium text-[#0E0E0E]">{statusName}</span>
                      <span className="text-[11px] font-mono text-[#8C877F]">
                        ({data.count})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-[#6E6A64]">
                        {data.volume.toLocaleString()} /mo
                      </span>
                      <span className="font-semibold text-[#0E0E0E] w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  {/* Thin Crisp Bar */}
                  <div className="h-1 w-full bg-[#EAE5DC] overflow-hidden">
                    <div
                      className="h-full bg-[#0E0E0E] transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="border border-[#E3DFD8] bg-[#FAF8F5] p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-[#E3DFD8] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6E6A64] block">
                Clinical Focus Area
              </span>
              <h3 className="font-serif text-lg text-[#0E0E0E] font-normal tracking-tight">
                Keywords by Category
              </h3>
            </div>
            <Link
              href="/keywords"
              className="text-xs font-mono uppercase tracking-[0.14em] text-[#0F766E] hover:underline"
            >
              Filter in Table →
            </Link>
          </div>

          <div className="space-y-4 pt-1">
            {Object.entries(stats.categoryMap).map(([catName, data]) => {
              const pct = stats.totalKeywords > 0
                ? Math.round((data.count / stats.totalKeywords) * 100)
                : 0;

              return (
                <div key={catName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#0E0E0E]">{catName}</span>
                      <span className="text-[11px] font-mono text-[#8C877F]">
                        ({data.count})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-[#6E6A64]">
                        {data.volume.toLocaleString()} /mo
                      </span>
                      <span className="font-semibold text-[#0E0E0E] w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  {/* Thin Crisp Bar */}
                  <div className="h-1 w-full bg-[#EAE5DC] overflow-hidden">
                    <div
                      className="h-full bg-[#0F766E] transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Top 10 Keywords Priority Ranking */}
      <section className="border border-[#E3DFD8] bg-[#FAF8F5]">
        <div className="p-6 sm:p-7 border-b border-[#E3DFD8] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6E6A64] block">
              Priority Ranking
            </span>
            <h3 className="font-serif text-lg text-[#0E0E0E] font-normal tracking-tight">
              Top 10 High-Volume Search Queries
            </h3>
          </div>
          <Link
            href="/keywords"
            className="text-xs font-mono uppercase tracking-[0.14em] text-[#0E0E0E] hover:text-[#0F766E] transition-colors"
          >
            View All {keywords.length} Keywords →
          </Link>
        </div>

        <div className="divide-y divide-[#E3DFD8]">
          {stats.topKeywords.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#8C877F]">
              No keywords recorded in database.
            </div>
          ) : (
            stats.topKeywords.map((k, index) => (
              <div
                key={k.id}
                onClick={() => onSelectKeyword?.(k.id)}
                className="p-4 sm:px-7 flex items-center justify-between hover:bg-[#F2EFE9] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                  <span className="font-mono text-xs text-[#8C877F] w-6">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="font-serif text-base text-[#0E0E0E] group-hover:text-[#0F766E] transition-colors truncate">
                      {k.keyword}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#6E6A64] mt-0.5">
                      <span>{k.category}</span>
                      {k.target_url && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[200px] sm:max-w-[340px] text-[#8C877F]">
                            {k.target_url.replace(/^https?:\/\//, '')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-sm font-semibold tabular-nums text-[#0E0E0E] block">
                      {Number(k.volume).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C877F] block">
                      searches/mo
                    </span>
                  </div>

                  <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-[0.14em] text-[#6E6A64] border border-[#D5CFC4] px-2 py-0.5">
                    {k.status}
                  </span>

                  <span className="text-xs font-mono text-[#8C877F] group-hover:text-[#0F766E] transition-colors">
                    →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Add Keyword Modal */}
      <AddKeywordDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        categories={settings?.categories}
        statuses={settings?.statuses}
        users={settings?.users}
      />

      {/* Side Panel for Top Keywords inspection */}
      <KeywordSidePanel
        keyword={activeKeyword}
        open={Boolean(activeKeyword)}
        onOpenChange={(isOpen) => !isOpen && onSelectKeyword?.(null)}
        categories={settings?.categories}
        statuses={settings?.statuses}
        users={settings?.users}
        onDeleteRequest={(kw) => setKeywordToDelete(kw)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteKeywordDialog
        keyword={keywordToDelete}
        open={Boolean(keywordToDelete)}
        onOpenChange={(isOpen) => !isOpen && setKeywordToDelete(null)}
        onDeleted={() => {
          if (selectedKeywordId === keywordToDelete?.id) {
            onSelectKeyword?.(null);
          }
        }}
      />
    </div>
  );
}
