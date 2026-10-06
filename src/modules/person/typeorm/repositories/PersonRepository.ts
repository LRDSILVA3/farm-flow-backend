import { EntityRepository, Repository } from 'typeorm';
import Person from '../entities/Person';

@EntityRepository(Person)
export class PersonRepository extends Repository<Person> {
  public async findById(id: string): Promise<Person | undefined> {
    const person = this.findOne({
      where: {
        id,
      },
    });
    return person;
  }

  public async findByCpf(cpf: string): Promise<Person | undefined> {
    const person = this.findOne({
      where: {
        cpf,
      },
    });
    return person;
  }
  public async findByEmail(email: string): Promise<Person | undefined> {
    const person = this.findOne({
      where: {
        email,
      },
    });
    return person;
  }
}
