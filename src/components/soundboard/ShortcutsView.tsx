import { useState } from 'react';
import { Keyboard, AlertTriangle, Check, X, Edit2, Trash2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sound, Shortcut } from '@/types/sound';
import { HotkeyBadge } from './HotkeyBadge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { EditShortcutDialog } from './EditShortcutDialog';

interface ShortcutsViewProps {
  shortcuts: Shortcut[];
  sounds: Sound[];
  onToggleShortcut: (id: string) => void;
  onDeleteShortcut: (id: string) => void;
}

export function ShortcutsView({
  shortcuts,
  sounds,
  onToggleShortcut,
  onDeleteShortcut,
}: ShortcutsViewProps) {
  const [recordingFor, setRecordingFor] = useState<string | null>(null);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);

  const getSoundForShortcut = (shortcut: Shortcut) => 
    sounds.find(s => s.id === shortcut.soundId);

  // Check for duplicate hotkeys
  const hotkeyConflicts = shortcuts.reduce((acc, shortcut) => {
    const duplicates = shortcuts.filter(
      s => s.id !== shortcut.id && s.hotkey === shortcut.hotkey && s.enabled
    );
    if (duplicates.length > 0) {
      acc[shortcut.id] = true;
    }
    return acc;
  }, {} as Record<string, boolean>);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Keyboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Keyboard Shortcuts</h1>
            <p className="text-sm text-muted-foreground">
              Manage global hotkeys for your sounds
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sound
                </th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Hotkey
                </th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Action
                </th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((shortcut) => {
                const sound = getSoundForShortcut(shortcut);
                const hasConflict = hotkeyConflicts[shortcut.id];

                return (
                  <tr 
                    key={shortcut.id}
                    className={cn(
                      "border-b border-border/30 hover:bg-secondary/30 transition-colors",
                      hasConflict && "bg-destructive/5"
                    )}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          {sound?.coverImage ? (
                            <img 
                              src={sound.coverImage} 
                              alt={sound.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
                              <Volume2 className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-foreground">
                          {sound?.name ?? 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <HotkeyBadge hotkey={shortcut.hotkey} />
                        {hasConflict && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="w-3 h-3" />
                            Conflict
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground capitalize">
                        {shortcut.action.toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Switch
                        checked={shortcut.enabled}
                        onCheckedChange={() => onToggleShortcut(shortcut.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setEditingShortcut(shortcut)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDeleteShortcut(shortcut.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {shortcuts.length === 0 && (
            <div className="p-12 text-center">
              <Keyboard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <h3 className="font-medium text-foreground mb-1">No shortcuts yet</h3>
              <p className="text-sm text-muted-foreground">
                Add a shortcut from the sound library to get started
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-border/50">
          <h3 className="font-medium text-foreground mb-2">💡 Tips</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Global shortcuts work even when the app is not focused</li>
            <li>• Avoid conflicts with system shortcuts (Ctrl+C, Ctrl+V, etc.)</li>
            <li>• Use Ctrl, Alt, Shift modifiers for unique combinations</li>
          </ul>
        </div>
      </div>

      {/* Edit Shortcut Dialog */}
      <EditShortcutDialog
        open={editingShortcut !== null}
        onOpenChange={(open) => !open && setEditingShortcut(null)}
        shortcut={editingShortcut}
      />
    </div>
  );
}
