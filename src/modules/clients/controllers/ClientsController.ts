import { Request, Response } from 'express';
import ListClientService from '../services/ListClientService';
import CreateClientService from '../services/CreateClientService';
import UpdateClientService from '../services/UpdateClientService';
import DeleteClientService from '../services/DeleteClientService';
import Client from '../typeorm/entities/Client';
import {
  diffObjects,
  formatChangesSummary,
  recordAudit,
  safeFindSnapshot,
} from '@modules/audit/services/AuditLogService';

const CLIENT_AUDIT_FIELDS = {
  name: 'Nome',
  cpf: 'CPF',
  email: 'Email',
  phone: 'Telefone',
  birth_date: 'Nascimento',
  zip_code: 'CEP',
  city: 'Cidade',
  state: 'Estado',
  cad_pro: 'CAD/PRO',
};

export default class ClientsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const listService = new ListClientService();
    const clients = await listService.execute();
    return response.json(clients);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const createService = new CreateClientService();
    const client = await createService.execute(request.body);

    await recordAudit({
      req: request,
      module: 'clients',
      action: 'CREATE',
      entityId: client.id,
      entityLabel: client.name,
      summary: `Cliente cadastrado: ${client.name}`,
      afterData: client,
    });

    return response.json(client);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const before = await safeFindSnapshot(Client, id);
    const updateService = new UpdateClientService();
    const client = await updateService.execute({ id, ...request.body });
    const changes = diffObjects(before, client, CLIENT_AUDIT_FIELDS);

    await recordAudit({
      req: request,
      module: 'clients',
      action: 'UPDATE',
      entityId: id,
      entityLabel: client.name || before?.name,
      summary: formatChangesSummary(changes) || `Cliente atualizado: ${client.name}`,
      changes,
      beforeData: before,
      afterData: client,
    });

    return response.json(client);
  }

  public async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const before = await safeFindSnapshot(Client, id);
    const deleteService = new DeleteClientService();
    await deleteService.execute(id);

    await recordAudit({
      req: request,
      module: 'clients',
      action: 'DELETE',
      entityId: id,
      entityLabel: before?.name,
      summary: `Cliente excluído: ${before?.name || id}`,
      beforeData: before,
    });

    return response.status(204).send();
  }
}
