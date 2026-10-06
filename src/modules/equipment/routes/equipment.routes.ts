import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import Equipment from '../typeorm/entities/Equipment';

const equipmentRouter = Router();

equipmentRouter.get('/', async (req: Request, res: Response) => {
  const repo = getRepository(Equipment);
  const items = await repo.find({ order: { name: 'ASC' } });
  return res.json(items);
});

equipmentRouter.post('/', async (req: Request, res: Response) => {
  const repo = getRepository(Equipment);
  const item = repo.create(req.body);
  await repo.save(item);
  return res.json(item);
});

equipmentRouter.put('/:id', async (req: Request, res: Response) => {
  const repo = getRepository(Equipment);
  const item = await repo.findOne(req.params.id);
  if (!item) return res.status(404).json({ error: 'Equipment not found' });
  Object.assign(item, req.body);
  await repo.save(item);
  return res.json(item);
});

equipmentRouter.delete('/:id', async (req: Request, res: Response) => {
  const repo = getRepository(Equipment);
  await repo.delete(req.params.id);
  return res.status(204).send();
});

export default equipmentRouter;
