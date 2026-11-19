import { getCustomRepository, getRepository, In } from 'typeorm';
import { ServicesRepository } from '../typeorm/repositories/ServicesRepository';
import { ServiceGroupsRepository } from '../typeorm/repositories/ServiceGroupsRepository';
import Service from '../typeorm/entities/Service';
import ServiceProduct from '../typeorm/entities/ServiceProduct';
import ServiceGroup from '../typeorm/entities/ServiceGroup';
import Product from '@modules/products/typeorm/entities/Product';
import AppError from '@shared/errors/AppError';

export interface IServiceDTO extends Partial<Service> {
  product_ids?: string[];
}

export class ServicesManager {
  public async listServices(): Promise<Service[]> {
    const repo = getCustomRepository(ServicesRepository);
    return repo.find({
      order: { created_at: 'DESC' },
      relations: ['service_products', 'service_products.product'],
    });
  }

  public async getService(id: string): Promise<Service> {
    const repo = getCustomRepository(ServicesRepository);
    const service = await repo.findOne(id, {
      relations: ['service_products', 'service_products.product'],
    });
    if (!service) throw new AppError('Service not found', 404);
    return service;
  }

  public async createService(data: IServiceDTO): Promise<Service> {
    const repo = getCustomRepository(ServicesRepository);
    const { product_ids, ...serviceData } = data;

    const service = repo.create(serviceData);
    await repo.save(service);

    if (product_ids && Array.isArray(product_ids)) {
      await this.syncServiceProducts(service.id, product_ids);
    }

    return this.getService(service.id);
  }

  public async updateService(id: string, data: IServiceDTO): Promise<Service> {
    const repo = getCustomRepository(ServicesRepository);
    const service = await repo.findOne(id);
    if (!service) throw new AppError('Service not found', 404);

    const { product_ids, ...serviceData } = data;
    Object.assign(service, serviceData);
    await repo.save(service);

    if (product_ids && Array.isArray(product_ids)) {
      await this.syncServiceProducts(service.id, product_ids);
    }

    return this.getService(service.id);
  }

  public async syncServiceProducts(serviceId: string, productIds: string[]): Promise<void> {
    const spRepo = getRepository(ServiceProduct);
    const productsRepo = getRepository(Product);
    const servicesRepo = getCustomRepository(ServicesRepository);

    // Remove old links
    await spRepo.delete({ service_id: serviceId });

    if (productIds.length > 0) {
      const validProducts = await productsRepo.find({
        where: { id: In(productIds) },
      });

      const newLinks = validProducts.map((p) =>
        spRepo.create({
          service_id: serviceId,
          product_id: p.id,
        })
      );
      await spRepo.save(newLinks);

      // Update text representation for legacy compatibility
      const productNames = validProducts.map((p) => p.name).join(', ');
      await servicesRepo.update(serviceId, { products: productNames });
    } else {
      await servicesRepo.update(serviceId, { products: '' });
    }
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
