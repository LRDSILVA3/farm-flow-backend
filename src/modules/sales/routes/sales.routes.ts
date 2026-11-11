import { Router } from 'express';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser } from '@shared/http/middlewares/ensurePermission';
import SalesController from '../controllers/SalesController';

const salesRouter = Router();
const salesController = new SalesController();

salesRouter.get('/', ensureAuthenticated, ensureActiveUser, salesController.index);

export default salesRouter;