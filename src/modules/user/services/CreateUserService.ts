import { getCustomRepository } from 'typeorm';
import { hash } from 'bcryptjs';
import { UsersRepository } from '../typeorm/repositories/UsersRepository';
import AppError from '@shared/errors/AppError';
import {
  getDefaultPermissionsForRole,
  normalizeRoleLabel,
  normalizeUserStatus,
  SafeUserDTO,
  sanitizePermissions,
  sanitizeUser,
} from '../constants/permissions';

interface IRequest {
  name: string;
  email: string;
  password?: string;
  role?: string;
  phone?: string;
  status?: string;
  permissions?: string[];
}

export default class CreateUserService {
  public async execute({
    name,
    email,
    password,
    role,
    phone,
    status,
    permissions,
  }: IRequest): Promise<SafeUserDTO> {
    const usersRepository = getCustomRepository(UsersRepository);
    const userExists = await usersRepository.findByEmail(email);

    if (userExists) {
      throw new AppError('Email address already used.');
    }

    const hashedPassword = password ? await hash(password, 8) : undefined;
    const roleLabel = normalizeRoleLabel(role);
    const normalizedStatus = normalizeUserStatus(status);
    const resolvedPermissions =
      permissions !== undefined
        ? sanitizePermissions(permissions)
        : getDefaultPermissionsForRole(roleLabel);

    const user = usersRepository.create({
      name,
      email,
      password: hashedPassword,
      role: roleLabel,
      phone: phone ? String(phone).trim() : undefined,
      status: normalizedStatus,
      permissions: resolvedPermissions,
    });

    await usersRepository.save(user);

    return sanitizeUser(user);
  }
}
