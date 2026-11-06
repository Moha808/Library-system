import React from 'react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border-t border-emerald-800/80 py-6 text-emerald-200/90 text-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img
            src="/fcahpt-logo.png"
            alt="FCAHPT Crest"
            className="w-5 h-5 rounded-full object-contain bg-white p-0.5 border border-emerald-400"
          />
          <span className="font-semibold text-white">LibCredit — Automated Credit Score Borrowing System</span>
        </div>
        <p className="text-center sm:text-right text-emerald-300/80">
          Federal College of Animal Health and Production Technology (FCAHPT), Vom, Plateau State, Nigeria &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
