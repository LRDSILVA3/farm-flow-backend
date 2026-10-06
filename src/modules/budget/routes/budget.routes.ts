import { Router } from 'express';
import BudgetController from '../controllers/BudgetController';

const budgetRouter = Router();
const controller = new BudgetController();

budgetRouter.post('/calculate/conferencia', controller.calculateConferencia);
budgetRouter.post('/calculate/foliar', controller.calculateFoliar);
budgetRouter.post('/calculate/compaction', controller.calculateCompaction);
budgetRouter.post('/calculate/drone-mapping', controller.calculateDroneMapping);
budgetRouter.post('/calculate/atv', controller.calculateATV);
budgetRouter.post('/calculate/soil-sampling', controller.calculateSoilSampling);
budgetRouter.post('/calculate/drone-spraying', controller.calculateDroneSpraying);
budgetRouter.post('/calculate/equaliza', controller.calculateEqualiza);
budgetRouter.post('/calculate/biological', controller.calculateBiological);

export default budgetRouter;
