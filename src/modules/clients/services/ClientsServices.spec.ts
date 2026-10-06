import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRepo = {
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn((data: any) => ({ id: 'client-1', ...data })),
  save: vi.fn((c: any) => Promise.resolve(c)),
  remove: vi.fn(),
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
  ManyToOne: () => () => {},
  OneToMany: () => () => {},
  JoinColumn: () => () => {},
}));

import ListClientService from './ListClientService';
import CreateClientService from './CreateClientService';
import ShowClientService from './ShowClientService';
import UpdateClientService from './UpdateClientService';
import DeleteClientService from './DeleteClientService';
import AppError from '@shared/errors/AppError';

describe('Clients Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ListClientService should return clients sorted by name', async () => {
    mockRepo.find.mockResolvedValue([
      { id: '1', name: 'Ana Silva' },
      { id: '2', name: 'Carlos Rocha' },
    ]);

    const service = new ListClientService();
    const result = await service.execute();

    expect(result).toHaveLength(2);
    expect(mockRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('CreateClientService should save and return a new client', async () => {
    const data = {
      name: 'João Fazendeiro',
      cpf: '12345678901',
      city: 'Ribeirão Preto',
      state: 'SP',
    };

    const service = new CreateClientService();
    const result = await service.execute(data);

    expect(result).toHaveProperty('id', 'client-1');
    expect(result.name).toBe('João Fazendeiro');
    expect(mockRepo.create).toHaveBeenCalledWith(data);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('ShowClientService should return a client by id', async () => {
    const existing = { id: 'client-1', name: 'João' };
    mockRepo.findOne.mockResolvedValue(existing);

    const service = new ShowClientService();
    const result = await service.execute({ id: 'client-1' });

    expect(result).toEqual(existing);
    expect(mockRepo.findOne).toHaveBeenCalledWith('client-1');
  });

  it('ShowClientService should throw AppError if client is not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    const service = new ShowClientService();
    await expect(service.execute({ id: 'non-existent' })).rejects.toBeInstanceOf(AppError);
  });

  it('UpdateClientService should update an existing client', async () => {
    const existing = { id: 'client-1', name: 'Antigo Nome', cpf: '12345678901' };
    mockRepo.findOne.mockResolvedValue(existing);

    const service = new UpdateClientService();
    const result = await service.execute({
      id: 'client-1',
      name: 'Novo Nome',
      phone: '1699999999',
    });

    expect(result.name).toBe('Novo Nome');
    expect(result.phone).toBe('1699999999');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('UpdateClientService should throw AppError if client is not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    const service = new UpdateClientService();
    await expect(
      service.execute({ id: 'non-existent', name: 'Qualquer' })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('DeleteClientService should remove existing client', async () => {
    const existing = { id: 'client-1', name: 'Cliente a remover' };
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.remove.mockResolvedValue(existing);

    const service = new DeleteClientService();
    await service.execute({ id: 'client-1' });

    expect(mockRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('DeleteClientService should throw AppError if client is not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    const service = new DeleteClientService();
    await expect(
      service.execute({ id: 'non-existent' })
    ).rejects.toBeInstanceOf(AppError);
  });
});
