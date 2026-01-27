import { Settings as SettingsIcon, Volume2, Terminal, Download, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n';

export function SettingsView() {
  const { data: settingsData, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { t } = useTranslation();
  
  const [settings, setSettings] = useState({
    audioOutputDevice: '',
    mpvPath: 'mpv',
    youtubeDownloadTool: 'yt-dlp',
    defaultVolume: 80,
    stopPreviousOnPlay: true,
    allowOverlappingSounds: false,
  });

  // Load settings from API
  useEffect(() => {
    if (settingsData) {
      setSettings({
        audioOutputDevice: settingsData.audioOutputDevice || '',
        mpvPath: settingsData.mpvPath || 'mpv',
        youtubeDownloadTool: settingsData.youtubeDownloadTool || 'yt-dlp',
        defaultVolume: settingsData.defaultVolume || 80,
        stopPreviousOnPlay: settingsData.stopPreviousOnPlay ?? true,
        allowOverlappingSounds: settingsData.allowOverlappingSounds ?? false,
      });
    }
  }, [settingsData]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        audioOutputDevice: settings.audioOutputDevice || undefined,
        mpvPath: settings.mpvPath,
        youtubeDownloadTool: settings.youtubeDownloadTool,
        defaultVolume: settings.defaultVolume,
        stopPreviousOnPlay: settings.stopPreviousOnPlay,
        allowOverlappingSounds: settings.allowOverlappingSounds,
      });
      toast({
        title: t('toast.success'),
        description: t('settings.toastSaved'),
      });
    } catch (error: any) {
      toast({
        title: t('toast.error'),
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: t('settings.toastExportTitle'),
      description: t('settings.toastExportDesc'),
    });
  };

  const handleImport = () => {
    toast({
      title: t('settings.toastImportTitle'),
      description: t('settings.toastImportDesc'),
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">{t('settings.loading')}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('settings.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('settings.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Audio Settings */}
        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{t('settings.audioSection')}</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('settings.audioDeviceLabel')}
              </label>
              <Input
                value={settings.audioOutputDevice}
                onChange={(e) => setSettings({ ...settings, audioOutputDevice: e.target.value })}
                placeholder={t('settings.audioDevicePlaceholder')}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.audioDeviceHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  {t('settings.defaultVolumeLabel')}
                </label>
                <span className="text-sm text-muted-foreground">{settings.defaultVolume}%</span>
              </div>
              <Slider
                value={[settings.defaultVolume]}
                onValueChange={([v]) => setSettings({ ...settings, defaultVolume: v })}
                max={100}
                step={1}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{t('settings.stopPreviousTitle')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.stopPreviousDesc')}
                </p>
              </div>
              <Switch
                checked={settings.stopPreviousOnPlay}
                onCheckedChange={(v) => setSettings({ ...settings, stopPreviousOnPlay: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{t('settings.allowOverlappingTitle')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.allowOverlappingDesc')}
                </p>
              </div>
              <Switch
                checked={settings.allowOverlappingSounds}
                onCheckedChange={(v) => setSettings({ ...settings, allowOverlappingSounds: v })}
              />
            </div>
          </div>
        </section>

        {/* Paths Settings */}
        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{t('settings.pathsSection')}</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('settings.mpvPathLabel')}
              </label>
              <Input
                value={settings.mpvPath}
                onChange={(e) => setSettings({ ...settings, mpvPath: e.target.value })}
                placeholder={t('settings.mpvPathPlaceholder')}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.mpvPathHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('settings.ytdlpPathLabel')}
              </label>
              <Input
                value={settings.youtubeDownloadTool}
                onChange={(e) => setSettings({ ...settings, youtubeDownloadTool: e.target.value })}
                placeholder={t('settings.ytdlpPathPlaceholder')}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.ytdlpPathHelp')}
              </p>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{t('settings.dataSection')}</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              {t('settings.exportLibrary')}
            </Button>
            <Button variant="outline" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              {t('settings.importLibrary')}
            </Button>
          </div>
        </section>

        {/* Save Button */}
        <Button 
          className="w-full glow-primary" 
          onClick={handleSave}
          disabled={updateSettings.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {updateSettings.isPending ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
