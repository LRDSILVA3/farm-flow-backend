import { describe, it, expect } from 'vitest';
import { ATVService } from './ATVService';
import { CostVariable } from './ConferenciaService';

const mockCostVariables: CostVariable[] = [
  { id: '1', name: 'ATV 1 Produto', code: 'ATV_1_PRODUTO', value: 290, description: '' },
  { id: '2', name: 'ATV 2 Produtos', code: 'ATV_2_PRODUTOS', value: 280, description: '' },
  { id: '3', name: 'ATV 3 ou Mais Produtos', code: 'ATV_3_PRODUTOS', value: 260, description: '' },
  { id: '4', name: 'Valor Aplicacao Esterco', code: 'VALOR_APLICACAO_ESTERCO', value: 40.40, description: '' },
  { id: '5', name: 'Juros Pagamento Prazo Percentual', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.5, description: '' },
  { id: '6', name: 'Data Base Calculo Juro', code: 'DATA_BASE_CALCULO_JURO', value: 20241231, description: '' },
  { id: '7', name: 'Valor Km Frete', code: 'VALOR_KM_FRETE', value: 14.77, description: '' },
  { id: '8', name: 'Valor Km Deslocamento Vazio', code: 'VALOR_KM_DESLOCAMENTO_VAZIO', value: 6.12, description: '' },
  { id: '9', name: 'Valor Km Deslocamento Prancha', code: 'VALOR_KM_DESLOCAMENTO_PRANCHA', value: 10.0, description: '' },
  { id: '10', name: 'Diaria Pa Carregadeira', code: 'DIARIA_PA_CARREGADEIRA', value: 2600.0, description: '' },
  { id: '11', name: 'Despesa Viagem ATV', code: 'DESPESA_VIAGEM_ATV', value: 208.24, description: '' },
];

describe('ATVService', () => {
  it('should calculate ATV matching user screenshot (R$ 11.719,81 with loading, without interest)', () => {
    const service = new ATVService(mockCostVariables);

    const result = service.calculate({
      distanciaIdaKm: 40,
      quantosProdutos: 3,
      quantosCaminhoes: 2,
      carregamentoNecessario: true,
      comNotaFiscal: true,
      mapaPreciza: true,
      descontoManual: 111.19,
      itens: [
        {
          produto: 'Calc. Dolomítico',
          idTalhao: 'TL44',
          areaHa: 72,
          toneladas: 20,
          cobraFrete: false,
        },
      ],
    });

    // Subtotal ATV: 29.75 alq * 260 = 7735.00
    // Carregamento: 0.96 * 2600 * 1 dia + 10 * 40 * 4 = 2496 + 1600 = 4096.00
    // Desconto manual: -111.19
    // Total: 7735.00 + 4096.00 - 111.19 = 11719.81
    expect(result.subtotalATV).toBe(7735.00);
    expect(result.custoCarregamento).toBe(4096.00);
    expect(result.totalValue).toBeCloseTo(11719.81, 2);
    expect(result.precoPorAlqueire).toBeCloseTo(393.94, 2);
    expect(result.precoPorTonelada).toBeCloseTo(585.99, 2);
    expect(result.precoPorCarga).toBeCloseTo(5859.91, 2);
  });

  it('should calculate ATV investment matching INPUT ATV rows 10 & 11 in budget.xlsm', () => {
    const service = new ATVService(mockCostVariables);

    const result = service.calculate({
      distanciaIdaKm: 40,
      vencimentoServico: '30/08/2025',
      quantosProdutos: 3,
      carregamentoNecessario: false,
      itens: [
        {
          produto: 'Calc. Dolomítico',
          areaHa: 72.82,
          toneladas: 174.5,
          cobraFrete: false,
        },
        {
          produto: 'Calc. Dolomítico',
          areaHa: 9.1,
          toneladas: 12.5,
          cobraFrete: false,
        },
      ],
    });

    expect(result.details.jurosFactor).toBeCloseTo(1.128, 3);

    const item1 = result.details.itens[0];
    expect(item1.areaAlq).toBe(30.09);
    expect(item1.precoUnitarioAlq).toBeCloseTo(293.28, 2);
    expect(item1.investimentoATV).toBeCloseTo(8824.80, 2);

    const item2 = result.details.itens[1];
    expect(item2.areaAlq).toBe(3.76);
    expect(item2.precoUnitarioAlq).toBeCloseTo(293.28, 2);
    expect(item2.investimentoATV).toBeCloseTo(1102.73, 2);

    expect(result.subtotalATV).toBeCloseTo(9927.53, 2);
  });

  it('should calculate complete ATV matching budget.xlsm sheet totals (Q21-Q25 = R$ 14.023,53)', () => {
    const service = new ATVService(mockCostVariables);

    const result = service.calculate({
      distanciaIdaKm: 40,
      vencimentoServico: '30/08/2025',
      quantosProdutos: 3,
      quantosCaminhoes: 2,
      carregamentoNecessario: true,
      comNotaFiscal: true,
      mapaPreciza: true,
      itens: [
        {
          produto: 'Calc. Dolomítico',
          areaHa: 72.82,
          toneladas: 174.5,
          cobraFrete: false,
        },
        {
          produto: 'Calc. Dolomítico',
          areaHa: 9.1,
          toneladas: 12.5,
          cobraFrete: false,
        },
      ],
    });

    expect(result.subtotalATV).toBeCloseTo(9927.53, 2);
    expect(result.custoCarregamento).toBe(4096.00);
    expect(result.totalValue).toBeCloseTo(14023.53, 2);
    expect(result.precoPorAlqueire).toBeCloseTo(414.28, 2);
    expect(result.precoPorTonelada).toBeCloseTo(74.99, 2);
    expect(result.precoPorCarga).toBeCloseTo(934.90, 2);
  });
});
