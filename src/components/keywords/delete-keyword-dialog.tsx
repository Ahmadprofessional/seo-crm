'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Keyword } from '@/lib/types';
import { useDeleteKeywordMutation } from '@/lib/hooks/use-keywords';

interface DeleteKeywordDialogProps {
  keyword: Keyword | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteKeywordDialog({
  keyword,
  open,
  onOpenChange,
  onDeleted,
}: DeleteKeywordDialogProps) {
  const deleteMutation = useDeleteKeywordMutation();

  if (!keyword) return null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(keyword.id);
      onOpenChange(false);
      onDeleted?.();
    } catch {
      // Handled by mutation toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-none border border-[#E5E0D8] bg-white p-6 shadow-2xl">
        <DialogHeader>
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-none bg-red-50 text-red-700 border border-red-200 mb-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center font-serif text-xl font-normal text-[#0E0E0E]">
            Delete Target Keyword
          </DialogTitle>
          <DialogDescription className="text-center text-xs font-mono text-[#666] pt-1">
            Are you sure you want to delete{' '}
            <span className="text-[#0E0E0E] font-serif font-bold">"{keyword.keyword}"</span>?
            <br />
            This will permanently remove the row from Google Sheets and log a deletion entry in the audit trail.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-center gap-2 pt-4 border-t border-[#E5E0D8]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
            className="border-[#E5E0D8] text-[#0E0E0E] rounded-none text-xs font-mono uppercase tracking-[0.1em] h-9 px-3"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-700 hover:bg-red-800 text-white rounded-none text-xs font-mono uppercase tracking-[0.1em] h-9 px-3 gap-1.5"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Delete Row
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
