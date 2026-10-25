import mongoose from 'mongoose';
import { DB_NAME } from '../constant.js';
export const connectDB = async () => {
    if (!process.env.DB_URL) throw new Error('DB_URL is not configured');
    await mongoose.connect(process.env.DB_URL, {
        dbName: DB_NAME,
        serverSelectionTimeoutMS: Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS) || 10_000,
    });
    console.log('Database connected successfully');
}
