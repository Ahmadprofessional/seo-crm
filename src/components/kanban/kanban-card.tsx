'use client';

import { useDraggable } from '@dnd-kit/core';
import { Keyword } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface KanbanCardProps {
  keyword: Keyword;
  onClick: () => void;
  isOverlay?: boolean;
}

export function KanbanCard({ keyword, onClick, isOverlay = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: keyword.id,
    data: { keyword },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-700 border-red-200 bg-red-50/60';
      case 'Medium':
        return 'text-amber-800 border-amber-200 bg-amber-50/60';
      case 'Low':
        return 'text-slate-600 border-slate-200 bg-slate-50/60';
      default:
        return 'text-[#666] border-[#E5E0D8] bg-[#F4F1EC]';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only trigger click if we weren't dragging
        if (!isDragging) {
          onClick();
        }
      }}
      className={cn(
        'group relative flex flex-col gap-2 rounded-none border border-[#E5E0D8] bg-white p-3.5 select-none touch-none',
        'transition-[border-color,background-color,box-shadow] duration-150',
        'hover:border-[#0E0E0E] hover:bg-[#FAF8F5] cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-25 border-[#0F766E] scale-[0.98]',
        isOverlay && 'shadow-2xl border-[#0E0E0E] rotate-2 cursor-grabbing z-50 bg-white ring-1 ring-[#0E0E0E] scale-[1.02]'
      )}
    >
      {/* Top row: keyword query + visual grip hint */}
      <div className="flex items-start justify-between gap-1.5 pointer-events-none">
        <span className="font-serif text-[13px] font-medium text-[#0E0E0E] leading-snug group-hover:text-[#0F766E] transition-colors">
          {keyword.keyword}
        </span>
        <div
          className="text-[#999] p-0.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0"
          aria-hidden="true"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Target URL indicator if present */}
      {keyword.target_url && (
        <span className="text-[10px] font-mono text-[#888] truncate pointer-events-none">
          {keyword.target_url.replace(/^https?:\/\//, '')}
        </span>
      )}

      {/* Bottom row: Volume + Category + Priority */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-[#E5E0D8] mt-0.5 pointer-events-none">
        <span className="text-[11px] font-mono tabular-nums font-medium text-[#0F766E] bg-[#0F766E]/5 px-2 py-0.5 border border-[#0F766E]/30">
          {keyword.volume.toLocaleString()} /mo
        </span>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border',
              getPriorityBadge(keyword.priority)
            )}
          >
            {keyword.priority}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#666] bg-[#F4F1EC] px-1.5 py-0.5 border border-[#E5E0D8] truncate max-w-[100px]">
            {keyword.category}
          </span>
        </div>
      </div>
    </div>
  );
}
