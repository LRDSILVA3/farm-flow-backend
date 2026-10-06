import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRepo = {
  find: vi.fn(),
  findOne: vi.fn(),
  findByCode: vi.fn(),
  create: vi.fn((data: any) => ({ id: 'var-1', ...data })),
  save: vi.fn((v: any) => Promise.resolve(v)),
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

import ListCostVariablesService from './ListCostVariablesService';
import UpdateCostVariableService from './UpdateCostVariableService';
import AppError from '@shared/errors/AppError';

describe('Cost Variables Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ListCostVariablesService should return all cost variables ordered by category and code', async () => {
    const variables = [
      { id: '1', code: 'VALOR_DIESEL', value: 6.5, category: 'fuel' },
      { id: '2', code: 'VALOR_DIARIA', value: 150, category: 'labor' },
    ];
    mockRepo.find.mockResolvedValue(variables);

    const service = new ListCostVariablesService();
    const result = await service.execute();

    expect(result).toHaveLength(2);
    expect(mockRepo.find).toHaveBeenCalledWith({
      order: { category: 'ASC', code: 'ASC' },
    });
  });

  it('UpdateCostVariableService should update an existing variable by code', async () => {
    const existing = { id: '1', code: 'VALOR_DIESEL', value: 6.0 };
    mockRepo.findByCode.mockResolvedValue(existing);

    const service = new UpdateCostVariableService();
    const result = await service.execute({
      code: 'VALOR_DIESEL',
      value: 6.8,
    });

    expect(result.value).toBe(6.8);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('UpdateCostVariableService should throw AppError if variable code is not found', async () => {
    mockRepo.findByCode.mockResolvedValue(null);

    const service = new UpdateCostVariableService();
    await expect(
      service.execute({ code: 'INVALID_CODE', value: 100 })
    ).rejects.toBeInstanceOf(AppError);
  });
});
