import { getCustomRepository } from 'typeorm';
import { ServicesRepository } from '../typeorm/repositories/ServicesRepository';
import { ServiceGroupsRepository } from '../typeorm/repositories/ServiceGroupsRepository';
import Service from '../typeorm/entities/Service';
import ServiceGroup from '../typeorm/entities/ServiceGroup';
import AppError from '@shared/errors/AppError';

export class ServicesManager {
  public async listServices(): Promise<Service[]> {
    const repo = getCustomRepository(ServicesRepository);
    return repo.find({ order: { created_at: 'DESC' } });
  }

  public async createService(data: Partial<Service>): Promise<Service> {
    const repo = getCustomRepository(ServicesRepository);
    const service = repo.create(data);
    await repo.save(service);
    return service;
  }

  public async updateService(id: string, data: Partial<Service>): Promise<Service> {
    const repo = getCustomRepository(ServicesRepository);
    const service = await repo.findOne(id);
    if (!service) throw new AppError('Service not found', 404);
    Object.assign(service, data);
    await repo.save(service);
    return service;
  }

  public async deleteService(id: string): Promise<void> {
    const repo = getCustomRepository(ServicesRepository);
    const service = await repo.findOne(id);
    if (!service) throw new AppError('Service not found', 404);
    await repo.remove(service);
  }

  // Groups
  public async listGroups(): Promise<ServiceGroup[]> {
    const repo = getCustomRepository(ServiceGroupsRepository);
    return repo.find({ order: { created_at: 'DESC' } });
  }

  public async createGroup(data: Partial<ServiceGroup>): Promise<ServiceGroup> {
    const repo = getCustomRepository(ServiceGroupsRepository);
    const group = repo.create(data);
    await repo.save(group);
    return group;
  }

  public async updateGroup(id: string, data: Partial<ServiceGroup>): Promise<ServiceGroup> {
    const repo = getCustomRepository(ServiceGroupsRepository);
    const group = await repo.findOne(id);
    if (!group) throw new AppError('Group not found', 404);
    Object.assign(group, data);
    await repo.save(group);
    return group;
  }

  public async deleteGroup(id: string): Promise<void> {
    const repo = getCustomRepository(ServiceGroupsRepository);
    const group = await repo.findOne(id);
    if (!group) throw new AppError('Group not found', 404);
    await repo.remove(group);
  }
}
