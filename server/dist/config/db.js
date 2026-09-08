"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
let isConnecting = false;
const connectDB = async () => {
    if (mongoose_1.default.connection.readyState === 1) {
        return;
    }
    if (isConnecting) {
        while (mongoose_1.default.connection.readyState === 2) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return;
    }
    isConnecting = true;
    const mongoUri = process.env.MONGODB_URI;
    try {
        if (mongoUri) {
            console.log('[DB] Connecting to configured MongoDB Atlas...');
            await mongoose_1.default.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
            console.log('[DB] Connected to MongoDB database successfully.');
            return;
        }
        if (!process.env.VERCEL) {
            console.log('[DB] MONGODB_URI not supplied. Starting in-memory MongoDB for local use...');
            const mongod = await mongodb_memory_server_1.MongoMemoryServer.create();
            const uri = mongod.getUri();
            await mongoose_1.default.connect(uri);
            console.log(`[DB] Connected to In-Memory MongoDB instance at: ${uri}`);
        }
        else {
            throw new Error('MONGODB_URI environment variable is required on Vercel deployment.');
        }
    }
    catch (error) {
        console.error(`[DB] MongoDB connection failed: ${error.message}`);
        throw error;
    }
    finally {
        isConnecting = false;
    }
};
exports.connectDB = connectDB;
