import { Settings as SettingsIcon, Volume2, Terminal, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

export function SettingsView() {
  const [settings, setSettings] = useState({
    audioOutputDevice: 'pipewire/alsa_output.pci-0000_00_1f.3.analog-stereo',
    mpvPath: 'mpv',
    ytDlpPath: 'yt-dlp',
    defaultVolume: 75,
    stopPreviousOnPlay: true,
    allowOverlappingSounds: false,
  });

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
                placeholder="pipewire/alsa_output..."
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
                value={settings.ytDlpPath}
                onChange={(e) => setSettings({ ...settings, ytDlpPath: e.target.value })}
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
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Library
            </Button>
            <Button variant="outline">
              Import Library
            </Button>
          </div>
        </section>

        {/* Save Button */}
        <Button className="w-full glow-primary">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
