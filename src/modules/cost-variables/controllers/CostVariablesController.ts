import { Request, Response } from 'express';
import ListCostVariablesService from '../services/ListCostVariablesService';
import UpdateCostVariableService from '../services/UpdateCostVariableService';
import CostVariable from '../typeorm/entities/CostVariable';
import {
  diffObjects,
  formatChangesSummary,
  recordAudit,
  safeFindSnapshot,
} from '@modules/audit/services/AuditLogService';

export default class CostVariablesController {
  public async index(request: Request, response: Response): Promise<Response> {
    const listService = new ListCostVariablesService();
    const variables = await listService.execute();
    return response.json(variables);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { code } = request.params;
    const { value } = request.body;

    const before = await safeFindSnapshot(CostVariable, { where: { code } });
    const updateService = new UpdateCostVariableService();
    const updated = await updateService.execute({ code, value: Number(value) });
    const changes = diffObjects(before, updated, {
      value: { label: 'Valor', format: 'currency' },
    });

    await recordAudit({
      req: request,
      module: 'cost_variables',
      action: 'UPDATE',
      entityId: updated.id || code,
      entityLabel: `${updated.name} (${updated.code})`,
      summary: formatChangesSummary(changes) || `Variável ${code} atualizada para ${updated.value}`,
      changes,
      beforeData: before,
      afterData: updated,
    });

    return response.json(updated);
  }
}
