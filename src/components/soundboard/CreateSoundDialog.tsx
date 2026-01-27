import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateSound, useIngestSound, useUploadAudio } from '@/hooks/useSounds';
import { soundsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { SourceType } from '@/types/sound';
import { Image, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressDialog, ProgressStep } from './ProgressDialog';
import { useTranslation } from '@/lib/i18n';

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
  const [trimStart, setTrimStart] = useState('');
  const [trimEnd, setTrimEnd] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localFilePath, setLocalFilePath] = useState('');
  
  // Progress tracking
  const [showProgress, setShowProgress] = useState(false);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const createSound = useCreateSound();
  const ingestSound = useIngestSound();
  const uploadAudioMutation = useUploadAudio();
  const { t } = useTranslation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalFile(file);
      setLocalFilePath(file.name);
      // Store file name as source URL for now
      // The file will be uploaded when creating the sound
      setSourceUrl(file.name);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('toast.error'),
          description: "Please select an image file (JPG, PNG, GIF, or WEBP)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: t('toast.error'),
          description: `File too large. Maximum size is 10MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`,
          variant: "destructive",
        });
        return;
      }

      if (file.size === 0) {
        toast({
          title: t('toast.error'),
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
    
    if (!name.trim()) {
      toast({
        title: t('toast.error'),
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (sourceType === 'LOCAL_FILE' && !localFile) {
      toast({
        title: t('toast.error'),
        description: "Please select a local file",
        variant: "destructive",
      });
      return;
    }

    if (!sourceUrl.trim() && sourceType !== 'LOCAL_FILE') {
      toast({
        title: t('toast.error'),
        description: "Source URL is required",
        variant: "destructive",
      });
      return;
    }

    // Validate trim values
    if (trimStart && trimEnd) {
      const start = parseFloat(trimStart);
      const end = parseFloat(trimEnd);
      if (isNaN(start) || isNaN(end) || start < 0 || end < 0) {
        toast({
          title: t('toast.error'),
          description: "Trim values must be valid positive numbers",
          variant: "destructive",
        });
        return;
      }
      if (end <= start) {
        toast({
          title: t('toast.error'),
          description: "Trim end must be greater than trim start",
          variant: "destructive",
        });
        return;
      }
    }

    // Initialize progress steps based on source type
    const steps: ProgressStep[] = [];
    steps.push({ id: 'create', label: t('createSound.progressTitle'), status: 'pending' });
    
    if (sourceType === 'LOCAL_FILE') {
      steps.push({ id: 'upload-audio', label: 'Uploading audio file', status: 'pending' });
    }
    
    if (coverImage) {
      steps.push({ id: 'upload-cover', label: 'Uploading cover image', status: 'pending' });
    }
    
    if (sourceType === 'YOUTUBE') {
      steps.push({ id: 'download', label: 'Downloading audio from YouTube', status: 'pending' });
    }
    
    setProgressSteps(steps);
    setCurrentStepIndex(0);
    setShowProgress(true);

    try {
      // Step 1: Create sound
      updateStepStatus('create', 'active');
      const soundData: any = {
        name: name.trim(),
        description: description.trim() || null,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        source_type: sourceType,
        volume: volume ? parseInt(volume) : null,
        trim_start_sec: trimStart ? parseFloat(trimStart) : null,
        trim_end_sec: trimEnd ? parseFloat(trimEnd) : null,
      };

      if (sourceType === 'DIRECT_URL' || sourceType === 'YOUTUBE') {
        soundData.source_url = sourceUrl.trim();
      } else if (sourceType === 'LOCAL_FILE') {
        soundData.source_url = localFile?.name || localFilePath;
        soundData.local_path = null;
      }

      const createdSound = await createSound.mutateAsync(soundData) as { id: string } | undefined;
      const soundId = createdSound?.id;
      
      if (!soundId) {
        throw new Error("Failed to create sound - no ID returned");
      }

      updateStepStatus('create', 'completed');
      // Move to next step if there is one
      if (steps.length > 1) {
        setCurrentStepIndex(1);
      }

      let uploadSuccess = true;
      let errorMessages: string[] = [];

      // Step 2: Upload audio file for LOCAL_FILE type (REQUIRED)
      if (sourceType === 'LOCAL_FILE') {
        if (!localFile) {
          throw new Error("No file selected for local file sound");
        }
        
        updateStepStatus('upload-audio', 'active');
        try {
          await uploadAudioMutation.mutateAsync({ soundId, file: localFile });
          updateStepStatus('upload-audio', 'completed');
          setCurrentStepIndex(prev => prev + 1);
        } catch (audioError: any) {
          console.error('Failed to upload audio file:', audioError);
          updateStepStatus('upload-audio', 'error');
          uploadSuccess = false;
          errorMessages.push("Audio file upload failed");
          // Delete the sound if audio upload fails
          try {
            await soundsApi.delete(soundId);
          } catch (deleteError) {
            console.error('Failed to delete sound after upload failure:', deleteError);
          }
          throw new Error(`Failed to upload audio file: ${audioError.message || 'Unknown error'}`);
        }
      }
      
      // Step 3: Upload cover image if provided (OPTIONAL)
      if (coverImage && soundId) {
        updateStepStatus('upload-cover', 'active');
        try {
          await soundsApi.uploadCover(soundId, coverImage);
          updateStepStatus('upload-cover', 'completed');
          setCurrentStepIndex(prev => prev + 1);
        } catch (coverError: any) {
          console.error('Failed to upload cover:', coverError);
          updateStepStatus('upload-cover', 'error');
          const errorMsg = coverError.message || "Cover image upload failed";
          errorMessages.push(errorMsg);
          // Don't fail the whole operation for cover image (it's optional)
          setCurrentStepIndex(prev => prev + 1);
        }
      }

      // Step 4: Ingest YouTube sound if needed
      if (sourceType === 'YOUTUBE' && soundId) {
        updateStepStatus('download', 'active');
        try {
          await ingestSound.mutateAsync(soundId);
          updateStepStatus('download', 'completed');
          setCurrentStepIndex(prev => prev + 1);
          toast({
            title: t('toast.success'),
            description: "Sound created and YouTube audio downloaded successfully",
          });
        } catch (ingestError: any) {
          updateStepStatus('download', 'error');
          toast({
            title: t('toast.success'),
            description: "Sound created but YouTube download failed. You can retry later from the sound details.",
          });
          setCurrentStepIndex(prev => prev + 1);
        }
      } else if (uploadSuccess) {
        // Show success message
        if (errorMessages.length > 0) {
          toast({
            title: t('toast.success'),
            description: `Sound created successfully. ${errorMessages.join('. ')}`,
          });
        } else {
          toast({
            title: t('toast.success'),
            description: "Sound created successfully",
          });
        }
      }

      // Wait a moment to show completion, then close
      setTimeout(() => {
        setShowProgress(false);
        
        // Reset form
        setName('');
        setDescription('');
        setTags('');
        setSourceUrl('');
        setLocalFile(null);
        setLocalFilePath('');
        setVolume('80');
        setTrimStart('');
        setTrimEnd('');
        setSourceType('DIRECT_URL');
        setCoverImage(null);
        setCoverPreview(null);
        setProgressSteps([]);
        setCurrentStepIndex(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (coverInputRef.current) coverInputRef.current.value = '';
        
        onOpenChange(false);
      }, 1000);
    } catch (error: any) {
      setShowProgress(false);
      toast({
        title: t('toast.error'),
        description: error.message || "Failed to create sound",
        variant: "destructive",
      });
    }
  };

  const updateStepStatus = (stepId: string, status: ProgressStep['status']) => {
    setProgressSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const calculateProgress = (): number => {
    if (progressSteps.length === 0) return 0;
    const completed = progressSteps.filter(s => s.status === 'completed').length;
    const activeIndex = progressSteps.findIndex(s => s.status === 'active');
    
    // Base progress from completed steps
    let progress = (completed / progressSteps.length) * 100;
    
    // Add partial progress for current active step (estimate 50% done)
    if (activeIndex >= 0 && progressSteps[activeIndex]?.status === 'active') {
      progress += (1 / progressSteps.length) * 50;
    }
    
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('createSound.title')}</DialogTitle>
          <DialogDescription>
            {t('createSound.description')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('createSound.nameLabel')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('createSound.namePlaceholder')}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t('createSound.descriptionLabel')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('createSound.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">{t('createSound.tagsLabel')}</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t('createSound.tagsPlaceholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sourceType">{t('createSound.sourceTypeLabel')}</Label>
              <Select value={sourceType} onValueChange={(value) => setSourceType(value as SourceType)}>
                <SelectTrigger id="sourceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT_URL">{t('createSound.sourceType.direct')}</SelectItem>
                  <SelectItem value="YOUTUBE">{t('createSound.sourceType.youtube')}</SelectItem>
                  <SelectItem value="LOCAL_FILE">{t('createSound.sourceType.local')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(sourceType === 'DIRECT_URL' || sourceType === 'YOUTUBE') && (
              <div className="grid gap-2">
                <Label htmlFor="sourceUrl">
                  {sourceType === 'YOUTUBE' ? t('createSound.youtubeUrlLabel') : t('createSound.audioUrlLabel')}
                </Label>
                <Input
                  id="sourceUrl"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder={sourceType === 'YOUTUBE'
                    ? t('createSound.youtubeUrlPlaceholder')
                    : t('createSound.audioUrlPlaceholder')}
                  required
                />
                {sourceType === 'YOUTUBE' && (
                  <p className="text-xs text-muted-foreground">
                    {t('createSound.youtubeHint')}
                  </p>
                )}
              </div>
            )}

            {sourceType === 'YOUTUBE' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="trimStart">{t('createSound.trimStartLabel')}</Label>
                  <Input
                    id="trimStart"
                    type="number"
                    step="0.1"
                    min="0"
                    value={trimStart}
                    onChange={(e) => setTrimStart(e.target.value)}
                    placeholder="0.0"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('createSound.trimStartHelp')}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="trimEnd">{t('createSound.trimEndLabel')}</Label>
                  <Input
                    id="trimEnd"
                    type="number"
                    step="0.1"
                    min="0"
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(e.target.value)}
                    placeholder="0.0"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('createSound.trimEndHelp')}
                  </p>
                </div>
              </div>
            )}

            {sourceType === 'LOCAL_FILE' && (
              <div className="grid gap-2">
                <Label htmlFor="fileInput">{t('createSound.localFileLabel')}</Label>
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
                    {localFilePath || t('createSound.localFileButton')}
                  </Button>
                </div>
                {localFilePath && (
                  <p className="text-xs text-muted-foreground">
                    {t('createSound.localFileSelected', { file: localFilePath })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('createSound.localFileHelp')}
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="volume">{t('createSound.volumeLabel')}</Label>
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
              <Label htmlFor="coverInput">{t('createSound.coverLabel')}</Label>
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
                    {coverImage ? t('createSound.coverChange') : t('createSound.coverSelect')}
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
                        {t('createSound.coverNone')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('createSound.coverHelp')}
              </p>
            </div>
            </div>
          </div>

          <DialogFooter className="mt-4 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('createSound.cancel')}
            </Button>
            <Button type="submit" disabled={createSound.isPending}>
              {createSound.isPending ? t('createSound.submitPending') : t('createSound.submitIdle')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Progress Dialog */}
      <ProgressDialog
        open={showProgress}
        title={t('createSound.progressTitle')}
        steps={progressSteps}
        currentStepIndex={currentStepIndex}
        overallProgress={calculateProgress()}
      />
    </Dialog>
  );
}
