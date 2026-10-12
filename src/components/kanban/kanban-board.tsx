'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
  duration: 180,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
};
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { Keyword, Settings, DEFAULT_CATEGORIES, DEFAULT_STATUSES, PRIORITIES } from '@/lib/types';
import { useUpdateKeywordMutation } from '@/lib/hooks/use-keywords';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { AddKeywordDialog } from '@/components/keywords/add-keyword-dialog';
import { KeywordSidePanel } from '@/components/keywords/keyword-side-panel';
import { DeleteKeywordDialog } from '@/components/keywords/delete-keyword-dialog';
import { toast } from 'sonner';

interface KanbanBoardProps {
  initialKeywords: Keyword[];
  settings?: Settings;
  selectedKeywordId?: string | null;
  onSelectKeyword?: (keywordId: string | null) => void;
}

export function KanbanBoard({
  initialKeywords,
  settings,
  selectedKeywordId,
  onSelectKeyword,
}: KanbanBoardProps) {
  const statuses = settings?.statuses || DEFAULT_STATUSES;
  const categories = settings?.categories || DEFAULT_CATEGORIES;
  const users = settings?.users || [];

  // Filter states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Drag state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [keywordToDelete, setKeywordToDelete] = useState<Keyword | null>(null);

  const updateMutation = useUpdateKeywordMutation();

  // Sensors for drag interaction (require slight movement before activating drag so clicks work)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const activeKeyword = useMemo(() => {
    if (!selectedKeywordId) return null;
    return initialKeywords.find((k) => k.id === selectedKeywordId) || null;
  }, [selectedKeywordId, initialKeywords]);

  const draggedKeyword = useMemo(() => {
    if (!activeDragId) return null;
    return initialKeywords.find((k) => k.id === activeDragId) || null;
  }, [activeDragId, initialKeywords]);

  // Filtered keywords
  const filteredKeywords = useMemo(() => {
    return initialKeywords.filter((k) => {
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        if (!k.keyword.toLowerCase().includes(query)) return false;
      }
      if (categoryFilter !== 'all' && k.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && k.priority !== priorityFilter) return false;
      return true;
    });
  }, [initialKeywords, search, categoryFilter, priorityFilter]);

  // Group keywords by status column
  const columnMap = useMemo(() => {
    const map: Record<string, Keyword[]> = {};
    statuses.forEach((s) => {
      map[s] = [];
    });

    filteredKeywords.forEach((k) => {
      const s = k.status || statuses[0] || 'Research';
      if (map[s]) {
        map[s].push(k);
      } else {
        if (!map[statuses[0]]) map[statuses[0]] = [];
        map[statuses[0]].push(k);
      }
    });

    return map;
  }, [filteredKeywords, statuses]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const draggedId = String(active.id);
    const targetStatus = String(over.id);

    const kw = initialKeywords.find((k) => k.id === draggedId);
    if (!kw || kw.status === targetStatus) return;

    try {
      await updateMutation.mutateAsync({
        id: draggedId,
        status: targetStatus,
      });
      toast.success(`Moved "${kw.keyword}" to ${targetStatus}`);
    } catch {
      // Handled by optimistic rollback & toast
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1">
          {/* Search box */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#888]" />
            <Input
              type="text"
              placeholder="Filter lifecycle cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono placeholder:text-[#999] focus-visible:ring-0 focus-visible:border-[#0F766E]"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val ?? 'all')}>
            <SelectTrigger className="h-9 w-[150px] bg-white border-[#E5E0D8] rounded-none text-xs font-mono hover:border-[#0E0E0E]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-[#E5E0D8] font-mono text-xs">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val ?? 'all')}>
            <SelectTrigger className="h-9 w-[130px] bg-white border-[#E5E0D8] rounded-none text-xs font-mono hover:border-[#0E0E0E]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-[#E5E0D8] font-mono text-xs">
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(search || categoryFilter !== 'all' || priorityFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setPriorityFilter('all');
              }}
              className="h-9 text-xs font-mono uppercase tracking-[0.1em] text-[#666] hover:text-[#0E0E0E] rounded-none"
            >
              Reset
            </Button>
          )}
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-[#0E0E0E] hover:bg-[#222] text-[#F4F1EC] rounded-none text-xs font-mono uppercase tracking-[0.14em] h-9 px-4 gap-2 shrink-0 transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-[#0F766E]" />
          Add Keyword
        </Button>
      </div>

      {/* Lifecycle Drag and Drop Workspace */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
          {statuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              keywords={columnMap[status] || []}
              onCardClick={(id) => onSelectKeyword?.(id)}
            />
          ))}
        </div>

        {/* Drag Overlay (renders floating card when dragging) */}
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {draggedKeyword ? (
            <KanbanCard
              keyword={draggedKeyword}
              onClick={() => {}}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Keyword Dialog */}
      <AddKeywordDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        categories={categories}
        statuses={statuses}
        users={users}
      />

      {/* Side Panel for clicked card */}
      <KeywordSidePanel
        keyword={activeKeyword}
        open={Boolean(activeKeyword)}
        onOpenChange={(isOpen) => !isOpen && onSelectKeyword?.(null)}
        categories={categories}
        statuses={statuses}
        users={users}
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
