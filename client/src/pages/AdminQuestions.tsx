import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { Code, Plus, Trash2, Edit2, Check, HelpCircle, Key, Layers } from 'lucide-react';

export const AdminQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'MCQ' | 'RIDDLE'>('MCQ');
  const [options, setOptions] = useState<string>('Stack, Queue, Binary Tree, Graph');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [points, setPoints] = useState<number>(10);
  const [order, setOrder] = useState<number>(1);
  const [unlockCondition, setUnlockCondition] = useState('Previous question solved');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQuestions = async () => {
    try {
      const eventRes = await apiRequest('/events/active');
      if (eventRes?.event) {
        setActiveEvent(eventRes.event);
        const qRes = await apiRequest(`/questions/admin?eventId=${eventRes.event._id}`);
        setQuestions(qRes.questions || []);
        if (qRes.questions?.length) {
          setOrder(qRes.questions.length + 1);
        }
      }
    } catch (err) {
      console.error('Error fetching admin questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setType('MCQ');
    setOptions('Stack, Queue, Binary Tree, Graph');
    setCorrectAnswer('');
    setPoints(10);
    setOrder(questions.length + 1);
    setUnlockCondition('Previous question solved');
    setFormOpen(true);
  };

  const handleOpenEdit = (q: any) => {
    setEditingId(q._id);
    setTitle(q.title);
    setDescription(q.description);
    setType(q.type);
    setOptions(q.options?.join(', ') || '');
    setCorrectAnswer(q.correctAnswer);
    setPoints(q.points);
    setOrder(q.order);
    setUnlockCondition(q.unlockCondition || 'Previous question solved');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;

    setActionLoading(true);
    const optionsArray = type === 'MCQ' ? options.split(',').map((s) => s.trim()).filter(Boolean) : [];

    try {
      if (editingId) {
        await apiRequest(`/questions/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title,
            description,
            type,
            options: optionsArray,
            correctAnswer,
            points,
            order,
            unlockCondition,
          }),
        });
      } else {
        await apiRequest('/questions', {
          method: 'POST',
          body: JSON.stringify({
            eventId: activeEvent._id,
            title,
            description,
            type,
            options: optionsArray,
            correctAnswer,
            points,
            order,
            unlockCondition,
          }),
        });
      }

      setFormOpen(false);
      fetchQuestions();
    } catch (err: any) {
      alert(err.message || 'Failed to save question');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await apiRequest(`/questions/${id}`, { method: 'DELETE' });
      fetchQuestions();
    } catch (err: any) {
      alert(err.message || 'Failed to delete question');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span>Loading Question Management System...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
            <Code className="w-8 h-8 text-cyan-400" />
            <span>Question Management</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure MCQs and Riddles for {activeEvent?.name || 'Competition Event'}.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel max-w-2xl w-full p-8 rounded-3xl border border-purple-500/40 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">
                {editingId ? 'Edit Question' : 'Create New Question'}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Data Structures - Queue Mechanics"
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="RIDDLE">RIDDLE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description / Prompt</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter problem prompt or riddle description..."
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                />
              </div>

              {type === 'MCQ' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    MCQ Options (Comma Separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={options}
                    onChange={(e) => setOptions(e.target.value)}
                    placeholder="Stack, Queue, Binary Tree, Graph"
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Secret Correct Answer
                  </label>
                  <input
                    type="text"
                    required
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    placeholder="e.g. Queue"
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Points</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Order Sequence</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30"
                >
                  {actionLoading ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 text-center">Order</th>
                <th className="py-4 px-6">Title & Prompt</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Correct Answer</th>
                <th className="py-4 px-6 text-center">Points</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                    No questions added yet.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 px-6 text-center font-mono font-bold text-indigo-400">
                      #{q.order}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-white text-base">{q.title}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1">
                        {q.description}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        q.type === 'MCQ' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30' : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                      }`}>
                        {q.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-emerald-400 font-bold">
                      🔑 {q.correctAnswer}
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-amber-400">
                      +{q.points} PTS
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(q)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit Question"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q._id)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
