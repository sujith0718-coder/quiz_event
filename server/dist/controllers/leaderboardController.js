"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.computeLeaderboard = void 0;
const Team_js_1 = require("../models/Team.js");
const Event_js_1 = require("../models/Event.js");
const Question_js_1 = require("../models/Question.js");
const computeLeaderboard = async (eventId, isParticipant = false) => {
    const event = await Event_js_1.Event.findById(eventId);
    const totalQuestions = await Question_js_1.Question.countDocuments({ eventId });
    // Fetch all teams sorted by Score DESC, then completedAt ASC (nulls last), then createdAt ASC
    const teams = await Team_js_1.Team.find()
        .select('name teamCode score completedAt currentQuestionOrder members createdAt')
        .populate('members', 'name')
        .sort({ score: -1, completedAt: 1, createdAt: 1 });
    const formattedRankings = teams.map((team, index) => {
        const solvedCount = Math.max(0, team.currentQuestionOrder - 1);
        return {
            rank: index + 1,
            teamId: team._id,
            teamName: team.name,
            teamCode: team.teamCode,
            members: team.members.map((m) => m.name),
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
exports.computeLeaderboard = computeLeaderboard;
const getLeaderboard = async (req, res) => {
    try {
        let { eventId } = req.params;
        if (!eventId || eventId === 'active') {
            let activeEvent = await Event_js_1.Event.findOne({ status: 'LIVE' });
            if (!activeEvent) {
                activeEvent = await Event_js_1.Event.findOne().sort({ createdAt: -1 });
            }
            if (!activeEvent) {
                return res.status(404).json({ error: 'No active event found' });
            }
            eventId = activeEvent._id.toString();
        }
        const isParticipant = req.user?.role !== 'ADMIN';
        const leaderboardData = await (0, exports.computeLeaderboard)(eventId, isParticipant);
        return res.json(leaderboardData);
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch leaderboard' });
    }
};
exports.getLeaderboard = getLeaderboard;
