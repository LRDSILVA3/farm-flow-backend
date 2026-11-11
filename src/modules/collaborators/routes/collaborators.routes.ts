import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser, ensurePermission } from '@shared/http/middlewares/ensurePermission';
import Collaborator from '../typeorm/entities/Collaborator';
import {
  diffObjects,
  formatChangesSummary,
  recordAudit,
} from '@modules/audit/services/AuditLogService';

const COLLAB_AUDIT_FIELDS = {
  name: 'Nome',
  role: 'Cargo',
  email: 'Email',
  phone: 'Telefone',
  status: 'Status',
};

const collaboratorsRouter = Router();

collaboratorsRouter.use(ensureAuthenticated, ensureActiveUser);

collaboratorsRouter.get('/', async (req: Request, res: Response) => {
  const repo = getRepository(Collaborator);
  const items = await repo.find({ order: { name: 'ASC' } });
  return res.json(items);
});

collaboratorsRouter.post('/', ensurePermission('settings'), async (req: Request, res: Response) => {
  const repo = getRepository(Collaborator);
  const item = repo.create(req.body);
  await repo.save(item);
  await recordAudit({
    req,
    module: 'collaborators',
    action: 'CREATE',
    entityId: (item as any).id,
    entityLabel: (item as any).name,
    summary: `Colaborador cadastrado: ${(item as any).name}`,
    afterData: item as any,
  });
  return res.json(item);
});

collaboratorsRouter.put('/:id', ensurePermission('settings'), async (req: Request, res: Response) => {
  const repo = getRepository(Collaborator);
  const item = await repo.findOne(req.params.id);
  if (!item) return res.status(404).json({ error: 'Collaborator not found' });
  const before = { ...item };
  Object.assign(item, req.body);
  await repo.save(item);
  const changes = diffObjects(before, item, COLLAB_AUDIT_FIELDS);
  await recordAudit({
    req,
    module: 'collaborators',
    action: 'UPDATE',
    entityId: req.params.id,
    entityLabel: item.name || before.name,
    summary: formatChangesSummary(changes) || `Colaborador atualizado: ${item.name}`,
    changes,
    beforeData: before,
    afterData: item,
  });
  return res.json(item);
});

collaboratorsRouter.delete('/:id', ensurePermission('settings'), async (req: Request, res: Response) => {
  const repo = getRepository(Collaborator);
  const before = await repo.findOne(req.params.id);
  await repo.delete(req.params.id);
  await recordAudit({
    req,
    module: 'collaborators',
    action: 'DELETE',
    entityId: req.params.id,
    entityLabel: before?.name,
    summary: `Colaborador excluído: ${before?.name || req.params.id}`,
    beforeData: before,
  });
  return res.status(204).send();
});

export default collaboratorsRouter;
