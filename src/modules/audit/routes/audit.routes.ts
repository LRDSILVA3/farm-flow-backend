import { Router, Request, Response } from 'express';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser, ensurePermission } from '@shared/http/middlewares/ensurePermission';
import { listAuditLogs } from '../services/AuditLogService';

const auditRouter = Router();

auditRouter.use(ensureAuthenticated);

auditRouter.get('/', ensurePermission('reports', 'settings'), async (req: Request, res: Response) => {
  const result = await listAuditLogs({
    module: typeof req.query.module === 'string' ? req.query.module : undefined,
    action: typeof req.query.action === 'string' ? req.query.action : undefined,
    userId: typeof req.query.userId === 'string' ? req.query.userId : undefined,
    entityId: typeof req.query.entityId === 'string' ? req.query.entityId : undefined,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
    page: typeof req.query.page === 'string' ? Number(req.query.page) : 1,
    limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : 25,
  });

  return res.json(result);
});

auditRouter.get(
  '/entity/:module/:entityId',
  ensureActiveUser,
  async (req: Request, res: Response) => {
    const result = await listAuditLogs({
      module: req.params.module,
      entityId: req.params.entityId,
      limit: 100,
    });
    return res.json(result.items);
  },
);

export default auditRouter;

