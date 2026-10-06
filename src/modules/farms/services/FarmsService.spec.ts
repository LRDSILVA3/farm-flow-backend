import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFarmsRepo = {
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn((data: any) => ({ id: 'farm-1', ...data })),
  save: vi.fn((f: any) => Promise.resolve(f)),
  remove: vi.fn(),
};

const mockPlotsRepo = {
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn((data: any) => ({ id: 'plot-1', ...data })),
  save: vi.fn((p: any) => Promise.resolve(p)),
  remove: vi.fn(),
};

vi.mock('typeorm', () => ({
  getCustomRepository: vi.fn((repo: any) => {
    if (repo && (repo.name === 'PlotsRepository' || repo.name === 'PlotRepository')) return mockPlotsRepo;
    return mockFarmsRepo;
  }),
  getRepository: vi.fn(() => mockFarmsRepo),
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

import { FarmsService } from './FarmsService';
import AppError from '@shared/errors/AppError';

describe('Farms and Plots Service', () => {
  let service: FarmsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FarmsService();
  });

  it('list should return all farms with relations', async () => {
    mockFarmsRepo.find.mockResolvedValue([
      { id: 'farm-1', name: 'Fazenda Primavera', plots: [] },
    ]);

    const result = await service.list();
    expect(result).toHaveLength(1);
    expect(mockFarmsRepo.find).toHaveBeenCalledWith({
      relations: ['plots', 'client'],
      order: { name: 'ASC' },
    });
  });

  it('create should save a new farm and its plots', async () => {
    const data = {
      name: 'Fazenda Sol Nascente',
      client_id: 'client-1',
      city: 'Uberlândia',
      state: 'MG',
      total_area: 500,
      plots: [{ name: 'Talhão 1', area: 50 }],
    };

    const result = await service.create(data);
    expect(result).toHaveProperty('id', 'farm-1');
    expect(mockFarmsRepo.create).toHaveBeenCalledWith(data);
    expect(mockFarmsRepo.save).toHaveBeenCalled();
    expect(mockPlotsRepo.create).toHaveBeenCalled();
    expect(mockPlotsRepo.save).toHaveBeenCalled();
  });

  it('update should update existing farm', async () => {
    const existing = { id: 'farm-1', name: 'Antiga' };
    mockFarmsRepo.findOne.mockResolvedValue(existing);

    const result = await service.update('farm-1', { name: 'Atualizada' });
    expect(result.name).toBe('Atualizada');
    expect(mockFarmsRepo.save).toHaveBeenCalled();
  });

  it('update should throw AppError if farm not found', async () => {
    mockFarmsRepo.findOne.mockResolvedValue(null);
    await expect(service.update('999', { name: 'X' })).rejects.toBeInstanceOf(AppError);
  });

  it('delete should remove existing farm', async () => {
    const existing = { id: 'farm-1', name: 'Remover' };
    mockFarmsRepo.findOne.mockResolvedValue(existing);
    mockFarmsRepo.remove.mockResolvedValue(existing);

    await service.delete('farm-1');
    expect(mockFarmsRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('delete should throw AppError if farm not found', async () => {
    mockFarmsRepo.findOne.mockResolvedValue(null);
    await expect(service.delete('999')).rejects.toBeInstanceOf(AppError);
  });

  it('addPlot should create and save plot with farm_id', async () => {
    const data = { name: 'Talhão 2', area: 50 };
    const result = await service.addPlot('farm-1', data);

    expect(result).toHaveProperty('id', 'plot-1');
    expect(mockPlotsRepo.create).toHaveBeenCalledWith({ ...data, farm_id: 'farm-1' });
    expect(mockPlotsRepo.save).toHaveBeenCalled();
  });

  it('updatePlot should update existing plot', async () => {
    const existing = { id: 'plot-1', name: 'Talhão 1' };
    mockPlotsRepo.findOne.mockResolvedValue(existing);

    const result = await service.updatePlot('plot-1', { name: 'Talhão 1 Editado' });
    expect(result.name).toBe('Talhão 1 Editado');
    expect(mockPlotsRepo.save).toHaveBeenCalled();
  });

  it('updatePlot should throw AppError if plot not found', async () => {
    mockPlotsRepo.findOne.mockResolvedValue(null);
    await expect(service.updatePlot('999', { name: 'X' })).rejects.toBeInstanceOf(AppError);
  });

  it('deletePlot should remove plot', async () => {
    const existing = { id: 'plot-1' };
    mockPlotsRepo.findOne.mockResolvedValue(existing);
    mockPlotsRepo.remove.mockResolvedValue(existing);

    await service.deletePlot('plot-1');
    expect(mockPlotsRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('deletePlot should throw AppError if plot not found', async () => {
    mockPlotsRepo.findOne.mockResolvedValue(null);
    await expect(service.deletePlot('999')).rejects.toBeInstanceOf(AppError);
  });
});
