import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureActiveUser, ensurePermission } from './ensurePermission';
import AppError from '@shared/errors/AppError';

const mockUsersRepo = {
  findById: vi.fn(),
};

vi.mock('typeorm', () => ({
  getCustomRepository: vi.fn(() => mockUsersRepo),
  EntityRepository: () => () => {},
  Repository: class Repository {},
  Entity: () => () => {},
  PrimaryGeneratedColumn: () => () => {},
  Column: () => () => {},
  CreateDateColumn: () => () => {},
  UpdateDateColumn: () => () => {},
}));

describe('ensurePermission middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows access when active user has required permission', async () => {
    mockUsersRepo.findById.mockResolvedValue({
      id: 'usr-1',
      name: 'Maria Financeira',
      email: 'maria@farmflow.com',
      role: 'Financeiro',
      status: 'Ativo',
      permissions: ['dashboard', 'financial'],
    });
    const req: any = { user: { id: 'usr-1' } };
    const next = vi.fn();

    await ensurePermission('financial')(req, {} as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({
      id: 'usr-1',
      name: 'Maria Financeira',
      email: 'maria@farmflow.com',
      role: 'Financeiro',
      status: 'Ativo',
      permissions: ['dashboard', 'financial'],
    });
  });

  it('allows multi-permission route if user matches any allowed permission', async () => {
    mockUsersRepo.findById.mockResolvedValue({
      id: 'usr-2',
      role: 'Operador de Campo',
      status: 'Ativo',
      permissions: ['dashboard', 'orders', 'schedule'],
    });
    const req: any = { user: { id: 'usr-2' } };
    const next = vi.fn();

    await ensurePermission('financial', 'orders')(req, {} as any, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('grants legacy admin role full permissions when permissions column is null', async () => {
    mockUsersRepo.findById.mockResolvedValue({
      id: 'usr-admin',
      role: 'admin',
      status: 'Ativo',
      permissions: null,
    });
    const req: any = { user: { id: 'usr-admin' } };
    const next = vi.fn();

    await ensurePermission('settings')(req, {} as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.permissions).toContain('settings');
  });

  it('throws 403 when user lacks required permission', async () => {
    mockUsersRepo.findById.mockResolvedValue({
      id: 'usr-3',
      role: 'Operador de Campo',
      status: 'Ativo',
      permissions: ['dashboard', 'schedule'],
    });
    const req: any = { user: { id: 'usr-3' } };
    const next = vi.fn();

    await expect(
      ensurePermission('settings')(req, {} as any, next),
    ).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('throws 403 when user is Inativo even with valid token', async () => {
    mockUsersRepo.findById.mockResolvedValue({
      id: 'usr-4',
      role: 'Administrador',
      status: 'Inativo',
      permissions: ['dashboard', 'settings'],
    });
    const req: any = { user: { id: 'usr-4' } };
    const next = vi.fn();

    await expect(ensureActiveUser(req, {} as any, next)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('throws 401 when user does not exist in database', async () => {
    mockUsersRepo.findById.mockResolvedValue(null);
    const req: any = { user: { id: 'missing-user' } };
    const next = vi.fn();

    await expect(ensureActiveUser(req, {} as any, next)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('throws 401 if request.user is missing', async () => {
    const req: any = {};
    const next = vi.fn();

    await expect(ensureActiveUser(req, {} as any, next)).rejects.toBeInstanceOf(AppError);
  });
});

