import { Request, Response } from 'express';
import { FarmsService } from '../services/FarmsService';
import Farm from '../typeorm/entities/Farm';
import Plot from '../typeorm/entities/Plot';
import {
  diffObjects,
  formatChangesSummary,
  recordAudit,
  safeFindSnapshot,
} from '@modules/audit/services/AuditLogService';

const FARM_AUDIT_FIELDS = {
  name: 'Nome da Fazenda',
  client_id: 'Proprietário (ID)',
  area: { label: 'Área', format: 'area' as const },
  city: 'Cidade',
  state: 'Estado',
  contact: 'Contato',
  status: 'Status',
  registration: 'Matrícula',
  lot: 'Lote',
};

const PLOT_AUDIT_FIELDS = {
  name: 'Nome do Talhão',
  area: { label: 'Área', format: 'area' as const },
  city: 'Cidade',
  state: 'Estado',
  status: 'Status',
  registration: 'Matrícula',
  lot: 'Lote',
};

export default class FarmsController {
  private service = new FarmsService();

  public index = async (req: Request, res: Response): Promise<Response> => {
    const farms = await this.service.list();
    return res.json(farms);
  };

  public create = async (req: Request, res: Response): Promise<Response> => {
    const farm = await this.service.create(req.body);
    await recordAudit({
      req,
      module: 'farms',
      action: 'CREATE',
      entityId: farm.id,
      entityLabel: farm.name,
      summary: `Fazenda cadastrada: ${farm.name}`,
      afterData: farm,
    });
    return res.json(farm);
  };

  public update = async (req: Request, res: Response): Promise<Response> => {
    const before = await safeFindSnapshot(Farm, req.params.id);
    const farm = await this.service.update(req.params.id, req.body);
    const changes = diffObjects(before, farm, FARM_AUDIT_FIELDS);

    await recordAudit({
      req,
      module: 'farms',
      action: 'UPDATE',
      entityId: req.params.id,
      entityLabel: farm.name || before?.name,
      summary: formatChangesSummary(changes) || `Fazenda atualizada: ${farm.name}`,
      changes,
      beforeData: before,
      afterData: farm,
    });
    return res.json(farm);
  };

  public delete = async (req: Request, res: Response): Promise<Response> => {
    const before = await safeFindSnapshot(Farm, req.params.id);
    await this.service.delete(req.params.id);
    await recordAudit({
      req,
      module: 'farms',
      action: 'DELETE',
      entityId: req.params.id,
      entityLabel: before?.name,
      summary: `Fazenda excluída: ${before?.name || req.params.id}`,
      beforeData: before,
    });
    return res.status(204).send();
  };

  public addPlot = async (req: Request, res: Response): Promise<Response> => {
    const farm = await safeFindSnapshot(Farm, req.params.farm_id);
    const plot = await this.service.addPlot(req.params.farm_id, req.body);
    await recordAudit({
      req,
      module: 'farms',
      action: 'CREATE',
      entityId: plot.id,
      entityLabel: `${plot.name}${farm?.name ? ` (${farm.name})` : ''}`,
      summary: `Talhão adicionado: ${plot.name}`,
      afterData: plot,
    });
    return res.json(plot);
  };

  public updatePlot = async (req: Request, res: Response): Promise<Response> => {
    const before = await safeFindSnapshot(Plot, req.params.plot_id);
    const plot = await this.service.updatePlot(req.params.plot_id, req.body);
    const changes = diffObjects(before, plot, PLOT_AUDIT_FIELDS);
    await recordAudit({
      req,
      module: 'farms',
      action: 'UPDATE',
      entityId: req.params.plot_id,
      entityLabel: plot.name || before?.name,
      summary: formatChangesSummary(changes) || `Talhão atualizado: ${plot.name}`,
      changes,
      beforeData: before,
      afterData: plot,
    });
    return res.json(plot);
  };

  public deletePlot = async (req: Request, res: Response): Promise<Response> => {
    const before = await safeFindSnapshot(Plot, req.params.plot_id);
    await this.service.deletePlot(req.params.plot_id);
    await recordAudit({
      req,
      module: 'farms',
      action: 'DELETE',
      entityId: req.params.plot_id,
      entityLabel: before?.name,
      summary: `Talhão excluído: ${before?.name || req.params.plot_id}`,
      beforeData: before,
    });
    return res.status(204).send();
  };
}
