import { getCustomRepository } from 'typeorm';
import { FarmsRepository } from '../typeorm/repositories/FarmsRepository';
import { PlotsRepository } from '../typeorm/repositories/PlotsRepository';
import Farm from '../typeorm/entities/Farm';
import Plot from '../typeorm/entities/Plot';
import AppError from '@shared/errors/AppError';

export class FarmsService {
  public async list(): Promise<Farm[]> {
    const repo = getCustomRepository(FarmsRepository);
    return repo.find({ relations: ['plots', 'client'], order: { name: 'ASC' } });
  }

  public async create(data: Partial<Farm> & { plots?: Partial<Plot>[] }): Promise<Farm> {
    const farmRepo = getCustomRepository(FarmsRepository);
    const plotRepo = getCustomRepository(PlotsRepository);

    const farm = farmRepo.create(data);
    await farmRepo.save(farm);

    if (data.plots && data.plots.length > 0) {
      const createdPlots = data.plots.map(p => plotRepo.create({ ...p, farm_id: farm.id }));
      await plotRepo.save(createdPlots);
      farm.plots = createdPlots;
    }

    return farm;
  }

  public async update(id: string, data: Partial<Farm>): Promise<Farm> {
    const repo = getCustomRepository(FarmsRepository);
    const farm = await repo.findOne(id);
    if (!farm) throw new AppError('Farm not found', 404);

    Object.assign(farm, data);
    await repo.save(farm);
    return farm;
  }

  public async delete(id: string): Promise<void> {
    const repo = getCustomRepository(FarmsRepository);
    const farm = await repo.findOne(id);
    if (!farm) throw new AppError('Farm not found', 404);
    await repo.remove(farm);
  }

  // Plot operations
  public async addPlot(farmId: string, plotData: Partial<Plot>): Promise<Plot> {
    const plotRepo = getCustomRepository(PlotsRepository);
    const plot = plotRepo.create({ ...plotData, farm_id: farmId });
    await plotRepo.save(plot);
    return plot;
  }

  public async updatePlot(plotId: string, plotData: Partial<Plot>): Promise<Plot> {
    const plotRepo = getCustomRepository(PlotsRepository);
    const plot = await plotRepo.findOne(plotId);
    if (!plot) throw new AppError('Plot not found', 404);
    Object.assign(plot, plotData);
    await plotRepo.save(plot);
    return plot;
  }

  public async deletePlot(plotId: string): Promise<void> {
    const plotRepo = getCustomRepository(PlotsRepository);
    const plot = await plotRepo.findOne(plotId);
    if (!plot) throw new AppError('Plot not found', 404);
    await plotRepo.remove(plot);
  }
}
