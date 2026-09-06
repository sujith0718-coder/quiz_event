import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext.js';
import { apiRequest } from '../api/client.js';
import { Trophy, Snowflake, Clock, CheckCircle2, RefreshCw, Zap, Medal } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { socket, joinEventRoom } = useSocket();

  const fetchLeaderboard = async () => {
    try {
      const data = await apiRequest('/leaderboard/active');
      setLeaderboard(data);
      setLastUpdated(new Date());
      if (data.eventId) joinEventRoom(data.eventId);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Listen for live Socket.IO leaderboard update events
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (updatedData: any) => {
      console.log('[Socket.IO] Real-time leaderboard update received!');
      setLeaderboard(updatedData);
      setLastUpdated(new Date());
    };

    socket.on('leaderboard:update', handleUpdate);

    return () => {
      socket.off('leaderboard:update', handleUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span>Loading Live Leaderboard...</span>
      </div>
    );
  }

  const isFrozen = leaderboard?.isFrozen;
  const rankings = leaderboard?.rankings || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="glass-panel p-8 rounded-3xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono mb-3">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>REAL-TIME STANDINGS</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Competition Leaderboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ranked by Total Score (Primary) and Earliest Completion Time (Tie Breaker).
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
          <button
            onClick={fetchLeaderboard}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:text-white transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            <span>Refresh</span>
          </button>
          <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Leaderboard Freeze Alert Banner */}
      {isFrozen && (
        <div className="p-6 rounded-3xl bg-cyan-950/40 border border-cyan-500/40 flex items-center space-x-4 shadow-xl shadow-cyan-500/10">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
            <Snowflake className="w-6 h-6 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-cyan-200">🏆 Leaderboard Frozen by Admin</h3>
            <p className="text-slate-300 text-sm mt-0.5">
              Public rankings are currently locked for dramatic effect! Final standings will be revealed when the round completes.
            </p>
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 text-center">Rank</th>
                <th className="py-4 px-6">Team Name</th>
                <th className="py-4 px-6">Roster</th>
                <th className="py-4 px-6 text-center">Solved</th>
                <th className="py-4 px-6 text-center">Completion Time</th>
                <th className="py-4 px-6 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                    No teams participating yet.
                  </td>
                </tr>
              ) : (
                rankings.map((t: any) => {
                  const isGold = t.rank === 1;
                  const isSilver = t.rank === 2;
                  const isBronze = t.rank === 3;

                  return (
                    <tr
                      key={t.teamId}
                      className={`transition-colors ${
                        isGold
                          ? 'bg-amber-500/5 hover:bg-amber-500/10'
                          : isSilver
                          ? 'bg-slate-300/5 hover:bg-slate-300/10'
                          : isBronze
                          ? 'bg-amber-700/5 hover:bg-amber-700/10'
                          : 'hover:bg-slate-900/50'
                      }`}
                    >
                      {/* Rank Badge */}
                      <td className="py-4 px-6 text-center">
                        {isGold ? (
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center mx-auto text-sm">
                            🥇 1
                          </div>
                        ) : isSilver ? (
                          <div className="w-8 h-8 rounded-full bg-slate-400/20 border border-slate-400/40 text-slate-200 font-bold flex items-center justify-center mx-auto text-sm">
                            🥈 2
                          </div>
                        ) : isBronze ? (
                          <div className="w-8 h-8 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-400 font-bold flex items-center justify-center mx-auto text-sm">
                            🥉 3
                          </div>
                        ) : (
                          <span className="font-mono text-slate-400 font-bold">#{t.rank}</span>
                        )}
                      </td>

                      {/* Team Name */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white text-base">{t.teamName}</div>
                        <div className="text-xs font-mono text-slate-500">CODE: {t.teamCode}</div>
                      </td>

                      {/* Members */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {t.members?.map((m: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Solved Progress */}
                      <td className="py-4 px-6 text-center">
                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs font-bold">
                          {t.solvedCount} / {t.totalQuestions} Solved
                        </span>
                      </td>

                      {/* Completion Timestamp (Tie-breaker) */}
                      <td className="py-4 px-6 text-center font-mono text-xs text-slate-400">
                        {t.completedAt ? (
                          <span className="text-emerald-400 flex items-center justify-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(t.completedAt).toLocaleTimeString()}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600">&mdash;</span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-4 px-6 text-right font-extrabold text-amber-400 text-lg font-mono">
                        {t.score} <span className="text-xs text-slate-500 font-normal">PTS</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
