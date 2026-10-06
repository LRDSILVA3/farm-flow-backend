import { Router } from 'express';
import ServicesController from '../controllers/ServicesController';

const serviceGroupsRouter = Router();
const controller = new ServicesController();

serviceGroupsRouter.get('/', controller.indexGroups);
serviceGroupsRouter.post('/', controller.createGroup);
serviceGroupsRouter.put('/:id', controller.updateGroup);
serviceGroupsRouter.delete('/:id', controller.deleteGroup);

export default serviceGroupsRouter;
