import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext.js';
import { apiRequest } from '../api/client.js';
import { Shield, Radio, CheckCircle2, XCircle, RefreshCw, Clock } from 'lucide-react';

export const AdminSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [liveStreamActive, setLiveStreamActive] = useState<boolean>(true);

  const { socket, joinAdminRoom } = useSocket();

  const fetchSubmissions = async () => {
    try {
      const data = await apiRequest('/admin/submissions?limit=50');
      setSubmissions(data.submissions || []);
      setTotal(data.total || 0);
      joinAdminRoom();
    } catch (err) {
      console.error('Failed to fetch admin submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Listen for real-time WebSocket submission events
  useEffect(() => {
    if (!socket) return;

    const handleNewSubmission = (newSub: any) => {
      console.log('[Socket.IO] New real-time submission stream event:', newSub);
      setSubmissions((prev) => [newSub, ...prev.slice(0, 49)]);
      setTotal((prev) => prev + 1);
    };

    socket.on('submission:new', handleNewSubmission);

    return () => {
      socket.off('submission:new', handleNewSubmission);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span>Connecting to Live Submission Stream...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-8 rounded-3xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono mb-3">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
            <span>REAL-TIME SUBMISSION STREAM ({total} TOTAL)</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Submission Monitoring</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time audit log of team answer attempts, evaluation results, and timestamp logs.
          </p>
        </div>

        <button
          onClick={fetchSubmissions}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono text-xs flex items-center space-x-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Submissions Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Team</th>
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Question</th>
                <th className="py-4 px-6">Submitted Answer</th>
                <th className="py-4 px-6 text-center">Result</th>
                <th className="py-4 px-6 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                    No submissions recorded yet. Submissions will stream in real-time.
                  </td>
                </tr>
              ) : (
                submissions.map((sub: any) => (
                  <tr key={sub._id} className="hover:bg-slate-900/50 transition-colors font-mono">
                    <td className="py-4 px-6 text-xs text-slate-400 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(sub.submittedAt).toLocaleTimeString()}</span>
                    </td>

                    <td className="py-4 px-6 font-sans">
                      <div className="font-bold text-white text-sm">{sub.teamId?.name || 'Unknown Team'}</div>
                      <div className="text-xs text-slate-500 font-mono">CODE: {sub.teamId?.teamCode}</div>
                    </td>

                    <td className="py-4 px-6 font-sans text-xs text-slate-300">
                      {sub.userId?.name || 'Participant'}
                    </td>

                    <td className="py-4 px-6 font-sans text-xs">
                      <span className="text-slate-300 font-medium">{sub.questionId?.title || 'Question'}</span>
                      <span className="text-slate-500 font-mono ml-2">#{sub.questionId?.order}</span>
                    </td>

                    <td className="py-4 px-6 text-xs text-indigo-300 max-w-xs truncate font-mono">
                      "{sub.answer}"
                    </td>

                    <td className="py-4 px-6 text-center">
                      {sub.isCorrect ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>CORRECT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>INCORRECT</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right font-bold text-amber-400 font-mono">
                      +{sub.pointsAwarded} PTS
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
