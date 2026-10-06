import { getCustomRepository } from 'typeorm';
import { ClientRepository } from '../typeorm/repositories/ClientRepository';
import AppError from '@shared/errors/AppError';
import Client from '../typeorm/entities/Client';

interface IRequest {
  id: string;
  name?: string;
  cpf?: string;
  birth_date?: string;
  email?: string;
  phone?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  cad_pro?: string;
}

export default class UpdateClientService {
  public async execute(data: IRequest): Promise<Client> {
    const clientsRepository = getCustomRepository(ClientRepository);
    const client = await clientsRepository.findOne(data.id);

    if (!client) {
      throw new AppError('Client not found.', 404);
    }

    Object.assign(client, data);
    await clientsRepository.save(client);
    return client;
  }
}
