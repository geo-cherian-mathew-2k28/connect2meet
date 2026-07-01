import React from 'react';
import { motion } from 'framer-motion';
import type { ConnectionQuality } from '@/types';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface ConnectionQualityGaugeProps {
  quality: ConnectionQuality;
  rtt: number;
  packetLoss: number;
}

const QUALITY_CONFIG = {
  excellent: { color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100', label: 'Excellent Connection', bars: 5 },
  good: { color: 'text-blue-600 bg-blue-50/50 border-blue-100', label: 'Good Connection', bars: 4 },
  fair: { color: 'text-amber-600 bg-amber-50/50 border-amber-100', label: 'Fair Connection', bars: 2 },
  poor: { color: 'text-rose-600 bg-rose-50/50 border-rose-100', label: 'Poor Connection', bars: 1 },
  connecting: { color: 'text-slate-500 bg-slate-50 border-slate-200', label: 'Analyzing network...', bars: 0 },
};

export function ConnectionQualityGauge({ quality, rtt, packetLoss }: ConnectionQualityGaugeProps) {
  const config = QUALITY_CONFIG[quality] || QUALITY_CONFIG.connecting;

  return (
    <div className={cn(
      "relative p-4 rounded-xl border flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-300",
      config.color
    )}>
      {/* Metrics text info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Zap className="w-3.5 h-3.5 opacity-80" />
          <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">Signal Status</span>
        </div>
        <p className="text-xs font-bold tracking-wide text-slate-800">
          {config.label}
        </p>
        <div className="flex gap-2 mt-1.5 font-mono text-[9px] text-slate-500">
          <span>RTT: <strong className="text-slate-700">{rtt}ms</strong></span>
          <span className="w-px h-3 bg-slate-200" />
          <span>Loss: <strong className="text-slate-700">{packetLoss.toFixed(1)}%</strong></span>
        </div>
      </div>

      {/* Bars Display */}
      <div className="flex items-end gap-1 px-1">
        {[1, 2, 3, 4, 5].map((bar) => {
          const isActive = bar <= config.bars;
          return (
            <div key={bar} className="flex flex-col items-center">
              <motion.div
                className={cn(
                  "w-1.5 rounded-full transition-all duration-300",
                  isActive ? "bg-current" : "bg-slate-200"
                )}
                style={{
                  height: `${bar * 5 + 6}px`,
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: bar * 0.05 }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
