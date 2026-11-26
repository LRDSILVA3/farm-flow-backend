import { getCustomRepository } from 'typeorm';
import { UserPositionRepository } from '../typeorm/repositories/UserPositionRepository';
import { UsersRepository } from '@modules/user/typeorm/repositories/UsersRepository';
import AppError from '@shared/errors/AppError';

interface IRequest {
  id: number;
}

class DeleteUserPositionService {
  public async execute({ id }: IRequest): Promise<void> {
    const repository = getCustomRepository(UserPositionRepository);

    const position = await repository.findOne(id);
    if (!position) {
      throw new AppError('Cargo não encontrado.');
    }

    if (position.name.toLowerCase() === 'administrador') {
      throw new AppError('O cargo Administrador é fundamental para o sistema e não pode ser excluído.');
    }

    // Verificar se há usuários associados a este cargo
    const usersRepository = getCustomRepository(UsersRepository);
    const usersWithRole = await usersRepository.find({
      where: { role: position.name },
    });

    if (usersWithRole.length > 0) {
      throw new AppError(
        `Não é possível excluir o cargo "${position.name}" pois existem ${usersWithRole.length} usuário(s) vinculado(s) a ele. Altere o cargo desses usuários antes de excluir.`,
      );
    }

    await repository.remove(position);
  }
}

export default DeleteUserPositionService;
