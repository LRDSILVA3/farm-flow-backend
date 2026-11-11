import { Request, Response, NextFunction } from 'express';
import { getCustomRepository } from 'typeorm';
import AppError from '@shared/errors/AppError';
import { UsersRepository } from '@modules/user/typeorm/repositories/UsersRepository';
import {
  normalizeRoleLabel,
  normalizeUserStatus,
  resolveUserPermissions,
} from '@modules/user/constants/permissions';

export const ensurePermission = (...requiredPermissions: string[]) => {
  return async (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): Promise<void> => {
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
      throw new AppError('Usuário inativo. Acesso bloqueado.', 403);
    }

    const effectivePermissions = resolveUserPermissions(user.role, user.permissions);
    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normalizeRoleLabel(user.role),
      status: 'Ativo',
      permissions: effectivePermissions,
    };

    if (
      requiredPermissions.length > 0 &&
      !requiredPermissions.some(perm => effectivePermissions.includes(perm as any))
    ) {
      throw new AppError('Você não tem permissão para acessar este recurso.', 403);
    }

    return next();
  };
};

export const ensureActiveUser = ensurePermission();

