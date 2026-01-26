import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shortcutsApi } from '@/lib/api';
import { Shortcut } from '@/types/sound';
import { transformShortcut } from '@/lib/apiTransform';

export function useShortcuts() {
  return useQuery({
    queryKey: ['shortcuts'],
    queryFn: async () => {
      const data = await shortcutsApi.getAll() as any[];
      return data.map(transformShortcut);
    },
  });
}

export function useCreateShortcut() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => shortcutsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortcuts'] });
    },
  });
}

export function useUpdateShortcut() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => shortcutsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortcuts'] });
    },
  });
}

export function useDeleteShortcut() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => shortcutsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortcuts'] });
    },
  });
}

export function useCheckHotkeyConflict() {
  return useMutation({
    mutationFn: (hotkey: string) => shortcutsApi.checkConflict(hotkey),
  });
}
