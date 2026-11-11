import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import AppError from '@shared/errors/AppError';
import CreateSessionService from '../services/CreateSessionService';
import { UsersRepository } from '../typeorm/repositories/UsersRepository';
import { normalizeUserStatus, sanitizeUser } from '../constants/permissions';
import { recordAudit } from '@modules/audit/services/AuditLogService';

export default class SessionsController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { email, password } = request.body;
    const createSession = new CreateSessionService();
    const { user, token } = await createSession.execute({ email, password });

    await recordAudit({
      req: request,
      actor: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      module: 'sessions',
      action: 'LOGIN',
      entityId: user.id,
      entityLabel: `${user.name} (${user.email})`,
      summary: `Login efetuado por ${user.name} (${user.role})`,
    });

    return response.json({ user, token });
  }

  public async me(request: Request, response: Response): Promise<Response> {
    const userId = request.user?.id;
    if (!userId) {
      throw new AppError('JWT token is missing', 401);
    }

    const usersRepository = getCustomRepository(UsersRepository);
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw new AppError('Sessão inválida. Faça login novamente.', 401);
    }

    if (normalizeUserStatus(user.status) === 'Inativo') {
      throw new AppError('Usuário inativo. Contate o administrador.', 403);
    }

    return response.json({ user: sanitizeUser(user) });
  }
}
