import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { Trophy, Shield, Users, LogOut, Code, Zap, BarChart2, Radio } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                CodeArena
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                LIVE
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {user && (
              <>
                <Link
                  to={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    isActive(user.role === 'ADMIN' ? '/admin' : '/dashboard')
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {user.role === 'PARTICIPANT' && (
                  <>
                    <Link
                      to="/team"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                        isActive('/team')
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>My Team</span>
                    </Link>

                    <Link
                      to="/competition"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                        isActive('/competition')
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Quiz Arena</span>
                    </Link>
                  </>
                )}

                <Link
                  to="/leaderboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    isActive('/leaderboard')
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>Leaderboard</span>
                </Link>

                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin/events"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                        isActive('/admin/events')
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Radio className="w-4 h-4 text-rose-400" />
                      <span>Events & Rounds</span>
                    </Link>
                    <Link
                      to="/admin/questions"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                        isActive('/admin/questions')
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Code className="w-4 h-4 text-cyan-400" />
                      <span>Questions</span>
                    </Link>
                    <Link
                      to="/admin/submissions"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                        isActive('/admin/submissions')
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Submissions</span>
                    </Link>
                    <Link
                      to="/admin/analytics"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                        isActive('/admin/analytics')
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <BarChart2 className="w-4 h-4 text-blue-400" />
                      <span>Analytics</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right Action Menu */}
          <div className="flex items-center space-x-3">
            {/* Live Socket Status Dot */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
                isConnected
                  ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-950/50 text-rose-400 border-rose-500/30'
              }`}
              title={isConnected ? 'Real-Time WebSocket Sync Active' : 'WebSocket Disconnected'}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
              <span className="hidden sm:inline">{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
            </div>

            {user ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-white">{user.name}</div>
                  <div className="text-xs text-slate-400 flex items-center justify-end space-x-1">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-600/30"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
