import { Router } from 'express';
import usersRouter from '@modules/user/routes/users.routes';
import sessionsRouter from '@modules/user/routes/sessions.routes';
import clientsRouter from '@modules/clients/routes/clients.routes';
import productsRouter from '@modules/products/routes/products.routes';
import salesRouter from '@modules/sales/routes/sales.routes';
import farmsRouter from '@modules/farms/routes/farms.routes';
import ordersRouter from '@modules/orders/routes/orders.routes';
import servicesRouter from '@modules/services/routes/services.routes';
import serviceGroupsRouter from '@modules/services/routes/serviceGroups.routes';
import costVariablesRouter from '@modules/cost-variables/routes/costVariables.routes';
import budgetRouter from '@modules/budget/routes/budget.routes';
import equipmentRouter from '@modules/equipment/routes/equipment.routes';
import collaboratorsRouter from '@modules/collaborators/routes/collaborators.routes';
import analysesRouter from '@modules/analyses/routes/analyses.routes';
import dashboardRouter from '@modules/dashboard/routes/dashboard.routes';
import financialRouter from '@modules/financial/routes/financial.routes';

const routes = Router();

routes.use('/users', usersRouter);
routes.use('/sessions', sessionsRouter);
routes.use('/clients', clientsRouter);
routes.use('/products', productsRouter);
routes.use('/sales', salesRouter);
routes.use('/farms', farmsRouter);
routes.use('/orders', ordersRouter);
routes.use('/services', servicesRouter);
routes.use('/service-groups', serviceGroupsRouter);
routes.use('/cost-variables', costVariablesRouter);
routes.use('/budget', budgetRouter);
routes.use('/equipment', equipmentRouter);
routes.use('/collaborators', collaboratorsRouter);
routes.use('/analyses', analysesRouter);
routes.use('/dashboard', dashboardRouter);
routes.use('/financial', financialRouter);


export default routes;
