import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockOrdersRepo = {
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn((data: any) => ({ id: 'order-1', ...data })),
  save: vi.fn((o: any) => Promise.resolve(o)),
  remove: vi.fn(),
};

vi.mock('typeorm', () => ({
  getCustomRepository: vi.fn(() => mockOrdersRepo),
  getRepository: vi.fn(() => mockOrdersRepo),
  EntityRepository: () => () => {},
  Repository: class Repository {},
  Entity: () => () => {},
  PrimaryGeneratedColumn: () => () => {},
  Column: () => () => {},
  CreateDateColumn: () => () => {},
  UpdateDateColumn: () => () => {},
  ManyToOne: () => () => {},
  OneToMany: () => () => {},
  JoinColumn: () => () => {},
}));

import { OrdersService } from './OrdersService';
import AppError from '@shared/errors/AppError';

describe('Orders Service', () => {
  let service: OrdersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrdersService();
  });

  it('list should return orders with client and farm relations', async () => {
    mockOrdersRepo.find.mockResolvedValue([
      { id: 'order-1', status: 'draft', total_amount: 1500 },
    ]);

    const result = await service.list();
    expect(result).toHaveLength(1);
    expect(mockOrdersRepo.find).toHaveBeenCalledWith({
      relations: ['client', 'farm'],
      order: { created_at: 'DESC' },
    });
  });

  it('create should save and return a new order', async () => {
    const data = {
      client_id: 'client-1',
      farm_id: 'farm-1',
      area: 24.2,
      total_amount: 5000,
      status: 'pending',
    };

    const result = await service.create(data);
    expect(result).toHaveProperty('id', 'order-1');
    expect(mockOrdersRepo.create).toHaveBeenCalledWith(data);
    expect(mockOrdersRepo.save).toHaveBeenCalled();
  });

  it('create should throw AppError if client_id is missing', async () => {
    await expect(
      service.create({
        client_id: '',
        area: 10,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('create should throw AppError if area is missing or <= 0 for non-product service', async () => {
    await expect(
      service.create({
        client_id: 'client-1',
        area: 0,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('create should allow area 0 for product order (type=Produto)', async () => {
    const data = {
      client_id: 'client-1',
      type: 'Produto',
      service_name: 'Venda de Produtos',
      area: 0,
      value: 1600,
    };
    const result = await service.create(data);
    expect(result).toHaveProperty('id', 'order-1');
  });

  it('update should update existing order fields', async () => {
    const existing = { id: 'order-1', status: 'pending', total_amount: 5000 };
    mockOrdersRepo.findOne.mockResolvedValue(existing);

    const result = await service.update('order-1', {
      status: 'completed',
      total_amount: 5200,
    });

    expect(result.status).toBe('completed');
    expect(result.total_amount).toBe(5200);
    expect(mockOrdersRepo.save).toHaveBeenCalled();
  });

  it('update should throw AppError if trying to add schedule to a pending order', async () => {
    const existing = { id: 'order-1', status: 'Pendente', schedules: [] };
    mockOrdersRepo.findOne.mockResolvedValue(existing);

    await expect(
      service.update('order-1', {
        schedules: [{ id: 'sched-1', scheduledDate: '2026-11-25' }],
      }),
    ).rejects.toThrow('O pedido não pode ser agendado pois está aguardando aprovação');
  });

  it('update should throw AppError if trying to add execution to a pending order', async () => {
    const existing = { id: 'order-1', status: 'Pendente', executions: [], executed_area: 0 };
    mockOrdersRepo.findOne.mockResolvedValue(existing);

    await expect(
      service.update('order-1', {
        executions: [{ id: 'exec-1', areaExecuted: 50 }],
        executed_area: 50,
      }),
    ).rejects.toThrow('O pedido não pode ser executado pois está aguardando aprovação');
  });

  it('update should allow schedule and execution when order is approved', async () => {
    const existing = { id: 'order-1', status: 'Aprovado', schedules: [], executions: [], executed_area: 0 };
    mockOrdersRepo.findOne.mockResolvedValue(existing);

    const result = await service.update('order-1', {
      schedules: [{ id: 'sched-1', scheduledDate: '2026-11-25' }],
      executions: [{ id: 'exec-1', areaExecuted: 50 }],
      executed_area: 50,
    });

    expect(result.schedules).toHaveLength(1);
    expect(result.executed_area).toBe(50);
    expect(mockOrdersRepo.save).toHaveBeenCalled();
  });

  it('update should allow recording payment on approved order even when area/value formatting differs ("100.00" vs 100)', async () => {
    const existing = {
      id: 'order-1',
      status: 'Aprovado',
      client_id: 'c1',
      farm_id: 'f1',
      service_name: 'Amostragem',
      type: 'Serviço',
      service_group: null,
      area: '100.00',
      value: '10000.00',
      products_data: null,
      payments: [],
      paid_amount: 0,
      payment: 'Aguardando',
    };
    mockOrdersRepo.findOne.mockResolvedValue(existing);

    const result = await service.update('order-1', {
      client_id: 'c1',
      farm_id: 'f1',
      service_name: 'Amostragem',
      type: 'Serviço',
      service_group: '',
      area: 100,
      value: 10000,
      products_data: [],
      payments: [{ id: 'pay-1', amount: 5000, method: 'PIX', date: '2026-11-22' }],
      paid_amount: 5000,
      payment: 'Parcial',
    });

    expect(result.paid_amount).toBe(5000);
    expect(result.payment).toBe('Parcial');
    expect(mockOrdersRepo.save).toHaveBeenCalled();
  });

  it('update should throw AppError if trying to edit contract fields of an approved order', async () => {
    const existing = { id: 'order-1', status: 'Aprovado', client_id: 'c1', service_name: 'Amostragem', area: 100, value: 'R$ 10.000,00' };
    mockOrdersRepo.findOne.mockResolvedValue(existing);

    await expect(
      service.update('order-1', {
        service_name: 'Novo Serviço Alterado',
      }),
    ).rejects.toThrow('Depois de aprovado, o pedido não pode ser editado.');

    await expect(
      service.update('order-1', {
        area: 120,
      }),
    ).rejects.toThrow('Depois de aprovado, o pedido não pode ser editado.');
  });

  it('update should throw AppError if order does not exist', async () => {
    mockOrdersRepo.findOne.mockResolvedValue(null);
    await expect(
      service.update('999', { status: 'completed' })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('delete should remove order', async () => {
    const existing = { id: 'order-1' };
    mockOrdersRepo.findOne.mockResolvedValue(existing);
    mockOrdersRepo.remove.mockResolvedValue(existing);

    await service.delete('order-1');
    expect(mockOrdersRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('delete should throw AppError if order does not exist', async () => {
    mockOrdersRepo.findOne.mockResolvedValue(null);
    await expect(service.delete('999')).rejects.toBeInstanceOf(AppError);
  });
});
