import { getCustomRepository } from 'typeorm';
import { hash } from 'bcryptjs';
import { UsersRepository } from '../typeorm/repositories/UsersRepository';
import AppError from '@shared/errors/AppError';
import User from '../typeorm/entities/User';

interface IRequest {
  name: string;
  email: string;
  password?: string;
  role?: string;
}

export default class CreateUserService {
  public async execute({ name, email, password, role }: IRequest): Promise<User> {
    const usersRepository = getCustomRepository(UsersRepository);
    const userExists = await usersRepository.findByEmail(email);

    if (userExists) {
      throw new AppError('Email address already used.');
    }

    const hashedPassword = password ? await hash(password, 8) : undefined;

    const user = usersRepository.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    await usersRepository.save(user);
    delete user.password;

    return user;
  }
}
