import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 mt-auto py-8 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-slate-200">CodeArena</span>
          <span>&mdash; Real-Time Quiz & Riddle Competition Platform</span>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <span className="flex items-center text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> RBAC & Encryption Active
          </span>
          <span>&bull;</span>
          <span>Built for Live Engineering Competitions</span>
        </div>
      </div>
    </footer>
  );
};
