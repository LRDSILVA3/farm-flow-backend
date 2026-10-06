const fs = require('fs');
const path = require('path');

const frontendPath = path.resolve(__dirname, '../../farm-flow-frontend');

// 1. FoliarService.ts
const foliarServiceContent = `import { differenceInDays } from 'date-fns';
import { CostVariable } from './ConferenciaService';

export interface FoliarParams {
  calculoPor: 'A' | 'P'; // 'A' = Alqueire, 'P' = Ponto
  clienteDesejaNotaFiscal: 'S' | 'N';
  distanciaFazendaKm: number;
  vencimentoServico: string; // DD/MM/YYYY
  alqueires: number;
  totalAlqueires?: number;
  numPontos: number;
}

export interface FoliarCalculationResult {
  totalValue: number;
  totalValuePerAlq: number;
  totalValuePerPoint: number;
  details: {
    jurosFactor: number;
    travelCost: number;
    valorKmCalculated: number;
    custoCampoCalculado: number;
    custoLaboratorial: number;
    numPontos: number;
    alqueires: number;
  };
}

export class FoliarService {
  private costVariables: Map<string, number>;

  constructor(costVariables: CostVariable[]) {
    this.costVariables = new Map(
      costVariables.map((variable) => [variable.code, Number(variable.value) || 0])
    );
  }

  public getVariableValue(code: string): number {
    const value = this.costVariables.get(code);
    return value === undefined ? 0 : value;
  }

  public calculate(params: FoliarParams): FoliarCalculationResult {
    let {
      calculoPor,
      clienteDesejaNotaFiscal,
      distanciaFazendaKm,
      vencimentoServico,
      alqueires,
      totalAlqueires,
      numPontos,
    } = params;

    if (!totalAlqueires || totalAlqueires <= 0) {
      totalAlqueires = alqueires;
    }

    const VALOR_ALQ_FOLHA = this.getVariableValue('VALOR_ALQ_FOLHA') || 60;
    const VALOR_PONTO_CONFERE_COMPACTACAO = this.getVariableValue('VALOR_PONTO_CONFERE_COMPACTACAO') || 430;
    const VALOR_ANALISE_FOLIAR = this.getVariableValue('VALOR_ANALISE_FOLIAR') || 70;
    const VALOR_VIAGEM_CONFERENCIA_FOLHA = this.getVariableValue('VALOR_VIAGEM_CONFERENCIA_FOLHA') || 330;
    // In Excel sheet 'INPUT FOLHA ', cell F2 uses POWER(1.03, DAYS(E2,H2)/30), i.e. 3.0% per month
    const JUROS_FOLIAR_PERCENTUAL =
      this.getVariableValue('JUROS_FOLIAR_PERCENTUAL') || 3.0;
    const DATA_BASE_CALCULO_JURO = this.getVariableValue('DATA_BASE_CALCULO_JURO') || 20241231;

    // KM cost: dynamically computed from diesel if available
    const valorDiesel = this.getVariableValue('VALOR_OLEO_DIESEL');
    let valorKm = this.getVariableValue('VALOR_KM_CONFERENCIA_FOLHA_CALCULADO');
    if (valorDiesel > 0) {
      valorKm = (valorDiesel / 7) * 2 * 2.5;
    } else if (valorKm === 0) {
      valorKm = this.getVariableValue('VALOR_KM_CONFERENCIA_FOLHA') || 4.96;
    }

    // Parse dates
    const [day, month, year] = vencimentoServico.split('/').map(Number);
    const vencimentoDate = new Date(year, month - 1, day);

    const yearJuro = Math.floor(DATA_BASE_CALCULO_JURO / 10000);
    const monthJuro = Math.floor((DATA_BASE_CALCULO_JURO % 10000) / 100);
    const dayJuro = DATA_BASE_CALCULO_JURO % 100;
    const dataBaseJuroDate = new Date(yearJuro, monthJuro - 1, dayJuro);

    const daysDifference = differenceInDays(vencimentoDate, dataBaseJuroDate);
    const jurosFactor =
      daysDifference > 0
        ? Math.pow(1 + JUROS_FOLIAR_PERCENTUAL / 100, daysDifference / 30)
        : 1;

    // Travel cost
    const travelCostPerAlq = totalAlqueires > 0 ? (valorKm * distanciaFazendaKm) / totalAlqueires : 0;
    const travelCost = travelCostPerAlq * alqueires;

    let custoBase = 0;
    if (numPontos > 0 && alqueires > 0) {
      if (calculoPor === 'A') {
        // Alqueire calculation
        const baseCost = alqueires * VALOR_ALQ_FOLHA + travelCost;
        if (clienteDesejaNotaFiscal === 'S') {
          custoBase = baseCost < VALOR_PONTO_CONFERE_COMPACTACAO ? VALOR_PONTO_CONFERE_COMPACTACAO : baseCost;
        } else {
          // If no NF, 0.93 discount factor in Excel
          const minNoNf = VALOR_PONTO_CONFERE_COMPACTACAO * 0.93;
          custoBase = baseCost < minNoNf ? minNoNf : baseCost * 0.93;
        }
      } else {
        // Point calculation
        const viagemCost = totalAlqueires > 0 ? (VALOR_VIAGEM_CONFERENCIA_FOLHA / totalAlqueires) * alqueires : 0;
        const baseCost = numPontos * VALOR_PONTO_CONFERE_COMPACTACAO + travelCost + alqueires + viagemCost;
        if (clienteDesejaNotaFiscal === 'S') {
          custoBase = baseCost / 0.85;
        } else {
          custoBase = baseCost;
        }
      }
    }

    // In Excel, total for the job is custoBase * jurosFactor.
    // Laboratory analysis is already included in the point price (R$ 0,00 in PEDIDO FOLHA CLIENTE).
    // In PEDIDO FOLHA EMPRESA, laboratory cost (numPontos * 70) is separated from field cost.
    const totalValue = custoBase * jurosFactor;
    const custoLaboratorial = numPontos * VALOR_ANALISE_FOLIAR;
    const custoCampoCalculado = Math.max(0, totalValue - custoLaboratorial);

    return {
      totalValue,
      totalValuePerAlq: alqueires > 0 ? totalValue / alqueires : 0,
      totalValuePerPoint: numPontos > 0 ? totalValue / numPontos : 0,
      details: {
        jurosFactor,
        travelCost,
        valorKmCalculated: valorKm,
        custoCampoCalculado,
        custoLaboratorial,
        numPontos,
        alqueires,
      },
    };
  }

  public formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
`;

fs.writeFileSync(path.join(frontendPath, 'src/services/FoliarService.ts'), foliarServiceContent, 'utf-8');
console.log('Updated FoliarService.ts in frontend');

// 2. FoliarService.spec.ts
const foliarServiceSpecContent = `import { describe, it, expect } from 'vitest';
import { FoliarService } from './FoliarService';
import { CostVariable } from './ConferenciaService';

const mockCostVariables: CostVariable[] = [
  { id: '1', name: 'Valor Alqueire Folha', code: 'VALOR_ALQ_FOLHA', value: 60, description: '' },
  { id: '2', name: 'Valor Ponto Confere Compactacao', code: 'VALOR_PONTO_CONFERE_COMPACTACAO', value: 430, description: '' },
  { id: '3', name: 'Valor Analise Foliar', code: 'VALOR_ANALISE_FOLIAR', value: 70, description: '' },
  { id: '4', name: 'Valor Viagem Conferencia Folha', code: 'VALOR_VIAGEM_CONFERENCIA_FOLHA', value: 330, description: '' },
  { id: '5', name: 'Juros Pagamento Prazo Percentual', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.5, description: '' },
  { id: '6', name: 'Data Base Calculo Juro', code: 'DATA_BASE_CALCULO_JURO', value: 20241231, description: '' },
  { id: '7', name: 'Valor KM Conferencia Folha Calculado', code: 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', value: 4.957983193277311, description: '' },
];

describe('FoliarService', () => {
  it('should calculate foliar service matching budget.xlsm for user scenario (Por Ponto, Sem NF)', () => {
    const service = new FoliarService(mockCostVariables);

    const result = service.calculate({
      calculoPor: 'P',
      clienteDesejaNotaFiscal: 'N',
      distanciaFazendaKm: 10,
      vencimentoServico: '01/11/2026',
      alqueires: 10,
      totalAlqueires: 10,
      numPontos: 10,
    });

    // Excel formula: base = 10 * 430 + 4.957983 * 10 + 10 + 330 = 4689.58
    // F2 (juros 3.0% ao mes): POWER(1.03, 670/30) = 1.93507596...
    // Total = 4689.58 * 1.93507596 = 9074.69
    expect(result.totalValue).toBeCloseTo(9074.69, 2);
    expect(result.totalValuePerAlq).toBeCloseTo(907.47, 2);
    expect(result.totalValuePerPoint).toBeCloseTo(907.47, 2);
    expect(result.details.custoLaboratorial).toBe(700.00);
    expect(result.details.custoCampoCalculado).toBeCloseTo(8374.69, 2);
  });

  it('should calculate foliar service by area (Alqueire) with minimum threshold', () => {
    const service = new FoliarService(mockCostVariables);

    const result = service.calculate({
      calculoPor: 'A',
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 20,
      vencimentoServico: '31/12/2024',
      alqueires: 5,
      totalAlqueires: 5,
      numPontos: 5,
    });

    // Base cost: 5 * 60 + (4.95798 * 20) = 300 + 99.16 = 399.16
    // Since 399.16 < VALOR_PONTO_CONFERE_COMPACTACAO (430), min threshold is 430
    // Juros factor: 1 (same date)
    // Total: 430.00 (laboratory included). Laboratório separated: 5 * 70 = 350. Campo: 80.
    expect(result.totalValue).toBeCloseTo(430.00, 2);
    expect(result.details.custoLaboratorial).toBe(350.00);
    expect(result.details.custoCampoCalculado).toBeCloseTo(80.00, 2);
  });

  it('should calculate foliar service by area above minimum', () => {
    const service = new FoliarService(mockCostVariables);

    const result = service.calculate({
      calculoPor: 'A',
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 20,
      vencimentoServico: '31/12/2024',
      alqueires: 10,
      totalAlqueires: 10,
      numPontos: 5,
    });

    // Base: 10 * 60 + 99.16 = 699.16 > 430
    // Total: 699.16
    expect(result.totalValue).toBeCloseTo(699.16, 2);
  });

  it('should apply 0.93 discount when Nota Fiscal is N for Alqueire calculation', () => {
    const service = new FoliarService(mockCostVariables);

    const withNF = service.calculate({
      calculoPor: 'A',
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 20,
      vencimentoServico: '31/12/2024',
      alqueires: 10,
      totalAlqueires: 10,
      numPontos: 5,
    });

    const withoutNF = service.calculate({
      calculoPor: 'A',
      clienteDesejaNotaFiscal: 'N',
      distanciaFazendaKm: 20,
      vencimentoServico: '31/12/2024',
      alqueires: 10,
      totalAlqueires: 10,
      numPontos: 5,
    });

    expect(withoutNF.totalValue).toBeCloseTo(withNF.totalValue * 0.93, 2);
  });
});
`;

fs.writeFileSync(path.join(frontendPath, 'src/services/FoliarService.spec.ts'), foliarServiceSpecContent, 'utf-8');
console.log('Updated FoliarService.spec.ts in frontend');

// 3. FoliarServiceForm.tsx
const foliarServiceFormContent = `import React, { useState, useEffect, useMemo } from 'react';
import { FoliarService, FoliarCalculationResult } from '../../../services/FoliarService';
import { useCostVariables } from '../../../hooks/useCostVariables';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface FoliarServiceFormProps {
  initialAlqueires: number;
  initialNumPontos: number;
  totalFarmAlqueires: number;
  onValuesChange: (calculatedValue: number) => void;
}

export const FoliarServiceForm: React.FC<FoliarServiceFormProps> = ({
  initialAlqueires,
  initialNumPontos,
  totalFarmAlqueires,
  onValuesChange,
}) => {
  const { costVariables, loading: loadingCostVariables } = useCostVariables();

  const [calculoPor, setCalculoPor] = useState<'A' | 'P'>('P');
  const [distanciaFazendaKm, setDistanciaFazendaKm] = useState<number | null>(null);
  const [clienteDesejaNotaFiscal, setClienteDesejaNotaFiscal] = useState<boolean>(false);
  const [vencimentoServico, setVencimentoServico] = useState<Date | undefined>(new Date());
  const [alqueires, setAlqueires] = useState<number | null>(initialAlqueires === 0 ? null : initialAlqueires);
  const [numPontos, setNumPontos] = useState<number | null>(initialNumPontos === 0 ? null : initialNumPontos);

  const [calculationResult, setCalculationResult] = useState<FoliarCalculationResult | null>(null);

  const foliarService = useMemo(() => {
    if (costVariables.length > 0) {
      return new FoliarService(costVariables);
    }
    return null;
  }, [costVariables]);

  useEffect(() => {
    setAlqueires(initialAlqueires === 0 ? null : initialAlqueires);
  }, [initialAlqueires]);

  useEffect(() => {
    if (vencimentoServico && foliarService) {
      const formattedVencimento = format(vencimentoServico, 'dd/MM/yyyy');
      const alqToCalc = alqueires === null ? 0 : alqueires;

      const result = foliarService.calculate({
        calculoPor,
        clienteDesejaNotaFiscal: clienteDesejaNotaFiscal ? 'S' : 'N',
        distanciaFazendaKm: distanciaFazendaKm === null ? 0 : distanciaFazendaKm,
        vencimentoServico: formattedVencimento,
        alqueires: alqToCalc,
        totalAlqueires: alqToCalc, // Budgeted area for this order
        numPontos: numPontos === null ? 0 : numPontos,
      });

      setCalculationResult(result);
      onValuesChange(result.totalValue);
    }
  }, [
    calculoPor,
    distanciaFazendaKm,
    clienteDesejaNotaFiscal,
    vencimentoServico,
    alqueires,
    numPontos,
    onValuesChange,
    foliarService,
  ]);

  if (loadingCostVariables) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando variáveis de custo...</p>
      </div>
    );
  }

  if (!foliarService) {
    return (
      <div className="text-red-500 p-4 border border-red-500 rounded-md">
        As variáveis de custo não foram carregadas. O cálculo não pode ser realizado.
      </div>
    );
  }

  const totalValue = calculationResult?.totalValue ?? 0;
  const totalValuePerAlq = calculationResult?.totalValuePerAlq ?? 0;
  const totalValuePerPoint = calculationResult?.totalValuePerPoint ?? 0;
  const details = calculationResult?.details;

  return (
    <div className="space-y-4 p-4 border rounded-md bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cálculo de Coleta Foliar</h3>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3.5 w-3.5" />
          Sincronizado com budget.xlsm
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="calculo-por">Base de Cálculo do Orçamento:</Label>
            <Select value={calculoPor} onValueChange={(val: 'A' | 'P') => setCalculoPor(val)}>
              <SelectTrigger id="calculo-por">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Por Alqueire (A) - Recomendado &lt; 50 alq</SelectItem>
                <SelectItem value="P">Por Ponto (P) - Recomendado &gt; 50 alq</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="foliar-nf"
              checked={clienteDesejaNotaFiscal}
              onCheckedChange={setClienteDesejaNotaFiscal}
            />
            <Label htmlFor="foliar-nf">Cliente deseja nota fiscal?</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="foliar-distancia">Distância da fazenda - Km (ida):</Label>
          <Input
            id="foliar-distancia"
            type="number"
            value={distanciaFazendaKm === null ? '' : distanciaFazendaKm}
            onChange={(e) => {
              const value = e.target.value;
              setDistanciaFazendaKm(value === '' ? null : parseFloat(value));
            }}
            min="0"
            placeholder="Ex: 20"
          />
        </div>

        <div>
          <Label htmlFor="foliar-vencimento">Vencimento do serviço:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !vencimentoServico && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {vencimentoServico ? format(vencimentoServico, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={vencimentoServico}
                onSelect={setVencimentoServico}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="foliar-alqueires">Alqueires:</Label>
            <Input
              id="foliar-alqueires"
              type="number"
              value={alqueires === null ? '' : alqueires}
              onChange={(e) => {
                const value = e.target.value;
                setAlqueires(value === '' ? null : parseFloat(value));
              }}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="foliar-hectares">Hectares (ha):</Label>
            <Input
              id="foliar-hectares"
              type="number"
              value={((alqueires || 0) * 2.42).toFixed(2)}
              readOnly
              className="bg-muted"
            />
          </div>
          <div>
            <Label htmlFor="foliar-pontos">Número de pontos:</Label>
            <Input
              id="foliar-pontos"
              type="number"
              value={numPontos === null ? '' : numPontos}
              onChange={(e) => {
                const value = e.target.value;
                setNumPontos(value === '' ? null : parseInt(value));
              }}
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t space-y-3">
        <h4 className="text-md font-semibold">Valores Calculados:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground block">Valor Total do Trabalho</span>
            <strong className="text-lg text-primary">{foliarService.formatCurrency(totalValue)}</strong>
          </div>
          <div className="p-3 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground block">Valor por Área</span>
            <strong className="text-lg">{foliarService.formatCurrency(totalValuePerAlq)}/ALQ</strong>
          </div>
          <div className="p-3 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground block">Valor por Ponto</span>
            <strong className="text-lg">{foliarService.formatCurrency(totalValuePerPoint)}/PTO</strong>
          </div>
        </div>

        {details && (
          <div className="mt-4 p-3 border rounded-md text-xs space-y-1.5 bg-muted/20">
            <div className="font-semibold text-sm mb-1 text-muted-foreground">Composição do Pedido (Conforme Excel):</div>
            <div className="flex justify-between">
              <span>Custo de Campo (Coleta):</span>
              <span className="font-medium">{foliarService.formatCurrency(details.custoCampoCalculado)}</span>
            </div>
            <div className="flex justify-between">
              <span>Análise Foliar em Laboratório ({details.numPontos} un):</span>
              <span className="font-medium">{foliarService.formatCurrency(details.custoLaboratorial)} (Inclusa)</span>
            </div>
            <div className="flex justify-between text-muted-foreground pt-1 border-t">
              <span>Deslocamento:</span>
              <span>{foliarService.formatCurrency(details.travelCost)} (R$ {details.valorKmCalculated.toFixed(2)}/km)</span>
            </div>
            {details.jurosFactor > 1 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Fator de juros até vencimento (3,0%/mês):</span>
                <span>{details.jurosFactor.toFixed(4)}x</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
`;

fs.writeFileSync(path.join(frontendPath, 'src/components/pages/orders/FoliarServiceForm.tsx'), foliarServiceFormContent, 'utf-8');
console.log('Updated FoliarServiceForm.tsx in frontend');
