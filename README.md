# call2meet — WebRTC Network Explorer

> A production-quality educational WebRTC web application that teaches you how peer-to-peer video calling works — from the inside out.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-8-purple) ![Socket.IO](https://img.shields.io/badge/Socket.IO-4-green)

---

## What is this?

Most video calling apps hide how they work. call2meet exposes everything:

- **Live Network Inspector** — ICE state, RTT, bitrate, packet loss, jitter, resolution, codec, FPS, DTLS state, candidate types — all updating every second via `getStats()`
- **Live Charts** — Bandwidth, latency, and packet loss graphed in real time
- **Network Flow Visualizer** — Animated diagram of the full WebRTC connection sequence
- **Packet Journey** — Interactive animation of how a video frame travels camera → encoding → SRTP → internet → peer → playback
- **Learning Mode** — Toggle educational tooltips over every networking concept
- **Educational Learn Page** — NAT, ICE, STUN, TURN, SDP, DTLS-SRTP explained with code examples

---

## Architecture

```
call2meet/
├── frontend/          ← Vite + React 18 + TypeScript + TailwindCSS v4 + Framer Motion
│   └── src/
│       ├── components/
│       │   ├── meeting/      ← VideoGrid, VideoTile, Controls, ChatPanel, ParticipantsPanel
│       │   ├── inspector/    ← NetworkInspector, StatsGraphs, ConnectionQualityGauge
│       │   └── education/    ← NetworkFlowVisualizer, PacketJourney
│       ├── hooks/            ← useWebRTC, useStats, useChat, useParticipants
│       ├── network/          ← ICE/SDP helpers, quality derivation
│       ├── stats/            ← getStats() poller + rolling history
│       ├── socket/           ← Socket.IO singleton client
│       ├── store/            ← Zustand state (meeting, settings, chat)
│       ├── pages/            ← Home, Room, Learn, Settings, NotFound
│       └── types/            ← All TypeScript types
└── backend/           ← Node.js + Express + Socket.IO (TypeScript)
    └── src/
        ├── server.ts         ← HTTP server + Socket.IO signaling
        ├── rooms.ts          ← In-memory room manager with host transfer
        └── types.ts          ← Shared socket event types
```

---

## How WebRTC Signaling Works (in this app)

```
Browser A                    Signaling Server              Browser B
    │                              │                           │
    │── join-room ────────────────→│                           │
    │                              │── room-joined ───────────→│
    │                              │                           │
    │                              │← join-room ───────────────│
    │                              │── user-joined ───────────→│
    │                              │                           │
    │← user-joined ────────────────│                           │
    │                              │                           │
    │── offer (SDP) ──────────────→│── offer ─────────────────→│
    │                              │                           │
    │← answer (SDP) ───────────────│←─ answer ─────────────────│
    │                              │                           │
    │⟵──── Trickle ICE candidates ─────────────────────────────│
    │                              │                           │
    │⟵══════════════ Direct P2P Media (SRTP/UDP) ══════════════│
```

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
npm run dev
# → Running on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:5173
```

### 3. Open two browser tabs

- Tab 1: `http://localhost:5173` → Create Meeting → Copy Room ID → Join
- Tab 2: `http://localhost:5173` → Join Meeting → Paste Room ID → Join

Open the **Network Inspector** (Activity icon in controls) to see live stats.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `CLIENT_URL` | `http://localhost:5173` | CORS allow origin |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_BACKEND_URL` | `http://localhost:3001` | Signaling server URL |
| `VITE_TURN_URL` | — | TURN server URL (optional) |
| `VITE_TURN_USERNAME` | — | TURN username |
| `VITE_TURN_CREDENTIAL` | — | TURN credential |

---

## Features

| Feature | Status |
|---|---|
| P2P Video + Audio | ✅ |
| Real-time Chat | ✅ |
| Participants Panel | ✅ |
| Screen Sharing | ✅ |
| Network Inspector (getStats) | ✅ |
| Live Bandwidth/RTT/Loss Charts | ✅ |
| Connection Quality Gauge | ✅ |
| ICE Candidate Display | ✅ |
| Learning Mode Tooltips | ✅ |
| Network Flow Visualizer | ✅ |
| Packet Journey Animation | ✅ |
| Learn Page (NAT/ICE/STUN/TURN/SDP/SRTP) | ✅ |
| Mute / Video Toggle | ✅ |
| Raise Hand | ✅ |
| Live Reactions | ✅ |
| Speaking Detection | ✅ |
| Device Selection | ✅ |
| Video Quality Selection | ✅ |
| Noise Suppression | ✅ |
| Responsive Layout | ✅ |

---

## Deployment

### Backend → Railway / Render

```bash
# Set env vars in Railway/Render dashboard:
PORT=3001
CLIENT_URL=https://your-frontend.vercel.app
```

### Frontend → Vercel

```bash
# Set env vars in Vercel dashboard:
VITE_BACKEND_URL=https://your-backend.railway.app
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + Vite 8 |
| Language | TypeScript 5 |
| Styling | TailwindCSS v4 |
| Icons | Lucide React |
| Animation | Framer Motion |
| Charts | Recharts |
| State | Zustand |
| Routing | React Router v6 |
| Signaling | Socket.IO v4 |
| Backend | Node.js + Express |
| WebRTC | Native Browser API |
| STUN | Google STUN (free) |
| TURN | Configurable via env |
