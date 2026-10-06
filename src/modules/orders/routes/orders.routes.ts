import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import OrdersController from '../controllers/OrdersController';
import ServiceExecution from '../typeorm/entities/ServiceExecution';

const ordersRouter = Router();
const controller = new OrdersController();

ordersRouter.get('/', controller.index);
ordersRouter.post('/', controller.create);
ordersRouter.put('/:id', controller.update);
ordersRouter.delete('/:id', controller.delete);

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

ordersRouter.post('/:id/executions', async (req: Request, res: Response) => {
  const repo = getRepository(ServiceExecution);
  const execution = repo.create({
    order_id: req.params.id,
    operator_name: req.body.operator_name || req.body.operator || 'Operador',
    equipment_name: req.body.equipment_name || req.body.equipment || null,
    area_ha: req.body.area_ha || req.body.areaHa || 0,
    execution_date: req.body.execution_date || req.body.date || new Date().toISOString().split('T')[0],
    notes: req.body.notes || null,
  });
  await repo.save(execution);
  return res.status(201).json(execution);
});

ordersRouter.delete('/executions/:executionId', async (req: Request, res: Response) => {
  const repo = getRepository(ServiceExecution);
  await repo.delete(req.params.executionId);
  return res.status(204).send();
});

export default ordersRouter;

