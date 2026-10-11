'use client';

/**
 * DashboardSkylineInteractive
 * High-performance, pure SVG/CSS architectural keyword skyline.
 * Zero WebGL overhead, zero Three.js lag, 100% real Google Sheet data.
 * Extruded vertical pillars proportional to monthly search volume.
 * Interactive hover tooltips and click-to-open drawer specification.
 */

import React, { useState, useMemo } from 'react';
import { Keyword } from '@/lib/types';

interface DashboardSkylineProps {
  keywords: Keyword[];
  onSelectKeyword: (keywordId: string) => void;
}

export function DashboardSkylineInteractive({
  keywords,
  onSelectKeyword,
}: DashboardSkylineProps) {
  const [hoveredKeyword, setHoveredKeyword] = useState<Keyword | null>(null);

  // Top 10 keywords sorted by real search volume from Google Sheets
  const topKeywords = useMemo(() => {
    return [...keywords]
      .sort((a, b) => (Number(b.volume) || 0) - (Number(a.volume) || 0))
      .slice(0, 10);
  }, [keywords]);

  const maxVolume = useMemo(() => {
    const vols = topKeywords.map((k) => Number(k.volume) || 0);
    return Math.max(...vols, 1000);
  }, [topKeywords]);

  if (topKeywords.length === 0) {
    return null;
  }

  return (
    <div className="w-full border border-[#E3DFD8] bg-[#FAF8F5] select-none">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-[#E3DFD8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F7F4EE]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#0F766E] font-medium block">
            Architectural Elevation · Top 10 Search Targets
          </span>
          <h3 className="font-serif text-lg text-[#0E0E0E] font-normal tracking-tight">
            Search Demand Distribution
          </h3>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-[#6E6A64]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-[#0F766E] inline-block" /> Published
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-[#0E0E0E] inline-block" /> In Pipeline
          </span>
          <span className="hidden md:inline text-[#8C877F]">
            Click any column to open specification
          </span>
        </div>
      </div>

      {/* Main Skyline Canvas Area (Pure SVG/HTML — Instant & Lightweight) */}
      <div className="relative p-6 sm:p-8 pt-10 min-h-[280px] sm:min-h-[320px] flex flex-col justify-end">
        {/* Subtle Horizontal Reference Gridlines */}
        <div className="absolute inset-x-6 sm:inset-x-8 top-10 bottom-16 pointer-events-none flex flex-col justify-between border-b border-[#D5CFC4]/50">
          <div className="border-b border-[#E3DFD8] flex items-center justify-between text-[10px] font-mono text-[#A8A29E] pb-0.5">
            <span>Peak Demand ({maxVolume.toLocaleString()} /mo)</span>
            <span>100%</span>
          </div>
          <div className="border-b border-[#E3DFD8]/60 flex items-center justify-between text-[10px] font-mono text-[#A8A29E] pb-0.5">
            <span>50% Demand ({Math.round(maxVolume * 0.5).toLocaleString()} /mo)</span>
            <span>50%</span>
          </div>
          <div className="border-b border-[#E3DFD8]/40 flex items-center justify-between text-[10px] font-mono text-[#A8A29E] pb-0.5">
            <span>Baseline</span>
            <span>0%</span>
          </div>
        </div>

        {/* 10 Architectural Pillars */}
        <div className="relative z-10 grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3 items-end h-48 sm:h-56 mb-4">
          {topKeywords.map((k, idx) => {
            const vol = Number(k.volume) || 0;
            const heightPercent = Math.max(12, Math.round((vol / maxVolume) * 100));
            const isPublished = k.status === 'Published';
            const isHovered = hoveredKeyword?.id === k.id;

            return (
              <button
                key={k.id}
                type="button"
                onClick={() => onSelectKeyword(k.id)}
                onMouseEnter={() => setHoveredKeyword(k)}
                onMouseLeave={() => setHoveredKeyword(null)}
                className="group relative flex flex-col items-center justify-end h-full transition-transform focus:outline-none cursor-pointer"
                aria-label={`Inspect ${k.keyword}`}
              >
                {/* Volume Tag above column on hover */}
                <div
                  className={`text-[10px] font-mono tabular-nums font-semibold mb-1.5 transition-opacity ${
                    isHovered ? 'opacity-100 text-[#0F766E]' : 'opacity-70 text-[#6E6A64]'
                  }`}
                >
                  {vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol}
                </div>

                {/* Vertical Column Monolith */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full transition-all duration-300 border ${
                    isHovered
                      ? 'border-[#0F766E] shadow-sm'
                      : 'border-[#1E1E1E]'
                  } ${
                    isPublished
                      ? 'bg-[#0F766E]'
                      : isHovered
                      ? 'bg-[#1C1917]'
                      : 'bg-[#0E0E0E]'
                  }`}
                />

                {/* Base Cap */}
                <div
                  className={`h-1 w-full transition-colors ${
                    isHovered ? 'bg-[#0F766E]' : 'bg-[#D5CFC4]'
                  }`}
                />

                {/* Index Monospace Label */}
                <span className="text-[10px] font-mono text-[#8C877F] mt-2 group-hover:text-[#0E0E0E]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Ground Plinth Hairline */}
        <div className="w-full border-t border-[#0E0E0E] pt-3 flex items-center justify-between text-[10px] font-mono text-[#6E6A64]">
          <span>Architectural Ground Plinth · Scale 1:1</span>
          <span>Google Sheets Synchronized</span>
        </div>

        {/* Floating Tooltip Card on Hover */}
        {hoveredKeyword && (
          <div className="absolute top-4 right-6 z-20 pointer-events-none bg-[#0E0E0E] text-[#F4F1EC] p-4 border border-[#2E2E2E] shadow-xl max-w-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-4 border-b border-[#262626] pb-1.5 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#0F766E]">
                {hoveredKeyword.category}
              </span>
              <span className="text-[10px] font-mono text-[#8C877F] uppercase tracking-[0.14em]">
                {hoveredKeyword.status}
              </span>
            </div>
            <p className="font-serif text-sm text-white tracking-tight mb-2">
              "{hoveredKeyword.keyword}"
            </p>
            <div className="flex items-center justify-between text-xs font-mono text-[#D4CDC0] pt-1">
              <span>Monthly UK Volume:</span>
              <span className="font-bold text-[#F4F1EC] tabular-nums">
                {Number(hoveredKeyword.volume).toLocaleString()} /mo
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#0F766E] mt-2 pt-1.5 border-t border-[#262626]">
              Click column to edit metadata →
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Fallback export for backward compatibility
export const DashboardSkylineFallback = DashboardSkylineInteractive;
