import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser, ensurePermission } from '@shared/http/middlewares/ensurePermission';
import OrdersController from '../controllers/OrdersController';
import ServiceExecution from '../typeorm/entities/ServiceExecution';
import Order from '../typeorm/entities/Order';
import AppError from '@shared/errors/AppError';
import { recordAudit, safeFindSnapshot } from '@modules/audit/services/AuditLogService';
import { buildOrderEntityLabel } from '../utils/orderAudit';

const ordersRouter = Router();
const controller = new OrdersController();

ordersRouter.use(ensureAuthenticated, ensureActiveUser);

ordersRouter.get('/', controller.index);
ordersRouter.post('/', ensurePermission('orders'), controller.create);
ordersRouter.put('/:id', ensurePermission('orders', 'schedule', 'financial'), controller.update);
ordersRouter.delete('/:id', ensurePermission('orders'), controller.delete);

// Execuções de campo
ordersRouter.get('/executions/all', async (req: Request, res: Response) => {
  const repo = getRepository(ServiceExecution);
  const executions = await repo.find({ order: { created_at: 'DESC' } });
  return res.json(executions);
});

ordersRouter.get('/:id/executions', async (req: Request, res: Response) => {
  const repo = getRepository(ServiceExecution);
  const executions = await repo.find({ where: { order_id: req.params.id }, order: { created_at: 'ASC' } });
  return res.json(executions);
});

ordersRouter.post('/:id/executions', ensurePermission('orders', 'schedule'), async (req: Request, res: Response) => {
  const orderRepo = getRepository(Order);
  const parentOrder = await orderRepo.findOne(req.params.id);
  if (!parentOrder) {
    throw new AppError('Pedido não encontrado.', 404);
  }

  const isPending =
    parentOrder.status === 'Pendente' ||
    parentOrder.status === 'pending' ||
    parentOrder.status === 'Aguardando' ||
    parentOrder.status === 'Aguardando Aprovação' ||
    parentOrder.status === 'Cancelado';

  if (isPending) {
    throw new AppError(
      'O pedido não pode ser executado pois está aguardando aprovação. Aprove o pedido antes de registrar execuções.',
      400,
    );
  }

  const repo = getRepository(ServiceExecution);
  const execution = repo.create({
    order_id: req.params.id,
    operator_name: req.body.operator_name || req.body.operator || 'Operador',
    equipment_name: req.body.equipment_name || req.body.equipment || null,
    area_ha: req.body.area_ha || req.body.areaHa || 0,
    product_name: req.body.product_name || req.body.product || undefined,
    quantity: req.body.quantity !== undefined && req.body.quantity !== null ? Number(req.body.quantity) : undefined,
    unit: req.body.unit || null,
    plot_name: req.body.plot_name || req.body.plot || null,
    samples_executed: req.body.samples_executed || req.body.samplesExecuted || 0,
    splits: req.body.splits || [],
    execution_date: req.body.execution_date || req.body.date || new Date().toISOString().split('T')[0],
    notes: req.body.notes || null,
  });
  await repo.save(execution);
  const orderSnapshot = await safeFindSnapshot(Order, req.params.id);
  const productInfo = execution.product_name ? ` - ${execution.quantity ? execution.quantity + ' ' + (execution.unit || '') + ' de ' : ''}${execution.product_name}` : '';
  const plotInfo = execution.plot_name ? ` (${execution.plot_name})` : '';
  await recordAudit({
    req,
    module: 'orders',
    action: 'EXECUTION',
    entityId: req.params.id,
    entityLabel: buildOrderEntityLabel(orderSnapshot || parentOrder),
    summary: `Execução de ${execution.area_ha} ha registrada (${execution.operator_name}${productInfo}${plotInfo})`,
    afterData: execution,
  });
  return res.status(201).json(execution);
});

ordersRouter.delete('/executions/:executionId', ensurePermission('orders', 'schedule'), async (req: Request, res: Response) => {
  const repo = getRepository(ServiceExecution);
  const existing = await safeFindSnapshot(ServiceExecution, req.params.executionId);
  await repo.delete(req.params.executionId);
  await recordAudit({
    req,
    module: 'orders',
    action: 'DELETE',
    entityId: existing?.order_id || req.params.executionId,
    entityLabel: `Execução ${existing?.operator_name || req.params.executionId}`,
    summary: `Apontamento de execução excluído (${existing?.area_ha ?? 0} ha)`,
    beforeData: existing,
  });
  return res.status(204).send();
});

export default ordersRouter;

