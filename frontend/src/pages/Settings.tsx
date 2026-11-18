import React from 'react';
import { ConfigCard } from '../components/settings/ConfigCard';
import { ArchitectureDiagram } from '../components/settings/ArchitectureDiagram';
import { SimulationControls } from '../components/settings/SimulationControls';
import { Settings as SettingsIcon, Info } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-purple-400" />
            System Architecture & Configuration (Decoupled Spec)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview of monitoring parameters, hybrid deployment design, and UI simulation playground.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-obsidian-card text-slate-400 border border-obsidian-border self-start sm:self-auto">
          <Info className="w-3.5 h-3.5 text-purple-400" />
          <span>Config managed in Python CLI (UI is decoupled)</span>
        </div>
      </div>

      {/* Active Configuration Summary Card */}
      <ConfigCard />

      {/* Dual Architecture Explanation (Local vs Cloud) */}
      <ArchitectureDiagram />

      {/* Client-Side Simulation Playground */}
      <SimulationControls />
    </div>
  );
};
