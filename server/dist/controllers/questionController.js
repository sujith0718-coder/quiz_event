"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuestion = exports.updateQuestion = exports.createQuestion = exports.getQuestionsForParticipant = exports.getQuestionsForAdmin = exports.seedQuestionsIfEmpty = void 0;
const Question_js_1 = require("../models/Question.js");
const Event_js_1 = require("../models/Event.js");
const Team_js_1 = require("../models/Team.js");
const User_js_1 = require("../models/User.js");
const Submission_js_1 = require("../models/Submission.js");
// Auto-seed default questions if event has no questions
const seedQuestionsIfEmpty = async (eventId) => {
    const count = await Question_js_1.Question.countDocuments({ eventId });
    if (count === 0) {
        console.log(`[Seed] Seeding sample competition questions for event: ${eventId}`);
        await Question_js_1.Question.create([
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
exports.seedQuestionsIfEmpty = seedQuestionsIfEmpty;
const getQuestionsForAdmin = async (req, res) => {
    try {
        const { eventId } = req.query;
        let filter = {};
        if (eventId) {
            filter.eventId = eventId;
            await (0, exports.seedQuestionsIfEmpty)(eventId);
        }
        const questions = await Question_js_1.Question.find(filter).sort({ order: 1 });
        return res.json({ questions });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch questions' });
    }
};
exports.getQuestionsForAdmin = getQuestionsForAdmin;
// Security enforced question endpoint for participants!
const getQuestionsForParticipant = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User_js_1.User.findById(userId);
        if (!user || !user.teamId) {
            return res.status(400).json({ error: 'You must create or join a team before viewing questions' });
        }
        const team = await Team_js_1.Team.findById(user.teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        // Get active event
        let event = await Event_js_1.Event.findOne({ status: 'LIVE' });
        if (!event) {
            event = await Event_js_1.Event.findOne().sort({ createdAt: -1 });
        }
        if (!event) {
            return res.status(404).json({ error: 'No active competition event found' });
        }
        await (0, exports.seedQuestionsIfEmpty)(event._id.toString());
        const allEventQuestions = await Question_js_1.Question.find({ eventId: event._id }).sort({ order: 1 });
        // Fetch team's solved submissions
        const solvedSubmissions = await Submission_js_1.Submission.find({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch participant questions' });
    }
};
exports.getQuestionsForParticipant = getQuestionsForParticipant;
const createQuestion = async (req, res) => {
    try {
        const { eventId, title, description, type, options, correctAnswer, points, order, unlockCondition } = req.body;
        if (!eventId || !title || !description || !type || !correctAnswer || order === undefined) {
            return res.status(400).json({ error: 'Missing required question parameters' });
        }
        const question = await Question_js_1.Question.create({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to create question' });
    }
};
exports.createQuestion = createQuestion;
const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const question = await Question_js_1.Question.findByIdAndUpdate(id, updateData, { new: true });
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        return res.json({ message: 'Question updated successfully', question });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to update question' });
    }
};
exports.updateQuestion = updateQuestion;
const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await Question_js_1.Question.findByIdAndDelete(id);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        return res.json({ message: 'Question deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to delete question' });
    }
};
exports.deleteQuestion = deleteQuestion;
