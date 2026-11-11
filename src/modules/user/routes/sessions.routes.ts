import { Router } from 'express';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import SessionsController from '../controllers/SessionsController';

const sessionsRouter = Router();
const controller = new SessionsController();

sessionsRouter.post('/', controller.create);
sessionsRouter.get('/me', ensureAuthenticated, controller.me);

export default sessionsRouter;
