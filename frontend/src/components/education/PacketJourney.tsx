import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Cpu, Package, Lock, Globe, Wifi, PlayCircle, CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    id: 'capture',
    label: 'Camera Capture',
    description: 'getUserMedia() captures raw video frames from your camera at the configured resolution and frame rate.',
    icon: Camera,
    color: 'bg-blue-100 text-blue-600',
    detail: 'Raw YUV420 frames at 1280×720@30fps',
  },
  {
    id: 'encode',
    label: 'Encoding',
    description: 'The browser encodes the raw frames using a video codec (VP8/VP9/H.264). This dramatically reduces the data size.',
    icon: Cpu,
    color: 'bg-violet-100 text-violet-600',
    detail: 'VP8 compresses 60MB/s → ~500Kbps',
  },
  {
    id: 'packetize',
    label: 'Packetization',
    description: 'Encoded video is split into small RTP packets (typically ~1200 bytes) that fit within the MTU of the network.',
    icon: Package,
    color: 'bg-amber-100 text-amber-600',
    detail: 'RTP/UDP packets, ~1200 bytes each',
  },
  {
    id: 'encrypt',
    label: 'SRTP Encryption',
    description: 'Each RTP packet is encrypted using SRTP (Secure Real-time Transport Protocol) with keys negotiated via DTLS.',
    icon: Lock,
    color: 'bg-red-100 text-red-600',
    detail: 'AES-128-CM + HMAC-SHA1 auth tag',
  },
  {
    id: 'internet',
    label: 'Internet / UDP',
    description: 'Encrypted SRTP packets are sent via UDP (or TCP via TURN). UDP has lower latency than TCP — dropped packets are acceptable for live video.',
    icon: Globe,
    color: 'bg-cyan-100 text-cyan-600',
    detail: 'UDP datagrams, NAT-traversed via ICE',
  },
  {
    id: 'receive',
    label: 'Peer Receives',
    description: 'The remote peer\'s WebRTC stack receives the SRTP packets, verifies authentication, and decrypts them.',
    icon: Wifi,
    color: 'bg-emerald-100 text-emerald-600',
    detail: 'Jitter buffer absorbs timing variation',
  },
  {
    id: 'decode',
    label: 'Decode & Playback',
    description: 'The peer\'s decoder (VP8/H.264) reconstructs the video frames, which are rendered to the <video> element.',
    icon: PlayCircle,
    color: 'bg-green-100 text-green-600',
    detail: 'Hardware-accelerated decode → <video>',
  },
];

export function PacketJourney() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = async () => {
    setIsPlaying(true);
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setActiveStep(i);
    }
    setIsPlaying(false);
  };

  const reset = () => {
    setActiveStep(-1);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button
          onClick={play}
          disabled={isPlaying}
          id="btn-play-journey"
          className="gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          {isPlaying ? 'Sending...' : 'Send Video Packet'}
        </Button>
        {activeStep >= 0 && (
          <Button variant="outline" onClick={reset} id="btn-reset-journey">
            Reset
          </Button>
        )}
      </div>

      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-6 top-6 bottom-6 w-px bg-slate-200" />

        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i <= activeStep;
            const isCurrent = i === activeStep;

            return (
              <motion.div
                key={step.id}
                className={cn(
                  'relative flex items-start gap-4 p-3 rounded-xl border transition-all duration-300 cursor-pointer',
                  isActive ? 'border-transparent shadow-sm' : 'border-slate-100 bg-white',
                  isCurrent && 'ring-2 ring-blue-300'
                )}
                style={{ backgroundColor: isActive ? undefined : undefined }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActiveStep(i)}
              >
                {/* Icon bubble */}
                <div className={cn('relative z-10 p-2 rounded-full shrink-0 transition-all', step.color, isActive ? 'scale-100' : 'opacity-40 scale-95')}>
                  {isActive && i < activeStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', isActive ? 'text-slate-800' : 'text-slate-400')}>
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">{step.detail}</p>
                  <AnimatePresence>
                    {isCurrent && (
                      <motion.p
                        className="text-sm text-slate-600 mt-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {step.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {isCurrent && isPlaying && (
                  <motion.div
                    className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
