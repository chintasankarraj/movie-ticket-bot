import React, { useState } from 'react';
import { Sparkles, AlertCircle, Play, Check } from 'lucide-react';

export const SimulationControls: React.FC = () => {
  const [simAlertTriggered, setSimAlertTriggered] = useState(false);
  const [audioSimulation, setAudioSimulation] = useState(true);

  const handleSimulateAlert = () => {
    setSimAlertTriggered(true);
    setTimeout(() => setSimAlertTriggered(false), 4000);
  };

  return (
    <div className="p-6 rounded-2xl bg-obsidian-card border border-obsidian-border space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Frontend UI Simulation Playground
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test frontend states, alert toasts, and visual interactions in this browser session.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40 uppercase font-semibold">
          Client-Side Only
        </span>
      </div>

      {/* Strict Warning Banner */}
      <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-300">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Non-Destructive Guarantee:</strong> Controls on this page alter only local in-memory UI state.
          They do <strong>not</strong> execute external network requests, modify Python files, alter GitHub Actions crons, or expose Telegram tokens.
        </div>
      </div>

      {/* Simulated Alert Toast Demonstration */}
      {simAlertTriggered && (
        <div className="p-4 rounded-xl bg-purple-950/40 border border-brand-purple/50 text-white flex items-center justify-between shadow-glow-purple animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-brand-purple/20 text-purple-300">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-bold text-purple-200">
                [SIMULATED] Midnight Show Detected!
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Prasads Multiplex: 01:00 AM (IMAX 3D) • Telegram Alert Dispatched
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono text-purple-300">Demo Toast</span>
        </div>
      )}

      {/* Simulation Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trigger demo alert */}
        <div className="p-4 rounded-xl bg-obsidian-surface border border-obsidian-border flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-200">Test Alert Toast</div>
            <div className="text-[11px] text-slate-400">Trigger simulated detection notification</div>
          </div>
          <button
            onClick={handleSimulateAlert}
            disabled={simAlertTriggered}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-purple hover:bg-brand-purple-hover text-white transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
          >
            {simAlertTriggered ? <Check className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {simAlertTriggered ? 'Triggered' : 'Simulate'}
          </button>
        </div>

        {/* Audio beep demonstration toggle */}
        <div className="p-4 rounded-xl bg-obsidian-surface border border-obsidian-border flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-200">Audio Alarm Emulation</div>
            <div className="text-[11px] text-slate-400">Simulate Windows Beep sound preference</div>
          </div>
          <button
            onClick={() => setAudioSimulation(!audioSimulation)}
            className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple/50 ${
              audioSimulation
                ? 'bg-purple-950/50 text-purple-300 border border-purple-800/50'
                : 'bg-obsidian-card text-slate-500 border border-obsidian-border'
            }`}
          >
            {audioSimulation ? 'ENABLED (MOCK)' : 'MUTED'}
          </button>
        </div>
      </div>

      <div className="pt-3 border-t border-obsidian-border/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Frontend Version: 1.2.0-cinematic</span>
        <span>Build: Vite + React 18 + Tailwind</span>
      </div>
    </div>
  );
};
