import { Router } from 'express';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensureActiveUser, ensurePermission } from '@shared/http/middlewares/ensurePermission';
import ProductsController from '../controllers/ProductsController';

const productsRouter = Router();
const productsController = new ProductsController();

productsRouter.use(ensureAuthenticated, ensureActiveUser);

productsRouter.get('/', productsController.index);
productsRouter.get('/:id', productsController.show);
productsRouter.post('/', ensurePermission('settings'), productsController.create);
productsRouter.put('/:id', ensurePermission('settings'), productsController.update);
productsRouter.delete('/:id', ensurePermission('settings'), productsController.delete);

export default productsRouter;
