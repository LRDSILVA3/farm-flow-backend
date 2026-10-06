import { Request, Response } from 'express';
import ListClientService from '../services/ListClientService';
import CreateClientService from '../services/CreateClientService';
import UpdateClientService from '../services/UpdateClientService';
import DeleteClientService from '../services/DeleteClientService';

export default class ClientsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const listService = new ListClientService();
    const clients = await listService.execute();
    return response.json(clients);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const createService = new CreateClientService();
    const client = await createService.execute(request.body);
    return response.json(client);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const updateService = new UpdateClientService();
    const client = await updateService.execute({ id, ...request.body });
    return response.json(client);
  }

  public async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const deleteService = new DeleteClientService();
    await deleteService.execute(id);
    return response.status(204).send();
  }
}
