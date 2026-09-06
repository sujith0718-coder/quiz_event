import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Submission } from '../models/Submission.js';
import { Team } from '../models/Team.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';

export const getSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    const submissions = await Submission.find()
      .populate('teamId', 'name teamCode score')
      .populate('userId', 'name email')
      .populate('questionId', 'title order points type')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Submission.countDocuments();

    return res.json({
      submissions,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch admin submissions' });
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const totalTeams = await Team.countDocuments();
    const totalParticipants = await User.countDocuments({ role: 'PARTICIPANT' });
    const totalQuestions = await Question.countDocuments();
    const totalSubmissions = await Submission.countDocuments();
    const correctSubmissions = await Submission.countDocuments({ isCorrect: true });

    const accuracyRate = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;

    // Per-question statistics
    const questions = await Question.find().sort({ order: 1 });
    const questionStats = await Promise.all(
      questions.map(async (q) => {
        const qSubmissions = await Submission.countDocuments({ questionId: q._id });
        const qCorrect = await Submission.countDocuments({ questionId: q._id, isCorrect: true });
        const qAccuracy = qSubmissions > 0 ? Math.round((qCorrect / qSubmissions) * 100) : 0;
        return {
          questionId: q._id,
          title: q.title,
          order: q.order,
          type: q.type,
          points: q.points,
          totalSubmissions: qSubmissions,
          correctSubmissions: qCorrect,
          accuracyRate: qAccuracy,
        };
      })
    );

    // Top 5 teams preview
    const topTeams = await Team.find()
      .select('name score completedAt currentQuestionOrder')
      .sort({ score: -1, completedAt: 1 })
      .limit(5);

    return res.json({
      overview: {
        totalTeams,
        totalParticipants,
        totalQuestions,
        totalSubmissions,
        correctSubmissions,
        accuracyRate,
      },
      questionStats,
      topTeams,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
};
