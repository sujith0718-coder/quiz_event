import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      console.log('[DB] Connecting to configured MongoDB...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
      console.log('[DB] Connected to MongoDB database successfully.');
      return;
    } catch (error: any) {
      console.error(`[DB] Configured MongoDB connection failed: ${error.message}`);
      console.error('[DB] In deployment, check MONGODB_URI instead of falling back to an ephemeral database.');
      throw error;
    }
  }

  try {
    console.log('[DB] MONGODB_URI not supplied. Starting in-memory MongoDB for local/demo use...');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[DB] Connected to In-Memory MongoDB instance at: ${uri}`);
  } catch (memError) {
    console.error('[DB] Critical: Failed to start in-memory MongoDB server.', memError);
    process.exit(1);
  }
};
