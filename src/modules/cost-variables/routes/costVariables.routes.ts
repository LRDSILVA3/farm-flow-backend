import { Router } from 'express';
import CostVariablesController from '../controllers/CostVariablesController';

const costVariablesRouter = Router();
const controller = new CostVariablesController();

costVariablesRouter.get('/', controller.index);
costVariablesRouter.put('/:code', controller.update);

export default costVariablesRouter;
