import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Shield, 
  GraduationCap, 
  Menu, 
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (e) {
      toast.error('Sign out error');
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border-b border-emerald-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Brand & Mobile Sidebar Toggle */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-emerald-200 hover:bg-emerald-800/60 focus:outline-hidden"
                aria-label="Toggle Navigation"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/fcahpt-logo.png"
                alt="FCAHPT Vom Crest"
                className="w-10 h-10 rounded-full object-contain p-0.5 bg-white border-2 border-emerald-400 shadow-xs group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-white">LibCredit</span>
                  <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-600/60">
                    FCAHPT Vom
                  </span>
                </div>
                <span className="text-2xs text-emerald-200/80 font-medium hidden sm:inline">
                  Automated Credit Score Borrowing System
                </span>
              </div>
            </Link>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-3">
            {/* User Profile & Auth controls */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  to={currentUser.role === 'admin' ? '/admin' : '/patron'}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-800/70 hover:bg-emerald-800 border border-emerald-600/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                    {currentUser.name ? currentUser.name[0] : 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                      {currentUser.name}
                    </span>
                    <span className="text-2xs text-emerald-200 uppercase font-medium">
                      {currentUser.role === 'admin' ? 'Librarian Admin' : (currentUser.matricNo || 'Patron')}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-800/80 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold px-3 py-1.5 text-emerald-100 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xs transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
