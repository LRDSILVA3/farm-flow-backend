const fs = require('fs');
const path = require('path');

const frontendPath = path.resolve(__dirname, '../../farm-flow-frontend');

// 1. DroneMappingService.ts
const droneMappingServiceContent = `import { differenceInDays } from 'date-fns';
import { CostVariable } from './ConferenciaService';

export interface DroneMappingParams {
  alqueires: number;
  distanciaKm: number;
  vencimentoServico: string; // DD/MM/YYYY
  servicoFungoNematoide?: boolean; // Ortomosaico/Mapeamento de Fungo e Nematóide (Row 27 in PEDIDO DRONE)
  servicoCurvasNivel?: boolean;    // Ortomosaico/Projeto de Curvas de Nível (Row 28 in PEDIDO DRONE)
  desconto?: number;
}

export interface DroneMappingCalculationResult {
  totalValue: number;
  totalValuePerAlq: number;
  details: {
    jurosFactor: number;
    servicoFungoNematoide: boolean;
    servicoCurvasNivel: boolean;
    nomeServico: string;
    precoBaseUnitario: number;
    precoUnitarioAlq: number;
    subtotalArea: number;
    precoUnitarioKm: number;
    subtotalDeslocamento: number;
    desconto: number;
    alqueires: number;
    distanciaKm: number;
  };
}

export class DroneMappingService {
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

  public calculate(params: DroneMappingParams): DroneMappingCalculationResult {
    const {
      alqueires,
      distanciaKm,
      vencimentoServico,
      servicoFungoNematoide = true,
      servicoCurvasNivel = false,
      desconto = 0,
    } = params;

    const VOO_DRONE_ALQ_ANO = this.getVariableValue('VOO_DRONE_ALQ_ANO') || 50;
    // In Excel sheet 'PEDIDO DRONE', cell M34 uses POWER(1.03, ...), i.e. 3.0% per month
    const JUROS_DRONE_PERCENTUAL =
      this.getVariableValue('JUROS_DRONE_PERCENTUAL') || 3.0;
    // In Excel sheet 'PEDIDO DRONE', cell M31 is 44956 = 30/01/2023
    const DATA_BASE_CALCULO_JURO_DRONE =
      this.getVariableValue('DATA_BASE_CALCULO_JURO_DRONE') || 20230130;

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

    const yearJuro = Math.floor(DATA_BASE_CALCULO_JURO_DRONE / 10000);
    const monthJuro = Math.floor((DATA_BASE_CALCULO_JURO_DRONE % 10000) / 100);
    const dayJuro = DATA_BASE_CALCULO_JURO_DRONE % 100;
    const dataBaseJuroDate = new Date(yearJuro, monthJuro - 1, dayJuro);

    const daysDifference = differenceInDays(vencimentoDate, dataBaseJuroDate);
    const jurosFactor =
      daysDifference > 0
        ? Math.pow(1 + JUROS_DRONE_PERCENTUAL / 100, daysDifference / 30)
        : 1;

    // Excel PEDIDO DRONE I40:
    // (IF(AND(C27="",C28=""),0,IF(AND(C27<>"",C28=""),'BANCO DE DADOS'!B26,IF(C28<>"",'BANCO DE DADOS'!B26*2,0))))*M34
    let precoBaseUnitario = 0;
    let nomeServico = 'Nenhum serviço selecionado';
    if (servicoCurvasNivel) {
      precoBaseUnitario = VOO_DRONE_ALQ_ANO * 2;
      nomeServico = servicoFungoNematoide
        ? 'Ortomosaico / Curvas de Nível + Fungo e Nematóide'
        : 'Ortomosaico / Projeto de Curvas de Nível';
    } else if (servicoFungoNematoide) {
      precoBaseUnitario = VOO_DRONE_ALQ_ANO;
      nomeServico = 'Ortomosaico / Mapeamento de Fungo e Nematóide';
    }

    const precoUnitarioAlq = precoBaseUnitario * jurosFactor;
    const subtotalArea = alqueires * precoUnitarioAlq;

    const precoUnitarioKm = valorKm * jurosFactor;
    const subtotalDeslocamento = distanciaKm * precoUnitarioKm;

    const totalValue = Math.max(0, subtotalArea + subtotalDeslocamento - desconto);
    const totalValuePerAlq = alqueires > 0 ? totalValue / alqueires : 0;

    return {
      totalValue,
      totalValuePerAlq,
      details: {
        jurosFactor,
        servicoFungoNematoide,
        servicoCurvasNivel,
        nomeServico,
        precoBaseUnitario,
        precoUnitarioAlq,
        subtotalArea,
        precoUnitarioKm,
        subtotalDeslocamento,
        desconto,
        alqueires,
        distanciaKm,
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

fs.writeFileSync(path.join(frontendPath, 'src/services/DroneMappingService.ts'), droneMappingServiceContent, 'utf-8');
console.log('Updated DroneMappingService.ts in frontend');

// 2. DroneMappingService.spec.ts
const droneMappingServiceSpecContent = `import { describe, it, expect } from 'vitest';
import { DroneMappingService } from './DroneMappingService';
import { CostVariable } from './ConferenciaService';

const mockCostVariables: CostVariable[] = [
  { id: '1', name: 'Voo Drone Alq Ano', code: 'VOO_DRONE_ALQ_ANO', value: 50, description: '' },
  { id: '2', name: 'Juros Voo de Drone Percentual', code: 'JUROS_DRONE_PERCENTUAL', value: 3.0, description: '' },
  { id: '3', name: 'Data Base Calculo Juro Drone', code: 'DATA_BASE_CALCULO_JURO_DRONE', value: 20230130, description: '' },
  { id: '4', name: 'Valor KM Conferencia Folha Calculado', code: 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', value: 4.957983193277311, description: '' },
];

describe('DroneMappingService', () => {
  it('should calculate drone mapping matching user Excel screenshot (R$ 2.121,74)', () => {
    const service = new DroneMappingService(mockCostVariables);

    const result = service.calculate({
      alqueires: 10,
      distanciaKm: 10,
      vencimentoServico: '01/11/2026',
      servicoFungoNematoide: true,
      servicoCurvasNivel: false,
    });

    // In Excel PEDIDO DRONE:
    // Base M31 = 44956 (30/01/2023)
    // Days to 01/11/2026 = 1371 days
    // jurosFactor = POWER(1.03, 1371/30) = 3.86065656...
    // Ortomosaico: 50 * 3.86065656 = 193.03 / alq -> 1930.33
    // Deslocamento: 4.957983 * 3.86065656 = 19.14 / km -> 191.41
    // Total = 1930.33 + 191.41 = 2121.74
    // R$/Alq = 212.17
    expect(result.details.jurosFactor).toBeCloseTo(3.8607, 4);
    expect(result.details.precoUnitarioAlq).toBeCloseTo(193.03, 2);
    expect(result.details.subtotalArea).toBeCloseTo(1930.33, 2);
    expect(result.details.precoUnitarioKm).toBeCloseTo(19.14, 2);
    expect(result.details.subtotalDeslocamento).toBeCloseTo(191.41, 2);
    expect(result.totalValue).toBeCloseTo(2121.74, 2);
    expect(result.totalValuePerAlq).toBeCloseTo(212.17, 2);
  });

  it('should double unit price when Ortomosaico/Projeto de Curvas de Nível is selected', () => {
    const service = new DroneMappingService(mockCostVariables);

    const result = service.calculate({
      alqueires: 10,
      distanciaKm: 10,
      vencimentoServico: '01/11/2026',
      servicoFungoNematoide: false,
      servicoCurvasNivel: true, // 2x base price = 100/alq
    });

    // 100 * 3.86065656 = 386.07 / alq -> 3860.66
    // Deslocamento: 191.41
    // Total = 3860.66 + 191.41 = 4052.07
    expect(result.details.precoUnitarioAlq).toBeCloseTo(386.07, 2);
    expect(result.details.subtotalArea).toBeCloseTo(3860.66, 2);
    expect(result.totalValue).toBeCloseTo(4052.07, 2);
  });

  it('should return 0 for area when no service is selected', () => {
    const service = new DroneMappingService(mockCostVariables);

    const result = service.calculate({
      alqueires: 10,
      distanciaKm: 10,
      vencimentoServico: '01/11/2026',
      servicoFungoNematoide: false,
      servicoCurvasNivel: false,
    });

    expect(result.details.subtotalArea).toBe(0);
    expect(result.totalValue).toBeCloseTo(191.41, 2); // only travel
  });
});
`;

fs.writeFileSync(path.join(frontendPath, 'src/services/DroneMappingService.spec.ts'), droneMappingServiceSpecContent, 'utf-8');
console.log('Updated DroneMappingService.spec.ts in frontend');

// 3. DroneMappingServiceForm.tsx
const droneMappingServiceFormContent = `import React, { useState, useEffect, useMemo } from 'react';
import { DroneMappingService, DroneMappingCalculationResult } from '../../../services/DroneMappingService';
import { useCostVariables } from '../../../hooks/useCostVariables';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface DroneMappingServiceFormProps {
  initialAlqueires: number;
  onValuesChange: (calculatedValue: number) => void;
}

export const DroneMappingServiceForm: React.FC<DroneMappingServiceFormProps> = ({
  initialAlqueires,
  onValuesChange,
}) => {
  const { costVariables, loading: loadingCostVariables } = useCostVariables();

  const [alqueires, setAlqueires] = useState<number | null>(initialAlqueires === 0 ? null : initialAlqueires);
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);
  const [vencimentoServico, setVencimentoServico] = useState<Date | undefined>(new Date());
  const [desconto, setDesconto] = useState<number | null>(null);

  // Seletores dos serviços (conforme linhas 27 e 28 do PEDIDO DRONE na planilha)
  const [servicoFungoNematoide, setServicoFungoNematoide] = useState<boolean>(true);
  const [servicoCurvasNivel, setServicoCurvasNivel] = useState<boolean>(false);

  const [calculationResult, setCalculationResult] = useState<DroneMappingCalculationResult | null>(null);

  const droneMappingService = useMemo(() => {
    if (costVariables.length > 0) {
      return new DroneMappingService(costVariables);
    }
    return null;
  }, [costVariables]);

  useEffect(() => {
    setAlqueires(initialAlqueires === 0 ? null : initialAlqueires);
  }, [initialAlqueires]);

  useEffect(() => {
    if (vencimentoServico && droneMappingService) {
      const formattedVencimento = format(vencimentoServico, 'dd/MM/yyyy');

      const result = droneMappingService.calculate({
        alqueires: alqueires === null ? 0 : alqueires,
        distanciaKm: distanciaKm === null ? 0 : distanciaKm,
        vencimentoServico: formattedVencimento,
        servicoFungoNematoide,
        servicoCurvasNivel,
        desconto: desconto === null ? 0 : desconto,
      });

      setCalculationResult(result);
      onValuesChange(result.totalValue);
    }
  }, [
    alqueires,
    distanciaKm,
    vencimentoServico,
    servicoFungoNematoide,
    servicoCurvasNivel,
    desconto,
    onValuesChange,
    droneMappingService,
  ]);

  if (loadingCostVariables) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando variáveis de custo...</p>
      </div>
    );
  }

  if (!droneMappingService) {
    return (
      <div className="text-red-500 p-4 border border-red-500 rounded-md">
        As variáveis de custo não foram carregadas. O cálculo não pode ser realizado.
      </div>
    );
  }

  const totalValue = calculationResult?.totalValue ?? 0;
  const totalValuePerAlq = calculationResult?.totalValuePerAlq ?? 0;
  const details = calculationResult?.details;

  return (
    <div className="space-y-4 p-4 border rounded-md bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cálculo de Voo de Drone (Mapeamento)</h3>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3.5 w-3.5" />
          Sincronizado com budget.xlsm (PEDIDO DRONE)
        </span>
      </div>

      {/* Seleção dos Serviços a Executar (Sinalize com X) */}
      <div className="p-3 border rounded-md bg-muted/20 space-y-2">
        <Label className="text-sm font-semibold text-foreground block">
          Serviços a executar (sinalize com "X"):
        </Label>
        <div className="space-y-2 pt-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="drone-servico-fungo"
              checked={servicoFungoNematoide}
              onCheckedChange={(checked) => setServicoFungoNematoide(!!checked)}
            />
            <label
              htmlFor="drone-servico-fungo"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Ortomosaico / Mapeamento de Fungo e Nematóide (Base: R$ 50/alq)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="drone-servico-curvas"
              checked={servicoCurvasNivel}
              onCheckedChange={(checked) => setServicoCurvasNivel(!!checked)}
            />
            <label
              htmlFor="drone-servico-curvas"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Ortomosaico / Projeto de Curvas de Nível (Base: R$ 100/alq)
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="drone-alqueires">Área em Alqueires:</Label>
            <Input
              id="drone-alqueires"
              type="number"
              value={alqueires === null ? '' : alqueires}
              onChange={(e) => {
                const value = e.target.value;
                setAlqueires(value === '' ? null : parseFloat(value));
              }}
              min="0"
              placeholder="Ex: 10"
            />
          </div>

          <div>
            <Label htmlFor="drone-distancia">Distância da fazenda - Km (ida):</Label>
            <Input
              id="drone-distancia"
              type="number"
              value={distanciaKm === null ? '' : distanciaKm}
              onChange={(e) => {
                const value = e.target.value;
                setDistanciaKm(value === '' ? null : parseFloat(value));
              }}
              min="0"
              placeholder="Ex: 10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="drone-vencimento">Vencimento do serviço:</Label>
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

          <div>
            <Label htmlFor="drone-desconto">Desconto Manual (R$):</Label>
            <Input
              id="drone-desconto"
              type="number"
              value={desconto === null ? '' : desconto}
              onChange={(e) => {
                const value = e.target.value;
                setDesconto(value === '' ? null : parseFloat(value));
              }}
              min="0"
              placeholder="Opcional: R$ 0,00"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t space-y-3">
        <h4 className="text-md font-semibold">Valores Calculados:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground block">Valor Total do Pedido</span>
            <strong className="text-lg text-primary">{droneMappingService.formatCurrency(totalValue)}</strong>
          </div>
          <div className="p-3 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground block">Valor por Alqueire</span>
            <strong className="text-lg">{droneMappingService.formatCurrency(totalValuePerAlq)}/ALQ</strong>
          </div>
        </div>

        {details && (
          <div className="mt-4 p-3 border rounded-md text-xs space-y-1.5 bg-muted/20">
            <div className="font-semibold text-sm mb-1 text-muted-foreground">Composição do Pedido (Conforme Excel):</div>
            <div className="flex justify-between">
              <span>Ortomosaico ({details.alqueires} alq):</span>
              <span className="font-medium">
                {droneMappingService.formatCurrency(details.subtotalArea)} ({droneMappingService.formatCurrency(details.precoUnitarioAlq)}/alq)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Deslocamento ({details.distanciaKm} km):</span>
              <span className="font-medium">
                {droneMappingService.formatCurrency(details.subtotalDeslocamento)} ({droneMappingService.formatCurrency(details.precoUnitarioKm)}/km)
              </span>
            </div>
            {details.desconto > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Desconto concedido:</span>
                <span>-{droneMappingService.formatCurrency(details.desconto)}</span>
              </div>
            )}
            {details.jurosFactor > 1 && (
              <div className="flex justify-between text-muted-foreground pt-1 border-t">
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

fs.writeFileSync(path.join(frontendPath, 'src/components/pages/orders/DroneMappingServiceForm.tsx'), droneMappingServiceFormContent, 'utf-8');
console.log('Updated DroneMappingServiceForm.tsx in frontend');
