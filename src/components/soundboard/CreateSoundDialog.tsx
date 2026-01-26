import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateSound, useIngestSound } from '@/hooks/useSounds';
import { soundsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { SourceType } from '@/types/sound';
import { Image, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateSoundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSoundDialog({ open, onOpenChange }: CreateSoundDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('DIRECT_URL');
  const [sourceUrl, setSourceUrl] = useState('');
  const [volume, setVolume] = useState('80');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [localFilePath, setLocalFilePath] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const createSound = useCreateSound();
  const ingestSound = useIngestSound();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalFilePath(file.name);
      // Note: For local files, we'll need to handle file upload separately
      // For now, we'll store the file path
      setSourceUrl(file.name);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
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
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (sourceType === 'LOCAL_FILE' && !localFilePath) {
      toast({
        title: "Error",
        description: "Please select a local file",
        variant: "destructive",
      });
      return;
    }

    if (!sourceUrl.trim() && sourceType !== 'LOCAL_FILE') {
      toast({
        title: "Error",
        description: "Source URL is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const soundData: any = {
        name: name.trim(),
        description: description.trim() || null,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        source_type: sourceType,
        volume: volume ? parseInt(volume) : null,
      };

      if (sourceType === 'DIRECT_URL' || sourceType === 'YOUTUBE') {
        soundData.source_url = sourceUrl.trim();
      } else if (sourceType === 'LOCAL_FILE') {
        // For local files, store the file path
        // In a real implementation, you'd upload the file first
        soundData.source_url = localFilePath;
        soundData.local_path = localFilePath;
      }

      const createdSound = await createSound.mutateAsync(soundData) as { id: string } | undefined;
      const soundId = createdSound?.id;
      
      // Upload cover image if provided
      if (coverImage && soundId) {
        try {
          await soundsApi.uploadCover(soundId, coverImage);
        } catch (coverError: any) {
          console.error('Failed to upload cover:', coverError);
          toast({
            title: "Warning",
            description: "Sound created but cover image upload failed",
            variant: "default",
          });
        }
      }

      // Ingest YouTube sound if needed
      if (sourceType === 'YOUTUBE' && soundId) {
        try {
          await ingestSound.mutateAsync(soundId);
          toast({
            title: "Success",
            description: "Sound created and YouTube audio is being downloaded",
          });
        } catch (ingestError: any) {
          toast({
            title: "Partial Success",
            description: "Sound created but YouTube download failed. You can retry later.",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Sound created successfully",
        });
      }

      // Reset form
      setName('');
      setDescription('');
      setTags('');
      setSourceUrl('');
      setLocalFilePath('');
      setVolume('80');
      setSourceType('DIRECT_URL');
      setCoverImage(null);
      setCoverPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (coverInputRef.current) coverInputRef.current.value = '';
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create sound",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Sound</DialogTitle>
          <DialogDescription>
            Create a new sound for your soundboard. You can add it from a URL, YouTube, or local file.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Air Horn"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="funny, alert, meme (comma-separated)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sourceType">Source Type *</Label>
              <Select value={sourceType} onValueChange={(value) => setSourceType(value as SourceType)}>
                <SelectTrigger id="sourceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT_URL">Direct URL</SelectItem>
                  <SelectItem value="YOUTUBE">YouTube</SelectItem>
                  <SelectItem value="LOCAL_FILE">Local File</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(sourceType === 'DIRECT_URL' || sourceType === 'YOUTUBE') && (
              <div className="grid gap-2">
                <Label htmlFor="sourceUrl">
                  {sourceType === 'YOUTUBE' ? 'YouTube URL *' : 'Audio URL *'}
                </Label>
                <Input
                  id="sourceUrl"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder={sourceType === 'YOUTUBE' ? 'https://youtube.com/watch?v=...' : 'https://example.com/sound.mp3'}
                  required
                />
                {sourceType === 'YOUTUBE' && (
                  <p className="text-xs text-muted-foreground">
                    The audio will be downloaded automatically after creation.
                  </p>
                )}
              </div>
            )}

            {sourceType === 'LOCAL_FILE' && (
              <div className="grid gap-2">
                <Label htmlFor="fileInput">Audio File *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    id="fileInput"
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {localFilePath || 'Choose Audio File'}
                  </Button>
                </div>
                {localFilePath && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {localFilePath}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Supported formats: MP3, WAV, OGG, M4A, FLAC
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="volume">Volume (0-100)</Label>
              <Input
                id="volume"
                type="number"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="80"
              />
            </div>

            {/* Cover Image */}
            <div className="grid gap-2">
              <Label htmlFor="coverInput">Cover Image (Optional)</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    ref={coverInputRef}
                    id="coverInput"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    {coverImage ? 'Change Image' : 'Select Cover Image'}
                  </Button>
                  {coverImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleRemoveCover}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {coverPreview && (
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border/50 bg-secondary/30">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {!coverPreview && (
                  <div className="w-full aspect-square rounded-lg border-2 border-dashed border-border/50 bg-secondary/20 flex items-center justify-center">
                    <div className="text-center">
                      <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">
                        No cover image selected
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a cover image for this sound (JPG, PNG, etc.)
              </p>
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
            <Button type="submit" disabled={createSound.isPending}>
              {createSound.isPending ? 'Creating...' : 'Create Sound'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
