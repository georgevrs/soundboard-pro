import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateShortcut, useCheckHotkeyConflict } from '@/hooks/useShortcuts';
import { toast } from '@/hooks/use-toast';
import { Sound, ShortcutAction } from '@/types/sound';

interface CreateShortcutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sound: Sound | null;
}

export function CreateShortcutDialog({ open, onOpenChange, sound }: CreateShortcutDialogProps) {
  const [hotkey, setHotkey] = useState('');
  const [action, setAction] = useState<ShortcutAction>('PLAY');
  const [enabled, setEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  const createShortcut = useCreateShortcut();
  const checkConflict = useCheckHotkeyConflict();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && sound) {
      setHotkey('');
      setAction('PLAY');
      setEnabled(true);
      setIsRecording(false);
    }
  }, [open, sound]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const parts: string[] = [];
    
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');
    
    // Get the main key (avoid modifiers)
    if (e.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      parts.push(key);
    }

    if (parts.length > 0) {
      setHotkey(parts.join('+'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sound) return;

    if (!hotkey.trim()) {
      toast({
        title: "Error",
        description: "Hotkey is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check for conflicts
      const conflictCheck = await checkConflict.mutateAsync(hotkey.trim());
      if (conflictCheck && (conflictCheck.conflict || conflictCheck.conflicts)) {
        toast({
          title: "Hotkey Conflict",
          description: "This hotkey is already in use by another shortcut",
          variant: "destructive",
        });
        return;
      }

      await createShortcut.mutateAsync({
        sound_id: sound.id,
        hotkey: hotkey.trim(),
        action,
        enabled,
      });
      
      toast({
        title: "Success",
        description: "Shortcut created successfully",
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create shortcut",
        variant: "destructive",
      });
    }
  };

  if (!sound) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Create Shortcut</DialogTitle>
          <DialogDescription>
            Bind a keyboard shortcut for "{sound.name}".
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="hotkey">Hotkey *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="hotkey"
                  value={hotkey}
                  onChange={(e) => setHotkey(e.target.value)}
                  placeholder="Ctrl+Alt+1"
                  required
                  onFocus={() => setIsRecording(true)}
                  onBlur={() => setIsRecording(false)}
                />
                <Button
                  type="button"
                  variant={isRecording ? "default" : "outline"}
                  onClick={() => setIsRecording(!isRecording)}
                >
                  {isRecording ? 'Recording...' : 'Record'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isRecording 
                  ? "Press the keys you want to use for this shortcut"
                  : "Click 'Record' and press your desired key combination, or type it manually (e.g., Ctrl+Alt+1)"}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="action">Action *</Label>
              <Select value={action} onValueChange={(value) => setAction(value as ShortcutAction)}>
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLAY">Play</SelectItem>
                  <SelectItem value="STOP">Stop</SelectItem>
                  <SelectItem value="TOGGLE">Toggle</SelectItem>
                  <SelectItem value="RESTART">Restart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enabled</Label>
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createShortcut.isPending}>
              {createShortcut.isPending ? 'Creating...' : 'Create Shortcut'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
