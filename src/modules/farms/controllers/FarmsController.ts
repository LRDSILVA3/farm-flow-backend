import { Request, Response } from 'express';
import { FarmsService } from '../services/FarmsService';

export default class FarmsController {
  private service = new FarmsService();

  public index = async (req: Request, res: Response): Promise<Response> => {
    const farms = await this.service.list();
    return res.json(farms);
  };

  public create = async (req: Request, res: Response): Promise<Response> => {
    const farm = await this.service.create(req.body);
    return res.json(farm);
  };

  public update = async (req: Request, res: Response): Promise<Response> => {
    const farm = await this.service.update(req.params.id, req.body);
    return res.json(farm);
  };

  public delete = async (req: Request, res: Response): Promise<Response> => {
    await this.service.delete(req.params.id);
    return res.status(204).send();
  };

  public addPlot = async (req: Request, res: Response): Promise<Response> => {
    const plot = await this.service.addPlot(req.params.farm_id, req.body);
    return res.json(plot);
  };

  public updatePlot = async (req: Request, res: Response): Promise<Response> => {
    const plot = await this.service.updatePlot(req.params.plot_id, req.body);
    return res.json(plot);
  };

  public deletePlot = async (req: Request, res: Response): Promise<Response> => {
    await this.service.deletePlot(req.params.plot_id);
    return res.status(204).send();
  };
}
