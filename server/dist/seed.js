"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = require("./config/db.js");
const User_js_1 = require("./models/User.js");
const Team_js_1 = require("./models/Team.js");
const Event_js_1 = require("./models/Event.js");
const Question_js_1 = require("./models/Question.js");
const Submission_js_1 = require("./models/Submission.js");
dotenv_1.default.config();
const seedDatabase = async () => {
    console.log('[Seed] Seeding rich competition environment...');
    await (0, db_js_1.connectDB)();
    // Clear existing collections if desired
    await User_js_1.User.deleteMany({});
    await Team_js_1.Team.deleteMany({});
    await Event_js_1.Event.deleteMany({});
    await Question_js_1.Question.deleteMany({});
    await Submission_js_1.Submission.deleteMany({});
    const salt = await bcryptjs_1.default.genSalt(10);
    const passwordHash = await bcryptjs_1.default.hash('admin123', salt);
    const alexPasswordHash = await bcryptjs_1.default.hash('alex123', salt);
    // 1. Admin User
    const admin = await User_js_1.User.create({
        name: 'System Administrator',
        email: 'admin@quiz.com',
        passwordHash,
        role: 'ADMIN',
    });
    // 2. Competition Event
    const event = await Event_js_1.Event.create({
        name: 'Software Engineering & Systems Quiz 2026',
        description: 'Real-Time competition covering Data Structures, System Design, and Algorithmic Riddles.',
        status: 'LIVE',
        isFrozen: false,
        startTime: new Date(Date.now() - 1000 * 60 * 45), // Started 45 mins ago
    });
    // 3. Questions
    const q1 = await Question_js_1.Question.create({
        eventId: event._id,
        title: 'Data Structures - Queue Mechanics',
        description: 'Which abstract data structure operates on a First-In, First-Out (FIFO) principle?',
        type: 'MCQ',
        options: ['Stack', 'Queue', 'Binary Tree', 'Graph'],
        correctAnswer: 'Queue',
        points: 10,
        order: 1,
        unlockCondition: 'Round 1 Initial Question',
    });
    const q2 = await Question_js_1.Question.create({
        eventId: event._id,
        title: 'System Design Riddle',
        description: 'I hold keys but no locks. I space out words without moving an inch. I can enter your commands, but I cannot leave your desk. What am I?',
        type: 'RIDDLE',
        options: [],
        correctAnswer: 'Keyboard',
        points: 20,
        order: 2,
        unlockCondition: 'Solve Question 1',
    });
    const q3 = await Question_js_1.Question.create({
        eventId: event._id,
        title: 'Algorithmic Complexity MCQ',
        description: 'What is the tightest worst-case time complexity of lookup in a properly balanced Hash Table (with good hash distribution)?',
        type: 'MCQ',
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
        correctAnswer: 'O(1)',
        points: 15,
        order: 3,
        unlockCondition: 'Solve Question 2',
    });
    const q4 = await Question_js_1.Question.create({
        eventId: event._id,
        title: 'Operating Systems Riddle',
        description: 'I run in the background, consuming memory without UI. I listen for requests and answer them all day long. What server-side process am I?',
        type: 'RIDDLE',
        options: [],
        correctAnswer: 'Daemon',
        points: 25,
        order: 4,
        unlockCondition: 'Solve Question 3',
    });
    const q5 = await Question_js_1.Question.create({
        eventId: event._id,
        title: 'Concurrency & Locking MCQ',
        description: 'Which condition occurs when two or more processes are blocked forever, each waiting for a resource held by the other?',
        type: 'MCQ',
        options: ['Livelock', 'Deadlock', 'Race Condition', 'Starvation'],
        correctAnswer: 'Deadlock',
        points: 30,
        order: 5,
        unlockCondition: 'Solve Question 4',
    });
    // 4. Sample Teams & Competitors
    // Team 1: Code Warriors (Score: 45)
    const alex = await User_js_1.User.create({
        name: 'Alex Mercer',
        email: 'alex@warriors.com',
        passwordHash: alexPasswordHash,
        role: 'PARTICIPANT',
    });
    const ashwin = await User_js_1.User.create({
        name: 'Ashwin Kumar',
        email: 'ashwin@warriors.com',
        passwordHash: alexPasswordHash,
        role: 'PARTICIPANT',
    });
    const team1 = await Team_js_1.Team.create({
        name: 'Code Warriors',
        teamCode: 'CW7K92',
        leaderId: alex._id,
        members: [alex._id, ashwin._id],
        score: 45,
        currentQuestionOrder: 4,
    });
    alex.teamId = team1._id;
    ashwin.teamId = team1._id;
    await alex.save();
    await ashwin.save();
    // Team 2: Dev Titans (Score: 30)
    const sarah = await User_js_1.User.create({
        name: 'Sarah Connor',
        email: 'sarah@titans.com',
        passwordHash: alexPasswordHash,
        role: 'PARTICIPANT',
    });
    const team2 = await Team_js_1.Team.create({
        name: 'Dev Titans',
        teamCode: 'DT3X99',
        leaderId: sarah._id,
        members: [sarah._id],
        score: 30,
        currentQuestionOrder: 3,
    });
    sarah.teamId = team2._id;
    await sarah.save();
    // Team 3: Bug Slayers (Score: 10)
    const david = await User_js_1.User.create({
        name: 'David Miller',
        email: 'david@slayers.com',
        passwordHash: alexPasswordHash,
        role: 'PARTICIPANT',
    });
    const team3 = await Team_js_1.Team.create({
        name: 'Bug Slayers',
        teamCode: 'BS4M11',
        leaderId: david._id,
        members: [david._id],
        score: 10,
        currentQuestionOrder: 2,
    });
    david.teamId = team3._id;
    await david.save();
    // 5. Seed Submissions History
    await Submission_js_1.Submission.create([
        {
            teamId: team1._id,
            userId: alex._id,
            questionId: q1._id,
            answer: 'Queue',
            isCorrect: true,
            pointsAwarded: 10,
            submittedAt: new Date(Date.now() - 1000 * 60 * 35),
        },
        {
            teamId: team1._id,
            userId: alex._id,
            questionId: q2._id,
            answer: 'Keyboard',
            isCorrect: true,
            pointsAwarded: 20,
            submittedAt: new Date(Date.now() - 1000 * 60 * 20),
        },
        {
            teamId: team1._id,
            userId: ashwin._id,
            questionId: q3._id,
            answer: 'O(1)',
            isCorrect: true,
            pointsAwarded: 15,
            submittedAt: new Date(Date.now() - 1000 * 60 * 10),
        },
        {
            teamId: team2._id,
            userId: sarah._id,
            questionId: q1._id,
            answer: 'Queue',
            isCorrect: true,
            pointsAwarded: 10,
            submittedAt: new Date(Date.now() - 1000 * 60 * 30),
        },
        {
            teamId: team2._id,
            userId: sarah._id,
            questionId: q2._id,
            answer: 'Keyboard',
            isCorrect: true,
            pointsAwarded: 20,
            submittedAt: new Date(Date.now() - 1000 * 60 * 15),
        },
        {
            teamId: team3._id,
            userId: david._id,
            questionId: q1._id,
            answer: 'Stack',
            isCorrect: false,
            pointsAwarded: 0,
            submittedAt: new Date(Date.now() - 1000 * 60 * 25),
        },
        {
            teamId: team3._id,
            userId: david._id,
            questionId: q1._id,
            answer: 'Queue',
            isCorrect: true,
            pointsAwarded: 10,
            submittedAt: new Date(Date.now() - 1000 * 60 * 22),
        },
    ]);
    console.log('[Seed] Database successfully populated with initial competition state.');
};
exports.seedDatabase = seedDatabase;
if (process.argv[2] === '--run') {
    (0, exports.seedDatabase)().then(() => process.exit(0));
}
