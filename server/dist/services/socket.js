"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitRoundChanged = exports.emitQuestionUnlocked = exports.emitNewSubmission = exports.emitLeaderboardUpdate = exports.getIO = exports.initSocketServer = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initSocketServer = (httpServer, clientUrl) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);
        socket.on('join:event', (eventId) => {
            socket.join(`event:${eventId}`);
            console.log(`[Socket.IO] ${socket.id} joined room event:${eventId}`);
        });
        socket.on('join:team', (teamId) => {
            socket.join(`team:${teamId}`);
            console.log(`[Socket.IO] ${socket.id} joined room team:${teamId}`);
        });
        socket.on('join:admin', () => {
            socket.join('admin');
            console.log(`[Socket.IO] ${socket.id} joined admin room`);
        });
        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocketServer = initSocketServer;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO instance has not been initialized');
    }
    return io;
};
exports.getIO = getIO;
// Helper broadcast functions
const emitLeaderboardUpdate = (eventId, leaderboard) => {
    if (io) {
        io.to(`event:${eventId}`).emit('leaderboard:update', leaderboard);
        io.to('admin').emit('leaderboard:update', leaderboard);
    }
};
exports.emitLeaderboardUpdate = emitLeaderboardUpdate;
const emitNewSubmission = (submission) => {
    if (io) {
        io.to('admin').emit('submission:new', submission);
    }
};
exports.emitNewSubmission = emitNewSubmission;
const emitQuestionUnlocked = (teamId, data) => {
    if (io) {
        io.to(`team:${teamId}`).emit('question:unlocked', data);
    }
};
exports.emitQuestionUnlocked = emitQuestionUnlocked;
const emitRoundChanged = (eventId, data) => {
    if (io) {
        io.to(`event:${eventId}`).emit('round:changed', data);
        io.to('admin').emit('round:changed', data);
    }
};
exports.emitRoundChanged = emitRoundChanged;
