import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { CostVariablesRepository } from '@modules/cost-variables/typeorm/repositories/CostVariablesRepository';
import { ConferenciaService } from '../services/domain/ConferenciaService';
import { FoliarService } from '../services/domain/FoliarService';
import { CompactionService } from '../services/domain/CompactionService';
import { DroneMappingService } from '../services/domain/DroneMappingService';
import { ATVService } from '../services/domain/ATVService';
import { SoilSamplingService } from '../services/domain/SoilSamplingService';
import { DroneSprayingService } from '../services/domain/DroneSprayingService';
import { EqualizaService } from '../services/domain/EqualizaService';
import { BiologicalProductsService } from '../services/domain/BiologicalProductsService';

export default class BudgetController {
  private async getCostVariables() {
    const costVariablesRepository = getCustomRepository(CostVariablesRepository);
    const vars = await costVariablesRepository.find();
    return vars.map(v => ({ code: v.code, value: Number(v.value) || 0 }));
  }

  public calculateConferencia = async (request: Request, response: Response): Promise<Response> => {
    const costVariables = await this.getCostVariables();
    const service = new ConferenciaService(costVariables as any);
    const result = service.calculate(request.body);
    return response.json(result);
  };

  public calculateFoliar = async (request: Request, response: Response): Promise<Response> => {
    const costVariables = await this.getCostVariables();
    const service = new FoliarService(costVariables as any);
    const result = service.calculate(request.body);
    return response.json(result);
  };

  public calculateCompaction = async (request: Request, response: Response): Promise<Response> => {
    const costVariables = await this.getCostVariables();
    const service = new CompactionService(costVariables as any);
    const result = service.calculate(request.body);
    return response.json(result);
  };

  public calculateDroneMapping = async (request: Request, response: Response): Promise<Response> => {
    const costVariables = await this.getCostVariables();
    const service = new DroneMappingService(costVariables as any);
    const result = service.calculate(request.body);
    return response.json(result);
  };

  public calculateATV = async (request: Request, response: Response): Promise<Response> => {
    const costVariables = await this.getCostVariables();
    const service = new ATVService(costVariables as any);
    const result = service.calculate(request.body);
    return response.json(result);
  };

  public calculateSoilSampling = async (request: Request, response: Response): Promise<Response> => {
    const costVariables = await this.getCostVariables();
    const service = new SoilSamplingService(costVariables as any);
    const result = service.calculate(request.body);
    return response.json(result);
  };

  public calculateDroneSpraying = async (request: Request, response: Response): Promise<Response> => {
    const costVariables = await this.getCostVariables();
    const service = new DroneSprayingService(costVariables as any);
    const result = service.calculate(request.body);
    return response.json(result);
  };

  public calculateEqualiza = async (request: Request, response: Response): Promise<Response> => {
    const costVariables = await this.getCostVariables();
    const service = new EqualizaService(costVariables as any);
    const result = service.calculate(request.body);
    return response.json(result);
  };

  public calculateBiological = async (request: Request, response: Response): Promise<Response> => {
    const service = new BiologicalProductsService(request.body.monthlyRate || 1.2);
    const result = service.calculate(request.body);
    return response.json(result);
  };
}
