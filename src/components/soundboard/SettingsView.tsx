import { Settings as SettingsIcon, Volume2, Terminal, Download, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { toast } from '@/hooks/use-toast';

export function SettingsView() {
  const { data: settingsData, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  
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
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: "Coming Soon",
      description: "Export functionality will be available soon",
    });
  };

  const handleImport = () => {
    toast({
      title: "Coming Soon",
      description: "Import functionality will be available soon",
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
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
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure app behavior and paths
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
            <h2 className="text-lg font-semibold text-foreground">Audio</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Audio Output Device
              </label>
              <Input
                value={settings.audioOutputDevice}
                onChange={(e) => setSettings({ ...settings, audioOutputDevice: e.target.value })}
                placeholder="pipewire/alsa_output... (leave empty for default)"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Device string passed to mpv's --audio-device flag
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Default Volume
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
                <p className="text-sm font-medium text-foreground">Stop Previous on Play</p>
                <p className="text-xs text-muted-foreground">
                  Stop any playing sound when a new one starts
                </p>
              </div>
              <Switch
                checked={settings.stopPreviousOnPlay}
                onCheckedChange={(v) => setSettings({ ...settings, stopPreviousOnPlay: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Allow Overlapping</p>
                <p className="text-xs text-muted-foreground">
                  Allow multiple sounds to play simultaneously
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
            <h2 className="text-lg font-semibold text-foreground">Command Paths</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                mpv Path
              </label>
              <Input
                value={settings.mpvPath}
                onChange={(e) => setSettings({ ...settings, mpvPath: e.target.value })}
                placeholder="/usr/bin/mpv"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Path to mpv executable. Use "mpv" if it's in your PATH
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                yt-dlp Path
              </label>
              <Input
                value={settings.youtubeDownloadTool}
                onChange={(e) => setSettings({ ...settings, youtubeDownloadTool: e.target.value })}
                placeholder="/usr/bin/yt-dlp"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Path to yt-dlp for downloading YouTube audio
              </p>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Data Management</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Library
            </Button>
            <Button variant="outline" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import Library
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
          {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
