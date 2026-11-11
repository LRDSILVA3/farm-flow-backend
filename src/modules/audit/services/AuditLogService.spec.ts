import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuditRepo = {
  create: vi.fn((data: any) => ({ id: 'aud-1', ...data })),
  save: vi.fn((item: any) => Promise.resolve(item)),
  createQueryBuilder: vi.fn(),
};

vi.mock('typeorm', () => ({
  getRepository: vi.fn(() => mockAuditRepo),
  Entity: () => () => {},
  PrimaryGeneratedColumn: () => () => {},
  Column: () => () => {},
  CreateDateColumn: () => () => {},
}));

import {
  diffObjects,
  formatChangesSummary,
  listAuditLogs,
  recordAudit,
  sanitizeAuditData,
} from './AuditLogService';

describe('AuditLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('strips sensitive secrets and omitted fields in sanitizeAuditData', () => {
    const clean = sanitizeAuditData({
      id: 'u1',
      name: 'Admin',
      password: 'hashed-password',
      token: 'jwt',
      logs: [{ a: 1 }],
    });

    expect(clean).toEqual({ id: 'u1', name: 'Admin' });
    expect(clean?.password).toBeUndefined();
    expect(clean?.token).toBeUndefined();
  });

  it('computes field diffs cleanly while ignoring decimal formatting noise', () => {
    const changes = diffObjects(
      { area: '50.00', value: 1000, status: 'Pendente' },
      { area: 50, value: 1500.5, status: 'Em Andamento' },
      {
        area: { label: 'Área', format: 'area' },
        value: { label: 'Valor', format: 'currency' },
        status: 'Status',
      },
    );

    expect(changes).toHaveLength(2);
    expect(changes.map(c => c.field)).toEqual(['value', 'status']);
    expect(formatChangesSummary(changes)).toContain('Pendente → Em Andamento');
  });

  it('records immutable audit log extracting actor and forwarded IP from request', async () => {
    const req: any = {
      user: {
        id: 'usr-1',
        name: 'Administrador FarmFlow',
        email: 'admin@farmflow.com',
        role: 'Administrador',
      },
      headers: {
        'x-forwarded-for': '187.10.20.30, 10.0.0.1',
        'user-agent': 'Vitest/1.0',
      },
    };

    await recordAudit({
      req,
      module: 'users',
      action: 'UPDATE',
      entityId: 'usr-2',
      entityLabel: 'João Operador',
      summary: 'Cargo alterado',
    });

    expect(mockAuditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'usr-1',
        user_name: 'Administrador FarmFlow',
        ip_address: '187.10.20.30',
        module: 'users',
        action: 'UPDATE',
      }),
    );
    expect(mockAuditRepo.save).toHaveBeenCalled();
  });

  it('applies filters and pagination in listAuditLogs', async () => {
    const qb = {
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([[{ id: 'a1' }], 1]),
    };
    mockAuditRepo.createQueryBuilder.mockReturnValue(qb);

    const res = await listAuditLogs({
      module: 'orders',
      action: 'UPDATE',
      search: 'Lucas',
      page: 2,
      limit: 10,
    });

    expect(res.total).toBe(1);
    expect(res.page).toBe(2);
    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
  });
});

