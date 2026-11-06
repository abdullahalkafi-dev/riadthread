import mongoose from 'mongoose';
import sharp from 'sharp';
import request from 'supertest';
import { createApp } from '../app';
import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import '../jobs';
import { storage } from '../lib/storage';
import { seedAdminIfMissing } from '../modules/user/user.service';

export const TAG = `inttest-${Date.now().toString(36)}`;

export interface Session {
  agent: ReturnType<typeof request.agent>;
  post: (url: string) => request.Test;
  patch: (url: string) => request.Test;
  put: (url: string) => request.Test;
  del: (url: string) => request.Test;
  get: (url: string) => request.Test;
}

/** App + database + a signed-in admin agent, shared by the integration tests. */
export async function setup(): Promise<{ app: ReturnType<typeof createApp>; admin: Session }> {
  await connectDb();
  await seedAdminIfMissing();
  await storage.ensureBuckets();
  const app = createApp();
  const agent = request.agent(app);
  const res = await agent
    .post('/api/v1/auth/login')
    .set('x-riad-csrf', '1')
    .send({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
  if (res.status !== 200) throw new Error(`Test login failed: ${res.status} ${JSON.stringify(res.body)}`);
  const csrf = (t: request.Test) => t.set('x-riad-csrf', '1');
  return {
    app,
    admin: {
      agent,
      get: (u) => agent.get(u),
      post: (u) => csrf(agent.post(u)),
      patch: (u) => csrf(agent.patch(u)),
      put: (u) => csrf(agent.put(u)),
      del: (u) => csrf(agent.delete(u)),
    },
  };
}

export async function teardown() {
  await disconnectDb();
}

/** A real, decodable JPEG large enough to pass the 1000px rule. */
export const sampleJpeg = (width = 1100, height = 1400, colour = '#b9603f') =>
  sharp({ create: { width, height, channels: 3, background: colour } }).jpeg().toBuffer();

/** Polls until the media is processed (inline jobs finish within a few seconds). */
export async function waitForMedia(admin: Session, id: string) {
  for (let i = 0; i < 60; i++) {
    const res = await admin.get(`/api/v1/admin/media/${id}`);
    if (res.body.data?.status === 'ready' || res.body.data?.status === 'failed') return res.body.data;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Media did not finish processing');
}

export async function uploadImage(admin: Session, colour?: string) {
  const res = await admin.post('/api/v1/admin/media').attach('file', await sampleJpeg(1100, 1400, colour), 'sample.jpg');
  if (res.status !== 202) throw new Error(`Upload failed: ${res.status} ${JSON.stringify(res.body)}`);
  return waitForMedia(admin, res.body.data.id);
}

/** Counts every MongoDB operation issued while fn runs. */
export async function countQueries<T>(fn: () => Promise<T>): Promise<{ result: T; queries: number }> {
  let queries = 0;
  mongoose.set('debug', () => {
    queries++;
  });
  try {
    const result = await fn();
    return { result, queries };
  } finally {
    mongoose.set('debug', false);
  }
}
