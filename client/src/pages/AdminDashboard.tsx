import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { Shield, Radio, Code, Users, BarChart2, Snowflake, Play, Square, ArrowRight } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [event, setEvent] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [eventRes, analyticsRes] = await Promise.allSettled([
        apiRequest('/events/active'),
        apiRequest('/admin/analytics'),
      ]);

      if (eventRes.status === 'fulfilled') setEvent(eventRes.value.event);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (!event) return;
    setActionLoading(true);
    try {
      const data = await apiRequest(`/events/${event._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setEvent(data.event);
    } catch (err: any) {
      alert(err.message || 'Failed to change round status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFreeze = async () => {
    if (!event) return;
    setActionLoading(true);
    try {
      const data = await apiRequest(`/events/${event._id}/freeze`, {
        method: 'PUT',
      });
      setEvent({ ...event, isFrozen: data.isFrozen });
    } catch (err: any) {
      alert(err.message || 'Failed to toggle freeze state');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span>Loading Admin Control Center...</span>
      </div>
    );
  }

  const overview = analytics?.overview || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="glass-panel p-8 rounded-3xl border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono mb-3">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>ADMINISTRATOR CONTROL PANEL</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Event Control Center</h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor submissions in real-time, control event rounds, toggle leaderboard freeze, and manage question sets.
          </p>
        </div>

        {/* Quick Round Control Buttons */}
        {event && (
          <div className="flex flex-wrap items-center gap-3">
            {event.status !== 'LIVE' ? (
              <button
                onClick={() => handleStatusChange('LIVE')}
                disabled={actionLoading}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Open Live Round</span>
              </button>
            ) : (
              <button
                onClick={() => handleStatusChange('COMPLETED')}
                disabled={actionLoading}
                className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center space-x-2"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Close Round</span>
              </button>
            )}

            <button
              onClick={handleToggleFreeze}
              disabled={actionLoading}
              className={`px-5 py-3 rounded-2xl border text-sm font-bold transition-all flex items-center space-x-2 ${
                event.isFrozen
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Snowflake className="w-4 h-4" />
              <span>{event.isFrozen ? 'Unfreeze Standings' : 'Freeze Standings'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Teams Joined</span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{overview.totalTeams || 0}</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Questions Set</span>
            <Code className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{overview.totalQuestions || 0}</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Submissions</span>
            <Radio className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{overview.totalSubmissions || 0}</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Accuracy Rate</span>
            <BarChart2 className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{overview.accuracyRate || 0}%</div>
        </div>
      </div>

      {/* Navigation Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/questions"
          className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-4">
            <Code className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
            Question Manager
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Create, edit, and reorder MCQs and Riddles. Assign points and secret answers.
          </p>
          <div className="mt-4 text-xs font-semibold text-purple-400 flex items-center space-x-1">
            <span>Manage Questions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/submissions"
          className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mb-4">
            <Radio className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
            Live Submissions Stream
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Monitor live team submissions, correct vs incorrect results, and submission timestamps.
          </p>
          <div className="mt-4 text-xs font-semibold text-emerald-400 flex items-center space-x-1">
            <span>View Submissions Stream</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
            <BarChart2 className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
            Analytics Dashboard
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Analyze question solve accuracy rates, difficulty levels, and team velocity metrics.
          </p>
          <div className="mt-4 text-xs font-semibold text-blue-400 flex items-center space-x-1">
            <span>View Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
};
