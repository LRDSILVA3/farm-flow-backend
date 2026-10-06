import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import Analysis from '../typeorm/entities/Analysis';

const analysesRouter = Router();

analysesRouter.get('/', async (req: Request, res: Response) => {
  const repo = getRepository(Analysis);
  const items = await repo.find({ order: { created_at: 'DESC' } });
  return res.json(items);
});

analysesRouter.post('/', async (req: Request, res: Response) => {
  const repo = getRepository(Analysis);
  const item = repo.create(req.body);
  await repo.save(item);
  return res.json(item);
});

analysesRouter.put('/:id', async (req: Request, res: Response) => {
  const repo = getRepository(Analysis);
  const item = await repo.findOne(req.params.id);
  if (!item) return res.status(404).json({ error: 'Analysis not found' });
  Object.assign(item, req.body);
  await repo.save(item);
  return res.json(item);
});

analysesRouter.delete('/:id', async (req: Request, res: Response) => {
  const repo = getRepository(Analysis);
  await repo.delete(req.params.id);
  return res.status(204).send();
});

export default analysesRouter;
