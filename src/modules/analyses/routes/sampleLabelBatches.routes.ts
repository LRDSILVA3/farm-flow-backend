import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser, ensurePermission } from '@shared/http/middlewares/ensurePermission';
import SampleLabelBatch from '../typeorm/entities/SampleLabelBatch';
import { recordAudit } from '@modules/audit/services/AuditLogService';

const sampleLabelBatchesRouter = Router();

sampleLabelBatchesRouter.use(ensureAuthenticated, ensureActiveUser);

sampleLabelBatchesRouter.get('/', async (req: Request, res: Response) => {
  const repo = getRepository(SampleLabelBatch);
  const { farm_id, plot_id, order_id } = req.query;

  const qb = repo.createQueryBuilder('batch').orderBy('batch.created_at', 'DESC');

  if (farm_id) {
    qb.andWhere('batch.farm_id = :farm_id', { farm_id });
  }
  if (plot_id) {
    qb.andWhere('batch.plot_id = :plot_id', { plot_id });
  }
  if (order_id) {
    qb.andWhere('batch.order_id = :order_id', { order_id });
  }

  const batches = await qb.getMany();
  return res.json(batches);
});

sampleLabelBatchesRouter.get('/:id', async (req: Request, res: Response) => {
  const repo = getRepository(SampleLabelBatch);
  const batch = await repo.findOne(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Lote de etiquetas não encontrado' });
  return res.json(batch);
});

sampleLabelBatchesRouter.post('/', ensurePermission('analysis', 'orders', 'settings'), async (req: Request, res: Response) => {
  const repo = getRepository(SampleLabelBatch);
  const user = req.user as any;

  const data = {
    ...req.body,
    user_id: user?.id || req.body.user_id,
    user_name: user?.name || req.body.user_name,
  };

  const batch = repo.create(data);
  await repo.save(batch);

  await recordAudit({
    req,
    module: 'analyses',
    action: 'CREATE',
    entityId: batch.id,
    entityLabel: `${batch.farm_name || 'Fazenda'} - ${batch.plot_name || 'Talhão'} (${batch.emitted_count} etiquetas)`,
    summary: `Lote de ${batch.emitted_count} etiquetas emitido e salvo para ${batch.farm_name || ''} - ${batch.plot_name || ''}`,
    afterData: batch as any,
  });

  return res.status(201).json(batch);
});

sampleLabelBatchesRouter.delete('/:id', ensurePermission('analysis', 'orders', 'settings'), async (req: Request, res: Response) => {
  const repo = getRepository(SampleLabelBatch);
  const batch = await repo.findOne(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Lote de etiquetas não encontrado' });

  await repo.remove(batch);

  await recordAudit({
    req,
    module: 'analyses',
    action: 'DELETE',
    entityId: req.params.id,
    entityLabel: `${batch.farm_name || 'Fazenda'} - ${batch.plot_name || 'Talhão'}`,
    summary: `Lote de etiquetas removido: ${batch.farm_name || ''} - ${batch.plot_name || ''}`,
    beforeData: batch as any,
  });

  return res.status(204).send();
});

export default sampleLabelBatchesRouter;
