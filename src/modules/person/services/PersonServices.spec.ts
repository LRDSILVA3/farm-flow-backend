import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRepo = {
  find: vi.fn(),
  findOne: vi.fn(),
  findByCpf: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn((data: any) => ({ id: 1, ...data })),
  save: vi.fn((p: any) => Promise.resolve(p)),
};

vi.mock('typeorm', () => ({
  getCustomRepository: vi.fn(() => mockRepo),
  getRepository: vi.fn(() => mockRepo),
  EntityRepository: () => () => {},
  Repository: class Repository {},
  Entity: () => () => {},
  PrimaryGeneratedColumn: () => () => {},
  Column: () => () => {},
  CreateDateColumn: () => () => {},
  UpdateDateColumn: () => () => {},
}));

import CreatePersonService from './CreatePersonService';
import UpdatePersonService from './UpdatePersonService';
import AppError from '@shared/errors/AppError';

describe('Person Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('CreatePersonService should save a person', async () => {
    mockRepo.findByCpf.mockResolvedValue(null);
    mockRepo.findByEmail.mockResolvedValue(null);

    const data = {
      name: 'João da Silva',
      cpf: '12345678900',
      birth_date: new Date('1990-01-01'),
      telephone: '16999999999',
      email: 'joao@example.com',
    };

    const service = new CreatePersonService();
    const result = await service.create(data);

    expect(result).toHaveProperty('id', 1);
    expect(mockRepo.create).toHaveBeenCalledWith(data);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('CreatePersonService should throw 409 if CPF already exists', async () => {
    mockRepo.findByCpf.mockResolvedValue({ id: 1, cpf: '12345678900' });

    const service = new CreatePersonService();
    await expect(
      service.create({
        name: 'Duplicado',
        cpf: '12345678900',
        birth_date: new Date(),
        telephone: '123',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('CreatePersonService should throw 409 if email already exists', async () => {
    mockRepo.findByCpf.mockResolvedValue(null);
    mockRepo.findByEmail.mockResolvedValue({ id: 2, email: 'joao@example.com' });

    const service = new CreatePersonService();
    await expect(
      service.create({
        name: 'Duplicado',
        cpf: '99999999999',
        birth_date: new Date(),
        telephone: '123',
        email: 'joao@example.com',
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('UpdatePersonService should update person fields', async () => {
    const existing = { id: 1, name: 'Antigo', cpf: '12345678900', email: 'old@example.com' };
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.findByCpf.mockResolvedValue(null);
    mockRepo.findByEmail.mockResolvedValue(null);

    const service = new UpdatePersonService();
    const result = await service.update({
      id: 1,
      name: 'Novo Nome',
      cpf: '12345678900',
      birth_date: new Date('1990-01-01'),
      telephone: '16999999999',
      email: 'novo@example.com',
    });

    expect(result.name).toBe('Novo Nome');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('UpdatePersonService should throw 404 if person not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    const service = new UpdatePersonService();
    await expect(
      service.update({
        id: 999,
        name: 'Novo',
        cpf: '000',
        birth_date: new Date(),
        telephone: '000',
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});
