import { getCustomRepository } from 'typeorm';
import { CostVariablesRepository } from '../typeorm/repositories/CostVariablesRepository';
import CostVariable from '../typeorm/entities/CostVariable';

class ListCostVariablesService {
  public async execute(): Promise<CostVariable[]> {
    const costVariablesRepository = getCustomRepository(CostVariablesRepository);
    return costVariablesRepository.find({
      order: { category: 'ASC', code: 'ASC' },
    });
  }
}

export default ListCostVariablesService;
