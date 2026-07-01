import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Router, Shield, Radio, Cpu, Network, BookOpen, ChevronDown, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NetworkFlowVisualizer } from '@/components/education/NetworkFlowVisualizer';
import { PacketJourney } from '@/components/education/PacketJourney';
import { cn } from '@/lib/utils';

const CONCEPTS = [
  {
    id: 'nat',
    icon: Router,
    title: 'NAT — Network Address Translation',
    badge: 'Networking',
    badgeVariant: 'default' as const,
    content: `Your local home router assigns your device a private IP (e.g. 192.168.1.5) that is invisible to the outside internet. NAT translates this private address to a shared public IP address of your gateway.

The problem arises when Browser A (behind NAT) tries to establish a direct connection with Browser B (also behind NAT). Neither peer knows the other's true public port to send UDP packets directly.

ICE, STUN, and TURN are WebRTC technologies used to bridge this gap.`,
    code: `# Private Network Endpoint (LAN)
192.168.1.5:54321

# Public NAT Endpoint (Internet)
203.0.113.45:8765

# Resolution flow:
Browser A ──STUN Request──→ STUN Server (determines 203.0.113.45:8765)`,
  },
  {
    id: 'ice',
    icon: Network,
    title: 'ICE — Interactive Connectivity Establishment',
    badge: 'WebRTC Core',
    badgeVariant: 'blue' as const,
    content: `ICE is the framework used by WebRTC to discover and test network paths between two browsers.

ICE collects different candidate addresses from:
1. Host candidates: Direct local interface address (LAN).
2. Server Reflexive (srflx): Public IP address mapped via STUN.
3. Relay candidates: Relayed traffic address via TURN.

ICE tests all path pairs in priority order to establish the fastest direct route.`,
    code: `# ICE candidate payload representation
a=candidate:1 1 UDP 2122252543 192.168.1.5 54321 typ host
a=candidate:2 1 UDP 1685987327 203.0.113.45 8765 typ srflx raddr 192.168.1.5 rport 54321
a=candidate:3 1 UDP 33562367 turn.example.com 3478 typ relay`,
  },
  {
    id: 'stun',
    icon: Globe,
    title: 'STUN — Session Traversal Utilities for NAT',
    badge: 'NAT Traversal',
    badgeVariant: 'green' as const,
    content: `STUN is a lightweight utility server that answers a simple question: "What is my public IP and port?"

During connection setup, the browser sends a STUN request. The server notes the source IP/port of the incoming UDP packets and sends it back to the browser.

This allows the browser to announce its reflexive address (srflx). STUN fails if one peer is behind symmetric NAT.`,
    code: `→ STUN Binding Request (from local 192.168.1.5:54321)
← STUN Binding Response (header lists public IP 203.0.113.45:8765)

# Browser registers candidate:
typ srflx raddr 192.168.1.5 rport 54321`,
  },
  {
    id: 'turn',
    icon: Router,
    title: 'TURN — Traversal Using Relays around NAT',
    badge: 'Fallback Relay',
    badgeVariant: 'amber' as const,
    content: `TURN is an intermediate relay server used as a failsafe when direct peer-to-peer connection is blocked by symmetric NAT or strict firewalls.

All video/audio frames are relayed through the TURN server. This consumes host bandwidth and adds latency, but guarantees the call connects. About 15-20% of commercial calls require TURN fallback.`,
    code: `→ TURN Allocate Request
← TURN Allocate Success (allocated relay IP 198.51.100.1:49152)

# Browser relays media:
Browser A ──[SRTP Media]──→ TURN Server ──[SRTP Media]──→ Browser B`,
  },
  {
    id: 'sdp',
    icon: Radio,
    title: 'SDP — Session Description Protocol',
    badge: 'Signaling',
    badgeVariant: 'purple' as const,
    content: `SDP is the text configuration payload exchanged during signaling. It contains metadata about media codecs, audio/video configurations, ICE connection credentials, and security parameters.

SDP negotiation uses an offer/answer format. It does not carry video data, only config states.`,
    code: `v=0
o=- 123456 2 IN IP4 127.0.0.1
a=group:BUNDLE 0 1
m=video 9 UDP/TLS/RTP/SAVPF 96
a=rtpmap:96 VP8/90000
a=ice-ufrag:abc123pwd`,
  },
  {
    id: 'srtp',
    icon: Shield,
    title: 'DTLS-SRTP — Encrypted Media',
    badge: 'Security',
    badgeVariant: 'red' as const,
    content: `WebRTC mandates media encryption. Connection setup establishes a secure DTLS tunnel over UDP.

Peer keys are negotiated via DTLS, and all media packets are encrypted using Secure RTP (SRTP). This ensures call confidentiality and integrity without relying on central server safety.`,
    code: `# DTLS Handshake over UDP
Browser A ──ClientHello──→ Browser B
Browser A ←─ServerHello─── Browser B (Negotiated cipher keys)

# SRTP Packet:
[RTP Encrypted Payload][Auth Tag]`,
  },
];

export default function Learn() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-800 antialiased">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="font-semibold text-slate-900 tracking-tight text-sm">WebRTC Lab Guide</h1>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-16 space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
            How WebRTC P2P Works
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto">
            Deep dive into the protocols, NAT traversal logic, and encryption structures powering modern video networks.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Concept Column */}
          <div className="lg:col-span-8 space-y-4">
            {CONCEPTS.map((c, i) => {
              const Icon = c.icon;
              const isOpen = activeSection === c.id;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border border-slate-200/60 bg-white hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] rounded-2xl overflow-hidden transition-all">
                    <button
                      className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer"
                      onClick={() => setActiveSection(isOpen ? null : c.id)}
                      id={`btn-concept-${c.id}`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm md:text-base">{c.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={c.badgeVariant} className="text-[10px] tracking-wide font-semibold uppercase">{c.badge}</Badge>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
                      </div>
                    </button>

                    {isOpen && (
                      <CardContent className="px-5 pb-5 pt-0 space-y-4 border-t border-slate-50 mt-1">
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed whitespace-pre-line pt-4">
                          {c.content}
                        </p>
                        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 shadow-inner">
                          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                            <Terminal className="w-3.5 h-3.5 text-slate-600" />
                            Configuration Blueprint
                          </div>
                          <pre className="overflow-x-auto leading-normal">{c.code}</pre>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              );
            })}

            {/* Packet Journey Widget */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border border-slate-200/60 bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                <CardHeader className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/40">
                      <Cpu className="w-4.5 h-4.5" />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-950">Visualizer: Packet Journey</CardTitle>
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 pt-1">
                    Send a test payload to animate the live pipeline: frame capture, codec compression, cryptographic signature, and network reception.
                  </p>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0">
                  <PacketJourney />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Network Connection Sequence Column */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border border-slate-200/60 bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.01)] sticky top-24">
              <CardHeader className="p-5 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-950 uppercase tracking-wider">Protocol Pipeline</CardTitle>
                <p className="text-[11px] text-slate-500 pt-0.5">
                  Real-time sequence map of WebRTC handshakes and media allocation.
                </p>
              </CardHeader>
              <CardContent className="p-5">
                <NetworkFlowVisualizer autoPlay />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
