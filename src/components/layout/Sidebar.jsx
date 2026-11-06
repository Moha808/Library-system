import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Clock, 
  History, 
  HelpCircle, 
  AlertTriangle, 
  Users, 
  CheckSquare, 
  ArrowUpRight, 
  RotateCcw, 
  ShieldAlert, 
  FileText, 
  Settings, 
  Sliders,
  Scale,
  X,
  GraduationCap,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ isOpen, onClose }) {
  const { currentUser, isAdmin } = useAuth();

  const patronNav = [
    { name: 'Dashboard', path: '/patron', icon: LayoutDashboard },
    { name: 'Browse Books', path: '/patron/books', icon: BookOpen },
    { name: 'My Loans & Due Dates', path: '/patron/borrowings', icon: Clock },
    { name: 'Score History Timeline', path: '/patron/score-history', icon: History },
    { name: 'How My Score Works', path: '/patron/how-it-works', icon: HelpCircle },
    { name: 'My Disputes', path: '/patron/disputes', icon: Scale },
  ];

  const adminNav = [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Books Management', path: '/admin/books', icon: BookOpen },
    { name: 'Patrons Directory', path: '/admin/patrons', icon: Users },
    { name: 'Borrow Requests Queue', path: '/admin/requests', icon: CheckSquare },
    { name: 'Issue Book Directly', path: '/admin/issue', icon: ArrowUpRight },
    { name: 'Return & Score Preview', path: '/admin/return', icon: RotateCcw },
    { name: 'Overdue Monitoring', path: '/admin/overdue', icon: AlertTriangle },
    { name: 'Defaulters Tracker', path: '/admin/defaulters', icon: ShieldAlert },
    { name: 'Score Adjustments & Disputes', path: '/admin/scores', icon: Sliders },
    { name: 'Reports & Analytics', path: '/admin/reports', icon: FileText },
    { name: 'Scoring Rules Settings', path: '/admin/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNav : patronNav;

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/fcahpt-logo.png"
            alt="FCAHPT Logo"
            className="w-9 h-9 rounded-full object-contain bg-white p-0.5 border border-emerald-500/40 shadow-md shadow-emerald-950/40 shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-white tracking-tight">FCAHPT Library</p>
            <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
              {isAdmin ? 'Librarian Console' : 'Student Portal'}
            </p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">
          {isAdmin ? 'Library Administration' : 'Patron Services'}
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin' || item.path === '/patron'}
              onClick={() => isMobile && onClose && onClose()}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150
                ${isActive 
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/30 border-l-4 border-emerald-300 pl-2' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'}
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Current User Quick Info */}
      {currentUser && (
        <div className="px-3 py-2 mx-3 mb-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Signed In As</p>
          <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
          <p className="text-[11px] text-emerald-400 truncate">{currentUser.department || (isAdmin ? 'Library Dept.' : 'Student')}</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Screens lg and up) - 100% Locked, Never Moves on Scroll */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-full border-r border-slate-800 shadow-sm z-20 select-none">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer (Screens below lg) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <aside className="relative z-50 w-72 max-w-[85vw] h-full shadow-2xl border-r border-slate-800 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
