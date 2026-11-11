import { Request, Response } from 'express';
import { ServicesManager } from '../services/ServicesManager';
import Service from '../typeorm/entities/Service';
import ServiceGroup from '../typeorm/entities/ServiceGroup';
import {
  diffObjects,
  formatChangesSummary,
  recordAudit,
  safeFindSnapshot,
} from '@modules/audit/services/AuditLogService';

const SERVICE_AUDIT_FIELDS = {
  name: 'Nome',
  value_per_alqueire: { label: 'Valor por Alqueire', format: 'currency' as const },
  status: 'Status',
  products: 'Produtos',
};

const GROUP_AUDIT_FIELDS = {
  name: 'Nome do Grupo',
  description: 'Descrição',
  status: 'Status',
  services: 'Serviços',
};

export default class ServicesController {
  private manager = new ServicesManager();

  public index = async (req: Request, res: Response): Promise<Response> => {
    const list = await this.manager.listServices();
    return res.json(list);
  };

  public create = async (req: Request, res: Response): Promise<Response> => {
    const item = await this.manager.createService(req.body);
    await recordAudit({
      req,
      module: 'services',
      action: 'CREATE',
      entityId: item.id,
      entityLabel: item.name,
      summary: `Serviço cadastrado: ${item.name}`,
      afterData: item,
    });
    return res.json(item);
  };

  public update = async (req: Request, res: Response): Promise<Response> => {
    const before = await safeFindSnapshot(Service, req.params.id);
    const item = await this.manager.updateService(req.params.id, req.body);
    const changes = diffObjects(before, item, SERVICE_AUDIT_FIELDS);
    await recordAudit({
      req,
      module: 'services',
      action: 'UPDATE',
      entityId: req.params.id,
      entityLabel: item.name || before?.name,
      summary: formatChangesSummary(changes) || `Serviço atualizado: ${item.name}`,
      changes,
      beforeData: before,
      afterData: item,
    });
    return res.json(item);
  };

  public delete = async (req: Request, res: Response): Promise<Response> => {
    const before = await safeFindSnapshot(Service, req.params.id);
    await this.manager.deleteService(req.params.id);
    await recordAudit({
      req,
      module: 'services',
      action: 'DELETE',
      entityId: req.params.id,
      entityLabel: before?.name,
      summary: `Serviço excluído: ${before?.name || req.params.id}`,
      beforeData: before,
    });
    return res.status(204).send();
  };

  // Groups
  public indexGroups = async (req: Request, res: Response): Promise<Response> => {
    const list = await this.manager.listGroups();
    return res.json(list);
  };

  public createGroup = async (req: Request, res: Response): Promise<Response> => {
    const item = await this.manager.createGroup(req.body);
    await recordAudit({
      req,
      module: 'service_groups',
      action: 'CREATE',
      entityId: item.id,
      entityLabel: item.name,
      summary: `Grupo de serviços criado: ${item.name}`,
      afterData: item,
    });
    return res.json(item);
  };

  public updateGroup = async (req: Request, res: Response): Promise<Response> => {
    const before = await safeFindSnapshot(ServiceGroup, req.params.id);
    const item = await this.manager.updateGroup(req.params.id, req.body);
    const changes = diffObjects(before, item, GROUP_AUDIT_FIELDS);
    await recordAudit({
      req,
      module: 'service_groups',
      action: 'UPDATE',
      entityId: req.params.id,
      entityLabel: item.name || before?.name,
      summary: formatChangesSummary(changes) || `Grupo atualizado: ${item.name}`,
      changes,
      beforeData: before,
      afterData: item,
    });
    return res.json(item);
  };

  public deleteGroup = async (req: Request, res: Response): Promise<Response> => {
    const before = await safeFindSnapshot(ServiceGroup, req.params.id);
    await this.manager.deleteGroup(req.params.id);
    await recordAudit({
      req,
      module: 'service_groups',
      action: 'DELETE',
      entityId: req.params.id,
      entityLabel: before?.name,
      summary: `Grupo excluído: ${before?.name || req.params.id}`,
      beforeData: before,
    });
    return res.status(204).send();
  };
}
