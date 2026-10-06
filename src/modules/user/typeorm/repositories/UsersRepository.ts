import { EntityRepository, Repository } from 'typeorm';
import User from '../entities/User';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {
  public async findByEmail(email: string): Promise<User | undefined> {
    return this.findOne({ where: { email } });
  }

  public async findById(id: string): Promise<User | undefined> {
    return this.findOne({ where: { id } });
  }
}
