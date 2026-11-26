import { Request, Response } from 'express';
import ListUserPositionsService from '../services/ListUserPositionsService';
import CreateUserPositionService from '../services/CreateUserPositionService';
import UpdateUserPositionService from '../services/UpdateUserPositionService';
import DeleteUserPositionService from '../services/DeleteUserPositionService';

export default class UserPositionsController {
  public async index(_request: Request, response: Response): Promise<Response> {
    const listService = new ListUserPositionsService();
    const positions = await listService.execute();
    return response.json(positions);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const { name, status, permissions } = request.body;
    const createService = new CreateUserPositionService();
    const position = await createService.execute({ name, status, permissions });
    return response.status(201).json(position);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { name, status, permissions } = request.body;
    const updateService = new UpdateUserPositionService();
    const position = await updateService.execute({
      id: Number(id),
      name,
      status,
      permissions,
    });
    return response.json(position);
  }

  public async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const deleteService = new DeleteUserPositionService();
    await deleteService.execute({ id: Number(id) });
    return response.status(204).send();
  }
}
