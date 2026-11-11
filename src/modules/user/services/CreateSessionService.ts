import { getCustomRepository } from 'typeorm';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { UsersRepository } from '../typeorm/repositories/UsersRepository';
import AppError from '@shared/errors/AppError';
import {
  normalizeUserStatus,
  SafeUserDTO,
  sanitizeUser,
} from '../constants/permissions';

interface IRequest {
  email: string;
  password?: string;
}

interface IResponse {
  user: SafeUserDTO;
  token: string;
}

export default class CreateSessionService {
  public async execute({ email, password }: IRequest): Promise<IResponse> {
    const usersRepository = getCustomRepository(UsersRepository);
    const user = await usersRepository.findByEmail(email);

    if (!user) {
      throw new AppError('Incorrect email/password combination.', 401);
    }

    if (user.password) {
      if (!password) {
        throw new AppError('Incorrect email/password combination.', 401);
      }
      const passwordMatched = await compare(password, user.password);
      if (!passwordMatched) {
        throw new AppError('Incorrect email/password combination.', 401);
      }
    }

    if (normalizeUserStatus(user.status) === 'Inativo') {
      throw new AppError('Usuário inativo. Contate o administrador.', 403);
    }

    const safeUser = sanitizeUser(user);

    const token = sign(
      { role: safeUser.role },
      process.env.APP_SECRET || 'farmflow-secret-key-2026',
      {
        subject: user.id,
        expiresIn: '7d',
      },
    );

    return { user: safeUser, token };
  }
}
