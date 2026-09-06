import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { Radio, Play, Square, Snowflake, Plus, Check } from 'lucide-react';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      const data = await apiRequest('/events');
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });
      setName('');
      setDescription('');
      fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Error creating event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (eventId: string, status: string) => {
    setActionLoading(true);
    try {
      await apiRequest(`/events/${eventId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Error updating event status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFreeze = async (eventId: string) => {
    setActionLoading(true);
    try {
      await apiRequest(`/events/${eventId}/freeze`, {
        method: 'PUT',
      });
      fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Error toggling freeze state');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span>Loading Events & Round Control...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
          <Radio className="w-8 h-8 text-rose-400" />
          <span>Events & Round Control</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Open or close competition rounds, manage events, and freeze/unfreeze real-time standings.
        </p>
      </div>

      {/* Create Event Box */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Plus className="w-5 h-5 text-purple-400" />
          <span>Create Competition Event</span>
        </h3>
        <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Event Name (e.g. Systems Design Hackathon 2026)"
            className="px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description / Instructions"
            className="px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={actionLoading}
            className="py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2"
          >
            <span>{actionLoading ? 'Creating...' : 'Create Event'}</span>
          </button>
        </form>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">All Events ({events.length})</h3>
        <div className="grid grid-cols-1 gap-4">
          {events.map((e) => (
            <div
              key={e._id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div>
                <div className="flex items-center space-x-3">
                  <h4 className="text-xl font-bold text-white">{e.name}</h4>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                      e.status === 'LIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : e.status === 'COMPLETED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {e.status}
                  </span>
                  {e.isFrozen && (
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center space-x-1">
                      <Snowflake className="w-3 h-3 text-cyan-300" />
                      <span>STANDINGS FROZEN</span>
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mt-1">{e.description || 'No description provided.'}</p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {e.status !== 'LIVE' ? (
                  <button
                    onClick={() => handleUpdateStatus(e._id, 'LIVE')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Round</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(e._id, 'COMPLETED')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>End Round</span>
                  </button>
                )}

                <button
                  onClick={() => handleToggleFreeze(e._id)}
                  disabled={actionLoading}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                    e.isFrozen
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Snowflake className="w-4 h-4" />
                  <span>{e.isFrozen ? 'Unfreeze Standings' : 'Freeze Standings'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
