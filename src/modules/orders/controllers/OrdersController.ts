import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { OrdersService } from '../services/OrdersService';
import Order from '../typeorm/entities/Order';
import {
  extractActorFromRequest,
  recordAudit,
  safeFindSnapshot,
} from '@modules/audit/services/AuditLogService';
import {
  buildOrderEntityLabel,
  prepareOrderUpdateWithLogs,
} from '../utils/orderAudit';

export default class OrdersController {
  private service = new OrdersService();

  public index = async (req: Request, res: Response): Promise<Response> => {
    const orders = await this.service.list();
    return res.json(orders);
  };

  public create = async (req: Request, res: Response): Promise<Response> => {
    const actor = extractActorFromRequest(req);
    const body = { ...(req.body || {}) };
    const existingLogs = Array.isArray(body.logs) ? body.logs : [];

    const serviceLabel = body.service_name || body.type || 'Serviço';
    const numericVal = Number(body.value || 0);
    const formattedVal = Number.isFinite(numericVal)
      ? numericVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'R$ 0,00';

    if (existingLogs.length === 0) {
      body.logs = [
        {
          id: randomUUID(),
          action: 'Criação',
          details: `Pedido criado no valor de ${formattedVal} para o serviço ${serviceLabel}`,
          userName: actor.name || 'Sistema',
          userId: actor.id,
          timestamp: new Date().toISOString(),
        },
      ];
    } else if (actor.name) {
      body.logs = existingLogs.map((log: any, idx: number) =>
        idx === 0 ? { ...log, userName: actor.name, userId: actor.id || log.userId } : log,
      );
    }

    const order = await this.service.create(body);
    const snapshot = await safeFindSnapshot(Order, order.id);

    await recordAudit({
      req,
      module: 'orders',
      action: 'CREATE',
      entityId: order.id,
      entityLabel: buildOrderEntityLabel(snapshot || order),
      summary: `Pedido criado para ${serviceLabel} (${formattedVal})`,
      afterData: snapshot || order,
    });

    return res.json(order);
  };

  public update = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const existingOrder = await safeFindSnapshot(Order, id);
    const actor = extractActorFromRequest(req);

    const prepared = prepareOrderUpdateWithLogs(existingOrder, req.body, actor);
    const order = await this.service.update(id, prepared.payloadToSave);
    const afterSnapshot = (await safeFindSnapshot(Order, id)) || order;

    await recordAudit({
      req,
      module: 'orders',
      action: prepared.auditAction,
      entityId: id,
      entityLabel: buildOrderEntityLabel(afterSnapshot || existingOrder),
      summary: prepared.summary,
      changes: prepared.changes,
      beforeData: existingOrder,
      afterData: afterSnapshot,
    });

    return res.json(order);
  };

  public delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const existingOrder = await safeFindSnapshot(Order, id);

    await this.service.delete(id);

    await recordAudit({
      req,
      module: 'orders',
      action: 'DELETE',
      entityId: id,
      entityLabel: buildOrderEntityLabel(existingOrder),
      summary: `Pedido excluído: ${buildOrderEntityLabel(existingOrder)}`,
      beforeData: existingOrder,
    });

    return res.status(204).send();
  };
}
