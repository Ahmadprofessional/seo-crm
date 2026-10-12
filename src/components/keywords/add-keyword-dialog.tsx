'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { AlertCircle, Plus, Loader2 } from 'lucide-react';
import { useCreateKeywordMutation } from '@/lib/hooks/use-keywords';
import { DEFAULT_CATEGORIES, DEFAULT_STATUSES, PRIORITIES } from '@/lib/types';

interface AddKeywordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: string[];
  statuses?: string[];
  users?: string[];
}

export function AddKeywordDialog({
  open,
  onOpenChange,
  categories = DEFAULT_CATEGORIES,
  statuses = DEFAULT_STATUSES,
  users = [],
}: AddKeywordDialogProps) {
  const [keyword, setKeyword] = useState('');
  const [volume, setVolume] = useState<number | string>(100);
  const [category, setCategory] = useState(categories[0] || 'Aesthetic Clinic');
  const [status, setStatus] = useState(statuses[0] || 'Research');
  const [priority, setPriority] = useState<string>('Medium');
  const [targetUrl, setTargetUrl] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  // Duplicate warning modal state
  const [duplicateWarning, setDuplicateWarning] = useState<{
    existingKeyword: string;
    existingId: string;
  } | null>(null);

  const createMutation = useCreateKeywordMutation();

  const resetForm = () => {
    setKeyword('');
    setVolume(100);
    setCategory(categories[0] || 'Aesthetic Clinic');
    setStatus(statuses[0] || 'Research');
    setPriority('Medium');
    setTargetUrl('');
    setAssignedTo('');
    setNotes('');
    setDuplicateWarning(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (force = false) => {
    if (!keyword.trim()) return;

    try {
      await createMutation.mutateAsync({
        keyword: keyword.trim(),
        volume: Number(volume) || 0,
        category,
        status,
        priority,
        target_url: targetUrl.trim(),
        assigned_to: assignedTo,
        notes: notes.trim(),
        force,
      });

      handleClose();
    } catch (err: unknown) {
      const errorObj = err as { message?: string; duplicateData?: { existingKeyword: string; existingId: string } };
      if (errorObj.message === 'duplicate' && errorObj.duplicateData) {
        setDuplicateWarning(errorObj.duplicateData);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="sm:max-w-[500px] rounded-none border border-[#E5E0D8] bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl font-normal text-[#0E0E0E]">
              <Plus className="h-4 w-4 text-[#0F766E]" />
              Add Target Keyword
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-[#777] mt-1">
              Record a new SEO search query and demand metric in Google Sheets.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(false);
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="kw-name" className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                Target Query <span className="text-red-600">*</span>
              </Label>
              <Input
                id="kw-name"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. dermal fillers london"
                required
                autoFocus
                className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-serif text-[#0E0E0E] focus-visible:ring-0 focus-visible:border-[#0F766E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="kw-volume" className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                  Monthly Volume
                </Label>
                <Input
                  id="kw-volume"
                  type="number"
                  min="0"
                  step="1"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  placeholder="e.g. 1200"
                  className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono tabular-nums text-[#0E0E0E] focus-visible:ring-0 focus-visible:border-[#0F766E]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kw-priority" className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                  Priority
                </Label>
                <Select value={priority} onValueChange={(val) => setPriority(val ?? 'Medium')}>
                  <SelectTrigger id="kw-priority" className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-[#E5E0D8] font-mono text-xs">
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="kw-category" className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                  Category
                </Label>
                <Select value={category} onValueChange={(val) => setCategory(val ?? (categories[0] || ''))}>
                  <SelectTrigger id="kw-category" className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-[#E5E0D8] font-mono text-xs">
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kw-status" className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                  Lifecycle Status
                </Label>
                <Select value={status} onValueChange={(val) => setStatus(val ?? (statuses[0] || ''))}>
                  <SelectTrigger id="kw-status" className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-[#E5E0D8] font-mono text-xs">
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="kw-url" className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                  Target URL
                </Label>
                <Input
                  id="kw-url"
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com/..."
                  className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono text-[#0E0E0E] focus-visible:ring-0 focus-visible:border-[#0F766E]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kw-assigned" className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                  Assign Editor
                </Label>
                {users.length > 0 ? (
                  <Select value={assignedTo} onValueChange={(val) => setAssignedTo(val ?? '')}>
                    <SelectTrigger id="kw-assigned" className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono">
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
                    id="kw-assigned"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="Team member name"
                    className="h-9 bg-white border-[#E5E0D8] rounded-none text-xs font-mono text-[#0E0E0E] focus-visible:ring-0 focus-visible:border-[#0F766E]"
                  />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kw-notes" className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#666]">
                Editorial Notes
              </Label>
              <Textarea
                id="kw-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes or search intent rationale..."
                rows={2}
                className="resize-none bg-white border-[#E5E0D8] rounded-none text-xs font-serif leading-relaxed text-[#0E0E0E] focus-visible:ring-0 focus-visible:border-[#0F766E]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E5E0D8]">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-[#E5E0D8] bg-white hover:bg-[#EAE5DC] text-[#0E0E0E] rounded-none text-xs font-mono uppercase tracking-[0.1em] h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !keyword.trim()}
                className="bg-[#0E0E0E] hover:bg-[#222] text-[#F4F1EC] rounded-none text-xs font-mono uppercase tracking-[0.14em] h-9 px-4 gap-1.5 disabled:opacity-40"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Recording…
                  </>
                ) : (
                  'Add Target'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Duplicate Warning Dialog */}
      <Dialog
        open={Boolean(duplicateWarning)}
        onOpenChange={(isOpen) => !isOpen && setDuplicateWarning(null)}
      >
        <DialogContent className="sm:max-w-[420px] rounded-none border border-[#E5E0D8] bg-white p-6 shadow-2xl">
          <DialogHeader>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-none bg-amber-50 text-amber-700 border border-amber-200 mb-2">
              <AlertCircle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center font-serif text-xl font-normal text-[#0E0E0E]">
              Duplicate Query Detected
            </DialogTitle>
            <DialogDescription className="text-center text-xs font-mono text-[#666] pt-1">
              The query <span className="text-[#0E0E0E] font-serif font-bold">"{keyword}"</span> already exists:
              <br />
              <span className="inline-block mt-2 font-mono text-xs text-[#0F766E] bg-[#0F766E]/5 px-2.5 py-1 border border-[#0F766E]/30">
                "{duplicateWarning?.existingKeyword}"
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-center gap-2 pt-4 border-t border-[#E5E0D8]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDuplicateWarning(null)}
              className="border-[#E5E0D8] text-[#0E0E0E] rounded-none text-xs font-mono uppercase tracking-[0.1em] h-9 px-3"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-amber-700 hover:bg-amber-800 text-white rounded-none text-xs font-mono uppercase tracking-[0.1em] h-9 px-3"
              disabled={createMutation.isPending}
              onClick={() => handleSubmit(true)}
            >
              {createMutation.isPending ? 'Recording…' : 'Record Anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
