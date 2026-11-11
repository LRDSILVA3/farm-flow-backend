import { describe, it, expect } from 'vitest';
import { prepareOrderUpdateWithLogs } from './orderAudit';

describe('orderAudit helpers', () => {
  const actor = {
    id: 'usr-1',
    name: 'Maria Gerente',
    email: 'maria@farmflow.com',
    role: 'Gerente',
  };

  it('appends Edição log with field diffs when OrderForm updates without adding a new log', () => {
    const existing = {
      id: 'ord-1',
      service_name: 'Amostragem de Solo (AP)',
      area: '50.00',
      value: '10000.00',
      status: 'Pendente',
      payment: 'Aguardando',
      logs: [{ id: 'log-1', action: 'Criação', userName: 'Admin', timestamp: '2026-10-01T10:00:00Z' }],
    };

    const prepared = prepareOrderUpdateWithLogs(
      existing,
      {
        area: 80,
        value: 14500,
        logs: existing.logs,
      },
      actor,
    );

    expect(prepared.auditAction).toBe('UPDATE');
    expect(prepared.changes.map(c => c.field)).toEqual(['area', 'value']);
    expect(prepared.payloadToSave.logs).toHaveLength(2);
    expect(prepared.payloadToSave.logs[1]).toMatchObject({
      action: 'Edição',
      userName: 'Maria Gerente',
      userId: 'usr-1',
    });
    expect(prepared.payloadToSave.logs[1].changes).toHaveLength(2);
  });

  it('appends Conclusão log with financial notes when SchedulePage finishes order without logs field', () => {
    const existing = {
      id: 'ord-2',
      status: 'Em Andamento',
      value: '5000.00',
      logs: [],
    };

    const prepared = prepareOrderUpdateWithLogs(
      existing,
      {
        status: 'Concluído',
        value: 4200,
        financial_notes: 'Ajustado por área parcial medida',
      },
      actor,
    );

    expect(prepared.payloadToSave.logs).toHaveLength(1);
    expect(prepared.payloadToSave.logs[0].action).toBe('Conclusão');
    expect(prepared.payloadToSave.logs[0].details).toContain('Obs: Ajustado por área parcial medida');
    expect((prepared.payloadToSave as any).financial_notes).toBeUndefined();
  });

  it('preserves lifecycle action log from frontend and enforces JWT actor userName', () => {
    const existing = {
      id: 'ord-3',
      status: 'Pendente',
      logs: [{ id: 'l1', action: 'Criação' }],
    };

    const prepared = prepareOrderUpdateWithLogs(
      existing,
      {
        status: 'Aprovado',
        logs: [
          ...existing.logs,
          { id: 'l2', action: 'Aprovação', details: 'Pedido aprovado', userName: 'Spoofed' },
        ],
      },
      actor,
    );

    expect(prepared.auditAction).toBe('APPROVE');
    expect(prepared.payloadToSave.logs).toHaveLength(2);
    expect(prepared.payloadToSave.logs[1].userName).toBe('Maria Gerente');
  });
});

