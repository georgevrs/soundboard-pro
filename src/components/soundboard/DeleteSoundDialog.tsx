import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface DeleteSoundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  soundName: string;
  onConfirm: () => void;
}

export function DeleteSoundDialog({
  open,
  onOpenChange,
  soundName,
  onConfirm,
}: DeleteSoundDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">Delete Sound</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-2">
            Are you sure you want to delete <span className="font-semibold text-foreground">"{soundName}"</span>?
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              This action cannot be undone. The sound and all associated data will be permanently removed.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
