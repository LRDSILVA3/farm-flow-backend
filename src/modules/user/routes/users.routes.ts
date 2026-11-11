import { Router } from 'express';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensurePermission } from '@shared/http/middlewares/ensurePermission';
import UsersController from '../controllers/UsersController';

const usersRouter = Router();
const controller = new UsersController();

usersRouter.use(ensureAuthenticated, ensurePermission('settings'));

usersRouter.get('/', controller.index);
usersRouter.post('/', controller.create);
usersRouter.put('/:id', controller.update);
usersRouter.delete('/:id', controller.delete);

export default usersRouter;
