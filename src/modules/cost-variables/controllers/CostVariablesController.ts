import { Request, Response } from 'express';
import ListCostVariablesService from '../services/ListCostVariablesService';
import UpdateCostVariableService from '../services/UpdateCostVariableService';

export default class CostVariablesController {
  public async index(request: Request, response: Response): Promise<Response> {
    const listService = new ListCostVariablesService();
    const variables = await listService.execute();
    return response.json(variables);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { code } = request.params;
    const { value } = request.body;

    const updateService = new UpdateCostVariableService();
    const updated = await updateService.execute({ code, value: Number(value) });

    return response.json(updated);
  }
}
