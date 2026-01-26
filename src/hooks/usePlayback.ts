import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { playbackApi } from '@/lib/api';

export function usePlaySound() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ soundId, restart }: { soundId: string; restart?: boolean }) => 
      playbackApi.play(soundId, restart || false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['now-playing'] });
    },
  });
}

export function useStopSound() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (soundId: string) => playbackApi.stop(soundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['now-playing'] });
    },
  });
}

export function useToggleSound() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (soundId: string) => playbackApi.toggle(soundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['now-playing'] });
    },
  });
}

export function useRestartSound() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (soundId: string) => playbackApi.restart(soundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['now-playing'] });
    },
  });
}

export function useStopAll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => playbackApi.stopAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['now-playing'] });
    },
  });
}

export function useNowPlaying() {
  return useQuery({
    queryKey: ['now-playing'],
    queryFn: () => playbackApi.getNowPlaying() as Promise<any[]>,
    refetchInterval: 1000, // Poll every second
  });
}
