import { getCustomRepository } from 'typeorm';
import { CostVariablesRepository } from '../typeorm/repositories/CostVariablesRepository';
import CostVariable from '../typeorm/entities/CostVariable';
import AppError from '@shared/errors/AppError';

interface IRequest {
  code: string;
  value: number;
}

class UpdateCostVariableService {
  public async execute({ code, value }: IRequest): Promise<CostVariable> {
    const costVariablesRepository = getCustomRepository(CostVariablesRepository);
    const variable = await costVariablesRepository.findByCode(code);

    if (!variable) {
      throw new AppError('Cost variable not found', 404);
    }

    variable.value = value;
    await costVariablesRepository.save(variable);

    return variable;
  }
}

export default UpdateCostVariableService;
