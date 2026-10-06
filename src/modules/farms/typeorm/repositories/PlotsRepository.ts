import { EntityRepository, Repository } from 'typeorm';
import Plot from '../entities/Plot';

@EntityRepository(Plot)
export class PlotsRepository extends Repository<Plot> {
  public async findByFarmId(farmId: string): Promise<Plot[]> {
    return this.find({ where: { farm_id: farmId } });
  }
}
