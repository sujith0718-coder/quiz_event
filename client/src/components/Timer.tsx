import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const Timer: React.FC<{ startTime?: string }> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState<string>('00:00:00');

  useEffect(() => {
    const start = startTime ? new Date(startTime).getTime() : Date.now();

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const hours = String(Math.floor(diff / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const seconds = String(diff % 60).padStart(2, '0');
      setElapsed(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-sm text-indigo-300">
      <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
      <span>{elapsed}</span>
    </div>
  );
};
