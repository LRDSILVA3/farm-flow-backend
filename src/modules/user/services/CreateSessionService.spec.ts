import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUsersRepo = {
  findOne: vi.fn(),
  findByEmail: vi.fn(),
};

vi.mock('typeorm', () => ({
  getCustomRepository: vi.fn(() => mockUsersRepo),
  getRepository: vi.fn(() => mockUsersRepo),
  EntityRepository: () => () => {},
  Repository: class Repository {},
  Entity: () => () => {},
  PrimaryGeneratedColumn: () => () => {},
  Column: () => () => {},
  CreateDateColumn: () => () => {},
  UpdateDateColumn: () => () => {},
}));

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'jwt-token-xyz'),
  },
  sign: vi.fn(() => 'jwt-token-xyz'),
}));

import CreateSessionService from './CreateSessionService';
import AppError from '@shared/errors/AppError';
import { compare } from 'bcryptjs';

describe('CreateSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should authenticate user and return user info with token', async () => {
    const user = {
      id: 'usr-1',
      name: 'Admin',
      email: 'admin@farmflow.com',
      password: 'hashed-password',
    };
    mockUsersRepo.findByEmail.mockResolvedValue(user);
    (compare as any).mockResolvedValue(true);

    const service = new CreateSessionService();
    const result = await service.execute({
      email: 'admin@farmflow.com',
      password: 'correct-password',
    });

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token', 'jwt-token-xyz');
    expect(result.user.email).toBe('admin@farmflow.com');
    expect(result.user.password).toBeUndefined();
    expect(result.user.status).toBe('Ativo');
    expect(Array.isArray(result.user.permissions)).toBe(true);
  });

  it('should throw AppError if password is empty when user has stored hash', async () => {
    mockUsersRepo.findByEmail.mockResolvedValue({
      id: 'usr-1',
      email: 'admin@farmflow.com',
      password: 'hashed-password',
      status: 'Ativo',
    });

    const service = new CreateSessionService();
    await expect(
      service.execute({
        email: 'admin@farmflow.com',
        password: '',
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('should throw 403 AppError if user is Inativo', async () => {
    mockUsersRepo.findByEmail.mockResolvedValue({
      id: 'usr-1',
      email: 'inactive@farmflow.com',
      password: 'hashed-password',
      status: 'Inativo',
      role: 'Financeiro',
    });
    (compare as any).mockResolvedValue(true);

    const service = new CreateSessionService();
    await expect(
      service.execute({
        email: 'inactive@farmflow.com',
        password: 'correct-password',
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('should throw AppError if user email is not found', async () => {
    mockUsersRepo.findByEmail.mockResolvedValue(null);

    const service = new CreateSessionService();
    await expect(
      service.execute({
        email: 'unknown@farmflow.com',
        password: 'password',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should throw AppError if password does not match', async () => {
    mockUsersRepo.findByEmail.mockResolvedValue({
      id: 'usr-1',
      email: 'admin@farmflow.com',
      password: 'hashed-password',
    });
    (compare as any).mockResolvedValue(false);

    const service = new CreateSessionService();
    await expect(
      service.execute({
        email: 'admin@farmflow.com',
        password: 'wrong-password',
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});
