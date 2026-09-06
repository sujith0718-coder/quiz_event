import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { apiRequest } from '../api/client.js';
import { Users, Zap, Trophy, ArrowRight, Radio, Award } from 'lucide-react';
import { Timer } from '../components/Timer.js';

export const ParticipantDashboard: React.FC = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, teamRes] = await Promise.allSettled([
          apiRequest('/events/active'),
          apiRequest('/teams/me'),
        ]);

        if (eventRes.status === 'fulfilled') {
          setEvent(eventRes.value.event);
          setQuestionCount(eventRes.value.questionCount || 0);
        }

        if (teamRes.status === 'fulfilled') {
          setTeam(teamRes.value.team);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span>Loading Participant Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>COMPETITOR PORTAL</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Prepare your system design logic and conquer the sequential riddle challenges.
            </p>
          </div>

          {event && (
            <div className="flex items-center space-x-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">Event Status</div>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${event.status === 'LIVE' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span className="text-base font-bold text-white uppercase">{event.status}</span>
                </div>
              </div>
              <Timer startTime={event.startTime} />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Team Card Widget */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              {team && (
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold">
                  CODE: {team.teamCode}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-white">Your Team Status</h3>

            {team ? (
              <div className="mt-4 space-y-3">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400 font-mono uppercase">Team Name</div>
                  <div className="text-xl font-bold text-indigo-300 mt-0.5">{team.name}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-mono uppercase mb-2">
                    Members ({team.members?.length || 0})
                  </div>
                  <div className="space-y-1.5">
                    {team.members?.map((m: any) => (
                      <div key={m._id || m.id} className="text-sm text-slate-300 flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>{m.name}</span>
                        {m._id === team.leaderId && (
                          <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded font-mono uppercase">
                            Leader
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-400 space-y-4">
                <p>You haven't joined or created a team yet. Form a team to participate in the competition!</p>
                <Link
                  to="/team"
                  className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Create or Join Team
                </Link>
              </div>
            )}
          </div>

          {team && (
            <Link
              to="/team"
              className="mt-6 text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-end space-x-1"
            >
              <span>Manage Team Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Competition Action Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                {questionCount} CHALLENGES
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white">
              {event?.name || 'Software Engineering Competition'}
            </h3>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              {event?.description || 'Solve sequential MCQ & riddle challenges. Points accumulate in real-time on the global leaderboard.'}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-mono uppercase">Current Score</div>
                <div className="text-2xl font-extrabold text-amber-400 mt-1">
                  {team ? team.score || 0 : 0} <span className="text-xs text-slate-400 font-normal">PTS</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-mono uppercase">Current Question</div>
                <div className="text-2xl font-extrabold text-indigo-400 mt-1">
                  #{team ? team.currentQuestionOrder || 1 : 1}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-xs text-slate-400 font-mono uppercase">Status</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">
                  {team?.completedAt ? '✅ ALL SOLVED' : 'IN PROGRESS'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/competition"
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white flex items-center justify-center space-x-2 transition-all shadow-lg ${
                team
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Zap className="w-5 h-5 text-amber-300" />
              <span>Enter Competition Arena</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/leaderboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl glass-panel-interactive text-slate-200 font-medium flex items-center justify-center space-x-2 border border-slate-700 text-sm"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>View Leaderboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
