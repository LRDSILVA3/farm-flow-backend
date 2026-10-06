import { EntityRepository, Repository } from 'typeorm';
import Client from '../entities/Client';

@EntityRepository(Client)
export class ClientRepository extends Repository<Client> {
  public async findByName(name: string): Promise<Client | undefined> {
    return this.findOne({ where: { name } });
  }

  public async findByCpf(cpf: string): Promise<Client | undefined> {
    return this.findOne({ where: { cpf } });
  }
}
