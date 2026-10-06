import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRepo = {
  find: vi.fn(),
  findOne: vi.fn(),
  findByName: vi.fn(),
  create: vi.fn((data: any) => ({ id: 'prod-1', ...data })),
  save: vi.fn((p: any) => Promise.resolve(p)),
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
}));

import ListProductService from './ListProductService';
import CreateProductService from './CreateProductService';
import ShowProductService from './ShowProductService';
import UpdateProductService from './UpdateProductService';
import DeleteProductService from './DeleteProductService';
import AppError from '@shared/errors/AppError';

describe('Products Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ListProductService should return products', async () => {
    mockRepo.find.mockResolvedValue([
      { id: '1', name: 'Adubo Fertilizante', price: 100 },
      { id: '2', name: 'Semente Soja', price: 250 },
    ]);

    const service = new ListProductService();
    const result = await service.execute();

    expect(result).toHaveLength(2);
    expect(mockRepo.find).toHaveBeenCalled();
  });

  it('CreateProductService should save a new product', async () => {
    mockRepo.findByName.mockResolvedValue(null);
    const data = {
      name: 'Defensivo A',
      price: 150,
      quantity: 50,
    };

    const service = new CreateProductService();
    const result = await service.execute(data);

    expect(result).toHaveProperty('id', 'prod-1');
    expect(mockRepo.create).toHaveBeenCalledWith(data);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('CreateProductService should throw AppError if product with same name exists', async () => {
    mockRepo.findByName.mockResolvedValue({ id: 'existing', name: 'Defensivo A' });

    const service = new CreateProductService();
    await expect(
      service.execute({ name: 'Defensivo A', price: 100, quantity: 10 })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('ShowProductService should return product by id', async () => {
    const existing = { id: 'prod-1', name: 'Item' };
    mockRepo.findOne.mockResolvedValue(existing);

    const service = new ShowProductService();
    const result = await service.execute({ id: 'prod-1' });

    expect(result).toEqual(existing);
  });

  it('ShowProductService should throw AppError if not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    const service = new ShowProductService();
    await expect(service.execute({ id: '999' })).rejects.toBeInstanceOf(AppError);
  });

  it('UpdateProductService should update existing product', async () => {
    const existing = { id: 'prod-1', name: 'Velho', price: 100, quantity: 10 };
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.findByName.mockResolvedValue(null);

    const service = new UpdateProductService();
    const result = await service.execute({
      id: 'prod-1',
      name: 'Novo',
      price: 120,
      quantity: 15,
    });

    expect(result.name).toBe('Novo');
    expect(result.price).toBe(120);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('UpdateProductService should throw AppError if product not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    const service = new UpdateProductService();
    await expect(
      service.execute({ id: '999', name: 'X', price: 1, quantity: 1 })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('DeleteProductService should remove product', async () => {
    const existing = { id: 'prod-1', name: 'Item' };
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.remove.mockResolvedValue(existing);

    const service = new DeleteProductService();
    await service.execute({ id: 'prod-1' });

    expect(mockRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('DeleteProductService should throw AppError if not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    const service = new DeleteProductService();
    await expect(service.execute({ id: '999' })).rejects.toBeInstanceOf(AppError);
  });
});
