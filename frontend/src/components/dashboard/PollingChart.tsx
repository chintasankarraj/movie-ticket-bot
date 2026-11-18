import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { HOURLY_LATENCY_DATA } from '../../data/mockData';
import { Activity } from 'lucide-react';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-lg bg-obsidian-surface border border-obsidian-border shadow-xl text-xs font-mono">
        <p className="text-slate-400 font-semibold mb-1.5">{`Time: ${label}`}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-white">{`${entry.value} ms`}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const PollingChart: React.FC = () => {
  return (
    <div className="p-5 rounded-xl bg-obsidian-card border border-obsidian-border">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Provider Response Latency (Sample 10-Hour Window)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Illustrative benchmark response times for BookMyShow and District (Demo data).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> BMS
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> District
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={HOURLY_LATENCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBms" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E50914" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDistrict" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2538" vertical={false} />
            <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="ms" />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="bookmyshow"
              name="BookMyShow"
              stroke="#E50914"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBms)"
            />
            <Area
              type="monotone"
              dataKey="district"
              name="District by Zomato"
              stroke="#2563EB"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDistrict)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-obsidian-border/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>*Spike at 18:00 illustrates HTTP 429 exponential backoff recovery.</span>
        <span>Avg: ~382 ms</span>
      </div>
    </div>
  );
};
