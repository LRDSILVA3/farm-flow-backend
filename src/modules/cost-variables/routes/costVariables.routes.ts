import { Router } from 'express';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser, ensurePermission } from '@shared/http/middlewares/ensurePermission';
import CostVariablesController from '../controllers/CostVariablesController';

const costVariablesRouter = Router();
const controller = new CostVariablesController();

costVariablesRouter.use(ensureAuthenticated, ensureActiveUser);

costVariablesRouter.get('/', controller.index);
costVariablesRouter.put('/:code', ensurePermission('settings'), controller.update);

export default costVariablesRouter;
