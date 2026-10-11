import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Keyword, KeywordCreate, KeywordUpdate, Settings, ActivityRow } from '@/lib/types';

interface KeywordsData {
  keywords: Keyword[];
  settings: Settings;
}

export function useKeywordsQuery() {
  return useQuery<KeywordsData>({
    queryKey: ['keywords'],
    queryFn: async () => {
      const res = await fetch('/api/keywords', { cache: 'no-store' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch keywords');
      }
      const json = await res.json();
      return json.data;
    },
  });
}

export function useActivityQuery(keywordId?: string) {
  return useQuery<ActivityRow[]>({
    queryKey: ['activity', keywordId],
    queryFn: async () => {
      const url = keywordId
        ? `/api/activity?keyword_id=${encodeURIComponent(keywordId)}`
        : '/api/activity';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch activities');
      }
      const json = await res.json();
      return json.data || [];
    },
    enabled: keywordId !== undefined ? Boolean(keywordId) : true,
  });
}

export function useCreateKeywordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: KeywordCreate & { force?: boolean }) => {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409 && json.error === 'duplicate') {
          const err = new Error('duplicate');
          (err as unknown as { duplicateData: { existingKeyword: string; existingId: string } }).duplicateData = json.data;
          throw err;
        }
        throw new Error(json.error || 'Failed to create keyword');
      }

      return json.data as Keyword;
    },
    onSuccess: (newKeyword) => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      toast.success(`Keyword "${newKeyword.keyword}" added successfully`);
    },
  });
}

export function useUpdateKeywordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: KeywordUpdate) => {
      const res = await fetch('/api/keywords', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update keyword');
      }
      return json.data as Keyword;
    },
    onMutate: async (newKeywordData) => {
      await queryClient.cancelQueries({ queryKey: ['keywords'] });

      const previousData = queryClient.getQueryData<KeywordsData>(['keywords']);

      if (previousData) {
        queryClient.setQueryData<KeywordsData>(['keywords'], {
          ...previousData,
          keywords: previousData.keywords.map((kw) =>
            kw.id === newKeywordData.id ? { ...kw, ...newKeywordData, updated_at: new Date().toISOString() } : kw
          ),
        });
      }

      return { previousData };
    },
    onError: (err, newKeywordData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['keywords'], context.previousData);
      }
      toast.error(err instanceof Error ? err.message : 'Update failed. Changes rolled back.');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['activity', variables.id] });
      }
    },
  });
}

export function useDeleteKeywordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/keywords', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to delete keyword');
      }
      return id;
    },
    onMutate: async (idToDelete) => {
      await queryClient.cancelQueries({ queryKey: ['keywords'] });

      const previousData = queryClient.getQueryData<KeywordsData>(['keywords']);

      if (previousData) {
        queryClient.setQueryData<KeywordsData>(['keywords'], {
          ...previousData,
          keywords: previousData.keywords.filter((kw) => kw.id !== idToDelete),
        });
      }

      return { previousData };
    },
    onError: (err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['keywords'], context.previousData);
      }
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });
}

export function useBulkActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      ids: string[];
      action: 'delete' | 'update';
      field?: 'status' | 'category' | 'assigned_to';
      value?: string;
    }) => {
      const res = await fetch('/api/keywords/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Bulk action failed');
      }
      return json.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      if (variables.action === 'delete') {
        toast.success(`Deleted ${variables.ids.length} keywords`);
      } else {
        toast.success(`Updated ${variables.ids.length} keywords`);
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Bulk action failed');
    },
  });
}
