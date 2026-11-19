import { getCustomRepository } from 'typeorm';
import { OrdersRepository } from '../typeorm/repositories/OrdersRepository';
import Order from '../typeorm/entities/Order';
import AppError from '@shared/errors/AppError';

export class OrdersService {
  public async list(): Promise<Order[]> {
    const repo = getCustomRepository(OrdersRepository);
    return repo.find({ relations: ['client', 'farm'], order: { created_at: 'DESC' } });
  }

  public async create(data: Partial<Order>): Promise<Order> {
    if (!data.client_id || data.client_id.trim() === '') {
      throw new AppError('O cliente é obrigatório para cadastrar o pedido.', 400);
    }
    const numArea = Number(data.area || 0);
    if (!numArea || numArea <= 0) {
      throw new AppError('A área deve ser informada e maior que zero.', 400);
    }

    const repo = getCustomRepository(OrdersRepository);
    const order = repo.create(data);
    await repo.save(order);
    return order;
  }

  public async update(id: string, data: Partial<Order>): Promise<Order> {
    const repo = getCustomRepository(OrdersRepository);
    const order = await repo.findOne(id);
    if (!order) throw new AppError('Order not found', 404);

    Object.assign(order, data);
    await repo.save(order);
    return order;
  }

  public async delete(id: string): Promise<void> {
    const repo = getCustomRepository(OrdersRepository);
    const order = await repo.findOne(id);
    if (!order) throw new AppError('Order not found', 404);
    await repo.remove(order);
  }
}
