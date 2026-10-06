import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockServicesRepo = {
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn((data: any) => ({ id: 'srv-1', ...data })),
  save: vi.fn((s: any) => Promise.resolve(s)),
  remove: vi.fn(),
};

const mockGroupsRepo = {
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn((data: any) => ({ id: 'grp-1', ...data })),
  save: vi.fn((g: any) => Promise.resolve(g)),
  remove: vi.fn(),
};

vi.mock('typeorm', () => ({
  getCustomRepository: vi.fn((repo: any) => {
    if (repo && (repo.name === 'ServiceGroupsRepository' || repo.name === 'ServiceGroupRepository')) return mockGroupsRepo;
    return mockServicesRepo;
  }),
  getRepository: vi.fn(() => mockServicesRepo),
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

import { ServicesManager } from './ServicesManager';
import AppError from '@shared/errors/AppError';

describe('Services Manager', () => {
  let manager: ServicesManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new ServicesManager();
  });

  it('listServices should return all services', async () => {
    mockServicesRepo.find.mockResolvedValue([
      { id: 's1', name: 'Coleta de Solo' },
    ]);

    const result = await manager.listServices();
    expect(result).toHaveLength(1);
    expect(mockServicesRepo.find).toHaveBeenCalledWith({
      order: { created_at: 'DESC' },
    });
  });

  it('createService should save and return a new service', async () => {
    const data = {
      name: 'Voo Drone',
      service_group_id: 'g1',
      unit_type: 'ha',
      default_price: 25.0,
    };

    const result = await manager.createService(data);
    expect(result).toHaveProperty('id', 'srv-1');
    expect(mockServicesRepo.create).toHaveBeenCalledWith(data);
    expect(mockServicesRepo.save).toHaveBeenCalled();
  });

  it('updateService should update existing service', async () => {
    const existing = { id: 's1', name: 'Antigo' };
    mockServicesRepo.findOne.mockResolvedValue(existing);

    const result = await manager.updateService('s1', { name: 'Novo Nome', default_price: 30 });
    expect(result.name).toBe('Novo Nome');
    expect(mockServicesRepo.save).toHaveBeenCalled();
  });

  it('updateService should throw AppError if service not found', async () => {
    mockServicesRepo.findOne.mockResolvedValue(null);
    await expect(manager.updateService('999', { name: 'X' })).rejects.toBeInstanceOf(AppError);
  });

  it('deleteService should remove service', async () => {
    const existing = { id: 's1' };
    mockServicesRepo.findOne.mockResolvedValue(existing);
    mockServicesRepo.remove.mockResolvedValue(existing);

    await manager.deleteService('s1');
    expect(mockServicesRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('deleteService should throw AppError if not found', async () => {
    mockServicesRepo.findOne.mockResolvedValue(null);
    await expect(manager.deleteService('999')).rejects.toBeInstanceOf(AppError);
  });

  it('listGroups should return all service groups ordered by created_at', async () => {
    mockGroupsRepo.find.mockResolvedValue([{ id: 'g1', name: 'Diagnóstico' }]);

    const result = await manager.listGroups();
    expect(result).toHaveLength(1);
    expect(mockGroupsRepo.find).toHaveBeenCalledWith({ order: { created_at: 'DESC' } });
  });

  it('createGroup should create a new group', async () => {
    const data = { name: 'Biológicos', description: 'Serviços e insumos biológicos' };
    const result = await manager.createGroup(data);

    expect(result).toHaveProperty('id', 'grp-1');
    expect(mockGroupsRepo.create).toHaveBeenCalledWith(data);
  });

  it('updateGroup should update group fields', async () => {
    const existing = { id: 'grp-1', name: 'Antigo' };
    mockGroupsRepo.findOne.mockResolvedValue(existing);

    const result = await manager.updateGroup('grp-1', { name: 'Novo' });
    expect(result.name).toBe('Novo');
    expect(mockGroupsRepo.save).toHaveBeenCalled();
  });

  it('updateGroup should throw AppError if not found', async () => {
    mockGroupsRepo.findOne.mockResolvedValue(null);
    await expect(manager.updateGroup('999', { name: 'X' })).rejects.toBeInstanceOf(AppError);
  });

  it('deleteGroup should remove group', async () => {
    const existing = { id: 'grp-1' };
    mockGroupsRepo.findOne.mockResolvedValue(existing);
    mockGroupsRepo.remove.mockResolvedValue(existing);

    await manager.deleteGroup('grp-1');
    expect(mockGroupsRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('deleteGroup should throw AppError if not found', async () => {
    mockGroupsRepo.findOne.mockResolvedValue(null);
    await expect(manager.deleteGroup('999')).rejects.toBeInstanceOf(AppError);
  });
});
