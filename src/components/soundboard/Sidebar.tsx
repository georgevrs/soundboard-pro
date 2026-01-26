import { useState } from 'react';
import { 
  Search, 
  Music, 
  Link, 
  Youtube, 
  FolderOpen, 
  Tag as TagIcon,
  Settings,
  Keyboard,
  Plus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { TagPill } from './TagPill';

interface SidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: string[];
  selectedSource: string | null;
  onSourceSelect: (source: string | null) => void;
  onViewChange: (view: 'library' | 'shortcuts' | 'settings') => void;
  currentView: string;
}

export function Sidebar({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagToggle,
  availableTags,
  selectedSource,
  onSourceSelect,
  onViewChange,
  currentView,
}: SidebarProps) {
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [sourcesExpanded, setSourcesExpanded] = useState(true);

  const sources = [
    { id: 'DIRECT_URL', label: 'Direct URL', icon: Link },
    { id: 'YOUTUBE', label: 'YouTube', icon: Youtube },
    { id: 'LOCAL_FILE', label: 'Local File', icon: FolderOpen },
  ];

  return (
    <aside className="w-64 h-full glass-card rounded-none border-r border-border/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Music className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">KeySound</h1>
            <p className="text-[10px] text-muted-foreground">Commander</p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search sounds..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-secondary/50 border-transparent focus:border-primary/50"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {/* Main Nav */}
        <div className="sidebar-section border-none">
          <div
            className={cn("sidebar-item", currentView === 'library' && "active")}
            onClick={() => onViewChange('library')}
          >
            <Music className="w-4 h-4" />
            <span>Sound Library</span>
          </div>
          <div
            className={cn("sidebar-item", currentView === 'shortcuts' && "active")}
            onClick={() => onViewChange('shortcuts')}
          >
            <Keyboard className="w-4 h-4" />
            <span>Shortcuts</span>
          </div>
          <div
            className={cn("sidebar-item", currentView === 'settings' && "active")}
            onClick={() => onViewChange('settings')}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
        </div>

        {/* Source Filter */}
        <div className="sidebar-section">
          <button
            className="flex items-center gap-2 w-full px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            onClick={() => setSourcesExpanded(!sourcesExpanded)}
          >
            {sourcesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Sources
          </button>
          
          {sourcesExpanded && (
            <div className="mt-2">
              {sources.map(source => (
                <div
                  key={source.id}
                  className={cn(
                    "sidebar-item",
                    selectedSource === source.id && "active"
                  )}
                  onClick={() => onSourceSelect(selectedSource === source.id ? null : source.id)}
                >
                  <source.icon className="w-4 h-4" />
                  <span>{source.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags Filter */}
        <div className="sidebar-section border-none">
          <button
            className="flex items-center gap-2 w-full px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            onClick={() => setTagsExpanded(!tagsExpanded)}
          >
            {tagsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Tags
          </button>
          
          {tagsExpanded && (
            <div className="mt-2 px-3 flex flex-wrap gap-1.5">
              {availableTags.map(tag => (
                <TagPill
                  key={tag}
                  tag={tag}
                  isActive={selectedTags.includes(tag)}
                  onClick={() => onTagToggle(tag)}
                />
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Add Sound Button */}
      <div className="p-4 border-t border-border/50">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors glow-primary">
          <Plus className="w-4 h-4" />
          Add Sound
        </button>
      </div>
    </aside>
  );
}
