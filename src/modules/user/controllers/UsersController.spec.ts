import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUsersRepo = {
  find: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  save: vi.fn((u: any) => Promise.resolve(u)),
  remove: vi.fn(() => Promise.resolve()),
  count: vi.fn(),
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

vi.mock('bcryptjs', () => ({
  hash: vi.fn(() => Promise.resolve('hashed-pwd')),
}));

import UsersController from './UsersController';

const createMockResponse = () => {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  res.send = vi.fn(() => res);
  return res;
};

describe('UsersController', () => {
  const controller = new UsersController();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents self-inactivation during update', async () => {
    mockUsersRepo.findById.mockResolvedValue({
      id: 'usr-admin',
      name: 'Admin',
      email: 'admin@farmflow.com',
      role: 'Administrador',
      status: 'Ativo',
      permissions: ['dashboard', 'settings'],
    });

    const req: any = {
      params: { id: 'usr-admin' },
      user: { id: 'usr-admin' },
      body: { status: 'Inativo' },
    };

    await expect(controller.update(req, createMockResponse())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('prevents removing own settings permission', async () => {
    mockUsersRepo.findById.mockResolvedValue({
      id: 'usr-admin',
      name: 'Admin',
      email: 'admin@farmflow.com',
      role: 'Administrador',
      status: 'Ativo',
      permissions: ['dashboard', 'settings'],
    });

    const req: any = {
      params: { id: 'usr-admin' },
      user: { id: 'usr-admin' },
      body: { permissions: ['dashboard'] },
    };

    await expect(controller.update(req, createMockResponse())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('prevents deleting own currently logged-in account', async () => {
    const req: any = {
      params: { id: 'usr-admin' },
      user: { id: 'usr-admin' },
    };

    await expect(controller.delete(req, createMockResponse())).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(mockUsersRepo.remove).not.toHaveBeenCalled();
  });

  it('updates user permissions cleanly and strips password from response', async () => {
    mockUsersRepo.findById.mockResolvedValue({
      id: 'usr-2',
      name: 'Operador',
      email: 'op@farmflow.com',
      password: 'secret-hash',
      role: 'Operador de Campo',
      status: 'Ativo',
      permissions: ['dashboard'],
    });

    const req: any = {
      params: { id: 'usr-2' },
      user: { id: 'usr-admin' },
      body: {
        role: 'Financeiro',
        permissions: ['dashboard', 'financial'],
      },
    };
    const res = createMockResponse();

    await controller.update(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'usr-2',
        role: 'Financeiro',
        permissions: ['dashboard', 'financial'],
      }),
    );
    const payload = res.json.mock.calls[0][0];
    expect(payload.password).toBeUndefined();
  });
});

