import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HTTPServer, clientUrl: string): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: any) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join:event', (eventId: string) => {
      socket.join(`event:${eventId}`);
      console.log(`[Socket.IO] ${socket.id} joined room event:${eventId}`);
    });

    socket.on('join:team', (teamId: string) => {
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

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO instance has not been initialized');
  }
  return io;
};

// Helper broadcast functions
export const emitLeaderboardUpdate = (eventId: string, leaderboard: any) => {
  if (io) {
    io.to(`event:${eventId}`).emit('leaderboard:update', leaderboard);
    io.to('admin').emit('leaderboard:update', leaderboard);
  }
};

export const emitNewSubmission = (submission: any) => {
  if (io) {
    io.to('admin').emit('submission:new', submission);
  }
};

export const emitQuestionUnlocked = (teamId: string, data: any) => {
  if (io) {
    io.to(`team:${teamId}`).emit('question:unlocked', data);
  }
};

export const emitRoundChanged = (eventId: string, data: { status: string; isFrozen: boolean }) => {
  if (io) {
    io.to(`event:${eventId}`).emit('round:changed', data);
    io.to('admin').emit('round:changed', data);
  }
};
