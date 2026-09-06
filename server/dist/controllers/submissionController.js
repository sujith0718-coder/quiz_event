"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamSubmissions = exports.submitAnswer = void 0;
const User_js_1 = require("../models/User.js");
const Team_js_1 = require("../models/Team.js");
const Question_js_1 = require("../models/Question.js");
const Event_js_1 = require("../models/Event.js");
const Submission_js_1 = require("../models/Submission.js");
const socket_js_1 = require("../services/socket.js");
const leaderboardController_js_1 = require("./leaderboardController.js");
const submitAnswer = async (req, res) => {
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
        const user = await User_js_1.User.findById(userId);
        if (!user || !user.teamId) {
            return res.status(400).json({ error: 'Participant must be part of a team to submit answers' });
        }
        const team = await Team_js_1.Team.findById(user.teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        // Step 2: Fetch Target Question
        const question = await Question_js_1.Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        // Step 3: Verify Active Event
        const event = await Event_js_1.Event.findById(question.eventId);
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
        const alreadySolved = await Submission_js_1.Submission.findOne({
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
        const submission = await Submission_js_1.Submission.create({
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
            const nextQuestion = await Question_js_1.Question.findOne({
                eventId: question.eventId,
                order: question.order + 1,
            });
            if (nextQuestion) {
                team.currentQuestionOrder = nextQuestion.order;
                nextQuestionUnlocked = true;
            }
            else {
                // All questions completed! Record overall completion timestamp for tie-breaker
                if (!team.completedAt) {
                    team.completedAt = new Date();
                }
            }
            await team.save();
            // Trigger Real-Time Socket.IO Updates
            const updatedLeaderboard = await (0, leaderboardController_js_1.computeLeaderboard)(question.eventId.toString(), false);
            (0, socket_js_1.emitLeaderboardUpdate)(question.eventId.toString(), updatedLeaderboard);
            if (nextQuestionUnlocked) {
                (0, socket_js_1.emitQuestionUnlocked)(team._id.toString(), {
                    nextOrder: team.currentQuestionOrder,
                    unlockedQuestionId: nextQuestion?._id,
                });
            }
        }
        // Emit live submission to Admin portal
        const populatedSubmission = await Submission_js_1.Submission.findById(submission._id)
            .populate('teamId', 'name teamCode')
            .populate('userId', 'name email')
            .populate('questionId', 'title order points');
        (0, socket_js_1.emitNewSubmission)(populatedSubmission);
        return res.json({
            message: isCorrect ? '🎉 Correct answer!' : '❌ Incorrect answer. Try again!',
            isCorrect,
            pointsAwarded,
            teamScore: team.score,
            currentQuestionOrder: team.currentQuestionOrder,
            nextQuestionUnlocked,
            submissionId: submission._id,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Error processing submission' });
    }
};
exports.submitAnswer = submitAnswer;
const getTeamSubmissions = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User_js_1.User.findById(userId);
        if (!user || !user.teamId) {
            return res.json({ submissions: [] });
        }
        const submissions = await Submission_js_1.Submission.find({ teamId: user.teamId })
            .populate('questionId', 'title order points type')
            .populate('userId', 'name')
            .sort({ submittedAt: -1 });
        return res.json({ submissions });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch team submissions' });
    }
};
exports.getTeamSubmissions = getTeamSubmissions;
