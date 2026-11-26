import { Router } from 'express';
import UserPositionsController from '../controllers/UserPositionsController';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensurePermission } from '@shared/http/middlewares/ensurePermission';

const positionsRouter = Router();
const controller = new UserPositionsController();

positionsRouter.use(ensureAuthenticated);

// Leitura permitida para quem tem acesso a configurações ou usuários
positionsRouter.get('/', controller.index);

// Criação, edição e exclusão de cargos restrita a quem tem permissão de edição em configurações
positionsRouter.post('/', ensurePermission('settings', 'settings:edit'), controller.create);
positionsRouter.put('/:id', ensurePermission('settings', 'settings:edit'), controller.update);
positionsRouter.delete('/:id', ensurePermission('settings', 'settings:edit'), controller.delete);

export default positionsRouter;
