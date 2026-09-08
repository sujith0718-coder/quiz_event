import { Request, Response } from 'express';
import { Team } from '../models/Team.js';
import { Event } from '../models/Event.js';
import { Question } from '../models/Question.js';
import { AuthRequest } from '../middleware/auth.js';

export const computeLeaderboard = async (eventId: string, isParticipant: boolean = false) => {
  const event = await Event.findById(eventId);
  const totalQuestions = await Question.countDocuments({ eventId });

  // Fetch all teams sorted by Score DESC, then completedAt ASC (nulls last), then createdAt ASC
  const teams = await Team.find()
    .select('name teamCode score completedAt currentQuestionOrder members createdAt')
    .populate('members', 'name')
    .sort({ score: -1, completedAt: 1, createdAt: 1 });

  const formattedRankings = teams.map((team: any, index: number) => {
    const solvedCount = Math.max(0, team.currentQuestionOrder - 1);
    return {
      rank: index + 1,
      teamId: team._id,
      teamName: team.name,
      teamCode: team.teamCode,
      members: team.members.map((m: any) => m.name),
      score: team.score,
      solvedCount,
      totalQuestions,
      completedAt: team.completedAt || null,
    };
  });

  const isFrozen = event?.isFrozen || false;

  return {
    eventId,
    eventName: event?.name || 'Competition Event',
    eventStatus: event?.status || 'UPCOMING',
    isFrozen,
    updatedAt: new Date(),
    rankings: formattedRankings,
  };
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    let { eventId } = req.params;

    if (!eventId || eventId === 'active') {
      let activeEvent = await Event.findOne({ status: 'LIVE' });
      if (!activeEvent) {
        activeEvent = await Event.findOne().sort({ createdAt: -1 });
      }
      if (!activeEvent) {
        return res.status(404).json({ error: 'No active event found' });
      }
      eventId = activeEvent._id.toString();
    }

    const isParticipant = req.user?.role !== 'ADMIN';
    const leaderboardData = await computeLeaderboard(eventId, isParticipant);

    return res.json(leaderboardData);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch leaderboard' });
  }
};
