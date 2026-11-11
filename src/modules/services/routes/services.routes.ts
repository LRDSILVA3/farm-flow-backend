import { Router } from 'express';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser, ensurePermission } from '@shared/http/middlewares/ensurePermission';
import ServicesController from '../controllers/ServicesController';

const servicesRouter = Router();
const controller = new ServicesController();

servicesRouter.use(ensureAuthenticated, ensureActiveUser);

servicesRouter.get('/', controller.index);
servicesRouter.post('/', ensurePermission('settings'), controller.create);
servicesRouter.put('/:id', ensurePermission('settings'), controller.update);
servicesRouter.delete('/:id', ensurePermission('settings'), controller.delete);

export default servicesRouter;
