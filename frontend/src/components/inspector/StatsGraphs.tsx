import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { StatsHistory } from '@/types';

interface StatsGraphsProps {
  history: StatsHistory;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function StatsGraphs({ history }: StatsGraphsProps) {
  const data = history.timestamps.map((ts, i) => ({
    time: formatTime(ts),
    videoBitrate: history.videoBitrate[i] ?? 0,
    audioBitrate: history.audioBitrate[i] ?? 0,
    rtt: history.rtt[i] ?? 0,
    packetLoss: +(history.packetsLostPercent[i] ?? 0).toFixed(2),
  }));

  const chartProps = {
    margin: { top: 4, right: 4, left: -25, bottom: 0 },
  };

  const axisProps = {
    tick: { fontSize: 8, fill: '#64748b', fontFamily: 'monospace' },
    width: 32,
    tickLine: false,
    axisLine: false,
  };

  const customTooltip = {
    contentStyle: {
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      borderRadius: '12px',
      fontSize: '10px',
      color: '#1e293b',
      fontFamily: 'monospace',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
    itemStyle: { color: '#475569' },
    labelStyle: { color: '#94a3b8', marginBottom: '4px' },
  };

  return (
    <div className="space-y-3">
      {/* Bandwidth */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        <div className="flex items-center justify-between mb-1 px-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bandwidth Usage</p>
          <span className="text-[9px] font-mono text-cyan-600">Kbps</span>
        </div>
        <ResponsiveContainer width="100%" height={85}>
          <LineChart data={data} {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis {...axisProps} />
            <Tooltip {...customTooltip} />
            <Line type="monotone" dataKey="videoBitrate" stroke="#0284c7" strokeWidth={2} dot={false} name="Video" />
            <Line type="monotone" dataKey="audioBitrate" stroke="#059669" strokeWidth={1.5} dot={false} name="Audio" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Latency */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        <div className="flex items-center justify-between mb-1 px-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Round Trip Time (RTT)</p>
          <span className="text-[9px] font-mono text-amber-600">ms</span>
        </div>
        <ResponsiveContainer width="100%" height={75}>
          <LineChart data={data} {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis {...axisProps} />
            <Tooltip {...customTooltip} />
            <Line type="monotone" dataKey="rtt" stroke="#d97706" strokeWidth={2} dot={false} name="RTT" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Packet Loss */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        <div className="flex items-center justify-between mb-1 px-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Data Loss Rate</p>
          <span className="text-[9px] font-mono text-rose-600">%</span>
        </div>
        <ResponsiveContainer width="100%" height={75}>
          <LineChart data={data} {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis {...axisProps} />
            <Tooltip {...customTooltip} />
            <Line type="monotone" dataKey="packetLoss" stroke="#e11d48" strokeWidth={2} dot={false} name="Loss %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
