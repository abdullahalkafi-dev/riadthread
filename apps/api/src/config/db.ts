import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true);
  mongoose.set('debug', false);
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15_000,
    maxPoolSize: 20,
  });
  logger.info({ db: mongoose.connection.name }, 'Connected to MongoDB');
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
