"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = require("../models/User.js");
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        const existingUser = await User_js_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const userRole = role === 'ADMIN' ? 'ADMIN' : 'PARTICIPANT';
        const user = await User_js_1.User.create({
            name,
            email: email.toLowerCase(),
            passwordHash,
            role: userRole,
        });
        const jwtSecret = process.env.JWT_SECRET || 'super_secret_quiz_competition_jwt_key_2026';
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role, email: user.email }, jwtSecret, { expiresIn: '7d' });
        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                teamId: user.teamId,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Server error during registration' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await User_js_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const jwtSecret = process.env.JWT_SECRET || 'super_secret_quiz_competition_jwt_key_2026';
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role, email: user.email }, jwtSecret, { expiresIn: '7d' });
        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                teamId: user.teamId,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Server error during login' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthenticated' });
        }
        const user = await User_js_1.User.findById(req.user.userId).select('-passwordHash').populate('teamId');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ user });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Server error' });
    }
};
exports.getMe = getMe;
