import { Router } from 'express';
import ClientsController from '../controllers/ClientsController';

const clientsRouter = Router();
const controller = new ClientsController();

clientsRouter.get('/', controller.index);
clientsRouter.post('/', controller.create);
clientsRouter.put('/:id', controller.update);
clientsRouter.delete('/:id', controller.delete);

export default clientsRouter;
