'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  History,
  Save,
  AlertTriangle,
  Loader2,
  Trash2,
  FileText,
  Clock,
  User,
  Activity as ActivityIcon,
} from 'lucide-react';
import { Keyword, DEFAULT_CATEGORIES, DEFAULT_STATUSES, PRIORITIES } from '@/lib/types';
import { useUpdateKeywordMutation, useActivityQuery } from '@/lib/hooks/use-keywords';
import { toast } from 'sonner';

interface KeywordSidePanelProps {
  keyword: Keyword | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: string[];
  statuses?: string[];
  users?: string[];
  onDeleteRequest?: (keyword: Keyword) => void;
}

export function KeywordSidePanel({
  keyword,
  open,
  onOpenChange,
  categories = DEFAULT_CATEGORIES,
  statuses = DEFAULT_STATUSES,
  users = [],
  onDeleteRequest,
}: KeywordSidePanelProps) {
  // Form fields
  const [formData, setFormData] = useState({
    keyword: '',
    volume: 0,
    category: '',
    status: '',
    priority: '',
    target_url: '',
    assigned_to: '',
    content: '',
    meta_title: '',
    meta_description: '',
    notes: '',
  });

  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const updateMutation = useUpdateKeywordMutation();
  const { data: activities = [], isLoading: isActivityLoading } = useActivityQuery(keyword?.id);

  // Sync state whenever keyword prop changes
  useEffect(() => {
    if (keyword) {
      setFormData({
        keyword: keyword.keyword || '',
        volume: keyword.volume ?? 0,
        category: keyword.category || (categories[0] || 'Aesthetic Clinic'),
        status: keyword.status || (statuses[0] || 'Research'),
        priority: keyword.priority || 'Medium',
        target_url: keyword.target_url || '',
        assigned_to: keyword.assigned_to || '',
        content: keyword.content || '',
        meta_title: keyword.meta_title || '',
        meta_description: keyword.meta_description || '',
        notes: keyword.notes || '',
      });
      setActiveTab('details');
    }
  }, [keyword, categories, statuses]);

  // Compute dirty state
  const isDirty = useMemo(() => {
    if (!keyword) return false;
    return (
      formData.keyword !== (keyword.keyword || '') ||
      Number(formData.volume) !== Number(keyword.volume ?? 0) ||
      formData.category !== (keyword.category || '') ||
      formData.status !== (keyword.status || '') ||
      formData.priority !== (keyword.priority || '') ||
      formData.target_url !== (keyword.target_url || '') ||
      formData.assigned_to !== (keyword.assigned_to || '') ||
      formData.content !== (keyword.content || '') ||
      formData.meta_title !== (keyword.meta_title || '') ||
      formData.meta_description !== (keyword.meta_description || '') ||
      formData.notes !== (keyword.notes || '')
    );
  }, [formData, keyword]);

  // Content metrics
  const wordCount = useMemo(() => {
    const text = formData.content.trim();
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  }, [formData.content]);

  const charCount = formData.content.length;
  const isContentTooLong = charCount > 50000;

  // Attempt to close panel
  const handleRequestClose = () => {
    if (isDirty) {
      setShowUnsavedWarning(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardAndClose = () => {
    setShowUnsavedWarning(false);
    if (keyword) {
      // Reset to original
      setFormData({
        keyword: keyword.keyword || '',
        volume: keyword.volume ?? 0,
        category: keyword.category || '',
        status: keyword.status || '',
        priority: keyword.priority || '',
        target_url: keyword.target_url || '',
        assigned_to: keyword.assigned_to || '',
        content: keyword.content || '',
        meta_title: keyword.meta_title || '',
        meta_description: keyword.meta_description || '',
        notes: keyword.notes || '',
      });
    }
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!keyword) return;

    if (isContentTooLong) {
      toast.error('Content exceeds Google Sheets cell limit of 50,000 characters');
      return;
    }

    if (formData.target_url) {
      try {
        new URL(formData.target_url);
      } catch {
        toast.error('Please enter a valid Target URL (e.g. https://domain.com/treatments)');
        return;
      }
    }

    try {
      await updateMutation.mutateAsync({
        id: keyword.id,
        keyword: formData.keyword.trim(),
        volume: Number(formData.volume) || 0,
        category: formData.category,
        status: formData.status,
        priority: formData.priority,
        target_url: formData.target_url.trim(),
        assigned_to: formData.assigned_to,
        content: formData.content,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        notes: formData.notes,
      });

      toast.success('Keyword updated in Google Sheets');
    } catch {
      // Handled by mutation toast
    }
  };

  if (!keyword) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleRequestClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl md:max-w-2xl flex flex-col p-0 bg-[#FAF8F5] border-l border-[#E5E0D8] z-50 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <SheetHeader className="p-6 border-b border-[#E5E0D8] bg-[#F4F1EC]">
            <div className="flex items-start justify-between gap-4 pr-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#0F766E] bg-[#0F766E]/5 px-2 py-0.5 border border-[#0F766E]/30 inline-block">
                  {formData.category || 'General'}
                </span>
                <SheetTitle className="font-serif text-2xl text-[#0E0E0E] font-normal tracking-tight mt-2 leading-tight">
                  {formData.keyword || 'Untitled Keyword'}
                </SheetTitle>
                <SheetDescription className="text-xs font-mono text-[#888] mt-1">
                  ID: <span className="text-[#0E0E0E]">{keyword.id}</span>
                </SheetDescription>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || updateMutation.isPending || isContentTooLong}
                  className="bg-[#0E0E0E] hover:bg-[#222] text-[#F4F1EC] gap-1.5 h-9 px-4 rounded-none text-xs font-mono uppercase tracking-[0.12em] transition-colors disabled:opacity-40"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 text-[#0F766E]" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-6 mt-6 -mb-6 border-b border-[#E5E0D8]">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`flex items-center gap-2 pb-2.5 text-xs font-mono uppercase tracking-[0.12em] border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-[#0F766E] text-[#0E0E0E] font-semibold'
                    : 'border-transparent text-[#777] hover:text-[#0E0E0E]'
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-[#0F766E]" />
                Specification &amp; Draft
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 pb-2.5 text-xs font-mono uppercase tracking-[0.12em] border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-[#0F766E] text-[#0E0E0E] font-semibold'
                    : 'border-transparent text-[#777] hover:text-[#0E0E0E]'
                }`}
              >
                <History className="h-3.5 w-3.5 text-[#0F766E]" />
                Activity Log ({activities.length})
              </button>
            </div>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'details' ? (
              <>
                {/* Meta & Core Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                      Search Query
                    </Label>
                    <Input
                      value={formData.keyword}
                      onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                      className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-serif text-[#0E0E0E] focus-visible:ring-0 focus-visible:border-[#0F766E]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                      Monthly Search Volume
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: Number(e.target.value) || 0 })}
                      className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono tabular-nums text-[#0E0E0E] focus-visible:ring-0 focus-visible:border-[#0F766E]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                      Content Lifecycle Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(val) => setFormData({ ...formData, status: val ?? '' })}
                    >
                      <SelectTrigger className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-none border-[#262626] font-mono text-xs shadow-2xl">
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                      Priority
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(val) => setFormData({ ...formData, priority: val ?? '' })}
                    >
                      <SelectTrigger className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-none border-[#262626] font-mono text-xs shadow-2xl">
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                      Treatment Category
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => setFormData({ ...formData, category: val ?? '' })}
                    >
                      <SelectTrigger className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-none border-[#262626] font-mono text-xs shadow-2xl">
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                      Assigned Editor
                    </Label>
                    {users.length > 0 ? (
                      <Select
                        value={formData.assigned_to}
                        onValueChange={(val) => setFormData({ ...formData, assigned_to: val ?? '' })}
                      >
                        <SelectTrigger className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-none border-[#262626] font-mono text-xs shadow-2xl">
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
                        value={formData.assigned_to}
                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                        placeholder="Team member"
                        className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono text-[#0E0E0E] focus-visible:ring-0 focus-visible:border-[#0F766E]"
                      />
                    )}
                  </div>
                </div>

                {/* Target URL */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                    Target Landing Page URL
                  </Label>
                  <Input
                    type="url"
                    value={formData.target_url}
                    onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                    placeholder="https://yourhealthfirst.co.uk/..."
                    className="h-9 bg-white border-[#E5E0D8] rounded-none font-mono text-xs text-[#0E0E0E] focus-visible:ring-0 focus-visible:border-[#0F766E]"
                  />
                </div>

                <div className="border-t border-[#E5E0D8] pt-2" />

                {/* Meta Title with Live Counter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                      SEO Meta Title
                    </Label>
                    <span
                      className={`text-[11px] font-mono tabular-nums ${
                        formData.meta_title.length > 60
                          ? 'text-amber-800 font-semibold'
                          : 'text-[#888]'
                      }`}
                    >
                      {formData.meta_title.length} / 60 characters
                    </span>
                  </div>
                  <Input
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="e.g. Dermal Fillers London | Award-Winning Aesthetic Clinic"
                    className={`h-9 bg-white rounded-none font-serif text-xs text-[#0E0E0E] focus-visible:ring-0 ${
                      formData.meta_title.length > 60
                        ? 'border-amber-500 focus-visible:border-amber-600'
                        : 'border-[#E5E0D8] focus-visible:border-[#0F766E]'
                    }`}
                  />
                  {formData.meta_title.length > 60 && (
                    <p className="text-[11px] font-mono text-amber-800 flex items-center gap-1.5 pt-0.5">
                      <AlertTriangle className="h-3 w-3" />
                      Google SERP typically truncates titles exceeding 60 characters.
                    </p>
                  )}
                </div>

                {/* Meta Description with Live Counter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                      SEO Meta Description
                    </Label>
                    <span
                      className={`text-[11px] font-mono tabular-nums ${
                        formData.meta_description.length > 160
                          ? 'text-amber-800 font-semibold'
                          : 'text-[#888]'
                      }`}
                    >
                      {formData.meta_description.length} / 160 characters
                    </span>
                  </div>
                  <Textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="Brief description summarizing page value proposition for search snippets..."
                    rows={3}
                    className={`resize-none bg-white rounded-none text-xs font-serif leading-relaxed focus-visible:ring-0 ${
                      formData.meta_description.length > 160
                        ? 'border-amber-500 focus-visible:border-amber-600'
                        : 'border-[#E5E0D8] focus-visible:border-[#0F766E]'
                    }`}
                  />
                  {formData.meta_description.length > 160 && (
                    <p className="text-[11px] font-mono text-amber-800 flex items-center gap-1.5 pt-0.5">
                      <AlertTriangle className="h-3 w-3" />
                      Descriptions beyond 160 characters may be truncated in search snippets.
                    </p>
                  )}
                </div>

                <div className="border-t border-[#E5E0D8] pt-2" />

                {/* Large Content Editor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                      Page Content / Article Draft
                    </Label>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#888]">
                      <span>{wordCount} words</span>
                      <span
                        className={isContentTooLong ? 'text-red-700 font-bold' : ''}
                      >
                        {charCount.toLocaleString()} / 50,000 characters
                      </span>
                    </div>
                  </div>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Draft page copy, section headers, FAQs, clinical notes..."
                    rows={8}
                    className={`bg-white rounded-none font-serif text-xs leading-relaxed text-[#0E0E0E] focus-visible:ring-0 ${
                      isContentTooLong
                        ? 'border-red-600 focus-visible:border-red-700'
                        : 'border-[#E5E0D8] focus-visible:border-[#0F766E]'
                    }`}
                  />
                  {isContentTooLong && (
                    <p className="text-[11px] font-mono text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Content exceeds 50,000 characters (single Google Sheets cell maximum).
                    </p>
                  )}
                </div>

                {/* Internal Notes */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                    Internal Editorial Notes
                  </Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Search intent nuance, competitor URLs, doctor sign-off details..."
                    rows={3}
                    className="bg-white border-[#E5E0D8] rounded-none text-xs font-serif leading-relaxed text-[#0E0E0E] focus-visible:ring-0 focus-visible:border-[#0F766E]"
                  />
                </div>

                {/* Danger zone delete button */}
                {onDeleteRequest && (
                  <div className="border-t border-[#E5E0D8] pt-6 mt-8 flex justify-between items-center">
                    <div>
                      <h4 className="text-[11px] font-mono uppercase tracking-[0.14em] text-red-900 font-semibold">
                        Delete Target
                      </h4>
                      <p className="text-xs text-[#777] mt-0.5">
                        Permanently purge this row from Google Sheets.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteRequest(keyword)}
                      className="border-red-300 bg-white hover:bg-red-50 text-red-700 rounded-none h-8 px-3 text-xs font-mono uppercase tracking-[0.1em]"
                    >
                      <Trash2 className="h-3 w-3 mr-1.5" />
                      Delete Row
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Activity History Tab */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#888] pb-2 border-b border-[#E5E0D8]">
                  <span>Audit Trail (Google Sheets Activity Tab)</span>
                  <span className="tabular-nums">{activities.length} entries</span>
                </div>

                {isActivityLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-[#888] gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />
                    <span className="text-xs font-mono">Synchronizing audit log…</span>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="py-12 text-center text-[#888]">
                    <ActivityIcon className="h-7 w-7 mx-auto mb-2 opacity-40 text-[#0E0E0E]" />
                    <p className="font-serif text-sm text-[#0E0E0E]">No activity recorded</p>
                    <p className="text-xs font-mono text-[#888] mt-1">Changes made to this target will record here.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activities.map((act, index) => (
                      <div
                        key={index}
                        className="border border-[#E5E0D8] bg-white p-3 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[#888] text-[11px] font-mono">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-[#0F766E]" />
                            <span className="text-[#0E0E0E] font-medium">{act.user}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#888]">
                            <Clock className="h-3 w-3" />
                            <span>
                              {act.timestamp
                                ? new Date(act.timestamp).toLocaleString(undefined, {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })
                                : 'Recent'}
                            </span>
                          </div>
                        </div>

                        <div className="font-mono text-xs text-[#0E0E0E]">
                          Action: <span className="text-[#0F766E] uppercase tracking-wider">{act.action}</span>
                        </div>

                        {(act.old_value || act.new_value) && (
                          <div className="grid grid-cols-2 gap-2 mt-1 pt-1.5 border-t border-[#E5E0D8] font-mono text-[11px]">
                            <div className="bg-[#FAF8F5] p-2 border border-[#E5E0D8] overflow-hidden">
                              <span className="text-[#888] block text-[10px] uppercase tracking-wider">Before:</span>
                              <span className="text-red-700 line-through break-words">
                                {act.old_value || '(empty)'}
                              </span>
                            </div>
                            <div className="bg-[#FAF8F5] p-2 border border-[#E5E0D8] overflow-hidden">
                              <span className="text-[#888] block text-[10px] uppercase tracking-wider">After:</span>
                              <span className="text-[#0F766E] font-semibold break-words">
                                {act.new_value || '(empty)'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <DialogContent className="sm:max-w-[420px] rounded-none border border-[#E5E0D8] bg-white p-6">
          <DialogHeader>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-none bg-amber-50 text-amber-700 border border-amber-200 mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center font-serif text-xl font-normal text-[#0E0E0E]">
              Unsaved Changes
            </DialogTitle>
            <DialogDescription className="text-center text-[#666] pt-1 text-xs font-mono">
              You have modified this keyword specification. Closing without saving will discard your changes.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-center gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscardAndClose}
              className="border-[#E5E0D8] hover:bg-red-50 text-red-700 rounded-none text-xs font-mono uppercase tracking-[0.1em] h-9 px-3"
            >
              Discard Changes
            </Button>
            <Button
              type="button"
              className="bg-[#0E0E0E] hover:bg-[#222] text-[#F4F1EC] rounded-none text-xs font-mono uppercase tracking-[0.1em] h-9 px-4"
              onClick={async () => {
                await handleSave();
                setShowUnsavedWarning(false);
                onOpenChange(false);
              }}
            >
              Save &amp; Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
