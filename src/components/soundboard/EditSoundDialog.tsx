import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateSound, useUploadAudio } from '@/hooks/useSounds';
import { useQueryClient } from '@tanstack/react-query';
import { soundsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Sound, SourceType } from '@/types/sound';
import { Image, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditSoundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sound: Sound | null;
}

export function EditSoundDialog({ open, onOpenChange, sound }: EditSoundDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [volume, setVolume] = useState('80');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localFilePath, setLocalFilePath] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const updateSound = useUpdateSound();
  const uploadAudioMutation = useUploadAudio();
  const queryClient = useQueryClient();

  // Initialize form with sound data
  useEffect(() => {
    if (sound) {
      setName(sound.name);
      setDescription(sound.description || '');
      setTags(sound.tags.join(', '));
      setVolume(sound.volume?.toString() || '80');
      setCoverPreview(sound.coverImage || null);
      // For LOCAL_FILE type, show the source as the file path
      setLocalFilePath(sound.sourceType === 'LOCAL_FILE' ? (sound.source || '') : '');
    }
  }, [sound, open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalFile(file);
      setLocalFilePath(file.name);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file (JPG, PNG, GIF, or WEBP)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: `File too large. Maximum size is 10MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`,
          variant: "destructive",
        });
        return;
      }

      if (file.size === 0) {
        toast({
          title: "Error",
          description: "Empty file selected",
          variant: "destructive",
        });
        return;
      }
      
      setCoverImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCover = () => {
    setCoverImage(null);
    setCoverPreview(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sound) return;

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update sound data
      const soundData: any = {
        name: name.trim(),
        description: description.trim() || null,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        volume: parseInt(volume) || 80,
      };

      await updateSound.mutateAsync({
        id: sound.id,
        data: soundData,
      });

      // Upload new audio file if selected
      if (localFile) {
        await uploadAudioMutation.mutateAsync({
          soundId: sound.id,
          file: localFile,
        });
      }

      // Upload new cover image if selected
      if (coverImage) {
        await soundsApi.uploadCover(sound.id, coverImage);
      }

      // Invalidate queries to refresh the sound data with new cover image URL
      queryClient.invalidateQueries({ queryKey: ['sounds'] });
      queryClient.invalidateQueries({ queryKey: ['sounds', sound.id] });

      toast({
        title: "Success",
        description: "Sound updated successfully",
      });

      // Reset form
      setCoverImage(null);
      setLocalFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (coverInputRef.current) coverInputRef.current.value = '';
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update sound",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (sound) {
      setName(sound.name);
      setDescription(sound.description || '');
      setTags(sound.tags.join(', '));
      setVolume(sound.volume?.toString() || '80');
      setCoverPreview(sound.coverImage || null);
      setCoverImage(null);
      setLocalFile(null);
      setLocalFilePath(sound.sourceType === 'LOCAL_FILE' ? (sound.source || '') : '');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
    onOpenChange(false);
  };

  if (!sound) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sound</DialogTitle>
          <DialogDescription>
            Update the sound details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sound name"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sound description"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <Label htmlFor="edit-volume">Volume (0-100)</Label>
            <Input
              id="edit-volume"
              type="number"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
            />
          </div>

          {/* Audio File (only for LOCAL_FILE) */}
          {sound.sourceType === 'LOCAL_FILE' && (
            <div className="space-y-2">
              <Label htmlFor="edit-audio-file">Audio File (optional - leave empty to keep current)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-audio-file"
                  type="text"
                  value={localFilePath}
                  placeholder="No file selected"
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image (optional)</Label>
            {coverPreview ? (
              <div className="relative">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveCover}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => coverInputRef.current?.click()}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Select Cover Image
                </Button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateSound.isPending || uploadAudioMutation.isPending}
            >
              {updateSound.isPending || uploadAudioMutation.isPending ? 'Updating...' : 'Update Sound'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
