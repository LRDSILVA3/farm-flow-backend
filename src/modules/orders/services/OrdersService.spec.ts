import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockOrdersRepo = {
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn((data: any) => ({ id: 'order-1', ...data })),
  save: vi.fn((o: any) => Promise.resolve(o)),
  remove: vi.fn(),
};

vi.mock('typeorm', () => ({
  getCustomRepository: vi.fn(() => mockOrdersRepo),
  getRepository: vi.fn(() => mockOrdersRepo),
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

import { OrdersService } from './OrdersService';
import AppError from '@shared/errors/AppError';

describe('Orders Service', () => {
  let service: OrdersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrdersService();
  });

  it('list should return orders with client and farm relations', async () => {
    mockOrdersRepo.find.mockResolvedValue([
      { id: 'order-1', status: 'draft', total_amount: 1500 },
    ]);

    const result = await service.list();
    expect(result).toHaveLength(1);
    expect(mockOrdersRepo.find).toHaveBeenCalledWith({
      relations: ['client', 'farm'],
      order: { created_at: 'DESC' },
    });
  });

  it('create should save and return a new order', async () => {
    const data = {
      client_id: 'client-1',
      farm_id: 'farm-1',
      total_amount: 5000,
      status: 'pending',
    };

    const result = await service.create(data);
    expect(result).toHaveProperty('id', 'order-1');
    expect(mockOrdersRepo.create).toHaveBeenCalledWith(data);
    expect(mockOrdersRepo.save).toHaveBeenCalled();
  });

  it('update should update existing order fields', async () => {
    const existing = { id: 'order-1', status: 'pending', total_amount: 5000 };
    mockOrdersRepo.findOne.mockResolvedValue(existing);

    const result = await service.update('order-1', {
      status: 'completed',
      total_amount: 5200,
    });

    expect(result.status).toBe('completed');
    expect(result.total_amount).toBe(5200);
    expect(mockOrdersRepo.save).toHaveBeenCalled();
  });

  it('update should throw AppError if order does not exist', async () => {
    mockOrdersRepo.findOne.mockResolvedValue(null);
    await expect(
      service.update('999', { status: 'completed' })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('delete should remove order', async () => {
    const existing = { id: 'order-1' };
    mockOrdersRepo.findOne.mockResolvedValue(existing);
    mockOrdersRepo.remove.mockResolvedValue(existing);

    await service.delete('order-1');
    expect(mockOrdersRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('delete should throw AppError if order does not exist', async () => {
    mockOrdersRepo.findOne.mockResolvedValue(null);
    await expect(service.delete('999')).rejects.toBeInstanceOf(AppError);
  });
});
