import { Router } from 'express';
import PersonController from '../controllers/PersonController';


const personRouter = Router();
const personController = new PersonController();


//personRouter.get('/:id', personController.show);
export default personRouter;
