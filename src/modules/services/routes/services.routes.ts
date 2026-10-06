import { Router } from 'express';
import ServicesController from '../controllers/ServicesController';

const servicesRouter = Router();
const controller = new ServicesController();

servicesRouter.get('/', controller.index);
servicesRouter.post('/', controller.create);
servicesRouter.put('/:id', controller.update);
servicesRouter.delete('/:id', controller.delete);

export default servicesRouter;
