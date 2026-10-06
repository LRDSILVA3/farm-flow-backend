import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUsersRepo = {
  findOne: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn((data: any) => ({ id: 'usr-1', ...data })),
  save: vi.fn((u: any) => Promise.resolve(u)),
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
  hash: vi.fn(() => Promise.resolve('hashed-password-123')),
}));

import CreateUserService from './CreateUserService';
import AppError from '@shared/errors/AppError';

describe('CreateUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create and return a new user with deleted password field', async () => {
    mockUsersRepo.findByEmail.mockResolvedValue(null);

    const service = new CreateUserService();
    const result = await service.execute({
      name: 'Admin FarmFlow',
      email: 'admin@farmflow.com',
      password: 'password123',
    });

    expect(result).toHaveProperty('id', 'usr-1');
    expect(result.password).toBeUndefined();
    expect(mockUsersRepo.save).toHaveBeenCalled();
  });

  it('should throw AppError if user with email already exists', async () => {
    mockUsersRepo.findByEmail.mockResolvedValue({ id: 'usr-1', email: 'admin@farmflow.com' });

    const service = new CreateUserService();
    await expect(
      service.execute({
        name: 'Admin',
        email: 'admin@farmflow.com',
        password: '123',
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});
