"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_js_1 = require("./config/db.js");
const socket_js_1 = require("./services/socket.js");
const User_js_1 = require("./models/User.js");
const Event_js_1 = require("./models/Event.js");
const questionController_js_1 = require("./controllers/questionController.js");
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const teamRoutes_js_1 = __importDefault(require("./routes/teamRoutes.js"));
const eventRoutes_js_1 = __importDefault(require("./routes/eventRoutes.js"));
const questionRoutes_js_1 = __importDefault(require("./routes/questionRoutes.js"));
const submissionRoutes_js_1 = __importDefault(require("./routes/submissionRoutes.js"));
const leaderboardRoutes_js_1 = __importDefault(require("./routes/leaderboardRoutes.js"));
const adminRoutes_js_1 = __importDefault(require("./routes/adminRoutes.js"));
const aiRoutes_js_1 = __importDefault(require("./routes/aiRoutes.js"));
const analyticsRoutes_js_1 = __importDefault(require("./routes/analyticsRoutes.js"));
const hintRoutes_js_1 = __importDefault(require("./routes/hintRoutes.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
// CORS & Middleware
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.options('*', (0, cors_1.default)());
app.use(express_1.default.json());
// Initialize Socket.IO
(0, socket_js_1.initSocketServer)(httpServer, CLIENT_URL);
// Auto-seed admin user & initial event
let isSeeded = false;
const seedDefaultData = async () => {
    if (isSeeded)
        return;
    try {
        const adminCount = await User_js_1.User.countDocuments({ role: 'ADMIN' });
        if (adminCount === 0) {
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash('admin123', salt);
            await User_js_1.User.create({
                name: 'System Administrator',
                email: 'admin@quiz.com',
                passwordHash,
                role: 'ADMIN',
            });
            console.log('[Seed] Created default admin user: admin@quiz.com / admin123');
        }
        let event = await Event_js_1.Event.findOne();
        if (!event) {
            event = await Event_js_1.Event.create({
                name: 'Software Engineering & Systems Quiz 2026',
                description: 'Real-Time competition covering Data Structures, System Design, and Algorithmic Riddles.',
                status: 'LIVE',
                isFrozen: false,
            });
            console.log('[Seed] Created initial competition event:', event.name);
        }
        if (event) {
            await (0, questionController_js_1.seedQuestionsIfEmpty)(event._id.toString());
        }
        isSeeded = true;
    }
    catch (err) {
        console.error('[Seed] Error seeding default data:', err);
    }
};
// DB Connection & Seeding Middleware for Serverless / Express
app.use(async (req, res, next) => {
    if (req.path === '/api/health')
        return next();
    try {
        await (0, db_js_1.connectDB)();
        await seedDefaultData();
        next();
    }
    catch (error) {
        console.error('[DB Middleware Error]:', error);
        res.status(500).json({ error: 'Database connection failed: ' + (error?.message || 'Unknown error') });
    }
});
// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Quiz Competition Engine API Server is active.' });
});
// API Routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/teams', teamRoutes_js_1.default);
app.use('/api/events', eventRoutes_js_1.default);
app.use('/api/questions', questionRoutes_js_1.default);
app.use('/api/submissions', submissionRoutes_js_1.default);
app.use('/api/leaderboard', leaderboardRoutes_js_1.default);
app.use('/api/admin', adminRoutes_js_1.default);
app.use('/api/ai', aiRoutes_js_1.default);
app.use('/api/analytics', analyticsRoutes_js_1.default);
app.use('/api/questions', hintRoutes_js_1.default);
// Health Check
app.get('/api/health', async (req, res) => {
    try {
        await (0, db_js_1.connectDB)();
        res.json({ status: 'ok', service: 'Quiz Competition Engine', timestamp: new Date() });
    }
    catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});
// If not on Vercel serverless, start standalone HTTP server
if (!process.env.VERCEL) {
    const startServer = async () => {
        await (0, db_js_1.connectDB)();
        await seedDefaultData();
        httpServer.listen(PORT, () => {
            console.log(`====================================================`);
            console.log(` 🚀 Quiz Platform API Server running on port ${PORT}`);
            console.log(` 🌐 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`====================================================`);
        });
    };
    startServer();
}
exports.default = app;
