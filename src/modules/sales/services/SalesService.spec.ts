import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQueryBuilder = {
  leftJoinAndSelect: vi.fn().mockReturnThis(),
  getMany: vi.fn().mockResolvedValue([{ id: 'sale-1', total: 1000 }]),
};

const mockRepo = {
  createQueryBuilder: vi.fn(() => mockQueryBuilder),
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
  ManyToMany: () => () => {},
  JoinColumn: () => () => {},
  JoinTable: () => () => {},
}));

import ListSaleService from './ListSale.service';

describe('Sales Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ListSaleService should list all sales with relations', async () => {
    const service = new ListSaleService();
    const result = await service.execute();

    expect(result).toHaveLength(1);
    expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('sales');
    expect(mockQueryBuilder.getMany).toHaveBeenCalled();
  });
});
