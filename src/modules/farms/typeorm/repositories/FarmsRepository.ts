import { EntityRepository, Repository } from 'typeorm';
import Farm from '../entities/Farm';

@EntityRepository(Farm)
export class FarmsRepository extends Repository<Farm> {
  public async findByClientId(clientId: string): Promise<Farm[]> {
    return this.find({ where: { client_id: clientId }, relations: ['plots', 'client'] });
  }
}
