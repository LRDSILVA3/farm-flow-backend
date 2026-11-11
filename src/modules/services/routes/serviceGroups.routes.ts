import { Router } from 'express';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser, ensurePermission } from '@shared/http/middlewares/ensurePermission';
import ServicesController from '../controllers/ServicesController';

const serviceGroupsRouter = Router();
const controller = new ServicesController();

serviceGroupsRouter.use(ensureAuthenticated, ensureActiveUser);

serviceGroupsRouter.get('/', controller.indexGroups);
serviceGroupsRouter.post('/', ensurePermission('settings'), controller.createGroup);
serviceGroupsRouter.put('/:id', ensurePermission('settings'), controller.updateGroup);
serviceGroupsRouter.delete('/:id', ensurePermission('settings'), controller.deleteGroup);

export default serviceGroupsRouter;
