import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Question } from '../models/Question.js';
import { Event } from '../models/Event.js';
import { Submission } from '../models/Submission.js';
import { emitLeaderboardUpdate, emitNewSubmission, emitQuestionUnlocked } from '../services/socket.js';
import { computeLeaderboard } from './leaderboardController.js';

export const submitAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { questionId, answer } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    if (!questionId || answer === undefined || answer === null || answer.toString().trim() === '') {
      return res.status(400).json({ error: 'Question ID and answer are required' });
    }

    // Step 1: User & Team Verification
    const user = await User.findById(userId);
    if (!user || !user.teamId) {
      return res.status(400).json({ error: 'Participant must be part of a team to submit answers' });
    }

    const team = await Team.findById(user.teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Step 2: Fetch Target Question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Step 3: Verify Active Event
    const event = await Event.findById(question.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Associated competition event not found' });
    }

    if (event.status !== 'LIVE') {
      return res.status(400).json({ error: `Submissions are closed. Competition event is currently ${event.status}.` });
    }

    // Step 4: Progressive Unlocking Backend Enforcement
    if (question.order > team.currentQuestionOrder) {
      return res.status(403).json({
        error: `Forbidden: Question #${question.order} is currently locked for your team. You must solve Question #${team.currentQuestionOrder} first.`,
      });
    }

    // Step 5: Duplicate Solving Guard
    const alreadySolved = await Submission.findOne({
      teamId: team._id,
      questionId: question._id,
      isCorrect: true,
    });

    if (alreadySolved) {
      return res.status(400).json({ error: 'Your team has already solved this question.' });
    }

    // Step 6: Automated Answer Evaluation
    const normalizedSubmitted = answer.toString().trim().toLowerCase();
    const normalizedCorrect = question.correctAnswer.trim().toLowerCase();
    const isCorrect = normalizedSubmitted === normalizedCorrect;

    const pointsAwarded = isCorrect ? question.points : 0;

    // Step 7: Record Submission
    const submission = await Submission.create({
      teamId: team._id,
      userId: user._id,
      questionId: question._id,
      answer: answer.toString().trim(),
      isCorrect,
      pointsAwarded,
      submittedAt: new Date(),
    });

    let nextQuestionUnlocked = false;

    // Step 8: Update Team State on Correct Submission
    if (isCorrect) {
      team.score += pointsAwarded;

      // Check if there is a next question
      const nextQuestion = await Question.findOne({
        eventId: question.eventId,
        order: question.order + 1,
      });

      if (nextQuestion) {
        team.currentQuestionOrder = nextQuestion.order;
        nextQuestionUnlocked = true;
      } else {
        // All questions completed! Record overall completion timestamp for tie-breaker
        if (!team.completedAt) {
          team.completedAt = new Date();
        }
      }

      await team.save();

      // Trigger Real-Time Socket.IO Updates
      const updatedLeaderboard = await computeLeaderboard(question.eventId.toString(), false);
      emitLeaderboardUpdate(question.eventId.toString(), updatedLeaderboard);

      if (nextQuestionUnlocked) {
        emitQuestionUnlocked(team._id.toString(), {
          nextOrder: team.currentQuestionOrder,
          unlockedQuestionId: nextQuestion?._id,
        });
      }
    }

    // Emit live submission to Admin portal
    const populatedSubmission = await Submission.findById(submission._id)
      .populate('teamId', 'name teamCode')
      .populate('userId', 'name email')
      .populate('questionId', 'title order points');

    emitNewSubmission(populatedSubmission);

    return res.json({
      message: isCorrect ? '🎉 Correct answer!' : '❌ Incorrect answer. Try again!',
      isCorrect,
      pointsAwarded,
      teamScore: team.score,
      currentQuestionOrder: team.currentQuestionOrder,
      nextQuestionUnlocked,
      submissionId: submission._id,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error processing submission' });
  }
};

export const getTeamSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user || !user.teamId) {
      return res.json({ submissions: [] });
    }

    const submissions = await Submission.find({ teamId: user.teamId })
      .populate('questionId', 'title order points type')
      .populate('userId', 'name')
      .sort({ submittedAt: -1 });

    return res.json({ submissions });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch team submissions' });
  }
};
