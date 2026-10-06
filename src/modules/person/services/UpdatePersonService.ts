import { getCustomRepository } from 'typeorm';

import AppError from '@shared/errors/AppError';
import Person from '../typeorm/entities/Person';
import { PersonRepository } from '../typeorm/repositories/PersonRepository';

interface IRequest {
  id: number;
  name: string;
  cpf: string;
  birth_date: Date;
  telephone: string;
  email?: string;
  status?: boolean;
}

class UpdatePersonService {
  public async update({
    id,
    name,
    cpf,
    birth_date,
    telephone,
    email,
    status,
  }: IRequest): Promise<Person> {
    const personRepository = getCustomRepository(PersonRepository);

    const person = await personRepository.findOne(id);

    if (!person) {
      throw new AppError('Pessoa não encontrada.', 404);
    }

    const cpfExists = await personRepository.findByCpf(cpf);
    if (cpfExists && cpfExists.id !== id) {
      throw new AppError('Já existe outra pessoa com este CPF!', 409);
    }

    if (email) {
      const emailExists = await personRepository.findByEmail(email);
      if (emailExists && emailExists.id !== id) {
        throw new AppError('Já existe outra pessoa com este e-mail!', 409);
      }
    }

    person.name = name;
    person.cpf = cpf;
    person.birth_date = birth_date;
    person.telephone = telephone;
    if (email) {
      person.email = email;
    }
    if (status) {
      person.status = status;
    }

    await personRepository.save(person);

    return person;
  }
}

export default UpdatePersonService;