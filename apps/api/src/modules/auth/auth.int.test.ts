import request from 'supertest';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from '../../config/env';
import { setup, teardown } from '../../test/helpers';
import { RefreshToken } from './refreshToken.model';

let app: Awaited<ReturnType<typeof setup>>['app'];
const families = new Set<string>();

beforeAll(async () => {
  ({ app } = await setup());
});

afterAll(async () => {
  await RefreshToken.deleteMany({ family: { $in: [...families] } });
  await teardown();
});

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

function cookieValue(res: request.Response, name: string): string {
  const raw = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const line = raw.find((c) => c.startsWith(`${name}=`));
  if (!line) throw new Error(`No ${name} cookie in the response`);
  return line.slice(name.length + 1).split(';')[0]!;
}

/** Signs in and returns the refresh token from the cookie. */
async function signIn(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .set('x-riad-csrf', '1')
    .send({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
  expect(res.status).toBe(200);
  const token = cookieValue(res, 'rt_refresh');
  const record = await RefreshToken.findOne({ tokenHash: sha256(token) }).lean();
  families.add(record!.family);
  return token;
}

const refreshWith = (token: string) =>
  request(app).post('/api/v1/auth/refresh').set('x-riad-csrf', '1').set('Cookie', `rt_refresh=${token}`);

const logoutWith = (token: string) =>
  request(app).post('/api/v1/auth/logout').set('x-riad-csrf', '1').set('Cookie', `rt_refresh=${token}`);

describe('session refresh', () => {
  it('lets two refreshes with the same token succeed when they arrive together', async () => {
    const token = await signIn();
    const [a, b] = await Promise.all([refreshWith(token), refreshWith(token)]);
    expect([a.status, b.status]).toEqual([200, 200]);

    // The sign-in is still usable afterwards.
    const next = await refreshWith(cookieValue(a, 'rt_refresh'));
    expect(next.status).toBe(200);
  });

  it('treats an old token presented after the grace window as stolen and ends the sign-in', async () => {
    const token = await signIn();
    const rotated = await refreshWith(token);
    expect(rotated.status).toBe(200);
    const current = cookieValue(rotated, 'rt_refresh');

    // Pretend the rotation happened a minute ago.
    await RefreshToken.updateOne({ tokenHash: sha256(token) }, { $set: { rotatedAt: new Date(Date.now() - 60_000) } });
    expect((await refreshWith(token)).status).toBe(401);
    // The legitimate holder is signed out too.
    expect((await refreshWith(current)).status).toBe(401);
  });

  it('never brings back a token after sign-out, even within the grace window', async () => {
    const token = await signIn();
    const rotated = await refreshWith(token);
    const current = cookieValue(rotated, 'rt_refresh');
    expect((await logoutWith(current)).status).toBe(200);

    expect((await refreshWith(token)).status).toBe(401);
    expect((await refreshWith(current)).status).toBe(401);
  });
});
