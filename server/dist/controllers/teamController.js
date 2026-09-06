"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTeams = exports.getMyTeam = exports.joinTeam = exports.createTeam = void 0;
const Team_js_1 = require("../models/Team.js");
const User_js_1 = require("../models/User.js");
// Generate unique 6-character code e.g. CW7K92
const generateTeamCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like 0, O, 1, I
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
const createTeam = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user?.userId;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Team name is required' });
        }
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User_js_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.teamId) {
            return res.status(400).json({ error: 'User is already a member of a team' });
        }
        const existingTeamName = await Team_js_1.Team.findOne({ name: name.trim() });
        if (existingTeamName) {
            return res.status(400).json({ error: 'A team with this name already exists' });
        }
        // Generate unique teamCode
        let teamCode = generateTeamCode();
        let isUnique = false;
        while (!isUnique) {
            const existing = await Team_js_1.Team.findOne({ teamCode });
            if (!existing) {
                isUnique = true;
            }
            else {
                teamCode = generateTeamCode();
            }
        }
        const team = await Team_js_1.Team.create({
            name: name.trim(),
            teamCode,
            leaderId: userId,
            members: [userId],
            score: 0,
            currentQuestionOrder: 1,
        });
        user.teamId = team._id;
        await user.save();
        const populatedTeam = await Team_js_1.Team.findById(team._id).populate('members', 'name email role');
        return res.status(201).json({
            message: 'Team created successfully',
            team: populatedTeam,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Error creating team' });
    }
};
exports.createTeam = createTeam;
const joinTeam = async (req, res) => {
    try {
        const { teamCode } = req.body;
        const userId = req.user?.userId;
        if (!teamCode || !teamCode.trim()) {
            return res.status(400).json({ error: 'Team code is required' });
        }
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User_js_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.teamId) {
            return res.status(400).json({ error: 'You are already a member of a team' });
        }
        const team = await Team_js_1.Team.findOne({ teamCode: teamCode.trim().toUpperCase() });
        if (!team) {
            return res.status(404).json({ error: 'Invalid Team Code. Team not found.' });
        }
        // Add user to team if not already present
        if (!team.members.includes(user._id)) {
            team.members.push(user._id);
            await team.save();
        }
        user.teamId = team._id;
        await user.save();
        const populatedTeam = await Team_js_1.Team.findById(team._id).populate('members', 'name email role');
        return res.json({
            message: 'Joined team successfully',
            team: populatedTeam,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Error joining team' });
    }
};
exports.joinTeam = joinTeam;
const getMyTeam = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User_js_1.User.findById(userId);
        if (!user || !user.teamId) {
            return res.status(404).json({ error: 'Not in a team' });
        }
        const team = await Team_js_1.Team.findById(user.teamId).populate('members', 'name email role');
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        return res.json({ team });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Error fetching team' });
    }
};
exports.getMyTeam = getMyTeam;
const getAllTeams = async (req, res) => {
    try {
        const teams = await Team_js_1.Team.find().populate('members', 'name email').sort({ score: -1, completedAt: 1 });
        return res.json({ teams });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Error fetching teams' });
    }
};
exports.getAllTeams = getAllTeams;
