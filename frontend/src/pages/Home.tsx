import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Video, ArrowRight, Copy, Check, Globe, Shield, Zap,
  Network, BookOpen, Settings, Activity, Plus, Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { generateRoomId } from '@/network/iceHelpers';
import { useMeetingStore } from '@/store/meetingStore';

const FEATURES = [
  {
    icon: Activity,
    title: 'Live Diagnostics',
    description: 'Poll metrics via getStats() including bitrate, latency (RTT), packet loss, and codecs in real time.',
    color: 'text-blue-600 bg-blue-50/60 border border-blue-100',
  },
  {
    icon: Network,
    title: 'Interactive Diagram',
    description: 'Animate and visualize connection states from signaling to direct peer-to-peer media paths.',
    color: 'text-indigo-600 bg-indigo-50/60 border border-indigo-100',
  },
  {
    icon: Zap,
    title: 'Packet Journey',
    description: 'Step-by-step interactive walk-through of camera capture, VP8 compression, SRTP encryption, and UDP transmission.',
    color: 'text-amber-600 bg-amber-50/60 border border-amber-100',
  },
  {
    icon: BookOpen,
    title: 'Learning Mode',
    description: 'Toggle descriptive explanation overlays directly inside the active video call interface.',
    color: 'text-emerald-600 bg-emerald-50/60 border border-emerald-100',
  },
  {
    icon: Shield,
    title: 'DTLS-SRTP Security',
    description: 'Observe active security ciphers and connection fingerprints negotiating live on-screen.',
    color: 'text-rose-600 bg-rose-50/60 border border-rose-100',
  },
  {
    icon: Globe,
    title: 'ICE Candidate Analysis',
    description: 'Differentiate Host (LAN), Server Reflexive (STUN), and Relay (TURN) traffic routes on the fly.',
    color: 'text-cyan-600 bg-cyan-50/60 border border-cyan-100',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [joinId, setJoinId] = useState('');
  const [generatedId, setGeneratedId] = useState('');
  const [copied, setCopied] = useState(false);
  const { settings, updateSettings } = useMeetingStore();

  const createRoom = () => {
    const id = generateRoomId();
    setGeneratedId(id);
  };

  const joinGenerated = () => {
    if (generatedId) navigate(`/room/${generatedId}`);
  };

  const joinExisting = () => {
    const id = joinId.trim();
    if (id) navigate(`/room/${id}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${generatedId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-950 tracking-tight text-base">call2meet</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/learn">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 font-medium">
                How it Works
              </Button>
            </Link>
            <div className="w-px h-4 bg-slate-200" />
            <Link to="/settings">
              <Button variant="ghost" size="icon-sm" className="text-slate-500 hover:text-slate-800">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left */}
          <motion.div
            className="lg:col-span-7 space-y-6"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100/60 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              WebRTC Network Explorer
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Premium video calls. <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Visible network details.
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-xl leading-relaxed">
              A high-performance alternative to Google Meet, built to explore the internals of WebRTC. Look at peer logs, network pipelines, and packet stats dynamically as you speak.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={createRoom} size="lg" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Start Meeting
              </Button>
              <Link to="/learn">
                <Button variant="outline" size="lg" className="border-slate-200 hover:bg-slate-50 font-medium">
                  Explore Concepts
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Right - Meeting Panel Cards */}
          <motion.div
            className="lg:col-span-5 space-y-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Create Card */}
            <Card className="border border-slate-200/60 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50/80 rounded-xl text-blue-600 border border-blue-100/40">
                    <Video className="w-4.5 h-4.5" />
                  </div>
                  <h2 className="font-bold text-slate-900 text-base">Host a new meeting</h2>
                </div>

                {!generatedId ? (
                  <Button onClick={createRoom} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all duration-200">
                    Generate secure room ID
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <span className="flex-1 font-mono text-xs font-semibold text-slate-700 tracking-wide">{generatedId}</span>
                      <Button variant="ghost" size="icon-sm" onClick={copyLink} className="text-slate-500 hover:text-slate-800">
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={joinGenerated} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                        Enter Room
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                      <Button variant="outline" onClick={createRoom} className="border-slate-200 hover:bg-slate-50">
                        Regenerate
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Join Card */}
            <Card className="border border-slate-200/60 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                    <Keyboard className="w-4.5 h-4.5" />
                  </div>
                  <h2 className="font-bold text-slate-900 text-base">Join an existing room</h2>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="input-room-id"
                    placeholder="Enter Room ID"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && joinExisting()}
                    className="flex-1 border-slate-200 bg-white"
                  />
                  <Button
                    onClick={joinExisting}
                    disabled={!joinId.trim()}
                    className="bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 font-semibold"
                  >
                    Join
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Your Display Name</span>
                  <Input
                    id="input-display-name"
                    placeholder="Enter name"
                    value={settings.displayName}
                    onChange={(e) => updateSettings({ displayName: e.target.value })}
                    className="border-slate-200 bg-white"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="bg-slate-50 border-t border-slate-200/40 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              An interactive diagnostic laboratory
            </h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed">
              Every detail of peer-to-peer transport, ICE negotiation, codecs, and bandwidth allocation is visible, parsed, and explained.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full border border-slate-200/50 bg-white hover:shadow-md hover:border-slate-200 transition-all duration-200 rounded-2xl overflow-hidden">
                    <CardContent className="p-6 space-y-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-slate-900 text-base">{f.title}</h3>
                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{f.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
            <Video className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">call2meet — WebRTC Diagnostics Lab</span>
        </div>
        <div className="flex gap-6 font-semibold text-xs text-slate-400 uppercase tracking-wider">
          <Link to="/learn" className="hover:text-slate-800 transition-colors">Diagnostics Guide</Link>
          <Link to="/settings" className="hover:text-slate-800 transition-colors">Preferences</Link>
        </div>
      </footer>
    </div>
  );
}
