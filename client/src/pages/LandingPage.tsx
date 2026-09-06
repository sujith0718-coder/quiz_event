import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Zap, Trophy, Users, Shield, Cpu, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono mb-8 animate-pulse">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>REAL-TIME QUIZ & RIDDLE ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Next-Gen Real-Time <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
              Quiz & Riddle Competitions
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Form engineering teams, tackle sequential system design riddles, track live Socket.IO rankings, and experience automated server-side evaluation.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Register Participant Team</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel-interactive text-slate-200 font-semibold flex items-center justify-center space-x-2 border border-slate-700"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          {/* Quick Features Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Team Collaboration</h3>
              <p className="text-slate-400 text-sm">
                Create custom teams with unique 6-character Team Codes. Team members collaborate to submit answers together.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Progressive Unlocking</h3>
              <p className="text-slate-400 text-sm">
                Strict server-enforced sequential question unlocking. Solve current MCQs and riddles to unlock the next challenge.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Live Socket.IO Leaderboard</h3>
              <p className="text-slate-400 text-sm">
                Instant real-time rank updates with total score priority and earliest completion time tie-breaker. Supports Leaderboard Freeze!
              </p>
            </div>
          </div>

          {/* Highlights checklist */}
          <div className="mt-16 glass-panel p-8 rounded-3xl border border-slate-800 text-left max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>Core System & Security Guarantee</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>JWT Authentication & bcrypt Password Hashing</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>Role-Based Access Control (ADMIN / PARTICIPANT)</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>Confidential Server-Side Answer Key Evaluation</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>Duplicate Scoring Prevention & Transactional Guard</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>AI-Assisted Hint Engine for Complex Riddles</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>Real-Time Admin Live Submission Stream</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
