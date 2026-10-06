import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import Client from '@modules/clients/typeorm/entities/Client';
import Farm from '@modules/farms/typeorm/entities/Farm';
import Order from '@modules/orders/typeorm/entities/Order';

const dashboardRouter = Router();

dashboardRouter.get('/summary', async (req: Request, res: Response) => {
  const clientRepo = getRepository(Client);
  const farmRepo = getRepository(Farm);
  const orderRepo = getRepository(Order);

  const [totalClients, totalFarms, orders] = await Promise.all([
    clientRepo.count(),
    farmRepo.count(),
    orderRepo.find(),
  ]);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pendente' || o.status === 'Pending').length;

  return res.json({
    totalClients,
    totalFarms,
    totalOrders,
    totalRevenue,
    pendingOrders,
  });
});

export default dashboardRouter;
