import { Router } from 'express';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser, ensurePermission } from '@shared/http/middlewares/ensurePermission';
import FarmsController from '../controllers/FarmsController';

const farmsRouter = Router();
const controller = new FarmsController();

farmsRouter.use(ensureAuthenticated, ensureActiveUser);

farmsRouter.get('/', controller.index);
farmsRouter.post('/', ensurePermission('farms'), controller.create);
farmsRouter.put('/:id', ensurePermission('farms'), controller.update);
farmsRouter.delete('/:id', ensurePermission('farms'), controller.delete);

farmsRouter.post('/:farm_id/plots', ensurePermission('farms'), controller.addPlot);
farmsRouter.put('/plots/:plot_id', ensurePermission('farms'), controller.updatePlot);
farmsRouter.delete('/plots/:plot_id', ensurePermission('farms'), controller.deletePlot);

export default farmsRouter;
