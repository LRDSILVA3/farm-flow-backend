import { Router } from 'express';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser, ensurePermission } from '@shared/http/middlewares/ensurePermission';
import ClientsController from '../controllers/ClientsController';

const clientsRouter = Router();
const controller = new ClientsController();

clientsRouter.use(ensureAuthenticated, ensureActiveUser);

clientsRouter.get('/', controller.index);
clientsRouter.post('/', ensurePermission('customers'), controller.create);
clientsRouter.put('/:id', ensurePermission('customers'), controller.update);
clientsRouter.delete('/:id', ensurePermission('customers'), controller.delete);

export default clientsRouter;
