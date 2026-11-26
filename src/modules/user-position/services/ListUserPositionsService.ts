import { getCustomRepository } from 'typeorm';
import UserPosition from '../typeorm/entities/UserPosition';
import { UserPositionRepository } from '../typeorm/repositories/UserPositionRepository';

class ListUserPositionsService {
  public async execute(): Promise<UserPosition[]> {
    const repository = getCustomRepository(UserPositionRepository);
    const positions = await repository.find({
      order: { name: 'ASC' },
    });
    return positions;
  }
}

export default ListUserPositionsService;
