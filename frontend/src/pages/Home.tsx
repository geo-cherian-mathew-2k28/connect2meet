import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, ArrowRight, Copy, Check, Settings, Plus, Keyboard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { generateRoomId } from '@/network/iceHelpers';
import { useMeetingStore } from '@/store/meetingStore';

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
    <div className="min-h-screen bg-[#fafbfe] text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      {/* Navigation */}
      <nav className="z-40 bg-white/70 backdrop-blur-md border-b border-slate-200/50 w-full">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
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

      {/* Main Content Card Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl w-full mx-auto my-auto space-y-8">
        <div className="text-center space-y-2 max-w-md">
          <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Start or join a video call</h1>
          <p className="text-slate-500 text-sm font-medium">A minimal, secure peer-to-peer WebRTC video meeting system with integrated diagnostic monitoring.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Card 1: Start a meeting */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border border-slate-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl h-full flex flex-col justify-between">
              <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-blue-50/80 rounded-xl text-blue-600 border border-blue-100/40">
                      <Plus className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="font-bold text-slate-900 text-base">Host a new meeting</h2>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mb-4">
                    Instantly create a secure room ID and link to share with others.
                  </p>
                </div>

                {!generatedId ? (
                  <Button onClick={createRoom} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all duration-200 h-10 shadow-sm cursor-pointer">
                    Generate secure room ID
                  </Button>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <span className="flex-1 font-mono text-xs font-semibold text-slate-700 tracking-wide select-all">{generatedId}</span>
                      <Button variant="ghost" size="icon-sm" onClick={copyLink} className="text-slate-500 hover:text-slate-800">
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={joinGenerated} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm cursor-pointer">
                        Enter Room
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                      <Button variant="outline" onClick={createRoom} className="border-slate-200 hover:bg-slate-50 cursor-pointer">
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Join a meeting */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border border-slate-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl h-full flex flex-col">
              <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                      <Keyboard className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="font-bold text-slate-900 text-base">Join an existing room</h2>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mb-4">
                    Enter the room ID provided by the host. Host must approve entry.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Display Name</span>
                    <Input
                      id="input-display-name"
                      placeholder="Enter name"
                      value={settings.displayName}
                      onChange={(e) => updateSettings({ displayName: e.target.value })}
                      className="border-slate-200 bg-white"
                    />
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
                      className="bg-slate-950 hover:bg-slate-900 text-white disabled:opacity-50 font-semibold cursor-pointer shadow-sm"
                    >
                      Join
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* E2EE Info Line */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-4 py-1.5 shadow-sm font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>DTLS-SRTP End-to-End Encrypted Connections</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-8 border-t border-slate-150 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
            <Video className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">call2meet — WebRTC Explorer</span>
        </div>
        <div className="flex gap-6 font-semibold text-xs text-slate-400 uppercase tracking-wider">
          <Link to="/learn" className="hover:text-slate-800 transition-colors">How WebRTC Works</Link>
          <Link to="/settings" className="hover:text-slate-800 transition-colors">Preferences</Link>
        </div>
      </footer>
    </div>
  );
}
