import { getCustomRepository } from 'typeorm';
import { ClientRepository } from '../typeorm/repositories/ClientRepository';
import AppError from '@shared/errors/AppError';
import Client from '../typeorm/entities/Client';

interface IRequest {
  user_id?: string;
  name: string;
  cpf?: string;
  birth_date?: string;
  email?: string;
  phone?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  cad_pro?: string;
}

export default class CreateClientService {
  public async execute(data: IRequest): Promise<Client> {
    const clientsRepository = getCustomRepository(ClientRepository);
    const client = clientsRepository.create(data);
    await clientsRepository.save(client);
    return client;
  }
}
