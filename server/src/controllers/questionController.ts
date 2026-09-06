import { Request, Response } from 'express';
import { Question } from '../models/Question.js';
import { Event } from '../models/Event.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { Submission } from '../models/Submission.js';
import { AuthRequest } from '../middleware/auth.js';

// Auto-seed default questions if event has no questions
export const seedQuestionsIfEmpty = async (eventId: string) => {
  const count = await Question.countDocuments({ eventId });
  if (count === 0) {
    console.log(`[Seed] Seeding sample competition questions for event: ${eventId}`);
    await Question.create([
      {
        eventId,
        title: 'Data Structures - Queue Mechanics',
        description: 'Which abstract data structure operates on a First-In, First-Out (FIFO) principle?',
        type: 'MCQ',
        options: ['Stack', 'Queue', 'Binary Tree', 'Graph'],
        correctAnswer: 'Queue',
        points: 10,
        order: 1,
        unlockCondition: 'Round 1 Initial Question',
      },
      {
        eventId,
        title: 'System Design Riddle',
        description: 'I hold keys but no locks. I space out words without moving an inch. I can enter your commands, but I cannot leave your desk. What am I?',
        type: 'RIDDLE',
        options: [],
        correctAnswer: 'Keyboard',
        points: 20,
        order: 2,
        unlockCondition: 'Solve Question 1',
      },
      {
        eventId,
        title: 'Algorithmic Complexity MCQ',
        description: 'What is the tightest worst-case time complexity of lookup in a properly balanced Hash Table (with good hash distribution)?',
        type: 'MCQ',
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
        correctAnswer: 'O(1)',
        points: 15,
        order: 3,
        unlockCondition: 'Solve Question 2',
      },
      {
        eventId,
        title: 'Operating Systems Riddle',
        description: 'I run in the background, consuming memory without UI. I listen for requests and answer them all day long. What server-side process am I?',
        type: 'RIDDLE',
        options: [],
        correctAnswer: 'Daemon',
        points: 25,
        order: 4,
        unlockCondition: 'Solve Question 3',
      },
      {
        eventId,
        title: 'Concurrency & Locking MCQ',
        description: 'Which condition occurs when two or more processes are blocked forever, each waiting for a resource held by the other?',
        type: 'MCQ',
        options: ['Livelock', 'Deadlock', 'Race Condition', 'Starvation'],
        correctAnswer: 'Deadlock',
        points: 30,
        order: 5,
        unlockCondition: 'Solve Question 4',
      },
    ]);
  }
};

export const getQuestionsForAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.query;
    let filter: any = {};
    if (eventId) {
      filter.eventId = eventId;
      await seedQuestionsIfEmpty(eventId as string);
    }
    const questions = await Question.find(filter).sort({ order: 1 });
    return res.json({ questions });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch questions' });
  }
};

// Security enforced question endpoint for participants!
export const getQuestionsForParticipant = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user || !user.teamId) {
      return res.status(400).json({ error: 'You must create or join a team before viewing questions' });
    }

    const team = await Team.findById(user.teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get active event
    let event = await Event.findOne({ status: 'LIVE' });
    if (!event) {
      event = await Event.findOne().sort({ createdAt: -1 });
    }

    if (!event) {
      return res.status(404).json({ error: 'No active competition event found' });
    }

    await seedQuestionsIfEmpty(event._id.toString());

    const allEventQuestions = await Question.find({ eventId: event._id }).sort({ order: 1 });

    // Fetch team's solved submissions
    const solvedSubmissions = await Submission.find({
      teamId: team._id,
      isCorrect: true,
    });
    const solvedQuestionIds = new Set(solvedSubmissions.map((s) => s.questionId.toString()));

    // Filter questions: Only reveal unlocked questions (order <= team.currentQuestionOrder)
    // CRITICAL SECURITY RULE: Strip `correctAnswer` before sending to participant!
    const unlockedQuestions = allEventQuestions.map((q) => {
      const isUnlocked = q.order <= team.currentQuestionOrder;
      const isSolved = solvedQuestionIds.has(q._id.toString());

      return {
        _id: q._id,
        eventId: q.eventId,
        title: q.title,
        description: isUnlocked ? q.description : '🔒 Question locked. Solve previous questions to unlock.',
        type: q.type,
        options: isUnlocked ? q.options : [],
        points: q.points,
        order: q.order,
        unlockCondition: q.unlockCondition,
        isUnlocked,
        isSolved,
        isCurrent: q.order === team.currentQuestionOrder,
        // Notice: correctAnswer is INTENTIONALLY OMITTED for security!
      };
    });

    return res.json({
      eventId: event._id,
      eventStatus: event.status,
      teamCurrentOrder: team.currentQuestionOrder,
      teamScore: team.score,
      completedAt: team.completedAt,
      questions: unlockedQuestions,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch participant questions' });
  }
};

export const createQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, title, description, type, options, correctAnswer, points, order, unlockCondition } = req.body;

    if (!eventId || !title || !description || !type || !correctAnswer || order === undefined) {
      return res.status(400).json({ error: 'Missing required question parameters' });
    }

    const question = await Question.create({
      eventId,
      title: title.trim(),
      description: description.trim(),
      type,
      options: type === 'MCQ' ? options || [] : [],
      correctAnswer: correctAnswer.trim(),
      points: Number(points) || 10,
      order: Number(order),
      unlockCondition: unlockCondition || 'Previous question solved',
    });

    return res.status(201).json({ message: 'Question created successfully', question });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create question' });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const question = await Question.findByIdAndUpdate(id, updateData, { new: true });
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    return res.json({ message: 'Question updated successfully', question });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update question' });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    return res.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete question' });
  }
};
