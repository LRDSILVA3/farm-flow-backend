import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { hash } from 'bcryptjs';
import CreateUserService from '../services/CreateUserService';
import { UsersRepository } from '../typeorm/repositories/UsersRepository';
import AppError from '@shared/errors/AppError';
import {
  diffObjects,
  formatChangesSummary,
  recordAudit,
} from '@modules/audit/services/AuditLogService';
import {
  normalizeRoleLabel,
  normalizeUserStatus,
  resolveUserPermissions,
  sanitizePermissions,
  sanitizeUser,
} from '../constants/permissions';

const USER_AUDIT_FIELDS = {
  name: 'Nome',
  email: 'Email',
  role: 'Cargo',
  status: 'Status',
  phone: 'Telefone',
  permissions: { label: 'Permissões', format: 'array' as const },
};

export default class UsersController {
  public async index(request: Request, response: Response): Promise<Response> {
    const usersRepository = getCustomRepository(UsersRepository);
    const users = await usersRepository.find({ order: { created_at: 'ASC' } });
    return response.json(users.map(sanitizeUser));
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const { name, email, password, role, phone, status, permissions } = request.body;
    const createUserService = new CreateUserService();
    const user = await createUserService.execute({
      name,
      email,
      password,
      role,
      phone,
      status,
      permissions,
    });
    await recordAudit({
      req: request,
      module: 'users',
      action: 'CREATE',
      entityId: user.id,
      entityLabel: `${user.name} (${user.email})`,
      summary: `Usuário criado: ${user.name} (${user.role})`,
      afterData: user,
    });
    return response.status(201).json(user);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { name, email, password, role, phone, status, permissions } = request.body;
    const usersRepository = getCustomRepository(UsersRepository);
    const user = await usersRepository.findById(id);

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const beforeSnapshot = sanitizeUser(user);

    const isSelf = request.user?.id === id;
    const nextStatus = status !== undefined ? normalizeUserStatus(status) : normalizeUserStatus(user.status);
    const nextRole = role !== undefined ? normalizeRoleLabel(role) : normalizeRoleLabel(user.role);
    const nextPermissions =
      permissions !== undefined
        ? sanitizePermissions(permissions)
        : resolveUserPermissions(nextRole, user.permissions);

    if (isSelf && nextStatus === 'Inativo') {
      throw new AppError('Você não pode inativar o seu próprio usuário.', 400);
    }

    if (isSelf && !nextPermissions.includes('settings')) {
      throw new AppError('Você não pode remover a permissão de Configurações do seu próprio usuário.', 400);
    }

    if (email && email !== user.email) {
      const existing = await usersRepository.findByEmail(email);
      if (existing && existing.id !== id) {
        throw new AppError('Email address already used.', 400);
      }
      user.email = email;
    }

    const passwordChanged = Boolean(password && String(password).trim() !== '');
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = nextRole;
    if (phone !== undefined) user.phone = phone ? String(phone).trim() : undefined;
    if (status !== undefined) user.status = nextStatus;
    if (permissions !== undefined) user.permissions = nextPermissions;
    if (passwordChanged) {
      user.password = await hash(String(password), 8);
    }

    await usersRepository.save(user);
    const safeAfter = sanitizeUser(user);
    const changes = diffObjects(beforeSnapshot, safeAfter, USER_AUDIT_FIELDS);
    if (passwordChanged) {
      changes.push({ field: 'password', label: 'Senha', before: '••••••', after: 'Atualizada' });
    }
    await recordAudit({
      req: request,
      module: 'users',
      action: 'UPDATE',
      entityId: user.id,
      entityLabel: `${safeAfter.name} (${safeAfter.email})`,
      summary: formatChangesSummary(changes) || `Usuário atualizado: ${safeAfter.name}`,
      changes,
      beforeData: beforeSnapshot,
      afterData: safeAfter,
    });
    return response.json(safeAfter);
  }

  public async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const usersRepository = getCustomRepository(UsersRepository);

    if (request.user?.id === id) {
      throw new AppError('Você não pode excluir o usuário conectado no momento.', 400);
    }

    const totalUsers = await usersRepository.count();
    if (totalUsers <= 1) {
      throw new AppError('Não é possível excluir o único usuário do sistema.', 400);
    }

    const user = await usersRepository.findById(id);

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const beforeSnapshot = sanitizeUser(user);
    await usersRepository.remove(user);
    await recordAudit({
      req: request,
      module: 'users',
      action: 'DELETE',
      entityId: id,
      entityLabel: `${beforeSnapshot.name} (${beforeSnapshot.email})`,
      summary: `Usuário excluído: ${beforeSnapshot.name} (${beforeSnapshot.email})`,
      beforeData: beforeSnapshot,
    });
    return response.status(204).send();
  }
}
