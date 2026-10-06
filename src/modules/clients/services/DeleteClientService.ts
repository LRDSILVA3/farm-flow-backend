import { getCustomRepository } from 'typeorm';
import { ClientRepository } from '../typeorm/repositories/ClientRepository';
import AppError from '@shared/errors/AppError';

export default class DeleteClientService {
  public async execute(id: string): Promise<void> {
    const clientsRepository = getCustomRepository(ClientRepository);
    const client = await clientsRepository.findOne(id);

    if (!client) {
      throw new AppError('Client not found.', 404);
    }

    await clientsRepository.remove(client);
  }
}
