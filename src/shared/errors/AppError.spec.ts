import { describe, it, expect } from 'vitest';
import AppError from './AppError';

describe('AppError', () => {
  it('should instantiate with default statusCode 400', () => {
    const error = new AppError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(400);
  });

  it('should instantiate with custom statusCode', () => {
    const error = new AppError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
  });
});
