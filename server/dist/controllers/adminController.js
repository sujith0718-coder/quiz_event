"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = exports.getSubmissions = void 0;
const Submission_js_1 = require("../models/Submission.js");
const Team_js_1 = require("../models/Team.js");
const Question_js_1 = require("../models/Question.js");
const User_js_1 = require("../models/User.js");
const getSubmissions = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const submissions = await Submission_js_1.Submission.find()
            .populate('teamId', 'name teamCode score')
            .populate('userId', 'name email')
            .populate('questionId', 'title order points type')
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Submission_js_1.Submission.countDocuments();
        return res.json({
            submissions,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch admin submissions' });
    }
};
exports.getSubmissions = getSubmissions;
const getAnalytics = async (req, res) => {
    try {
        const totalTeams = await Team_js_1.Team.countDocuments();
        const totalParticipants = await User_js_1.User.countDocuments({ role: 'PARTICIPANT' });
        const totalQuestions = await Question_js_1.Question.countDocuments();
        const totalSubmissions = await Submission_js_1.Submission.countDocuments();
        const correctSubmissions = await Submission_js_1.Submission.countDocuments({ isCorrect: true });
        const accuracyRate = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;
        // Per-question statistics
        const questions = await Question_js_1.Question.find().sort({ order: 1 });
        const questionStats = await Promise.all(questions.map(async (q) => {
            const qSubmissions = await Submission_js_1.Submission.countDocuments({ questionId: q._id });
            const qCorrect = await Submission_js_1.Submission.countDocuments({ questionId: q._id, isCorrect: true });
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
        }));
        // Top 5 teams preview
        const topTeams = await Team_js_1.Team.find()
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
    }
};
exports.getAnalytics = getAnalytics;
