import { randomUUID } from 'crypto';
import {
  AuditActor,
  AuditFieldMap,
  diffObjects,
  formatChangesSummary,
} from '@modules/audit/services/AuditLogService';
import { AuditFieldChange } from '@modules/audit/typeorm/entities/AuditLog';

export const ORDER_AUDIT_FIELDS: AuditFieldMap = {
  service_name: 'Serviço',
  type: 'Tipo',
  area: { label: 'Área', format: 'area' },
  value: { label: 'Valor Total', format: 'currency' },
  status: 'Status',
  payment: 'Pagamento',
  executed_area: { label: 'Área Executada', format: 'area' },
  paid_amount: { label: 'Valor Pago', format: 'currency' },
  client_id: 'Cliente (ID)',
  farm_id: 'Fazenda (ID)',
  service_group: 'Grupo de Serviço',
};

const detectArrayChanges = (
  before: Record<string, any> | null,
  after: Record<string, any>,
): AuditFieldChange[] => {
  if (!before) return [];
  const extra: AuditFieldChange[] = [];

  const checkCollection = (field: string, label: string) => {
    if (after[field] === undefined) return;
    const prevArr = Array.isArray(before[field]) ? before[field] : [];
    const nextArr = Array.isArray(after[field]) ? after[field] : [];
    if (JSON.stringify(prevArr) !== JSON.stringify(nextArr)) {
      extra.push({
        field,
        label,
        before: `${prevArr.length} registro(s)`,
        after: `${nextArr.length} registro(s)`,
      });
    }
  };

  checkCollection('executions', 'Apontamentos de Execução');
  checkCollection('schedules', 'Agendamentos');
  checkCollection('payments', 'Pagamentos');
  checkCollection('products_data', 'Itens / Análises');

  return extra;
};

const inferOrderAction = (
  changes: AuditFieldChange[],
  incomingLogAction?: string,
): { logAction: string; auditAction: string } => {
  if (incomingLogAction) {
    const lower = incomingLogAction.toLowerCase();
    if (lower.includes('aprova')) return { logAction: incomingLogAction, auditAction: 'APPROVE' };
    if (lower.includes('cancel')) return { logAction: incomingLogAction, auditAction: 'CANCEL' };
    if (lower.includes('execu')) return { logAction: incomingLogAction, auditAction: 'EXECUTION' };
    if (lower.includes('agenda')) return { logAction: incomingLogAction, auditAction: 'SCHEDULE' };
    if (lower.includes('pag')) return { logAction: incomingLogAction, auditAction: 'PAYMENT' };
    return { logAction: incomingLogAction, auditAction: 'UPDATE' };
  }

  const fields = new Set(changes.map(c => c.field));
  const statusChange = changes.find(c => c.field === 'status');
  if (statusChange?.after === 'Concluído') {
    return { logAction: 'Conclusão', auditAction: 'UPDATE' };
  }
  if (statusChange?.after === 'Cancelado') {
    return { logAction: 'Cancelamento', auditAction: 'CANCEL' };
  }
  if (
    (fields.has('executed_area') || fields.has('executions')) &&
    !fields.has('value') &&
    !fields.has('area') &&
    !fields.has('service_name')
  ) {
    return { logAction: 'Execução', auditAction: 'EXECUTION' };
  }
  if (fields.has('schedules') && fields.size === 1) {
    return { logAction: 'Agendamento', auditAction: 'SCHEDULE' };
  }
  if (
    (fields.has('paid_amount') || fields.has('payments')) &&
    !fields.has('area') &&
    !fields.has('service_name')
  ) {
    return { logAction: 'Pagamento', auditAction: 'PAYMENT' };
  }

  return { logAction: 'Edição', auditAction: 'UPDATE' };
};

export const prepareOrderUpdateWithLogs = (
  existingOrder: Record<string, any> | null,
  rawBody: Record<string, any>,
  actor: AuditActor,
) => {
  const { financial_notes, ...cleanUpdateBody } = rawBody || {};
  const mergedForDiff = existingOrder
    ? { ...existingOrder, ...cleanUpdateBody }
    : cleanUpdateBody;

  const fieldChanges = existingOrder
    ? [
        ...diffObjects(existingOrder, mergedForDiff, ORDER_AUDIT_FIELDS),
        ...detectArrayChanges(existingOrder, cleanUpdateBody),
      ]
    : [];

  const existingLogs: any[] = Array.isArray(existingOrder?.logs) ? existingOrder!.logs : [];
  const incomingLogs: any[] | null = Array.isArray(cleanUpdateBody.logs)
    ? cleanUpdateBody.logs
    : null;

  const clientAddedLog =
    incomingLogs !== null && incomingLogs.length > existingLogs.length;

  let finalLogs: any[] = existingLogs;
  let resolvedAuditAction = 'UPDATE';
  let summary = formatChangesSummary(fieldChanges);

  if (clientAddedLog && incomingLogs) {
    const newestIdx = incomingLogs.length - 1;
    const newestLog = incomingLogs[newestIdx] || {};
    const inferred = inferOrderAction(fieldChanges, newestLog.action);
    resolvedAuditAction = inferred.auditAction;

    finalLogs = incomingLogs.map((entry, idx) =>
      idx === newestIdx
        ? {
            ...entry,
            userName: actor.name || entry.userName || 'Sistema',
            userId: actor.id || entry.userId,
            changes:
              Array.isArray(entry.changes) && entry.changes.length > 0
                ? entry.changes
                : fieldChanges,
          }
        : entry,
    );
    summary = newestLog.details || summary || 'Pedido atualizado';
  } else {
    const inferred = inferOrderAction(fieldChanges);
    resolvedAuditAction = inferred.auditAction;

    if (fieldChanges.length > 0 || financial_notes) {
      const diffText = formatChangesSummary(fieldChanges);
      const notesText =
        typeof financial_notes === 'string' && financial_notes.trim()
          ? `Obs: ${financial_notes.trim()}`
          : '';
      const combinedDetails = [diffText, notesText].filter(Boolean).join(' • ') || 'Pedido atualizado';
      summary = combinedDetails;

      finalLogs = [
        ...existingLogs,
        {
          id: randomUUID(),
          action: inferred.logAction,
          details: combinedDetails,
          userName: actor.name || 'Sistema',
          userId: actor.id,
          timestamp: new Date().toISOString(),
          changes: fieldChanges,
        },
      ];
    } else {
      summary = 'Atualização sem alteração de campos principais';
    }
  }

  return {
    payloadToSave: {
      ...cleanUpdateBody,
      logs: finalLogs,
    },
    changes: fieldChanges,
    auditAction: resolvedAuditAction,
    summary,
  };
};

export const buildOrderEntityLabel = (order: Record<string, any> | null | undefined): string => {
  if (!order) return 'Pedido';
  const serviceName = order.service_name || order.type || 'Serviço';
  const clientName = order.client?.name ? ` • ${order.client.name}` : '';
  const areaText = order.area ? ` (${Number(order.area).toFixed(2)} ha)` : '';
  return `${serviceName}${areaText}${clientName}`;
};

