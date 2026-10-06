import { Router } from 'express';
import UsersController from '../controllers/UsersController';

const usersRouter = Router();
const controller = new UsersController();

usersRouter.post('/', controller.create);

export default usersRouter;
