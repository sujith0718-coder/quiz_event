import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Submission } from '../models/Submission.js';
import { Team } from '../models/Team.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

// ─── Overview ────────────────────────────────────────────────────────────────
export const getOverview = async (req: AuthRequest, res: Response) => {
  try {
    const [totalTeams, totalParticipants, totalQuestions, totalSubmissions, correctSubmissions] =
      await Promise.all([
        Team.countDocuments(),
        User.countDocuments({ role: 'PARTICIPANT' }),
        Question.countDocuments(),
        Submission.countDocuments(),
        Submission.countDocuments({ isCorrect: true }),
      ]);

    const accuracyRate =
      totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;

    const teamsCompleted = await Team.countDocuments({ completedAt: { $exists: true, $ne: null } });

    return res.json({
      totalTeams,
      totalParticipants,
      totalQuestions,
      totalSubmissions,
      correctSubmissions,
      accuracyRate,
      teamsCompleted,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch overview' });
  }
};

// ─── Per-Question Stats (solve rate, attempts, bottleneck score) ──────────────
export const getQuestionStats = async (req: AuthRequest, res: Response) => {
  try {
    const questions = await Question.find().sort({ order: 1 });

    const stats = await Promise.all(
      questions.map(async (q) => {
        // Basic counts
        const [totalAttempts, correctAttempts] = await Promise.all([
          Submission.countDocuments({ questionId: q._id }),
          Submission.countDocuments({ questionId: q._id, isCorrect: true }),
        ]);

        const solveRate =
          totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

        // Average time-to-solve: time between team's first attempt and first correct submission
        const timeToSolveData = await Submission.aggregate([
          { $match: { questionId: q._id } },
          { $sort: { submittedAt: 1 } },
          {
            $group: {
              _id: '$teamId',
              firstAttempt: { $first: '$submittedAt' },
              firstCorrect: {
                $first: {
                  $cond: [{ $eq: ['$isCorrect', true] }, '$submittedAt', null],
                },
              },
            },
          },
          {
            $match: { firstCorrect: { $ne: null } },
          },
          {
            $project: {
              solveTimeMs: { $subtract: ['$firstCorrect', '$firstAttempt'] },
            },
          },
          {
            $group: {
              _id: null,
              avgSolveTimeMs: { $avg: '$solveTimeMs' },
            },
          },
        ]);

        const avgSolveTimeSec =
          timeToSolveData.length > 0
            ? Math.round(timeToSolveData[0].avgSolveTimeMs / 1000)
            : null;

        // Bottleneck score: low solve rate + high time-to-solve → higher = harder
        // Score 0–100: 60% weight on failure rate, 40% weight on relative time
        const failureRate = 100 - solveRate;
        const bottleneckScore = Math.round(failureRate * 0.6 + (avgSolveTimeSec ? Math.min(avgSolveTimeSec / 3, 40) : 40));

        return {
          questionId: q._id,
          title: q.title,
          order: q.order,
          type: q.type,
          points: q.points,
          totalAttempts,
          correctAttempts,
          solveRate,
          avgSolveTimeSec,
          bottleneckScore,
        };
      })
    );

    // Sort by order (natural sequence)
    stats.sort((a, b) => a.order - b.order);
    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch question stats' });
  }
};

// ─── Per-Team Stats (score, solved count, rank) ───────────────────────────────
export const getTeamStats = async (req: AuthRequest, res: Response) => {
  try {
    const teams = await Team.find()
      .populate('leaderId', 'name email')
      .sort({ score: -1, completedAt: 1 });

    const stats = teams.map((team, index) => ({
      teamId: team._id,
      name: team.name,
      teamCode: team.teamCode,
      score: team.score,
      rank: index + 1,
      questionsSolved: team.currentQuestionOrder - 1,
      completedAt: team.completedAt || null,
      memberCount: team.members.length,
    }));

    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch team stats' });
  }
};

// ─── Submission Heatmap (volume bucketed by 5-minute windows) ─────────────────
export const getSubmissionHeatmap = async (req: AuthRequest, res: Response) => {
  try {
    const bucketMinutes = parseInt(req.query.bucketMinutes as string) || 5;
    const bucketMs = bucketMinutes * 60 * 1000;

    const heatmap = await Submission.aggregate([
      {
        $group: {
          _id: {
            $multiply: [
              { $floor: { $divide: [{ $toLong: '$submittedAt' }, bucketMs] } },
              bucketMs,
            ],
          },
          total: { $sum: 1 },
          correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          timestamp: { $toDate: '$_id' },
          total: 1,
          correct: 1,
          incorrect: { $subtract: ['$total', '$correct'] },
        },
      },
    ]);

    return res.json({ bucketMinutes, heatmap });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to build heatmap' });
  }
};

// ─── Full Dashboard (combined for AdminAnalytics page) ───────────────────────
// Keeps backward-compat with existing /admin/analytics shape used by the current frontend
export const getFullDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalTeams,
      totalParticipants,
      totalQuestions,
      totalSubmissions,
      correctSubmissions,
      teamsCompleted,
    ] = await Promise.all([
      Team.countDocuments(),
      User.countDocuments({ role: 'PARTICIPANT' }),
      Question.countDocuments(),
      Submission.countDocuments(),
      Submission.countDocuments({ isCorrect: true }),
      Team.countDocuments({ completedAt: { $exists: true, $ne: null } }),
    ]);

    const accuracyRate =
      totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;

    // Per-question stats (inline for single round-trip)
    const questions = await Question.find().sort({ order: 1 });
    const questionStats = await Promise.all(
      questions.map(async (q) => {
        const [qTotal, qCorrect] = await Promise.all([
          Submission.countDocuments({ questionId: q._id }),
          Submission.countDocuments({ questionId: q._id, isCorrect: true }),
        ]);
        const accuracyRate = qTotal > 0 ? Math.round((qCorrect / qTotal) * 100) : 0;

        const ttData = await Submission.aggregate([
          { $match: { questionId: q._id } },
          { $sort: { submittedAt: 1 } },
          {
            $group: {
              _id: '$teamId',
              firstAttempt: { $first: '$submittedAt' },
              firstCorrect: {
                $first: { $cond: [{ $eq: ['$isCorrect', true] }, '$submittedAt', null] },
              },
            },
          },
          { $match: { firstCorrect: { $ne: null } } },
          { $project: { solveTimeMs: { $subtract: ['$firstCorrect', '$firstAttempt'] } } },
          { $group: { _id: null, avg: { $avg: '$solveTimeMs' } } },
        ]);

        const avgSolveTimeSec = ttData.length > 0 ? Math.round(ttData[0].avg / 1000) : null;
        const bottleneckScore = Math.round(
          (100 - accuracyRate) * 0.6 + (avgSolveTimeSec ? Math.min(avgSolveTimeSec / 3, 40) : 40)
        );

        return {
          questionId: q._id,
          title: q.title,
          order: q.order,
          type: q.type,
          points: q.points,
          totalSubmissions: qTotal,
          correctSubmissions: qCorrect,
          accuracyRate,
          avgSolveTimeSec,
          bottleneckScore,
        };
      })
    );

    // Heatmap (5-min buckets)
    const bucketMs = 5 * 60 * 1000;
    const heatmap = await Submission.aggregate([
      {
        $group: {
          _id: {
            $multiply: [
              { $floor: { $divide: [{ $toLong: '$submittedAt' }, bucketMs] } },
              bucketMs,
            ],
          },
          total: { $sum: 1 },
          correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          timestamp: { $toDate: '$_id' },
          total: 1,
          correct: 1,
          incorrect: { $subtract: ['$total', '$correct'] },
        },
      },
    ]);

    // Top teams
    const topTeams = await Team.find()
      .select('name score completedAt currentQuestionOrder members')
      .sort({ score: -1, completedAt: 1 })
      .limit(5);

    return res.json({
      // Backward-compat shape
      overview: {
        totalTeams,
        totalParticipants,
        totalQuestions,
        totalSubmissions,
        correctSubmissions,
        accuracyRate,
        teamsCompleted,
      },
      questionStats,
      topTeams,
      heatmap,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch analytics dashboard' });
  }
};
