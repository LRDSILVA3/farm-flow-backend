import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCostVarsRepo = {
  find: vi.fn().mockResolvedValue([
    { code: 'VALOR_DIESEL', value: 6.5 },
    { code: 'VALOR_DIARIA', value: 150 },
    { code: 'TAXA_DEPREC_EQUIP', value: 0.1 },
    { code: 'VALOR_KM_RODADO', value: 1.5 },
    { code: 'CUSTO_ANALISE_MACRO', value: 45 },
    { code: 'CUSTO_ANALISE_FISICA', value: 25 },
    { code: 'VALOR_ALQ_CONFERENCIA', value: 65 },
    { code: 'VALOR_PONTO_CONFERE_COMPACTACAO', value: 430 },
    { code: 'ANALISE_20_40_CM_VALOR_ANALISE', value: 70 },
    { code: 'DATA_BASE_CALCULO_JURO', value: 20241231 },
    { code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.5 },
    { code: 'VALOR_ANALISE_NOVA_AREA', value: 52.3 },
    { code: 'VALOR_ANALISE_ADUBO_BASE', value: 35.3 },
    { code: 'VALOR_DIARIA_FOLIAR', value: 180 },
    { code: 'FOLIAR_DIAS_PONTOS_MAX', value: 40 },
    { code: 'FOLIAR_BASE_ALQUEIRE_VALOR', value: 55 },
    { code: 'FOLIAR_BASE_PONTO_VALOR', value: 35 },
    { code: 'FOLIAR_LAB_MACRO_VALOR', value: 40 },
    { code: 'ATV_1_PRODUTO', value: 290 },
    { code: 'ATV_2_PRODUTOS', value: 280 },
    { code: 'ATV_3_PRODUTOS', value: 260 },
    { code: 'VALOR_APLICACAO_ESTERCO', value: 40.40 },
    { code: 'VALOR_HA_COMPACTACAO', value: 25 },
    { code: 'VALOR_HA_DRONE_MAP', value: 18 },
    { code: 'VALOR_PONTO_AMOSTRAGEM_SOLO', value: 40 },
    { code: 'VALOR_HA_DRONE_SPRAY', value: 45 },
    { code: 'TIER_1_AP_PRICE', value: 295 },
    { code: 'VALOR_ALQ_FOLHA', value: 60 },
  ]),
};

vi.mock('typeorm', () => ({
  getCustomRepository: vi.fn(() => mockCostVarsRepo),
  getRepository: vi.fn(() => mockCostVarsRepo),
  EntityRepository: () => () => {},
  Repository: class Repository {},
  Entity: () => () => {},
  PrimaryGeneratedColumn: () => () => {},
  Column: () => () => {},
  CreateDateColumn: () => () => {},
  UpdateDateColumn: () => () => {},
  ManyToOne: () => () => {},
  OneToMany: () => () => {},
  ManyToMany: () => () => {},
  JoinColumn: () => () => {},
}));

import BudgetController from '../controllers/BudgetController';

describe('BudgetController - Full Route Suite', () => {
  let controller: BudgetController;

  const createMockRes = () => {
    let captured: any;
    const res: any = {
      json: vi.fn((data: any) => {
        captured = data;
        return res;
      }),
      status: vi.fn().mockReturnThis(),
    };
    return { res, getCaptured: () => captured };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new BudgetController();
  });

  it('calculateConferencia', async () => {
    const { res, getCaptured } = createMockRes();
    await controller.calculateConferencia({
      body: {
        clienteDesejaNotaFiscal: 'S',
        distanciaFazendaKm: 50,
        vencimentoServico: '10/05/2026',
        desejaAnaliseFisica: 'S',
        percentualAnalises20_40cm: 20,
        alqueires: 10,
        numAnalises: 10,
        totalAlqueires: 10,
      },
    } as any, res);

    expect(getCaptured()).toHaveProperty('totalValue');
    expect(getCaptured().totalValue).toBeGreaterThan(0);
  });

  it('calculateFoliar', async () => {
    const { res, getCaptured } = createMockRes();
    await controller.calculateFoliar({
      body: {
        calculoPor: 'P',
        clienteDesejaNotaFiscal: 'S',
        distanciaFazendaKm: 50,
        vencimentoServico: '10/05/2026',
        alqueires: 10,
        totalAlqueires: 10,
        numPontos: 20,
      },
    } as any, res);

    expect(getCaptured()).toHaveProperty('totalValue');
    expect(getCaptured().totalValue).toBeGreaterThan(0);
  });

  it('calculateCompaction', async () => {
    const { res, getCaptured } = createMockRes();
    await controller.calculateCompaction({
      body: {
        distanciaFazendaKm: 30,
        vencimentoServico: '10/05/2026',
        clienteDesejaNotaFiscal: 'N',
        itens: [{ profundidadeCm: 40, areaHa: 100 }],
      },
    } as any, res);

    expect(getCaptured()).toBeDefined();
  });

  it('calculateDroneMapping', async () => {
    const { res, getCaptured } = createMockRes();
    await controller.calculateDroneMapping({
      body: {
        distanciaFazendaKm: 40,
        vencimentoServico: '10/05/2026',
        clienteDesejaNotaFiscal: 'S',
        itens: [{ tipoMapeamento: 'Ortomosaico', areaHa: 200 }],
      },
    } as any, res);

    expect(getCaptured()).toBeDefined();
  });

  it('calculateATV', async () => {
    const { res, getCaptured } = createMockRes();
    await controller.calculateATV({
      body: {
        clienteDesejaNotaFiscal: 'S',
        distanciaFazendaKm: 50,
        vencimentoServico: '10/05/2026',
        itens: [
          {
            produto: 'Calcário',
            areaHa: 100,
            freteKm: 20,
          },
        ],
      },
    } as any, res);

    expect(getCaptured()).toBeDefined();
    expect(getCaptured()).toHaveProperty('totalValue');
    expect(getCaptured().totalValue).toBeGreaterThan(0);
  });

  it('calculateSoilSampling', async () => {
    const { res, getCaptured } = createMockRes();
    await controller.calculateSoilSampling({
      body: {
        distanciaFazendaKm: 50,
        vencimentoServico: '10/05/2026',
        clienteDesejaNotaFiscal: 'N',
        itens: [{ tipoAmostragem: 'Grid 3ha', areaHa: 80, numPontos: 26 }],
      },
    } as any, res);

    expect(getCaptured()).toBeDefined();
  });

  it('calculateDroneSpraying', async () => {
    const { res, getCaptured } = createMockRes();
    await controller.calculateDroneSpraying({
      body: {
        distanciaFazendaKm: 45,
        vencimentoServico: '10/05/2026',
        clienteDesejaNotaFiscal: 'S',
        itens: [{ cultura: 'Soja', areaHa: 120, vazaoLHa: 10 }],
      },
    } as any, res);

    expect(getCaptured()).toBeDefined();
  });

  it('calculateEqualiza', async () => {
    const { res, getCaptured } = createMockRes();
    await controller.calculateEqualiza({
      body: {
        totalAlqueires: 120,
        percentualAnualAP: 0.33,
        descontoManual: 98,
      },
    } as any, res);

    expect(getCaptured()).toHaveProperty('totalAnualContrato');
    expect(getCaptured().totalAnualContrato).toBeGreaterThan(0);
  });

  it('calculateBiological', async () => {
    const { res, getCaptured } = createMockRes();
    await controller.calculateBiological({
      body: {
        items: [{ productId: '1', quantity: 10 }],
        targetDate: '01/04/2023',
        baseDate: '30/11/2023',
      },
    } as any, res);

    expect(getCaptured()).toHaveProperty('totalValue');
    expect(getCaptured().totalValue).toBeGreaterThan(0);
  });
});
