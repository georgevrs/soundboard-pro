import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from '@/components/soundboard/Sidebar';
import { SoundCard } from '@/components/soundboard/SoundCard';
import { InspectorPanel } from '@/components/soundboard/InspectorPanel';
import { NowPlayingBar } from '@/components/soundboard/NowPlayingBar';
import { ShortcutsView } from '@/components/soundboard/ShortcutsView';
import { SettingsView } from '@/components/soundboard/SettingsView';
import { EmptyState } from '@/components/soundboard/EmptyState';
import { CreateSoundDialog } from '@/components/soundboard/CreateSoundDialog';
import { Sound, Shortcut } from '@/types/sound';
import { Grid, List, SortAsc, Moon, Sun, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSounds } from '@/hooks/useSounds';
import { useShortcuts, useUpdateShortcut, useDeleteShortcut } from '@/hooks/useShortcuts';
import { usePlaySound, useStopSound, useToggleSound } from '@/hooks/usePlayback';
import { useNowPlaying } from '@/hooks/usePlayback';
import { toast } from '@/hooks/use-toast';

type ViewMode = 'library' | 'shortcuts' | 'settings';
type LayoutMode = 'grid' | 'list';
type SortMode = 'recent' | 'name' | 'plays';

export default function Index() {
  const [currentView, setCurrentView] = useState<ViewMode>('library');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const [isDark, setIsDark] = useState(true);

  // API hooks
  const { data: sounds = [], isLoading: soundsLoading, error: soundsError } = useSounds({
    q: searchQuery || undefined,
    tag: selectedTags.length > 0 ? selectedTags[0] : undefined,
    source_type: selectedSource || undefined,
    sort: sortMode,
  });

  const { data: shortcuts = [], isLoading: shortcutsLoading } = useShortcuts();
  const { data: nowPlaying = [] } = useNowPlaying();
  
  // Playback mutations
  const playMutation = usePlaySound();
  const stopMutation = useStopSound();
  const toggleMutation = useToggleSound();
  
  // Shortcut mutations
  const updateShortcut = useUpdateShortcut();
  const deleteShortcut = useDeleteShortcut();

  // Get all unique tags from sounds
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    sounds.forEach(sound => {
      sound.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [sounds]);

  // Find currently playing sound
  const playingSound = useMemo(() => {
    if (!nowPlaying || nowPlaying.length === 0) return null;
    const playing = nowPlaying[0];
    return sounds.find(s => s.id === playing.sound_id) || null;
  }, [nowPlaying, sounds]);

  const isPlaying = playingSound !== null;

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Filter sounds (backend handles search, but we can do additional client-side filtering)
  const filteredSounds = useMemo(() => {
    return sounds;
  }, [sounds]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handlePlaySound = async (sound: Sound) => {
    try {
      if (playingSound?.id === sound.id && isPlaying) {
        // Stop if already playing
        await stopMutation.mutateAsync(sound.id);
      } else {
        // Play the sound
        await playMutation.mutateAsync({ soundId: sound.id, restart: false });
        toast({
          title: "Playing sound",
          description: sound.name,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to play sound",
        variant: "destructive",
      });
    }
  };

  const handleStopSound = async () => {
    if (playingSound) {
      try {
        await stopMutation.mutateAsync(playingSound.id);
        toast({
          title: "Stopped",
          description: playingSound.name,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to stop sound",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleShortcut = async (id: string) => {
    const shortcut = shortcuts.find(s => s.id === id);
    if (!shortcut) return;
    
    try {
      await updateShortcut.mutateAsync({
        id: shortcut.id,
        data: {
          enabled: !shortcut.enabled,
        },
      });
      toast({
        title: shortcut.enabled ? "Shortcut disabled" : "Shortcut enabled",
        description: `Hotkey: ${shortcut.hotkey}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle shortcut",
        variant: "destructive",
      });
    }
  };

  const handleDeleteShortcut = async (id: string) => {
    const shortcut = shortcuts.find(s => s.id === id);
    if (!shortcut) return;
    
    try {
      await deleteShortcut.mutateAsync(id);
      toast({
        title: "Shortcut deleted",
        description: `Removed hotkey: ${shortcut.hotkey}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete shortcut",
        variant: "destructive",
      });
    }
  };

  const getShortcutForSound = (soundId: string) => 
    shortcuts.find(s => s.soundId === soundId);

  // Show loading state
  if (soundsLoading || shortcutsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show error state
  if (soundsError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load sounds</p>
          <p className="text-sm text-muted-foreground">
            Make sure the backend is running at http://localhost:8000
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          availableTags={allTags}
          selectedSource={selectedSource}
          onSourceSelect={setSelectedSource}
          onViewChange={setCurrentView}
          currentView={currentView}
        />

        {/* Main Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentView === 'library' && (
            <>
              {/* Toolbar */}
              <div className="h-14 border-b border-border/50 px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {filteredSounds.length} sounds
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateDialogOpen(true)}
                    className="ml-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sound
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Sort */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/50">
                    <SortAsc className="w-4 h-4 text-muted-foreground" />
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as SortMode)}
                      className="text-sm bg-transparent text-foreground outline-none cursor-pointer"
                    >
                      <option value="recent">Recent</option>
                      <option value="name">Name</option>
                      <option value="plays">Most Played</option>
                    </select>
                  </div>

                  {/* Layout Toggle */}
                  <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setLayoutMode('grid')}
                      className={cn(
                        "p-2 transition-colors",
                        layoutMode === 'grid' 
                          ? "bg-secondary text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setLayoutMode('list')}
                      className={cn(
                        "p-2 transition-colors",
                        layoutMode === 'list' 
                          ? "bg-secondary text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Theme Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDark(!isDark)}
                    className="h-9 w-9"
                  >
                    {isDark ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Sound Grid/List */}
                <div className="flex-1 overflow-y-auto p-6">
                  {filteredSounds.length === 0 ? (
                    <EmptyState onAddSound={() => setCreateDialogOpen(true)} />
                  ) : (
                    <div className={cn(
                      layoutMode === 'grid'
                        ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                        : "flex flex-col gap-2"
                    )}>
                      {filteredSounds.map((sound) => (
                        <SoundCard
                          key={sound.id}
                          sound={sound}
                          shortcut={getShortcutForSound(sound.id)}
                          isPlaying={playingSound?.id === sound.id && isPlaying}
                          isSelected={selectedSound?.id === sound.id}
                          onPlay={() => handlePlaySound(sound)}
                          onSelect={() => setSelectedSound(sound)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Inspector */}
                <div className="w-80 border-l border-border/50">
                  <InspectorPanel
                    sound={selectedSound}
                    shortcut={selectedSound ? getShortcutForSound(selectedSound.id) : undefined}
                    isPlaying={playingSound?.id === selectedSound?.id && isPlaying}
                    onPlay={() => selectedSound && handlePlaySound(selectedSound)}
                    onStop={handleStopSound}
                    onClose={() => setSelectedSound(null)}
                  />
                </div>
              </div>
            </>
          )}

          {currentView === 'shortcuts' && (
            <ShortcutsView
              shortcuts={shortcuts}
              sounds={sounds}
              onToggleShortcut={handleToggleShortcut}
              onDeleteShortcut={handleDeleteShortcut}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Now Playing Bar */}
      <NowPlayingBar
        currentSound={playingSound}
        isPlaying={isPlaying}
        onPlay={() => playingSound && handlePlaySound(playingSound)}
        onPause={() => playingSound && handleStopSound()}
        onStop={handleStopSound}
        onStopAll={handleStopSound}
        playingSoundsCount={nowPlaying?.length || 0}
      />

      {/* Create Sound Dialog */}
      <CreateSoundDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
