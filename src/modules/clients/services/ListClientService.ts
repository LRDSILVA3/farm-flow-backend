import { getCustomRepository } from 'typeorm';
import { ClientRepository } from '../typeorm/repositories/ClientRepository';
import Client from '../typeorm/entities/Client';

export default class ListClientService {
  public async execute(): Promise<Client[]> {
    const clientsRepository = getCustomRepository(ClientRepository);
    return clientsRepository.find({ order: { name: 'ASC' } });
  }
}
