import { Request, Response } from 'express';
import { OrdersService } from '../services/OrdersService';

export default class OrdersController {
  private service = new OrdersService();

  public index = async (req: Request, res: Response): Promise<Response> => {
    const orders = await this.service.list();
    return res.json(orders);
  };

  public create = async (req: Request, res: Response): Promise<Response> => {
    const order = await this.service.create(req.body);
    return res.json(order);
  };

  public update = async (req: Request, res: Response): Promise<Response> => {
    const order = await this.service.update(req.params.id, req.body);
    return res.json(order);
  };

  public delete = async (req: Request, res: Response): Promise<Response> => {
    await this.service.delete(req.params.id);
    return res.status(204).send();
  };
}
