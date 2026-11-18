import React from 'react';
import { TelegramNotification } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Bell } from 'lucide-react';

interface NotificationLogTableProps {
  notifications: TelegramNotification[];
}

export const NotificationLogTable: React.FC<NotificationLogTableProps> = ({ notifications }) => {
  return (
    <div className="p-5 rounded-xl bg-obsidian-card border border-obsidian-border space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" />
          Alert Delivery History (Demo Dataset)
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Audit trail of Telegram bot dispatches, network retry counts, and latency records.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-obsidian-border/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-obsidian-surface text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-obsidian-border">
            <tr>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Channel / Recipient</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Summary</th>
              <th className="py-3 px-4">Attempts</th>
              <th className="py-3 px-4">Latency</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-border/60">
            {notifications.map((item) => (
              <tr key={item.id} className="hover:bg-obsidian-surface/40 transition-colors">
                <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                  {item.displayTime}
                </td>
                <td className="py-3 px-4 text-slate-200 font-medium whitespace-nowrap">
                  {item.recipientMasked}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-obsidian-surface border border-obsidian-border text-slate-300 uppercase">
                    {item.alertType.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                  {item.showsSummary}
                </td>
                <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                  {item.attempts}
                </td>
                <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                  {item.responseTimeMs}ms
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <StatusBadge
                    status={item.deliveryStatus === 'delivered' ? 'delivered' : 'retrying'}
                    label={item.deliveryStatus === 'delivered' ? 'Sample Delivered' : 'Simulated Retry'}
                    size="sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
        <span>Telegram alerts strictly dispatched upon confirmed provider changes</span>
        <span>Mock Dispatcher</span>
      </div>
    </div>
  );
};
