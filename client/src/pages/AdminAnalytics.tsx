import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { BarChart2, Users, CheckCircle2, Target, Trophy, Award } from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await apiRequest('/admin/analytics');
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span>Calculating Competition Analytics...</span>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const questionStats = analytics?.questionStats || [];
  const topTeams = analytics?.topTeams || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-8 rounded-3xl border border-blue-500/30">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono mb-3">
          <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
          <span>REAL-TIME COMPETITION ANALYTICS</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Analytics & Performance Metrics</h1>
        <p className="text-slate-400 text-sm mt-1">
          Deep-dive analysis into team completion rates, question difficulty distributions, and accuracy statistics.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Competitors</span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{overview.totalParticipants || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Across {overview.totalTeams || 0} teams</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Submissions</span>
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{overview.totalSubmissions || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Logged answer attempts</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Correct Solves</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">{overview.correctSubmissions || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Successful question completions</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Overall Accuracy</span>
            <BarChart2 className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">{overview.accuracyRate || 0}%</div>
          <div className="text-xs text-slate-500 mt-1">Correct answer percentage</div>
        </div>
      </div>

      {/* Question Difficulty & Solve Breakdown */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <BarChart2 className="w-5 h-5 text-indigo-400" />
          <span>Question Solve Breakdown & Difficulty Index</span>
        </h3>

        <div className="space-y-4">
          {questionStats.map((q: any) => (
            <div key={q.questionId} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-300 font-mono text-xs font-bold">
                    Q#{q.order}
                  </span>
                  <span className="font-bold text-white text-sm">{q.title}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {q.type}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  {q.correctSubmissions} / {q.totalSubmissions} Correct ({q.accuracyRate}% Accuracy)
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${q.accuracyRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Performers Summary */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Top Performers Leaderboard Snapshot</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topTeams.map((team: any, index: number) => (
            <div key={team._id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold font-mono flex items-center justify-center">
                #{index + 1}
              </div>
              <div>
                <div className="font-bold text-white text-sm">{team.name}</div>
                <div className="text-xs font-mono text-amber-400 font-bold">{team.score} PTS</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
