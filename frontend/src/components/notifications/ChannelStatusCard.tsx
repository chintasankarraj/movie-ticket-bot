import React from 'react';
import { Send, Shield, RefreshCw, Radio } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const ChannelStatusCard: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-obsidian-card border border-obsidian-border flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-[#229ED9]/10 text-[#229ED9] border border-[#229ED9]/30">
            <Send className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Telegram Dispatch Channel
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40 uppercase font-semibold">
                Demo Profile
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Illustrative alert dispatcher. In production, real alerts are sent by the Python monitor via Telegram Bot API.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>Target Spec: Telegram Channel (***678)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>State Deduplication: Confirmed Delivery Only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Retry Policy: Bounded Backoff (3 Attempts)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start md:items-end justify-center gap-2">
        <StatusBadge
          status="idle"
          label="Mock Dispatcher (Offline Preview)"
          pulse={false}
        />
        <div className="text-[11px] font-mono text-slate-500">
          Zero credential exposure • Mock dispatcher
        </div>
      </div>
    </div>
  );
};
