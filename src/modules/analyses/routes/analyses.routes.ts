import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser, ensurePermission } from '@shared/http/middlewares/ensurePermission';
import Analysis from '../typeorm/entities/Analysis';
import {
  diffObjects,
  formatChangesSummary,
  recordAudit,
} from '@modules/audit/services/AuditLogService';

const ANALYSIS_AUDIT_FIELDS = {
  type: 'Tipo',
  status: 'Status',
  date: 'Data',
  farm_id: 'Fazenda (ID)',
  order_id: 'Pedido (ID)',
};

const analysesRouter = Router();

analysesRouter.use(ensureAuthenticated, ensureActiveUser);

analysesRouter.get('/', async (req: Request, res: Response) => {
  const repo = getRepository(Analysis);
  const items = await repo.find({ order: { created_at: 'DESC' } });
  return res.json(items);
});

analysesRouter.post('/', ensurePermission('analysis', 'settings'), async (req: Request, res: Response) => {
  const repo = getRepository(Analysis);
  const item = repo.create(req.body);
  await repo.save(item);
  await recordAudit({
    req,
    module: 'analyses',
    action: 'CREATE',
    entityId: (item as any).id,
    entityLabel: (item as any).type,
    summary: `Análise registrada: ${(item as any).type}`,
    afterData: item as any,
  });
  return res.json(item);
});

analysesRouter.put('/:id', ensurePermission('analysis', 'settings'), async (req: Request, res: Response) => {
  const repo = getRepository(Analysis);
  const item = await repo.findOne(req.params.id);
  if (!item) return res.status(404).json({ error: 'Analysis not found' });
  const before = { ...item };
  Object.assign(item, req.body);
  await repo.save(item);
  const changes = diffObjects(before, item, ANALYSIS_AUDIT_FIELDS);
  await recordAudit({
    req,
    module: 'analyses',
    action: 'UPDATE',
    entityId: req.params.id,
    entityLabel: item.type || before.type,
    summary: formatChangesSummary(changes) || `Análise atualizada: ${item.type}`,
    changes,
    beforeData: before,
    afterData: item,
  });
  return res.json(item);
});

analysesRouter.delete('/:id', ensurePermission('analysis', 'settings'), async (req: Request, res: Response) => {
  const repo = getRepository(Analysis);
  const before = await repo.findOne(req.params.id);
  await repo.delete(req.params.id);
  await recordAudit({
    req,
    module: 'analyses',
    action: 'DELETE',
    entityId: req.params.id,
    entityLabel: before?.type,
    summary: `Análise excluída: ${before?.type || req.params.id}`,
    beforeData: before,
  });
  return res.status(204).send();
});

export default analysesRouter;
