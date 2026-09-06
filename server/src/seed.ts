import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Team } from './models/Team.js';
import { Event } from './models/Event.js';
import { Question } from './models/Question.js';
import { Submission } from './models/Submission.js';

dotenv.config();

export const seedDatabase = async () => {
  console.log('[Seed] Seeding rich competition environment...');

  await connectDB();

  // Clear existing collections if desired
  await User.deleteMany({});
  await Team.deleteMany({});
  await Event.deleteMany({});
  await Question.deleteMany({});
  await Submission.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  const alexPasswordHash = await bcrypt.hash('alex123', salt);

  // 1. Admin User
  const admin = await User.create({
    name: 'System Administrator',
    email: 'admin@quiz.com',
    passwordHash,
    role: 'ADMIN',
  });

  // 2. Competition Event
  const event = await Event.create({
    name: 'Software Engineering & Systems Quiz 2026',
    description: 'Real-Time competition covering Data Structures, System Design, and Algorithmic Riddles.',
    status: 'LIVE',
    isFrozen: false,
    startTime: new Date(Date.now() - 1000 * 60 * 45), // Started 45 mins ago
  });

  // 3. Questions
  const q1 = await Question.create({
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

  const q2 = await Question.create({
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

  const q3 = await Question.create({
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

  const q4 = await Question.create({
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

  const q5 = await Question.create({
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
  const alex = await User.create({
    name: 'Alex Mercer',
    email: 'alex@warriors.com',
    passwordHash: alexPasswordHash,
    role: 'PARTICIPANT',
  });
  const ashwin = await User.create({
    name: 'Ashwin Kumar',
    email: 'ashwin@warriors.com',
    passwordHash: alexPasswordHash,
    role: 'PARTICIPANT',
  });

  const team1 = await Team.create({
    name: 'Code Warriors',
    teamCode: 'CW7K92',
    leaderId: alex._id,
    members: [alex._id, ashwin._id],
    score: 45,
    currentQuestionOrder: 4,
  });

  alex.teamId = team1._id as any;
  ashwin.teamId = team1._id as any;
  await alex.save();
  await ashwin.save();

  // Team 2: Dev Titans (Score: 30)
  const sarah = await User.create({
    name: 'Sarah Connor',
    email: 'sarah@titans.com',
    passwordHash: alexPasswordHash,
    role: 'PARTICIPANT',
  });

  const team2 = await Team.create({
    name: 'Dev Titans',
    teamCode: 'DT3X99',
    leaderId: sarah._id,
    members: [sarah._id],
    score: 30,
    currentQuestionOrder: 3,
  });
  sarah.teamId = team2._id as any;
  await sarah.save();

  // Team 3: Bug Slayers (Score: 10)
  const david = await User.create({
    name: 'David Miller',
    email: 'david@slayers.com',
    passwordHash: alexPasswordHash,
    role: 'PARTICIPANT',
  });
  const team3 = await Team.create({
    name: 'Bug Slayers',
    teamCode: 'BS4M11',
    leaderId: david._id,
    members: [david._id],
    score: 10,
    currentQuestionOrder: 2,
  });
  david.teamId = team3._id as any;
  await david.save();

  // 5. Seed Submissions History
  await Submission.create([
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

if (process.argv[2] === '--run') {
  seedDatabase().then(() => process.exit(0));
}
