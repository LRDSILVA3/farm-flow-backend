import { getCustomRepository } from 'typeorm';
import UserPosition from '../typeorm/entities/UserPosition';
import { UserPositionRepository } from '../typeorm/repositories/UserPositionRepository';
import AppError from '@shared/errors/AppError';

interface IRequest {
  name: string;
  status?: boolean;
  permissions?: string[];
}

class CreateUserPositionService {
  public async execute({ name, status = true, permissions = [] }: IRequest): Promise<UserPosition> {
    const repository = getCustomRepository(UserPositionRepository);

    if (!name || !name.trim()) {
      throw new AppError('O nome do cargo é obrigatório.');
    }

    const trimmedName = name.trim();
    const existing = await repository.findByName(trimmedName);
    if (existing) {
      throw new AppError(`Já existe um cargo cadastrado com o nome "${trimmedName}".`);
    }

    const position = repository.create({
      name: trimmedName,
      status,
      permissions,
    });

    await repository.save(position);
    return position;
  }
}

export default CreateUserPositionService;
