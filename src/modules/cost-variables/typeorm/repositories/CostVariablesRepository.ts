import { EntityRepository, Repository } from 'typeorm';
import CostVariable from '../entities/CostVariable';

@EntityRepository(CostVariable)
export class CostVariablesRepository extends Repository<CostVariable> {
  public async findByCode(code: string): Promise<CostVariable | undefined> {
    return this.findOne({
      where: { code },
    });
  }
}
