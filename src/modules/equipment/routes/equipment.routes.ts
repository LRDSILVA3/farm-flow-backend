import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser, ensurePermission } from '@shared/http/middlewares/ensurePermission';
import Equipment from '../typeorm/entities/Equipment';
import {
  diffObjects,
  formatChangesSummary,
  recordAudit,
} from '@modules/audit/services/AuditLogService';

const EQUIPMENT_AUDIT_FIELDS = {
  name: 'Nome',
  type: 'Tipo',
  status: 'Status',
  model: 'Modelo',
  plate: 'Placa',
  serial_number: 'Nº Série',
  hourmeter: 'Horímetro',
};

const equipmentRouter = Router();

equipmentRouter.use(ensureAuthenticated, ensureActiveUser);

equipmentRouter.get('/', async (req: Request, res: Response) => {
  const repo = getRepository(Equipment);
  const items = await repo.find({ order: { name: 'ASC' } });
  return res.json(items);
});

equipmentRouter.post('/', ensurePermission('settings'), async (req: Request, res: Response) => {
  const repo = getRepository(Equipment);
  const item = repo.create(req.body);
  await repo.save(item);
  await recordAudit({
    req,
    module: 'equipment',
    action: 'CREATE',
    entityId: (item as any).id,
    entityLabel: (item as any).name,
    summary: `Equipamento cadastrado: ${(item as any).name}`,
    afterData: item as any,
  });
  return res.json(item);
});

equipmentRouter.put('/:id', ensurePermission('settings'), async (req: Request, res: Response) => {
  const repo = getRepository(Equipment);
  const item = await repo.findOne(req.params.id);
  if (!item) return res.status(404).json({ error: 'Equipment not found' });
  const before = { ...item };
  Object.assign(item, req.body);
  await repo.save(item);
  const changes = diffObjects(before, item, EQUIPMENT_AUDIT_FIELDS);
  await recordAudit({
    req,
    module: 'equipment',
    action: 'UPDATE',
    entityId: req.params.id,
    entityLabel: item.name || before.name,
    summary: formatChangesSummary(changes) || `Equipamento atualizado: ${item.name}`,
    changes,
    beforeData: before,
    afterData: item,
  });
  return res.json(item);
});

equipmentRouter.delete('/:id', ensurePermission('settings'), async (req: Request, res: Response) => {
  const repo = getRepository(Equipment);
  const before = await repo.findOne(req.params.id);
  await repo.delete(req.params.id);
  await recordAudit({
    req,
    module: 'equipment',
    action: 'DELETE',
    entityId: req.params.id,
    entityLabel: before?.name,
    summary: `Equipamento excluído: ${before?.name || req.params.id}`,
    beforeData: before,
  });
  return res.status(204).send();
});

export default equipmentRouter;
