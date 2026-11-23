import { getCustomRepository } from 'typeorm';
import { CostVariablesRepository } from '../typeorm/repositories/CostVariablesRepository';
import CostVariable from '../typeorm/entities/CostVariable';
import AppError from '@shared/errors/AppError';

interface IRequest {
  code: string;
  value: number;
}

class UpdateCostVariableService {
  private async updateDerivedVariable(
    repo: CostVariablesRepository,
    code: string,
    newValue: number,
  ): Promise<void> {
    const target = await repo.findByCode(code);
    if (target) {
      target.value = Number(newValue.toFixed(6));
      await repo.save(target);
    }
  }

  public async execute({ code, value }: IRequest): Promise<CostVariable> {
    const costVariablesRepository = getCustomRepository(CostVariablesRepository);
    const variable = await costVariablesRepository.findByCode(code);

    if (!variable) {
      throw new AppError('Cost variable not found', 404);
    }

    const numericValue = Number(value);
    variable.value = numericValue;
    await costVariablesRepository.save(variable);

    // Recálculo em cascata das variáveis derivadas conforme planilha LucasRafael.xlsm ('BANCO DE DADOS')
    if (code === 'VALOR_OLEO_DIESEL' && numericValue > 0) {
      const kmConfFolha = (numericValue / 7) * 4; // BANCO DE DADOS!B12
      const despesaViagem = 5 * 2 * 3 * numericValue; // BANCO DE DADOS!B19
      const kmFrete = Math.round(((numericValue / 1) * 2 / 0.94) * 100) / 100; // BANCO DE DADOS!B21
      const kmDeslocVazio = Math.round(((numericValue / 1.7) * 1.5) * 100) / 100; // BANCO DE DADOS!B22

      await this.updateDerivedVariable(costVariablesRepository, 'VALOR_KM_CONFERENCIA_FOLHA', kmConfFolha);
      await this.updateDerivedVariable(costVariablesRepository, 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', kmConfFolha);
      await this.updateDerivedVariable(costVariablesRepository, 'DESPESA_VIAGEM_ATV', despesaViagem);
      await this.updateDerivedVariable(costVariablesRepository, 'VALOR_KM_FRETE', kmFrete);
      await this.updateDerivedVariable(costVariablesRepository, 'VALOR_KM_DESLOCAMENTO', kmDeslocVazio);
      await this.updateDerivedVariable(costVariablesRepository, 'VALOR_KM_DESLOCAMENTO_VAZIO', kmDeslocVazio);
    } else if (code === 'VALOR_KM_CONFERENCIA_FOLHA') {
      await this.updateDerivedVariable(costVariablesRepository, 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', numericValue);
    } else if (code === 'VALOR_KM_DESLOCAMENTO_VAZIO') {
      await this.updateDerivedVariable(costVariablesRepository, 'VALOR_KM_DESLOCAMENTO', numericValue);
    } else if (code === 'AP_ATE_50_ALQ') {
      await this.updateDerivedVariable(costVariablesRepository, 'TIER_1_AP_PRICE', numericValue);
    } else if (code === 'DIARIA_PA_CARREGADEIRA') {
      const horaPa = (numericValue / 8) * 1.2; // BANCO DE DADOS!B43
      await this.updateDerivedVariable(costVariablesRepository, 'HORA_PA_CARREGADEIRA', horaPa);
    } else if (code === 'VALOR_ANALISE_NOVA_AREA' || code === 'VALOR_ANALISE_ENXOFRE') {
      if (code === 'VALOR_ANALISE_NOVA_AREA') {
        await this.updateDerivedVariable(costVariablesRepository, 'ANALISE_MACRO_VALOR_ANALISE', numericValue);
      }
      const novaAreaVar = await costVariablesRepository.findByCode('VALOR_ANALISE_NOVA_AREA');
      const enxofreVar = await costVariablesRepository.findByCode('VALOR_ANALISE_ENXOFRE');
      if (novaAreaVar && enxofreVar) {
        const valor2040 = Number(novaAreaVar.value) + Number(enxofreVar.value); // INPUT DADOS!C23 = SUM(D3, D5)
        await this.updateDerivedVariable(costVariablesRepository, 'ANALISE_20_40_CM_VALOR_ANALISE', valor2040);
      }
    }

    return variable;
  }
}

export default UpdateCostVariableService;
