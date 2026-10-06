import { Request, Response } from 'express';
import { ServicesManager } from '../services/ServicesManager';

export default class ServicesController {
  private manager = new ServicesManager();

  public index = async (req: Request, res: Response): Promise<Response> => {
    const list = await this.manager.listServices();
    return res.json(list);
  };

  public create = async (req: Request, res: Response): Promise<Response> => {
    const item = await this.manager.createService(req.body);
    return res.json(item);
  };

  public update = async (req: Request, res: Response): Promise<Response> => {
    const item = await this.manager.updateService(req.params.id, req.body);
    return res.json(item);
  };

  public delete = async (req: Request, res: Response): Promise<Response> => {
    await this.manager.deleteService(req.params.id);
    return res.status(204).send();
  };

  // Groups
  public indexGroups = async (req: Request, res: Response): Promise<Response> => {
    const list = await this.manager.listGroups();
    return res.json(list);
  };

  public createGroup = async (req: Request, res: Response): Promise<Response> => {
    const item = await this.manager.createGroup(req.body);
    return res.json(item);
  };

  public updateGroup = async (req: Request, res: Response): Promise<Response> => {
    const item = await this.manager.updateGroup(req.params.id, req.body);
    return res.json(item);
  };

  public deleteGroup = async (req: Request, res: Response): Promise<Response> => {
    await this.manager.deleteGroup(req.params.id);
    return res.status(204).send();
  };
}
