import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext.js';
import { apiRequest } from '../api/client.js';
import confetti from 'canvas-confetti';
import { Zap, CheckCircle2, Lock, Lightbulb, AlertCircle, Send, Trophy, Sparkles, Award } from 'lucide-react';

export const CompetitionPage: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [teamScore, setTeamScore] = useState<number>(0);
  const [currentOrder, setCurrentOrder] = useState<number>(1);
  const [eventStatus, setEventStatus] = useState<string>('UPCOMING');
  const [eventId, setEventId] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  // Active question form state
  const [selectedMcqAnswer, setSelectedMcqAnswer] = useState<string>('');
  const [riddleAnswer, setRiddleAnswer] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // AI Hint Modal State
  const [hintModalOpen, setHintModalOpen] = useState<boolean>(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const { socket, joinTeamRoom, joinEventRoom } = useSocket();

  const fetchCompetitionState = async () => {
    try {
      const data = await apiRequest('/questions/participant');
      setQuestions(data.questions || []);
      setTeamScore(data.teamScore || 0);
      setCurrentOrder(data.teamCurrentOrder || 1);
      setEventStatus(data.eventStatus || 'LIVE');
      setEventId(data.eventId);
      setCompletedAt(data.completedAt || null);

      if (data.eventId) joinEventRoom(data.eventId);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to load competition arena questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitionState();
  }, []);

  // Listen for real-time WebSocket unlock & round status updates
  useEffect(() => {
    if (!socket) return;

    const handleQuestionUnlocked = (data: any) => {
      console.log('[Socket.IO] Real-time question unlocked:', data);
      fetchCompetitionState();
    };

    const handleRoundChanged = (data: any) => {
      console.log('[Socket.IO] Real-time round changed:', data);
      setEventStatus(data.status);
      fetchCompetitionState();
    };

    socket.on('question:unlocked', handleQuestionUnlocked);
    socket.on('round:changed', handleRoundChanged);

    return () => {
      socket.off('question:unlocked', handleQuestionUnlocked);
      socket.off('round:changed', handleRoundChanged);
    };
  }, [socket]);

  const activeQuestion = questions.find((q) => q.order === currentOrder && q.isUnlocked);
  const isAllCompleted = questions.length > 0 && questions.every((q) => q.isSolved);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuestion) return;

    const answerToSubmit = activeQuestion.type === 'MCQ' ? selectedMcqAnswer : riddleAnswer;
    if (!answerToSubmit || !answerToSubmit.trim()) {
      setSubmitError('Please select or type an answer before submitting.');
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(null);
    setSubmitting(true);

    try {
      const res = await apiRequest('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          questionId: activeQuestion._id,
          answer: answerToSubmit,
        }),
      });

      if (res.isCorrect) {
        setSubmitSuccess(`🎉 Correct! +${res.pointsAwarded} PTS awarded.`);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setSelectedMcqAnswer('');
        setRiddleAnswer('');
        fetchCompetitionState();
      } else {
        setSubmitError('❌ Incorrect answer. Review the question and try again!');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAIHint = async () => {
    if (!activeQuestion) return;
    setHintModalOpen(true);
    setHintLoading(true);
    setHintText(null);

    try {
      const data = await apiRequest('/ai/hint', {
        method: 'POST',
        body: JSON.stringify({ questionId: activeQuestion._id }),
      });
      setHintText(data.hint);
    } catch (err: any) {
      setHintText('Hint service temporarily unavailable. Think about the fundamental concepts!');
    } finally {
      setHintLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span>Syncing Real-Time Competition Arena...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Arena Top Header */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-white">Competition Arena</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                eventStatus === 'LIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              }`}>
                {eventStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Progressive question unlocking with instant evaluation</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Team Score</div>
            <div className="text-xl font-extrabold text-amber-400">{teamScore} PTS</div>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Active Level</div>
            <div className="text-xl font-extrabold text-indigo-400">Question #{currentOrder}</div>
          </div>
        </div>
      </div>

      {/* Sequential Progressive Stepper Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4">
          Progressive Sequence Status ({questions.filter((q) => q.isSolved).length} / {questions.length} Solved)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {questions.map((q) => {
            const isCurrent = q.order === currentOrder;
            const isSolved = q.isSolved;
            const isUnlocked = q.isUnlocked;

            return (
              <div
                key={q._id}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
                  isSolved
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : isCurrent
                    ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-lg shadow-indigo-500/20 glow-border'
                    : isUnlocked
                    ? 'bg-slate-900/50 border-slate-700 text-slate-300'
                    : 'bg-slate-950/80 border-slate-900 text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-1 font-mono text-xs">
                  <span>Q{q.order}</span>
                  {isSolved ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isUnlocked ? (
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
                <div className="text-[11px] font-bold truncate max-w-full">
                  {isSolved ? 'SOLVED' : isCurrent ? 'CURRENT' : isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">+{q.points} PTS</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Challenge Arena Area */}
      {isAllCompleted ? (
        <div className="glass-panel p-12 rounded-3xl border border-emerald-500/30 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
            <Trophy className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">🏆 All Challenges Solved!</h2>
          <p className="text-slate-300 max-w-md mx-auto">
            Congratulations! Your team has successfully solved every question in the competition arena.
          </p>
          <div className="inline-block px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-amber-400 font-mono text-lg font-bold">
            FINAL SCORE: {teamScore} PTS
          </div>
        </div>
      ) : activeQuestion ? (
        <div className="glass-panel p-8 rounded-3xl border border-indigo-500/30 space-y-6 relative overflow-hidden">
          {/* Question Title & Info Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-bold">
                  QUESTION {activeQuestion.order} of {questions.length}
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold uppercase">
                  {activeQuestion.type}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-2">{activeQuestion.title}</h2>
            </div>

            <div className="flex items-center space-x-3">
              <span className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-sm">
                +{activeQuestion.points} PTS
              </span>
              <button
                onClick={fetchAIHint}
                className="px-4 py-2 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-sm font-semibold flex items-center space-x-2 transition-colors"
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Need a Hint?</span>
              </button>
            </div>
          </div>

          {/* Question Prompt Description */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 text-base leading-relaxed font-mono">
            {activeQuestion.description}
          </div>

          {submitError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Answer Form */}
          <form onSubmit={handleSubmitAnswer} className="space-y-6 pt-2">
            {activeQuestion.type === 'MCQ' ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select the Correct Option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeQuestion.options?.map((opt: string, idx: number) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = selectedMcqAnswer === opt;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedMcqAnswer(opt)}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {letter}
                        </span>
                        <span className="font-medium text-sm">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Type Your Answer below
                </label>
                <input
                  type="text"
                  required
                  value={riddleAnswer}
                  onChange={(e) => setRiddleAnswer(e.target.value)}
                  placeholder="e.g. Keyboard"
                  className="w-full px-5 py-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-base"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || eventStatus !== 'LIVE'}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 text-base disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              <span>{submitting ? 'Evaluating Server Answer...' : 'Submit Answer'}</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center text-slate-400">
          No question currently unlocked.
        </div>
      )}

      {/* AI Hint Modal */}
      {hintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel max-w-lg w-full p-6 rounded-3xl border border-purple-500/40 shadow-2xl relative space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">AI Assistant Hint</h3>
                <p className="text-xs text-slate-400">Subtle clues generated by Gemini AI</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 min-h-[80px] flex items-center">
              {hintLoading ? (
                <div className="flex items-center space-x-3 text-slate-400 text-sm">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Consulting Gemini AI model for non-spoiler hint...</span>
                </div>
              ) : (
                <p className="text-slate-200 text-sm leading-relaxed font-mono">{hintText}</p>
              )}
            </div>

            <button
              onClick={() => setHintModalOpen(false)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
            >
              Close Hint
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
