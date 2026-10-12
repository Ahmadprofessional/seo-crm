'use client';

import { useDroppable } from '@dnd-kit/core';
import { Keyword } from '@/lib/types';
import { KanbanCard } from './kanban-card';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: string;
  keywords: Keyword[];
  onCardClick: (keywordId: string) => void;
}

export function KanbanColumn({ status, keywords, onCardClick }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
    data: { status },
  });

  const totalVolume = keywords.reduce((sum, k) => sum + (Number(k.volume) || 0), 0);

  const getStatusBorder = (colStatus: string) => {
    switch (colStatus) {
      case 'Published':
        return 'border-t-2 border-t-[#0F766E]';
      case 'Review':
        return 'border-t-2 border-t-[#4F46E5]';
      case 'Drafting':
        return 'border-t-2 border-t-[#0284C7]';
      case 'Planned':
        return 'border-t-2 border-t-[#B45309]';
      case 'Research':
      default:
        return 'border-t-2 border-t-[#64748B]';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-none border border-[#E5E0D8] bg-[#F8F6F2] p-3.5 min-w-[300px] w-80 shrink-0 transition-colors',
        getStatusBorder(status),
        isOver && 'bg-[#F0EDE6] border-[#0F766E] ring-1 ring-[#0F766E]'
      )}
    >
      {/* Column Header */}
      <div className="flex items-baseline justify-between pb-3 mb-3 border-b border-[#E5E0D8]">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-base font-normal text-[#0E0E0E] tracking-tight">
            {status}
          </h3>
          <span className="text-[10px] font-mono font-medium text-[#0E0E0E] bg-white border border-[#E5E0D8] px-1.5 py-0.5 tabular-nums">
            {keywords.length}
          </span>
        </div>

        <span className="text-xs font-mono tabular-nums text-[#0F766E] font-medium">
          {totalVolume.toLocaleString()} <span className="text-[10px] text-[#888] font-normal">/mo</span>
        </span>
      </div>

      {/* Cards container */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-260px)] pr-0.5">
        {keywords.length === 0 ? (
          <div className="flex h-28 items-center justify-center border border-[#E5E0D8] bg-white/40 text-center text-xs font-mono text-[#888] p-4">
            Drag targets here to update status
          </div>
        ) : (
          keywords.map((k) => (
            <KanbanCard key={k.id} keyword={k} onClick={() => onCardClick(k.id)} />
          ))
        )}
      </div>
    </div>
  );
}
