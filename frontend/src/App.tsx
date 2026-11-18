import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Overview } from './pages/Overview';
import { Watchlist } from './pages/Watchlist';
import { Activity } from './pages/Activity';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="activity" element={<Activity />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
