import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { apiRequest } from '../api/client.js';
import { Users, PlusCircle, LogIn, Copy, Check, ShieldAlert, Award } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [team, setTeam] = useState<any>(null);
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/teams/me');
      setTeam(data.team);
    } catch (err) {
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setActionLoading(true);

    try {
      const data = await apiRequest('/teams/create', {
        method: 'POST',
        body: JSON.stringify({ name: createName }),
      });
      setTeam(data.team);
      setSuccess(`Team "${data.team.name}" created successfully!`);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to create team.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setActionLoading(true);

    try {
      const data = await apiRequest('/teams/join', {
        method: 'POST',
        body: JSON.stringify({ teamCode: joinCode }),
      });
      setTeam(data.team);
      setSuccess(`Successfully joined team "${data.team.name}"!`);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to join team. Check team code.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyTeamCode = () => {
    if (team?.teamCode) {
      navigator.clipboard.writeText(team.teamCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span>Loading Team Details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
          <Users className="w-8 h-8 text-indigo-400" />
          <span>Team Management</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Form a competition squad or join an existing team using a unique 6-character Team Code.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center space-x-3">
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {team ? (
        /* Team Profile Details */
        <div className="glass-panel p-8 rounded-3xl border border-indigo-500/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono uppercase text-indigo-400 tracking-wider">Your Competition Team</span>
              <h2 className="text-3xl font-extrabold text-white mt-1">{team.name}</h2>
            </div>

            <div className="flex items-center space-x-3 bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800">
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Team Join Code</div>
                <div className="text-xl font-bold font-mono text-indigo-300 tracking-wider">{team.teamCode}</div>
              </div>
              <button
                onClick={copyTeamCode}
                className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors"
                title="Copy Team Code"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono uppercase">Current Score</div>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">{team.score} PTS</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono uppercase">Unlocked Question</div>
              <div className="text-2xl font-extrabold text-indigo-400 mt-1">#{team.currentQuestionOrder}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono uppercase">Members Count</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">{team.members?.length || 0}</div>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Team Roster</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {team.members?.map((m: any) => (
                <div
                  key={m._id || m.id}
                  className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{m.name}</div>
                      <div className="text-xs text-slate-400">{m.email}</div>
                    </div>
                  </div>

                  {m._id === team.leaderId && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono uppercase flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Leader</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Forms to Create or Join Team */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Team Form */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Create New Team</h3>
            </div>
            <p className="text-xs text-slate-400">
              Set up a team name and automatically generate a shareable 6-character code for your teammates.
            </p>

            <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Code Warriors"
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
              >
                <span>{actionLoading ? 'Creating...' : 'Create Team'}</span>
              </button>
            </form>
          </div>

          {/* Join Team Form */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <LogIn className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Join Existing Team</h3>
            </div>
            <p className="text-xs text-slate-400">
              Enter the unique 6-character Team Code provided by your team leader.
            </p>

            <form onSubmit={handleJoinTeam} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Team Code
                </label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CW7K92"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-white font-mono uppercase text-lg tracking-wider placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2"
              >
                <span>{actionLoading ? 'Joining...' : 'Join Team'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
