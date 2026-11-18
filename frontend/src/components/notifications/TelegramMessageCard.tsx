import React from 'react';
import { TelegramNotification } from '../../types';
import { Send, Clock, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface TelegramMessageCardProps {
  notification: TelegramNotification;
}

export const TelegramMessageCard: React.FC<TelegramMessageCardProps> = ({ notification }) => {
  const isMidnight = notification.alertType === 'midnight_show';

  return (
    <div className="p-5 rounded-xl bg-obsidian-card border border-obsidian-border hover:border-obsidian-borderHover transition-all flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-obsidian-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30">
              <Send className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {notification.channelName}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {notification.recipientMasked}
              </div>
            </div>
          </div>

          <StatusBadge
            status={notification.deliveryStatus === 'delivered' ? 'delivered' : 'retrying'}
            label={notification.deliveryStatus === 'delivered' ? 'Sample Delivered' : 'Simulated Retry'}
            size="sm"
          />
        </div>

        {/* Message Bubble (Simulated Telegram preview) */}
        <div className="mt-3 p-3.5 rounded-lg bg-obsidian-surface border border-obsidian-border/80 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
          {notification.messageContent}
        </div>
      </div>

      {/* Meta Footer */}
      <div className="mt-4 pt-3 border-t border-obsidian-border/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {notification.displayTime}
          </span>
          <span>Attempts: {notification.attempts}</span>
          <span>Latency: {notification.responseTimeMs}ms</span>
        </div>

        {isMidnight ? (
          <span className="text-purple-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-400" /> State Recorded (Sample)
          </span>
        ) : (
          <span className="text-slate-500">System Log (Sample)</span>
        )}
      </div>
    </div>
  );
};
