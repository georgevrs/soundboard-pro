import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateShortcut } from '@/hooks/useShortcuts';
import { toast } from '@/hooks/use-toast';
import { Shortcut, ShortcutAction } from '@/types/sound';

interface EditShortcutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcut: Shortcut | null;
}

export function EditShortcutDialog({ open, onOpenChange, shortcut }: EditShortcutDialogProps) {
  const [hotkey, setHotkey] = useState('');
  const [action, setAction] = useState<ShortcutAction>('PLAY');
  const [enabled, setEnabled] = useState(true);
  
  const updateShortcut = useUpdateShortcut();

  useEffect(() => {
    if (shortcut) {
      setHotkey(shortcut.hotkey);
      setAction(shortcut.action);
      setEnabled(shortcut.enabled);
    }
  }, [shortcut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shortcut) return;

    if (!hotkey.trim()) {
      toast({
        title: "Error",
        description: "Hotkey is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateShortcut.mutateAsync({
        id: shortcut.id,
        data: {
          hotkey: hotkey.trim(),
          action,
          enabled,
        },
      });
      
      toast({
        title: "Success",
        description: "Shortcut updated successfully",
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update shortcut",
        variant: "destructive",
      });
    }
  };

  if (!shortcut) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Shortcut</DialogTitle>
          <DialogDescription>
            Update the hotkey and action for this shortcut.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="hotkey">Hotkey *</Label>
              <Input
                id="hotkey"
                value={hotkey}
                onChange={(e) => setHotkey(e.target.value)}
                placeholder="Ctrl+Alt+1"
                required
              />
              <p className="text-xs text-muted-foreground">
                Press the keys you want to use (e.g., Ctrl+Alt+1)
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
            <Button type="submit" disabled={updateShortcut.isPending}>
              {updateShortcut.isPending ? 'Updating...' : 'Update Shortcut'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
