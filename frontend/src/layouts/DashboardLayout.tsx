import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { MobileNav } from '../components/layout/MobileNav';
import { DemoBanner } from '../components/common/DemoBanner';

export const DashboardLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="flex h-screen bg-obsidian overflow-hidden font-sans">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuToggle={() => setMobileNavOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
          <DemoBanner />
          <div key={refreshKey} className="pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
