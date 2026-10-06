import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import Collaborator from '../typeorm/entities/Collaborator';

const collaboratorsRouter = Router();

collaboratorsRouter.get('/', async (req: Request, res: Response) => {
  const repo = getRepository(Collaborator);
  const items = await repo.find({ order: { name: 'ASC' } });
  return res.json(items);
});

collaboratorsRouter.post('/', async (req: Request, res: Response) => {
  const repo = getRepository(Collaborator);
  const item = repo.create(req.body);
  await repo.save(item);
  return res.json(item);
});

collaboratorsRouter.put('/:id', async (req: Request, res: Response) => {
  const repo = getRepository(Collaborator);
  const item = await repo.findOne(req.params.id);
  if (!item) return res.status(404).json({ error: 'Collaborator not found' });
  Object.assign(item, req.body);
  await repo.save(item);
  return res.json(item);
});

collaboratorsRouter.delete('/:id', async (req: Request, res: Response) => {
  const repo = getRepository(Collaborator);
  await repo.delete(req.params.id);
  return res.status(204).send();
});

export default collaboratorsRouter;
