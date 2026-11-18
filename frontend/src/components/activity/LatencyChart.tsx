import React from 'react';
import {
  LineChart,
  Line,
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
        <p className="text-slate-400 font-semibold mb-1">{`Time: ${label}`}</p>
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

export const LatencyChart: React.FC = () => {
  return (
    <div className="p-5 rounded-xl bg-obsidian-card border border-obsidian-border">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Sweeper Latency Benchmark (Sample 10-Hour Window)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Benchmark round-trip response times for BookMyShow and District endpoints (Demo data).
          </p>
        </div>
        <span className="text-xs font-mono text-purple-400 bg-brand-purple/10 border border-brand-purple/20 px-2.5 py-1 rounded-md">
          Average: 382ms
        </span>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={HOURLY_LATENCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2538" vertical={false} />
            <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="ms" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
            <Line
              type="monotone"
              dataKey="bookmyshow"
              name="BookMyShow (Local)"
              stroke="#E50914"
              strokeWidth={2}
              dot={{ r: 3, fill: '#E50914' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="district"
              name="District (Cloud/Local)"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ r: 3, fill: '#2563EB' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="average"
              name="Combined Mean"
              stroke="#A855F7"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
