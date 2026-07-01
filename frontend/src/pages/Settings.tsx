import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Mic, Speaker, Wifi, BookOpen, Moon, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMeetingStore } from '@/store/meetingStore';

interface DeviceOption {
  deviceId: string;
  label: string;
}

export default function Settings() {
  const { settings, updateSettings } = useMeetingStore();
  const [cameras, setCameras] = useState<DeviceOption[]>([]);
  const [mics, setMics] = useState<DeviceOption[]>([]);
  const [speakers, setSpeakers] = useState<DeviceOption[]>([]);

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        setCameras(
          devices
            .filter((d) => d.kind === 'videoinput')
            .map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 8)}` }))
        );
        setMics(
          devices
            .filter((d) => d.kind === 'audioinput')
            .map((d) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 8)}` }))
        );
        setSpeakers(
          devices
            .filter((d) => d.kind === 'audiooutput')
            .map((d) => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 8)}` }))
        );
      })
      .catch(console.error);
  }, []);

  const Toggle = ({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) => (
    <button
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const Select = ({
    value, onChange, options, id,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: DeviceOption[];
    id: string;
  }) => (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">System default</option>
      {options.map((o) => (
        <option key={o.deviceId} value={o.deviceId}>
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="h-5 w-px bg-slate-200" />
          <h1 className="font-semibold text-slate-800">Settings</h1>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-5">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>How others see you in meetings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Display Name</label>
                <Input
                  id="settings-display-name"
                  value={settings.displayName}
                  onChange={(e) => updateSettings({ displayName: e.target.value })}
                  placeholder="Your name"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Devices */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader>
              <CardTitle>Devices</CardTitle>
              <CardDescription>Select your preferred camera, microphone, and speaker</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Camera
                </label>
                <Select
                  id="settings-camera"
                  value={settings.selectedCamera}
                  onChange={(v) => updateSettings({ selectedCamera: v })}
                  options={cameras}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Microphone
                </label>
                <Select
                  id="settings-microphone"
                  value={settings.selectedMicrophone}
                  onChange={(v) => updateSettings({ selectedMicrophone: v })}
                  options={mics}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <Speaker className="w-4 h-4" /> Speaker
                </label>
                <Select
                  id="settings-speaker"
                  value={settings.selectedSpeaker}
                  onChange={(v) => updateSettings({ selectedSpeaker: v })}
                  options={speakers}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Video Quality */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Video Quality</CardTitle>
              <CardDescription>Higher quality uses more bandwidth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    id={`settings-quality-${q}`}
                    onClick={() => updateSettings({ videoQuality: q })}
                    className={`p-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                      settings.videoQuality === q
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {q}
                    <div className="text-xs font-normal text-slate-400 mt-0.5">
                      {q === 'low' ? '360p · 15fps' : q === 'medium' ? '720p · 30fps' : '1080p · 30fps'}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* App settings */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle>Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  id: 'toggle-learning-mode',
                  icon: BookOpen,
                  label: 'Learning Mode',
                  desc: 'Show educational tooltips over networking stats in the inspector',
                  key: 'isLearningMode' as const,
                },
                {
                  id: 'toggle-noise-suppression',
                  icon: Volume2,
                  label: 'Noise Suppression',
                  desc: 'Reduce background noise using browser audio processing',
                  key: 'noiseSuppressionEnabled' as const,
                },
                {
                  id: 'toggle-background-blur',
                  icon: Camera,
                  label: 'Background Blur',
                  desc: 'Blur your background (requires browser support)',
                  key: 'backgroundBlurEnabled' as const,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <Toggle
                      id={item.id}
                      checked={settings[item.key] as boolean}
                      onChange={(v) => updateSettings({ [item.key]: v })}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
