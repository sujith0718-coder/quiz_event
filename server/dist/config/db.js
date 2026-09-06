"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quiz_competition';
        console.log(`[DB] Attempting connection to MongoDB at: ${mongoUri}`);
        // Set connection timeout to 3 seconds for fast fallback
        await mongoose_1.default.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
        console.log('[DB] Connected to MongoDB database successfully.');
    }
    catch (error) {
        console.warn(`[DB] Primary MongoDB connection failed (${error.message}). Falling back to In-Memory MongoDB Server...`);
        try {
            const mongod = await mongodb_memory_server_1.MongoMemoryServer.create();
            const uri = mongod.getUri();
            await mongoose_1.default.connect(uri);
            console.log(`[DB] Connected to In-Memory MongoDB instance at: ${uri}`);
        }
        catch (memError) {
            console.error('[DB] Critical: Failed to start in-memory MongoDB server.', memError);
            process.exit(1);
        }
    }
};
exports.connectDB = connectDB;
