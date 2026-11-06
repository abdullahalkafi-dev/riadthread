import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { isInternalRequest } from './rateLimit';

const req = (key?: string) => ({ get: (name: string) => (name === 'x-internal-key' ? key : undefined) }) as unknown as Request;

describe('isInternalRequest', () => {
  it('accepts only the exact shared key', () => {
    expect(isInternalRequest(req('test-internal-secret-test-internal-secret-00'))).toBe(true);
    expect(isInternalRequest(req('test-internal-secret-test-internal-secret-01'))).toBe(false);
    expect(isInternalRequest(req('short'))).toBe(false);
    expect(isInternalRequest(req())).toBe(false);
  });
});
