import { getCustomRepository } from 'typeorm';
import { PersonRepository } from '../typeorm/repositories/PersonRepository';
import AppError from '@shared/errors/AppError';
import Person from '../typeorm/entities/Person';

interface IRequest {
  name: string;
  cpf: string;
  birth_date: Date;
  telephone: string;
  email?: string;
}

class CreatePersonService {
  public async create({
    name,
    cpf,
    birth_date,
    telephone,
    email,
  }: IRequest): Promise<Person> {
    const personRepository = getCustomRepository(PersonRepository);

    const personExists = await personRepository.findByCpf(cpf);

    if (personExists) {
      throw new AppError('Já existe uma pessoa com este CPF!', 409);
    }

    if (email) {
      const emailExists = await personRepository.findByEmail(email);
      if (emailExists) {
        throw new AppError('Já existe uma pessoa com este e-mail!', 409);
      }
    }

    const person = personRepository.create({
      name,
      cpf,
      birth_date,
      telephone,
      email,
    });

    await personRepository.save(person);

    return person;
  }
}

export default CreatePersonService;