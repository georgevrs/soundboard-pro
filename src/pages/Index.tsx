import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from '@/components/soundboard/Sidebar';
import { SoundCard } from '@/components/soundboard/SoundCard';
import { InspectorPanel } from '@/components/soundboard/InspectorPanel';
import { NowPlayingBar } from '@/components/soundboard/NowPlayingBar';
import { ShortcutsView } from '@/components/soundboard/ShortcutsView';
import { SettingsView } from '@/components/soundboard/SettingsView';
import { EmptyState } from '@/components/soundboard/EmptyState';
import { mockSounds, mockShortcuts, allTags } from '@/data/mockSounds';
import { Sound, Shortcut } from '@/types/sound';
import { Grid, List, SortAsc, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ViewMode = 'library' | 'shortcuts' | 'settings';
type LayoutMode = 'grid' | 'list';
type SortMode = 'recent' | 'name' | 'plays';

export default function Index() {
  const [sounds] = useState<Sound[]>(mockSounds);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(mockShortcuts);
  
  const [currentView, setCurrentView] = useState<ViewMode>('library');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [playingSound, setPlayingSound] = useState<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [isDark, setIsDark] = useState(true);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Filter and sort sounds
  const filteredSounds = useMemo(() => {
    let result = [...sounds];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      result = result.filter(s => 
        selectedTags.some(tag => s.tags.includes(tag))
      );
    }

    // Source filter
    if (selectedSource) {
      result = result.filter(s => s.sourceType === selectedSource);
    }

    // Sort
    switch (sortMode) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'plays':
        result.sort((a, b) => b.playCount - a.playCount);
        break;
      case 'recent':
      default:
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return result;
  }, [sounds, searchQuery, selectedTags, selectedSource, sortMode]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handlePlaySound = (sound: Sound) => {
    if (playingSound?.id === sound.id && isPlaying) {
      setIsPlaying(false);
    } else {
      setPlayingSound(sound);
      setIsPlaying(true);
    }
  };

  const handleStopSound = () => {
    setIsPlaying(false);
    setPlayingSound(null);
  };

  const handleToggleShortcut = (id: string) => {
    setShortcuts(prev => 
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const handleDeleteShortcut = (id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  };

  const getShortcutForSound = (soundId: string) => 
    shortcuts.find(s => s.soundId === soundId);

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
                    <EmptyState onAddSound={() => {}} />
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
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onStop={handleStopSound}
        onStopAll={handleStopSound}
        playingSoundsCount={isPlaying && playingSound ? 1 : 0}
      />
    </div>
  );
}
