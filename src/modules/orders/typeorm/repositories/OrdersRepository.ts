import { EntityRepository, Repository } from 'typeorm';
import Order from '../entities/Order';

@EntityRepository(Order)
export class OrdersRepository extends Repository<Order> {
  public async findByClientId(clientId: string): Promise<Order[]> {
    return this.find({ where: { client_id: clientId } });
  }
}
