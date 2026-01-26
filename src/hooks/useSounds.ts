import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { soundsApi } from '@/lib/api';
import { Sound } from '@/types/sound';
import { transformSound } from '@/lib/apiTransform';

export function useSounds(params?: { q?: string; tag?: string; source_type?: string; sort?: string }) {
  return useQuery({
    queryKey: ['sounds', params],
    queryFn: async () => {
      const data = await soundsApi.getAll(params);
      return data.map(transformSound);
    },
  });
}

export function useSound(id: string | null) {
  return useQuery({
    queryKey: ['sounds', id],
    queryFn: () => id ? soundsApi.getById(id) as Promise<Sound> : null,
    enabled: !!id,
  });
}

export function useCreateSound() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => soundsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sounds'] });
    },
  });
}

export function useUploadAudio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ soundId, file }: { soundId: string; file: File }) => 
      soundsApi.uploadAudio(soundId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sounds'] });
      queryClient.invalidateQueries({ queryKey: ['sounds', variables.soundId] });
    },
  });
}

export function useUpdateSound() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => soundsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sounds'] });
    },
  });
}

export function useDeleteSound() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => soundsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sounds'] });
    },
  });
}

export function useIngestSound() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => soundsApi.ingest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sounds'] });
    },
  });
}
