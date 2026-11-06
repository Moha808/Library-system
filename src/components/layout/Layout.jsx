import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuth } from '../../context/AuthContext';

export function Layout({ withSidebar = true }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-emerald-950/5 via-emerald-50/50 to-emerald-100/30 font-sans antialiased text-slate-900 overflow-hidden">
      {/* Fixed Institutional Top Header & Navigation */}
      <Navbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        isSidebarOpen={sidebarOpen} 
      />

      {/* Main Viewport Workspace: Fills remaining height, completely locked */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        {withSidebar && currentUser && (
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
        )}

        {/* Scrollable Content Pane: Only this section scrolls */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto flex flex-col justify-between">
          <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
