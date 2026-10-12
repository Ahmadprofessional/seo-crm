'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  ArrowUpDown,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Layers,
} from 'lucide-react';
import { Keyword, Settings, DEFAULT_CATEGORIES, DEFAULT_STATUSES, PRIORITIES } from '@/lib/types';
import {
  useUpdateKeywordMutation,
  useBulkActionMutation,
} from '@/lib/hooks/use-keywords';
import { AddKeywordDialog } from '@/components/keywords/add-keyword-dialog';
import { DeleteKeywordDialog } from '@/components/keywords/delete-keyword-dialog';
import { KeywordSidePanel } from '@/components/keywords/keyword-side-panel';
import { cn } from '@/lib/utils';

interface KeywordsTableProps {
  initialKeywords: Keyword[];
  settings?: Settings;
  selectedKeywordId?: string | null;
  onSelectKeyword?: (keywordId: string | null) => void;
}

type SortField = 'keyword' | 'volume' | 'category' | 'status' | 'priority' | 'updated_at';
type SortOrder = 'asc' | 'desc';

export function KeywordsTable({
  initialKeywords,
  settings,
  selectedKeywordId,
  onSelectKeyword,
}: KeywordsTableProps) {
  const categories = settings?.categories || DEFAULT_CATEGORIES;
  const statuses = settings?.statuses || DEFAULT_STATUSES;
  const users = settings?.users || [];

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Sorting state (default: volume descending)
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [bulkUser, setBulkUser] = useState<string>('');

  // Modals & Side Panel
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [keywordToDelete, setKeywordToDelete] = useState<Keyword | null>(null);

  // Mutations
  const updateMutation = useUpdateKeywordMutation();
  const bulkMutation = useBulkActionMutation();

  // Active keyword for side panel
  const activeKeyword = useMemo(() => {
    if (!selectedKeywordId) return null;
    return initialKeywords.find((k) => k.id === selectedKeywordId) || null;
  }, [selectedKeywordId, initialKeywords]);

  // Filter & Search Logic
  const filteredKeywords = useMemo(() => {
    return initialKeywords.filter((k) => {
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        if (!k.keyword.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (categoryFilter !== 'all' && k.category !== categoryFilter) {
        return false;
      }

      if (statusFilter !== 'all' && k.status !== statusFilter) {
        return false;
      }

      if (priorityFilter !== 'all' && k.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [initialKeywords, search, categoryFilter, statusFilter, priorityFilter]);

  // Sorting Logic
  const sortedKeywords = useMemo(() => {
    const sorted = [...filteredKeywords];
    sorted.sort((a, b) => {
      const valA: string | number = a[sortField] || '';
      const valB: string | number = b[sortField] || '';

      if (sortField === 'volume') {
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      if (sortField === 'updated_at') {
        const dateA = new Date(valA as string).getTime() || 0;
        const dateB = new Date(valB as string).getTime() || 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredKeywords, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = sortedKeywords.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedKeywords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedKeywords.slice(startIndex, startIndex + pageSize);
  }, [sortedKeywords, currentPage, pageSize]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'volume' ? 'desc' : 'asc');
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedKeywords.map((k) => k.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedKeywords.map((k) => k.id));
      setSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    }
  };

  const handleToggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    }
  };

  const isAllPageSelected =
    paginatedKeywords.length > 0 &&
    paginatedKeywords.every((k) => selectedIds.includes(k.id));

  // Inline edit handler
  const handleInlineUpdate = async (id: string, field: keyof Keyword, value: string | number) => {
    try {
      await updateMutation.mutateAsync({
        id,
        [field]: value,
      });
    } catch {
      // Handled by optimistic rollback and mutation toast
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} selected keywords from the sheet?`
      )
    ) {
      return;
    }

    try {
      await bulkMutation.mutateAsync({
        ids: selectedIds,
        action: 'delete',
      });
      setSelectedIds([]);
    } catch {
      // Handled by toast
    }
  };

  const handleBulkStatusChange = async (val: string) => {
    if (!val || selectedIds.length === 0) return;
    try {
      await bulkMutation.mutateAsync({
        ids: selectedIds,
        action: 'update',
        field: 'status',
        value: val,
      });
      setBulkStatus('');
      setSelectedIds([]);
    } catch {
      // Handled by toast
    }
  };

  const handleBulkCategoryChange = async (val: string) => {
    if (!val || selectedIds.length === 0) return;
    try {
      await bulkMutation.mutateAsync({
        ids: selectedIds,
        action: 'update',
        field: 'category',
        value: val,
      });
      setBulkCategory('');
      setSelectedIds([]);
    } catch {
      // Handled by toast
    }
  };

  const handleBulkAssign = async (val: string) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkMutation.mutateAsync({
        ids: selectedIds,
        action: 'update',
        field: 'assigned_to',
        value: val,
      });
      setBulkUser('');
      setSelectedIds([]);
    } catch {
      // Handled by toast
    }
  };

  // Priority badge styling
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

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return 'text-[#0F766E] border-[#0F766E]/40 bg-[#0F766E]/5';
      case 'Review':
        return 'text-[#4F46E5] border-[#4F46E5]/30 bg-[#4F46E5]/5';
      case 'Drafting':
        return 'text-[#0284C7] border-[#0284C7]/30 bg-[#0284C7]/5';
      case 'Planned':
        return 'text-[#B45309] border-[#B45309]/30 bg-[#B45309]/5';
      case 'Research':
      default:
        return 'text-[#64748B] border-[#64748B]/30 bg-[#64748B]/5';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar: Search, Filters, Add button */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Search box */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#888]" />
            <Input
              type="text"
              placeholder="Search keyword or URL..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono placeholder:text-[#999] focus-visible:ring-0 focus-visible:border-[#0F766E]"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onValueChange={(val) => {
              setCategoryFilter(val ?? 'all');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[160px] bg-white border-[#E5E0D8] rounded-none text-xs font-mono hover:border-[#0E0E0E]">
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

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val ?? 'all');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[140px] bg-white border-[#E5E0D8] rounded-none text-xs font-mono hover:border-[#0E0E0E]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-[#E5E0D8] font-mono text-xs">
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onValueChange={(val) => {
              setPriorityFilter(val ?? 'all');
              setCurrentPage(1);
            }}
          >
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

          {(search || categoryFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setStatusFilter('all');
                setPriorityFilter('all');
                setCurrentPage(1);
              }}
              className="h-9 text-xs font-mono uppercase tracking-[0.1em] text-[#666] hover:text-[#0E0E0E] rounded-none"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Add keyword CTA button */}
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-[#0E0E0E] hover:bg-[#222] text-[#F4F1EC] gap-2 h-9 px-4 rounded-none text-xs font-mono uppercase tracking-[0.14em] shrink-0 transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-[#0F766E]" />
          Add Keyword
        </Button>
      </div>

      {/* Bulk Action Bar (visible when 1+ rows selected) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0E0E0E] text-[#F4F1EC] p-3 border border-[#0E0E0E] text-xs font-mono">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[#0F766E]" />
            <span>
              {selectedIds.length} keyword{selectedIds.length === 1 ? '' : 's'} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-[11px] text-[#999] hover:text-white underline ml-2"
            >
              Deselect all
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Status */}
            <Select value={bulkStatus} onValueChange={(val) => handleBulkStatusChange(val ?? '')}>
              <SelectTrigger className="h-8 bg-[#1C1C1C] border-[#333] text-[#F4F1EC] text-xs font-mono rounded-none w-[140px]">
                <SelectValue placeholder="Set Status…" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#333] bg-[#1C1C1C] text-[#F4F1EC] font-mono text-xs">
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Bulk Category */}
            <Select value={bulkCategory} onValueChange={(val) => handleBulkCategoryChange(val ?? '')}>
              <SelectTrigger className="h-8 bg-[#1C1C1C] border-[#333] text-[#F4F1EC] text-xs font-mono rounded-none w-[150px]">
                <SelectValue placeholder="Set Category…" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#333] bg-[#1C1C1C] text-[#F4F1EC] font-mono text-xs">
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Bulk Assign */}
            {users.length > 0 ? (
              <Select value={bulkUser} onValueChange={(val) => handleBulkAssign(val ?? '')}>
                <SelectTrigger className="h-8 bg-[#1C1C1C] border-[#333] text-[#F4F1EC] text-xs font-mono rounded-none w-[140px]">
                  <SelectValue placeholder="Assign To…" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-[#333] bg-[#1C1C1C] text-[#F4F1EC] font-mono text-xs">
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {/* Bulk Delete */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="h-8 text-xs font-mono uppercase tracking-[0.1em] gap-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-none"
            >
              <Trash2 className="h-3 w-3" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Main Content: Desktop Table + Mobile Card List */}
      <div className="bg-white border border-[#E5E0D8] overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#F8F6F2] border-b border-[#E5E0D8]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 text-center">
                  <Checkbox
                    checked={isAllPageSelected}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Select all on this page"
                    className="border-[#999] data-[state=checked]:bg-[#0E0E0E] data-[state=checked]:border-[#0E0E0E]"
                  />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('keyword')}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-[#666] hover:text-[#0E0E0E] select-none min-w-[220px]"
                >
                  <div className="flex items-center gap-1.5">
                    Search Query
                    <ArrowUpDown className="h-3 w-3 text-[#999]" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('volume')}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-[#666] hover:text-[#0E0E0E] select-none text-right w-28"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Monthly Vol
                    <ArrowUpDown className="h-3 w-3 text-[#999]" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('category')}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-[#666] hover:text-[#0E0E0E] select-none min-w-[150px]"
                >
                  <div className="flex items-center gap-1.5">
                    Category
                    <ArrowUpDown className="h-3 w-3 text-[#999]" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('status')}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-[#666] hover:text-[#0E0E0E] select-none min-w-[130px]"
                >
                  <div className="flex items-center gap-1.5">
                    Status
                    <ArrowUpDown className="h-3 w-3 text-[#999]" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('priority')}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-[#666] hover:text-[#0E0E0E] select-none min-w-[110px]"
                >
                  <div className="flex items-center gap-1.5">
                    Priority
                    <ArrowUpDown className="h-3 w-3 text-[#999]" />
                  </div>
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#666] min-w-[140px]">
                  Assigned
                </TableHead>
                <TableHead
                  onClick={() => handleSort('updated_at')}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-[#666] hover:text-[#0E0E0E] select-none text-right w-32"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Updated
                    <ArrowUpDown className="h-3 w-3 text-[#999]" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedKeywords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-44 text-center text-[#666]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="h-7 w-7 text-[#BBB]" />
                      <p className="font-serif text-base text-[#0E0E0E]">No keywords found</p>
                      <p className="text-xs font-mono text-[#888]">
                        {search || categoryFilter !== 'all' || statusFilter !== 'all'
                          ? 'Try adjusting your search query or filters.'
                          : 'Click "Add Keyword" to record a new search target.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedKeywords.map((k) => (
                  <TableRow
                    key={k.id}
                    className="hover:bg-[#FAF8F5] transition-colors group cursor-pointer border-b border-[#E5E0D8]"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (
                        target.closest('button') ||
                        target.closest('input') ||
                        target.closest('[role="combobox"]') ||
                        target.closest('[data-slot="checkbox"]')
                      ) {
                        return;
                      }
                      onSelectKeyword?.(k.id);
                    }}
                  >
                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.includes(k.id)}
                        onCheckedChange={(checked) =>
                          handleToggleSelect(k.id, Boolean(checked))
                        }
                        aria-label={`Select ${k.keyword}`}
                        className="border-[#BBB] data-[state=checked]:bg-[#0E0E0E] data-[state=checked]:border-[#0E0E0E]"
                      />
                    </TableCell>

                    {/* Keyword title */}
                    <TableCell className="text-[#0E0E0E]">
                      <div className="flex flex-col">
                        <span className="font-serif text-[13px] font-medium text-[#0E0E0E] group-hover:text-[#0F766E] transition-colors leading-snug">
                          {k.keyword}
                        </span>
                        {k.target_url && (
                          <span className="text-[10px] font-mono text-[#888] truncate max-w-[260px] mt-0.5">
                            {k.target_url.replace(/^https?:\/\//, '')}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Volume (inline editable on double click / input) */}
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        type="number"
                        min="0"
                        defaultValue={k.volume}
                        onBlur={(e) => {
                          const val = Number(e.target.value) || 0;
                          if (val !== k.volume) {
                            handleInlineUpdate(k.id, 'volume', val);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="h-7 w-20 text-right ml-auto border-transparent hover:border-[#E5E0D8] focus:border-[#0F766E] bg-transparent px-1.5 text-xs font-mono tabular-nums text-[#0E0E0E] rounded-none focus-visible:ring-0"
                      />
                    </TableCell>

                    {/* Category (inline select) */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={k.category}
                        onValueChange={(val) => handleInlineUpdate(k.id, 'category', val ?? '')}
                      >
                        <SelectTrigger className="h-7 text-[11px] font-mono border-transparent hover:border-[#E5E0D8] bg-transparent px-1.5 w-full max-w-[170px] rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-[#E5E0D8] font-mono text-xs">
                          {categories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Status (inline select) */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={k.status}
                        onValueChange={(val) => handleInlineUpdate(k.id, 'status', val ?? '')}
                      >
                        <SelectTrigger
                          className={cn(
                            'h-6 text-[10px] font-mono uppercase tracking-wider px-2 border w-fit min-w-[90px] rounded-none',
                            getStatusBadge(k.status)
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-[#E5E0D8] font-mono text-xs">
                          {statuses.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Priority (inline select) */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={k.priority}
                        onValueChange={(val) => handleInlineUpdate(k.id, 'priority', val ?? '')}
                      >
                        <SelectTrigger
                          className={cn(
                            'h-6 text-[10px] font-mono uppercase tracking-wider px-2 border w-fit min-w-[80px] rounded-none',
                            getPriorityBadge(k.priority)
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-[#E5E0D8] font-mono text-xs">
                          {PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Assigned To (inline select or input) */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {users.length > 0 ? (
                        <Select
                          value={k.assigned_to || ''}
                          onValueChange={(val) => handleInlineUpdate(k.id, 'assigned_to', val ?? '')}
                        >
                          <SelectTrigger className="h-7 text-xs border-transparent hover:border-[#E5E0D8] bg-transparent px-1.5 w-full max-w-[140px] rounded-none">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent className="rounded-none border-[#E5E0D8] text-xs">
                            <SelectItem value="">Unassigned</SelectItem>
                            {users.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          defaultValue={k.assigned_to || ''}
                          placeholder="Unassigned"
                          onBlur={(e) => {
                            if (e.target.value !== (k.assigned_to || '')) {
                              handleInlineUpdate(k.id, 'assigned_to', e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="h-7 text-xs border-transparent hover:border-[#E5E0D8] bg-transparent px-1.5 max-w-[140px] rounded-none focus-visible:ring-0"
                        />
                      )}
                    </TableCell>

                    {/* Updated at */}
                    <TableCell className="text-right text-[11px] font-mono text-[#888] whitespace-nowrap">
                      {k.updated_at
                        ? new Date(k.updated_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : ''}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card List (visible on screens < md) */}
        <div className="block md:hidden divide-y divide-[#E5E0D8]">
          {paginatedKeywords.length === 0 ? (
            <div className="p-8 text-center text-[#888] text-xs font-mono">
              No keywords match your criteria.
            </div>
          ) : (
            paginatedKeywords.map((k) => (
              <div
                key={k.id}
                onClick={() => onSelectKeyword?.(k.id)}
                className="p-4 space-y-2 hover:bg-[#FAF8F5] active:bg-[#F0EDE6] transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.includes(k.id)}
                      onCheckedChange={(checked) =>
                        handleToggleSelect(k.id, Boolean(checked))
                      }
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${k.keyword}`}
                      className="border-[#BBB] data-[state=checked]:bg-[#0E0E0E] data-[state=checked]:border-[#0E0E0E]"
                    />
                    <span className="font-serif text-sm font-medium text-[#0E0E0E]">
                      {k.keyword}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-[#0F766E] bg-[#0F766E]/5 px-2 py-0.5 border border-[#0F766E]/30 tabular-nums">
                    {k.volume.toLocaleString()} /mo
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#666] bg-[#F4F1EC] border border-[#E5E0D8] px-1.5 py-0.5">
                    {k.category}
                  </span>
                  <span className={cn('text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border', getStatusBadge(k.status))}>
                    {k.status}
                  </span>
                  <span className={cn('text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border', getPriorityBadge(k.priority))}>
                    {k.priority}
                  </span>
                  {k.assigned_to && (
                    <span className="text-[11px] font-mono text-[#888]">· {k.assigned_to}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#F8F6F2] border-t border-[#E5E0D8] text-xs font-mono text-[#666]">
          <div className="flex items-center gap-2">
            <span>
              Showing{' '}
              <strong className="text-[#0E0E0E] tabular-nums">
                {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-[#0E0E0E] tabular-nums">
                {Math.min(currentPage * pageSize, totalItems)}
              </strong>{' '}
              of <strong className="text-[#0E0E0E] tabular-nums">{totalItems.toLocaleString()}</strong> targets
            </span>

            <span className="text-[#CCC]">|</span>

            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 border border-[#E5E0D8] bg-white px-2 py-0.5 text-xs font-mono text-[#0E0E0E] focus:outline-none focus:border-[#0F766E] rounded-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2.5 text-xs font-mono uppercase tracking-[0.08em] border-[#E5E0D8] bg-white hover:bg-[#EAE5DC] text-[#0E0E0E] rounded-none disabled:opacity-40"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Prev
            </Button>
            <span className="px-2 font-mono text-xs text-[#0E0E0E] tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2.5 text-xs font-mono uppercase tracking-[0.08em] border-[#E5E0D8] bg-white hover:bg-[#EAE5DC] text-[#0E0E0E] rounded-none disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add Keyword Dialog */}
      <AddKeywordDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        categories={categories}
        statuses={statuses}
        users={users}
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

      {/* Side Panel */}
      <KeywordSidePanel
        keyword={activeKeyword}
        open={Boolean(activeKeyword)}
        onOpenChange={(isOpen) => !isOpen && onSelectKeyword?.(null)}
        categories={categories}
        statuses={statuses}
        users={users}
        onDeleteRequest={(kw) => setKeywordToDelete(kw)}
      />
    </div>
  );
}
