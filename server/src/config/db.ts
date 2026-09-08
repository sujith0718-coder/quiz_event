import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let isConnecting = false;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (isConnecting) {
    while (mongoose.connection.readyState === 2) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return;
  }

  isConnecting = true;
  const mongoUri = process.env.MONGODB_URI;

  try {
    if (mongoUri) {
      console.log('[DB] Connecting to configured MongoDB Atlas...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
      console.log('[DB] Connected to MongoDB database successfully.');
      return;
    }

    if (!process.env.VERCEL) {
      console.log('[DB] MONGODB_URI not supplied. Starting in-memory MongoDB for local use...');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`[DB] Connected to In-Memory MongoDB instance at: ${uri}`);
    } else {
      throw new Error('MONGODB_URI environment variable is required on Vercel deployment.');
    }
  } catch (error: any) {
    console.error(`[DB] MongoDB connection failed: ${error.message}`);
    throw error;
  } finally {
    isConnecting = false;
  }
};
