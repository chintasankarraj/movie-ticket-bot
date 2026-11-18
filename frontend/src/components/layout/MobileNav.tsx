import React from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-obsidian-surface shadow-2xl z-10">
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-obsidian-card border border-obsidian-border text-slate-400 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <Sidebar className="w-full h-full border-r-0" onNavigate={onClose} />
      </div>
    </div>
  );
};
