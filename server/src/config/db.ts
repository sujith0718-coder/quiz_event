import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quiz_competition';
    console.log(`[DB] Attempting connection to MongoDB at: ${mongoUri}`);
    
    // Set connection timeout to 3 seconds for fast fallback
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('[DB] Connected to MongoDB database successfully.');
  } catch (error: any) {
    console.warn(`[DB] Primary MongoDB connection failed (${error.message}). Falling back to In-Memory MongoDB Server...`);
    try {
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`[DB] Connected to In-Memory MongoDB instance at: ${uri}`);
    } catch (memError) {
      console.error('[DB] Critical: Failed to start in-memory MongoDB server.', memError);
      process.exit(1);
    }
  }
};
