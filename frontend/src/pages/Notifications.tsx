import React from 'react';
import { ChannelStatusCard } from '../components/notifications/ChannelStatusCard';
import { TelegramMessageCard } from '../components/notifications/TelegramMessageCard';
import { NotificationLogTable } from '../components/notifications/NotificationLogTable';
import { MOCK_NOTIFICATIONS } from '../data/mockData';
import { Bell, ShieldCheck, Info } from 'lucide-react';

export const Notifications: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-400" />
            Telegram Notification Dispatcher (UI Preview)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Illustrative alert delivery logs, bounded retry policy demonstration, and message formatting previews.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40 self-start sm:self-auto">
          <Info className="w-3.5 h-3.5 text-purple-400" />
          <span>Demo Dispatch Log (Offline Preview)</span>
        </div>
      </div>

      {/* Telegram Channel Status Card */}
      <ChannelStatusCard />

      {/* Simulated Message Previews */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Simulated Telegram Alert Previews
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Formatted as delivered to Telegram channel
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_NOTIFICATIONS.map((notif) => (
            <TelegramMessageCard key={notif.id} notification={notif} />
          ))}
        </div>
      </section>

      {/* Delivery Log Table */}
      <NotificationLogTable notifications={MOCK_NOTIFICATIONS} />
    </div>
  );
};
