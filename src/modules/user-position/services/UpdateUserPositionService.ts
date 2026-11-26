import { getCustomRepository } from 'typeorm';
import UserPosition from '../typeorm/entities/UserPosition';
import { UserPositionRepository } from '../typeorm/repositories/UserPositionRepository';
import AppError from '@shared/errors/AppError';

interface IRequest {
  id: number;
  name?: string;
  status?: boolean;
  permissions?: string[];
}

class UpdateUserPositionService {
  public async execute({ id, name, status, permissions }: IRequest): Promise<UserPosition> {
    const repository = getCustomRepository(UserPositionRepository);

    const position = await repository.findOne(id);
    if (!position) {
      throw new AppError('Cargo não encontrado.');
    }

    if (name && name.trim()) {
      const trimmedName = name.trim();
      const existing = await repository.findByName(trimmedName);
      if (existing && existing.id !== id) {
        throw new AppError(`Já existe um cargo cadastrado com o nome "${trimmedName}".`);
      }
      position.name = trimmedName;
    }

    if (typeof status === 'boolean') {
      position.status = status;
    }

    if (Array.isArray(permissions)) {
      position.permissions = permissions;
    }

    await repository.save(position);
    return position;
  }
}

export default UpdateUserPositionService;
