import { Router } from 'express';
import FarmsController from '../controllers/FarmsController';

const farmsRouter = Router();
const controller = new FarmsController();

farmsRouter.get('/', controller.index);
farmsRouter.post('/', controller.create);
farmsRouter.put('/:id', controller.update);
farmsRouter.delete('/:id', controller.delete);

farmsRouter.post('/:farm_id/plots', controller.addPlot);
farmsRouter.put('/plots/:plot_id', controller.updatePlot);
farmsRouter.delete('/plots/:plot_id', controller.deletePlot);

export default farmsRouter;
