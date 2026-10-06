import { getCustomRepository } from 'typeorm';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { UsersRepository } from '../typeorm/repositories/UsersRepository';
import AppError from '@shared/errors/AppError';
import User from '../typeorm/entities/User';

interface IRequest {
  email: string;
  password?: string;
}

interface IResponse {
  user: User;
  token: string;
}

export default class CreateSessionService {
  public async execute({ email, password }: IRequest): Promise<IResponse> {
    const usersRepository = getCustomRepository(UsersRepository);
    const user = await usersRepository.findByEmail(email);

    if (!user) {
      throw new AppError('Incorrect email/password combination.', 401);
    }

    if (user.password && password) {
      const passwordMatched = await compare(password, user.password);
      if (!passwordMatched) {
        throw new AppError('Incorrect email/password combination.', 401);
      }
    }

    const token = sign({}, process.env.APP_SECRET || 'farmflow-secret-key-2026', {
      subject: user.id,
      expiresIn: '7d',
    });

    delete user.password;

    return { user, token };
  }
}
