import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client.js';
import {
  BarChart2,
  Users,
  CheckCircle2,
  Target,
  Trophy,
  Flame,
  Clock,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Overview {
  totalTeams: number;
  totalParticipants: number;
  totalQuestions: number;
  totalSubmissions: number;
  correctSubmissions: number;
  accuracyRate: number;
  teamsCompleted: number;
}

interface QuestionStat {
  questionId: string;
  title: string;
  order: number;
  type: string;
  points: number;
  totalSubmissions: number;
  correctSubmissions: number;
  accuracyRate: number;
  avgSolveTimeSec: number | null;
  bottleneckScore: number;
}

interface TopTeam {
  _id: string;
  name: string;
  score: number;
  completedAt?: string;
  currentQuestionOrder: number;
  members: string[];
}

interface HeatmapBucket {
  timestamp: string;
  total: number;
  correct: number;
  incorrect: number;
}

interface DashboardData {
  overview: Overview;
  questionStats: QuestionStat[];
  topTeams: TopTeam[];
  heatmap: HeatmapBucket[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (secs: number | null): string => {
  if (secs === null) return '—';
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const fmtHour = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const bottleneckColor = (score: number) => {
  if (score >= 70) return 'text-red-400';
  if (score >= 45) return 'text-amber-400';
  return 'text-emerald-400';
};

const bottleneckBg = (score: number) => {
  if (score >= 70) return 'from-red-500 to-red-400';
  if (score >= 45) return 'from-amber-500 to-amber-400';
  return 'from-emerald-500 to-emerald-400';
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}> = ({ label, value, sub, icon, accent }) => (
  <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-3 hover:border-slate-700 transition-colors duration-200">
    <div className="flex items-center justify-between">
      <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{label}</span>
      <div className={`p-2 rounded-xl ${accent}`}>{icon}</div>
    </div>
    <div className="text-3xl font-extrabold text-white">{value}</div>
    {sub && <div className="text-xs text-slate-500">{sub}</div>}
  </div>
);

// CSS-only horizontal bar chart for question solve rates
const SolveRateBar: React.FC<{ stat: QuestionStat; maxAttempts: number }> = ({
  stat,
  maxAttempts,
}) => {
  const widthPct = maxAttempts > 0 ? (stat.totalSubmissions / maxAttempts) * 100 : 0;
  const isBottleneck = stat.bottleneckScore >= 70;

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-300 font-mono text-xs font-bold">
            Q{stat.order}
          </span>
          <span className="font-bold text-white text-sm">{stat.title}</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {stat.type}
          </span>
          {isBottleneck && (
            <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
              <Flame className="w-3 h-3" /> BOTTLENECK
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
          <span className="text-slate-400">
            {stat.correctSubmissions}/{stat.totalSubmissions} correct
          </span>
          <span className={`font-bold ${stat.accuracyRate >= 60 ? 'text-emerald-400' : stat.accuracyRate >= 30 ? 'text-amber-400' : 'text-red-400'}`}>
            {stat.accuracyRate}%
          </span>
          {stat.avgSolveTimeSec !== null && (
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3" />
              {fmtTime(stat.avgSolveTimeSec)} avg
            </span>
          )}
        </div>
      </div>

      {/* Solve rate fill */}
      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${bottleneckBg(stat.bottleneckScore)} transition-all duration-700`}
          style={{ width: `${stat.accuracyRate}%` }}
        />
      </div>

      {/* Attempt volume bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-slate-600 w-16 shrink-0">Attempts</span>
        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-slate-600 transition-all duration-700"
            style={{ width: `${widthPct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-500 w-8 text-right shrink-0">
          {stat.totalSubmissions}
        </span>
      </div>
    </div>
  );
};

// CSS-only heatmap timeline chart
const HeatmapChart: React.FC<{ heatmap: HeatmapBucket[] }> = ({ heatmap }) => {
  if (heatmap.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        No submission data yet — activity will appear here during the competition.
      </div>
    );
  }

  const maxTotal = Math.max(...heatmap.map((b) => b.total), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
        {heatmap.map((bucket, i) => {
          const heightPct = (bucket.total / maxTotal) * 100;
          const correctPct = bucket.total > 0 ? (bucket.correct / bucket.total) * 100 : 0;
          return (
            <div
              key={i}
              className="group relative flex flex-col justify-end shrink-0"
              style={{ width: `${Math.max(20, Math.min(40, 600 / heatmap.length))}px`, height: '100%' }}
            >
              {/* Tooltip */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] font-mono text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div>{fmtHour(bucket.timestamp)}</div>
                <div className="text-emerald-400">{bucket.correct} correct</div>
                <div className="text-red-400">{bucket.incorrect} wrong</div>
              </div>

              {/* Bar */}
              <div
                className="w-full rounded-t-sm overflow-hidden relative"
                style={{ height: `${heightPct}%`, minHeight: bucket.total > 0 ? '4px' : '0px' }}
              >
                {/* Correct portion */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-emerald-500/70"
                  style={{ height: `${correctPct}%` }}
                />
                {/* Incorrect portion */}
                <div
                  className="absolute top-0 left-0 right-0 bg-red-500/50"
                  style={{ height: `${100 - correctPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
          Correct
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/50" />
          Incorrect
        </div>
        <div className="ml-auto text-slate-600">{heatmap.length} time windows · hover for details</div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const result = await apiRequest<DashboardData>('/analytics/dashboard');
      setData(result);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30s during live competition
    const interval = setInterval(() => fetchData(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center text-slate-400 space-y-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-mono">Crunching competition data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-slate-400 text-sm">{error || 'No data available'}</p>
        <button
          onClick={() => fetchData()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { overview, questionStats, topTeams, heatmap } = data;
  const maxAttempts = Math.max(...questionStats.map((q) => q.totalSubmissions), 1);
  const topBottleneck = [...questionStats].sort((a, b) => b.bottleneckScore - a.bottleneckScore)[0];
  const peakBucket = heatmap.length > 0 ? heatmap.reduce((a, b) => (b.total > a.total ? b : a)) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-8 rounded-3xl border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono mb-3">
            <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
            REAL-TIME COMPETITION ANALYTICS
          </div>
          <h1 className="text-3xl font-extrabold text-white">Analytics &amp; Performance Metrics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Deep-dive analysis into team completion rates, question difficulty, and submission trends.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            id="analytics-refresh-btn"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          {lastUpdated && (
            <span className="text-[10px] font-mono text-slate-600">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Competitors"
          value={overview.totalParticipants}
          sub={`Across ${overview.totalTeams} teams`}
          icon={<Users className="w-4 h-4 text-indigo-300" />}
          accent="bg-indigo-500/15"
        />
        <StatCard
          label="Total Submissions"
          value={overview.totalSubmissions}
          sub="Logged answer attempts"
          icon={<Target className="w-4 h-4 text-purple-300" />}
          accent="bg-purple-500/15"
        />
        <StatCard
          label="Correct Solves"
          value={overview.correctSubmissions}
          sub="Successful completions"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-300" />}
          accent="bg-emerald-500/15"
        />
        <StatCard
          label="Overall Accuracy"
          value={`${overview.accuracyRate}%`}
          sub={`${overview.teamsCompleted} teams finished`}
          icon={<TrendingUp className="w-4 h-4 text-amber-300" />}
          accent="bg-amber-500/15"
        />
      </div>

      {/* Highlight Strip */}
      {(topBottleneck || peakBucket) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topBottleneck && (
            <div className="glass-panel p-5 rounded-2xl border border-red-500/20 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-red-500/15 shrink-0">
                <Flame className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-xs font-mono text-red-400 uppercase mb-1">Top Bottleneck</div>
                <div className="font-bold text-white text-sm">{topBottleneck.title}</div>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  {topBottleneck.accuracyRate}% solve rate · bottleneck score{' '}
                  <span className="text-red-400 font-bold">{topBottleneck.bottleneckScore}</span>
                </div>
              </div>
            </div>
          )}
          {peakBucket && (
            <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-500/15 shrink-0">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-mono text-amber-400 uppercase mb-1">Peak Activity</div>
                <div className="font-bold text-white text-sm">{fmtHour(peakBucket.timestamp)}</div>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  {peakBucket.total} submissions in 5 min ·{' '}
                  <span className="text-emerald-400">{peakBucket.correct} correct</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question Difficulty & Solve Breakdown */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-400" />
          Question Solve Breakdown &amp; Difficulty Index
        </h3>
        <div className="space-y-3">
          {questionStats.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No questions found.</p>
          ) : (
            questionStats.map((stat) => (
              <SolveRateBar key={stat.questionId} stat={stat} maxAttempts={maxAttempts} />
            ))
          )}
        </div>
      </div>

      {/* Submission Heatmap */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Submission Volume Over Time
          </h3>
          <span className="text-xs font-mono text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
            5-min windows
          </span>
        </div>
        <HeatmapChart heatmap={heatmap} />
      </div>

      {/* Top Performers */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Top Performers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topTeams.map((team, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[index] || `#${index + 1}`;
            return (
              <div
                key={team._id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xl flex items-center justify-center shrink-0">
                  {medal}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm truncate">{team.name}</div>
                  <div className="text-xs font-mono text-amber-400 font-bold">{team.score} PTS</div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Q{team.currentQuestionOrder - 1} solved ·{' '}
                    {team.completedAt ? (
                      <span className="text-emerald-400">Finished ✓</span>
                    ) : (
                      <span className="text-slate-600">In progress</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
