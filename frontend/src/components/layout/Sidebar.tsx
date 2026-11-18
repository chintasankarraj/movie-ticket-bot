import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Activity,
  Bell,
  Settings,
  ShieldCheck,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { TARGET_MOVIE, PROVIDERS } from '../../data/mockData';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onNavigate }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/watchlist', label: 'Watchlist', icon: Film, badge: 'Target' },
    { to: '/activity', label: 'Monitoring Activity', icon: Activity },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'Telegram' },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'w-64 flex flex-col bg-obsidian-surface border-r border-obsidian-border select-none h-full',
        className
      )}
    >
      {/* Brand & Logo Header */}
      <div className="p-5 border-b border-obsidian-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-purple-900 flex items-center justify-center text-white shadow-glow-purple">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wider uppercase text-white flex items-center gap-1.5">
              Movie Ticket Bot
            </h1>
            <p className="text-[11px] font-mono text-purple-400">Midnight Radar</p>
          </div>
        </div>

        {/* Target Profile Card */}
        <div className="mt-4 p-2.5 rounded-lg bg-obsidian-card border border-obsidian-border text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Target Spec</span>
            <span className="flex items-center gap-1 text-purple-300 font-mono text-[10px] bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              UI PREVIEW
            </span>
          </div>
          <div className="mt-1.5 font-semibold text-slate-200 truncate">
            {TARGET_MOVIE.title}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            {TARGET_MOVIE.targetCity} • {TARGET_MOVIE.targetDateIso}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-brand-purple/50',
                  isActive
                    ? 'bg-brand-purple/15 text-purple-300 border border-brand-purple/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-card'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wide',
                        isActive
                          ? 'bg-brand-purple/30 text-purple-200'
                          : 'bg-obsidian-card text-slate-500 group-hover:text-slate-400'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {/* Engine Provider Scope */}
        <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Engine Feeds (Specs)
        </div>
        <div className="space-y-1.5 px-1">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className="px-3 py-2 rounded-lg bg-obsidian-card/60 border border-obsidian-border text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    provider.id === 'bookmyshow' ? 'bg-red-500' : 'bg-blue-500'
                  )}
                />
                <span className="font-medium text-slate-300">{provider.name}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {provider.environment === 'Local only' ? 'Local Spec' : 'Cloud Spec'}
              </span>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-obsidian-border bg-obsidian-card/40">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span className="font-medium text-slate-300 text-[11px]">Python Test Baseline</span>
          </div>
          <span
            className="text-[11px] font-mono text-purple-300 font-semibold"
            title="Verified offline unit test suite for Python engine"
          >
            72/72 PASS
          </span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono leading-tight">
          Engine tests verified offline (frontend not linked)
        </p>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 font-mono pt-2 border-t border-obsidian-border/50">
          <span>Release v1.2.0</span>
          <a
            href="https://github.com/chintasankarraj/movie-ticket-bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-purple-400 transition-colors focus:outline-none focus:underline"
          >
            GitHub <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </aside>
  );
};
