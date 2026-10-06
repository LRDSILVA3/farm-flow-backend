import { describe, it, expect, vi } from 'vitest';
import { sign } from 'jsonwebtoken';
import ensureAuthenticated from './ensureAuthenticated';
import AppError from '@shared/errors/AppError';

describe('ensureAuthenticated middleware', () => {
  it('should authenticate with a valid JWT token', () => {
    const token = sign({}, 'farmflow-secret-key-2026', { subject: 'user-123' });
    const req: any = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const res: any = {};
    const next = vi.fn();

    ensureAuthenticated(req, res, next);

    expect(req.user).toEqual({ id: 'user-123' });
    expect(next).toHaveBeenCalled();
  });

  it('should throw AppError 401 if authorization header is missing', () => {
    const req: any = { headers: {} };
    const res: any = {};
    const next = vi.fn();

    expect(() => ensureAuthenticated(req, res, next)).toThrowError(AppError);
  });

  it('should throw AppError 401 if JWT token is invalid', () => {
    const req: any = {
      headers: {
        authorization: 'Bearer invalid.token.payload',
      },
    };
    const res: any = {};
    const next = vi.fn();

    expect(() => ensureAuthenticated(req, res, next)).toThrowError(AppError);
  });
});
