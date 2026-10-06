const fs = require('fs');
const path = require('path');

const frontendPath = path.resolve(__dirname, '../../farm-flow-frontend');

// 1. ATVService.ts
const atvServiceContent = `import { differenceInDays } from 'date-fns';
import { CostVariable } from './ConferenciaService';

export interface ATVItemParam {
  produto: string; // 'Calc. Dolomítico' | 'Calc. Calcítico' | 'Cama de Frango' | 'Pó de Rocha' | 'Gesso' | 'KCl' | 'Outro'
  idTalhao?: string;
  areaHa: number;
  toneladas: number;
  cobraFrete: boolean;
  distanciaFreteKm?: number;
}

export interface ATVParams {
  distanciaIdaKm: number;
  vencimentoServico?: string; // DD/MM/YYYY (optional)
  quantosProdutos: number; // 1, 2, or >= 3
  quantosCaminhoes?: number; // default 2
  carregamentoNecessario?: boolean; // default true
  comNotaFiscal?: boolean; // default true
  mapaPreciza?: boolean; // default true
  clienteAlmoco?: boolean; // default false
  descontoManual?: number; // default 0
  itens: ATVItemParam[];
}

export interface ATVItemResult {
  produto: string;
  idTalhao: string;
  areaHa: number;
  areaAlq: number;
  toneladas: number;
  precoUnitarioAlq: number;
  investimentoATV: number;
  cargas: number;
  investimentoFrete: number;
  investimentoTotal: number;
}

export interface ATVCalculationResult {
  totalValue: number;
  subtotalATV: number;
  subtotalFrete: number;
  custoCarregamento: number;
  adicionalDeslocamento: number;
  descontoNF: number;
  descontoManual: number;
  diasServico: number;
  totalAreaAlq: number;
  totalToneladas: number;
  totalCargas: number;
  precoPorAlqueire: number;
  precoPorTonelada: number;
  precoPorCarga: number;
  details: {
    jurosFactor: number;
    itens: ATVItemResult[];
    carregamentoNecessario: boolean;
    comNotaFiscal: boolean;
    mapaPreciza: boolean;
    clienteAlmoco: boolean;
    quantosCaminhoes: number;
  };
}

export class ATVService {
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

  public calculate(params: ATVParams): ATVCalculationResult {
    const {
      distanciaIdaKm = 0,
      vencimentoServico,
      quantosProdutos = 1,
      quantosCaminhoes = 2,
      carregamentoNecessario = true,
      comNotaFiscal = true,
      mapaPreciza = true,
      clienteAlmoco = false,
      descontoManual = 0,
      itens = [],
    } = params;

    const ATV_1_PRODUTO = this.getVariableValue('ATV_1_PRODUTO') || 290;
    const ATV_2_PRODUTOS = this.getVariableValue('ATV_2_PRODUTOS') || 280;
    const ATV_3_PRODUTOS = this.getVariableValue('ATV_3_PRODUTOS') || 260;
    const VALOR_APLICACAO_ESTERCO = this.getVariableValue('VALOR_APLICACAO_ESTERCO') || 40.40;
    const DIARIA_PA_CARREGADEIRA = this.getVariableValue('DIARIA_PA_CARREGADEIRA') || 2600;
    const VALOR_KM_PRANCHA = this.getVariableValue('VALOR_KM_DESLOCAMENTO_PRANCHA') || 10;
    const VALOR_KM_DESLOCAMENTO_VAZIO = this.getVariableValue('VALOR_KM_DESLOCAMENTO_VAZIO') || 6.12;
    const DATA_BASE_CALCULO_JURO = this.getVariableValue('DATA_BASE_CALCULO_JURO') || 20241231;
    const JUROS_PAGAMENTO_PRAZO_PERCENTUAL = this.getVariableValue('JUROS_PAGAMENTO_PRAZO_PERCENTUAL') || 1.5;

    // Fuel derived values
    const valorDiesel = this.getVariableValue('VALOR_OLEO_DIESEL');
    let valorKmFrete = this.getVariableValue('VALOR_KM_FRETE');
    let despesaViagem = this.getVariableValue('DESPESA_VIAGEM_ATV');

    if (valorDiesel > 0) {
      valorKmFrete = Math.round(((valorDiesel / 1 * 2) / 0.94) * 100) / 100;
      despesaViagem = 5 * 2 * 3 * valorDiesel;
    } else {
      if (!valorKmFrete || valorKmFrete === 0) valorKmFrete = 14.77;
      if (!despesaViagem || despesaViagem === 0) despesaViagem = 208.24;
    }

    // Juros
    let jurosFactor = 1;
    if (vencimentoServico && vencimentoServico.trim() !== '') {
      const [day, month, year] = vencimentoServico.split('/').map(Number);
      const vencimentoDate = new Date(year, month - 1, day);

      const yearJuro = Math.floor(DATA_BASE_CALCULO_JURO / 10000);
      const monthJuro = Math.floor((DATA_BASE_CALCULO_JURO % 10000) / 100);
      const dayJuro = DATA_BASE_CALCULO_JURO % 100;
      const dataBaseJuroDate = new Date(yearJuro, monthJuro - 1, dayJuro);

      const daysDifference = differenceInDays(vencimentoDate, dataBaseJuroDate);
      if (daysDifference > 0) {
        jurosFactor =
          Math.round(Math.pow(1 + JUROS_PAGAMENTO_PRAZO_PERCENTUAL / 100, daysDifference / 30) * 1000) / 1000;
      }
    }

    let totalAreaAlq = 0;
    let totalToneladas = 0;
    let totalCargas = 0;
    let subtotalATV = 0;
    let subtotalFrete = 0;
    let sumDiasServico = 0;

    const itemResults: ATVItemResult[] = itens.map((item) => {
      const areaAlq = Math.round((item.areaHa / 2.42) * 100) / 100;
      const isEsterco = item.produto === 'Cama de Frango' || item.produto === 'Pó de Rocha';
      const tonPorHa = item.areaHa > 0 ? item.toneladas / item.areaHa : 0;

      let precoBaseAlq = 0;
      if (isEsterco) {
        precoBaseAlq = VALOR_APLICACAO_ESTERCO;
      } else if (tonPorHa >= 5.5) {
        precoBaseAlq = VALOR_APLICACAO_ESTERCO * 0.75;
      } else if (quantosProdutos === 1) {
        precoBaseAlq = ATV_1_PRODUTO;
      } else if (quantosProdutos >= 3) {
        precoBaseAlq = ATV_3_PRODUTOS;
      } else {
        precoBaseAlq = ATV_2_PRODUTOS;
      }

      const precoCorrigido = precoBaseAlq * jurosFactor;

      let investimentoATV = 0;
      if (item.areaHa > 0) {
        if (isEsterco) {
          const valorMinimo = ATV_3_PRODUTOS * areaAlq * jurosFactor;
          investimentoATV = Math.max(valorMinimo, item.toneladas * precoCorrigido);
        } else if (tonPorHa >= 5.5) {
          investimentoATV = precoCorrigido * item.toneladas;
        } else {
          investimentoATV = precoCorrigido * areaAlq;
        }
      }

      // Frete
      let cargas = 0;
      let investimentoFrete = 0;
      if (item.cobraFrete) {
        cargas = isEsterco ? Math.ceil(item.toneladas / 8.5) : Math.ceil(item.toneladas / 13);
        const distKm = item.distanciaFreteKm || distanciaIdaKm;
        const custoPorKm = cargas * distKm * 2 * valorKmFrete;
        const custoMinimoViagem = cargas * despesaViagem;
        investimentoFrete = Math.max(custoMinimoViagem, custoPorKm) * jurosFactor;
      } else {
        cargas = isEsterco ? Math.ceil(item.toneladas / 8.5) : Math.ceil(item.toneladas / 13);
      }

      const diasItem = isEsterco
        ? item.toneladas / (200 * quantosCaminhoes)
        : areaAlq / (28 * quantosCaminhoes);

      totalAreaAlq += areaAlq;
      totalToneladas += item.toneladas;
      totalCargas += cargas;
      subtotalATV += investimentoATV;
      subtotalFrete += investimentoFrete;
      sumDiasServico += diasItem;

      return {
        produto: item.produto,
        idTalhao: item.idTalhao || '',
        areaHa: item.areaHa,
        areaAlq,
        toneladas: item.toneladas,
        precoUnitarioAlq: precoCorrigido,
        investimentoATV,
        cargas,
        investimentoFrete,
        investimentoTotal: investimentoATV + investimentoFrete,
      };
    });

    const diasServico = Math.max(1, Math.ceil(sumDiasServico));

    // Carregamento + Frete Pá Carregadeira (Excel Q21)
    let custoCarregamento = 0;
    if (carregamentoNecessario) {
      let fatorAjuste = 1;
      if (comNotaFiscal && mapaPreciza) fatorAjuste = 0.96;
      else if (!comNotaFiscal && mapaPreciza) fatorAjuste = 0.96 * 0.96;
      else if (!comNotaFiscal && !mapaPreciza) fatorAjuste = 0.96;
      else fatorAjuste = 1.0;

      const custoPa = fatorAjuste * DIARIA_PA_CARREGADEIRA * diasServico;
      const custoPrancha = VALOR_KM_PRANCHA * distanciaIdaKm * 4;
      custoCarregamento = (custoPa + custoPrancha) * jurosFactor;
    }

    // Deslocamento Vazio (>20% threshold, Excel Q20)
    let adicionalDeslocamento = 0;
    if (distanciaIdaKm > 0 && subtotalATV > 0) {
      const custoDeslocVazio = distanciaIdaKm * 2 * quantosCaminhoes * VALOR_KM_DESLOCAMENTO_VAZIO;
      if (custoDeslocVazio / subtotalATV > 0.20) {
        adicionalDeslocamento = custoDeslocVazio * jurosFactor;
      }
    }

    // Desconto NF (Excel Q19)
    const descontoNF = !comNotaFiscal ? subtotalATV * 0.04 : 0;

    const totalValue = Math.max(
      0,
      subtotalATV + subtotalFrete + custoCarregamento + adicionalDeslocamento - descontoNF - descontoManual
    );

    const precoPorAlqueire = totalAreaAlq > 0 ? Math.round((totalValue / totalAreaAlq) * 100) / 100 : 0;
    const precoPorTonelada = totalToneladas > 0 ? Math.round((totalValue / totalToneladas) * 100) / 100 : 0;
    const precoPorCarga = totalCargas > 0 ? Math.round((totalValue / totalCargas) * 100) / 100 : 0;

    return {
      totalValue,
      subtotalATV,
      subtotalFrete,
      custoCarregamento,
      adicionalDeslocamento,
      descontoNF,
      descontoManual,
      diasServico,
      totalAreaAlq: Math.round(totalAreaAlq * 100) / 100,
      totalToneladas: Math.round(totalToneladas * 100) / 100,
      totalCargas,
      precoPorAlqueire,
      precoPorTonelada,
      precoPorCarga,
      details: {
        jurosFactor,
        itens: itemResults,
        carregamentoNecessario,
        comNotaFiscal,
        mapaPreciza,
        clienteAlmoco,
        quantosCaminhoes,
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

fs.writeFileSync(path.join(frontendPath, 'src/services/ATVService.ts'), atvServiceContent, 'utf-8');
console.log('Updated ATVService.ts in frontend');

// 2. ATVService.spec.ts
const atvServiceSpecContent = `import { describe, it, expect } from 'vitest';
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
});
`;

fs.writeFileSync(path.join(frontendPath, 'src/services/ATVService.spec.ts'), atvServiceSpecContent, 'utf-8');
console.log('Updated ATVService.spec.ts in frontend');

// 3. ATVServiceForm.tsx
const atvServiceFormContent = `import React, { useState, useEffect, useMemo } from 'react';
import { ATVService, ATVCalculationResult, ATVItemParam } from '../../../services/ATVService';
import { useCostVariables } from '../../../hooks/useCostVariables';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Info, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface ATVServiceFormProps {
  initialDistanciaKm: number;
  onValuesChange: (calculatedValue: number) => void;
}

const AVAILABLE_PRODUCTS = [
  'Calc. Dolomítico',
  'Calc. Calcítico',
  'Gesso',
  'Cama de Frango',
  'Pó de Rocha',
  'KCl',
  'Outro',
];

export const ATVServiceForm: React.FC<ATVServiceFormProps> = ({
  initialDistanciaKm,
  onValuesChange,
}) => {
  const { costVariables, loading: loadingCostVariables } = useCostVariables();

  const [distanciaIdaKm, setDistanciaIdaKm] = useState<number | null>(initialDistanciaKm || 40);
  const [vencimentoServico, setVencimentoServico] = useState<Date | undefined>(undefined);
  const [quantosProdutos, setQuantosProdutos] = useState<number>(3);
  const [quantosCaminhoes, setQuantosCaminhoes] = useState<number>(2);

  // Parâmetros operacionais da planilha INPUT ATV
  const [carregamentoNecessario, setCarregamentoNecessario] = useState<boolean>(true);
  const [comNotaFiscal, setComNotaFiscal] = useState<boolean>(true);
  const [mapaPreciza, setMapaPreciza] = useState<boolean>(true);
  const [clienteAlmoco, setClienteAlmoco] = useState<boolean>(false);
  const [descontoManual, setDescontoManual] = useState<number | null>(null);

  const [itens, setItens] = useState<ATVItemParam[]>([
    {
      produto: 'Calc. Dolomítico',
      idTalhao: 'TL44',
      areaHa: 72,
      toneladas: 20,
      cobraFrete: false,
    },
  ]);

  const [calculationResult, setCalculationResult] = useState<ATVCalculationResult | null>(null);

  const atvService = useMemo(() => {
    if (costVariables.length > 0) {
      return new ATVService(costVariables);
    }
    return null;
  }, [costVariables]);

  const handleAddItem = () => {
    setItens([
      ...itens,
      {
        produto: 'Calc. Dolomítico',
        idTalhao: '',
        areaHa: 0,
        toneladas: 0,
        cobraFrete: false,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof ATVItemParam, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setItens(newItens);
  };

  useEffect(() => {
    if (atvService) {
      const formattedVencimento = vencimentoServico ? format(vencimentoServico, 'dd/MM/yyyy') : undefined;

      const result = atvService.calculate({
        distanciaIdaKm: distanciaIdaKm === null ? 0 : distanciaIdaKm,
        vencimentoServico: formattedVencimento,
        quantosProdutos,
        quantosCaminhoes,
        carregamentoNecessario,
        comNotaFiscal,
        mapaPreciza,
        clienteAlmoco,
        descontoManual: descontoManual === null ? 0 : descontoManual,
        itens,
      });

      setCalculationResult(result);
      onValuesChange(result.totalValue);
    }
  }, [
    distanciaIdaKm,
    vencimentoServico,
    quantosProdutos,
    quantosCaminhoes,
    carregamentoNecessario,
    comNotaFiscal,
    mapaPreciza,
    clienteAlmoco,
    descontoManual,
    itens,
    onValuesChange,
    atvService,
  ]);

  if (loadingCostVariables) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando variáveis de custo...</p>
      </div>
    );
  }

  if (!atvService) {
    return (
      <div className="text-red-500 p-4 border border-red-500 rounded-md">
        As variáveis de custo não foram carregadas. O cálculo não pode ser realizado.
      </div>
    );
  }

  const totalValue = calculationResult?.totalValue ?? 0;
  const subtotalATV = calculationResult?.subtotalATV ?? 0;
  const custoCarregamento = calculationResult?.custoCarregamento ?? 0;
  const precoPorAlqueire = calculationResult?.precoPorAlqueire ?? 0;
  const precoPorTonelada = calculationResult?.precoPorTonelada ?? 0;
  const precoPorCarga = calculationResult?.precoPorCarga ?? 0;
  const diasServico = calculationResult?.diasServico ?? 1;
  const details = calculationResult?.details;

  return (
    <div className="space-y-4 p-4 border rounded-md bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cálculo de Aplicação em Taxa Variável (ATV)</h3>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3.5 w-3.5" />
          Sincronizado com budget.xlsm (INPUT ATV / PEDIDO ATV)
        </span>
      </div>

      <div className="space-y-4">
        {/* Parametrização Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="atv-distancia">Deslocamento até a área - Km (ida):</Label>
            <Input
              id="atv-distancia"
              type="number"
              value={distanciaIdaKm === null ? '' : distanciaIdaKm}
              onChange={(e) => {
                const value = e.target.value;
                setDistanciaIdaKm(value === '' ? null : parseFloat(value));
              }}
              min="0"
              placeholder="Ex: 40"
            />
          </div>

          <div>
            <Label htmlFor="atv-vencimento">Vencimento do serviço (opcional):</Label>
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
                  {vencimentoServico ? format(vencimentoServico, "PPP", { locale: ptBR }) : <span>À Vista (Sem acréscimo)</span>}
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
            <Label htmlFor="atv-quantos-produtos">Número de produtos no pacote:</Label>
            <Select
              value={quantosProdutos.toString()}
              onValueChange={(val) => setQuantosProdutos(parseInt(val))}
            >
              <SelectTrigger id="atv-quantos-produtos">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Produto (R$ 290/alq)</SelectItem>
                <SelectItem value="2">2 Produtos (R$ 280/alq)</SelectItem>
                <SelectItem value="3">3 ou Mais Produtos (R$ 260/alq)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Toggles operacionais */}
        <div className="p-3 border rounded-md bg-muted/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="atv-carregamento"
              checked={carregamentoNecessario}
              onCheckedChange={setCarregamentoNecessario}
            />
            <Label htmlFor="atv-carregamento" className="text-xs cursor-pointer">
              Carregamento Pá Carregadeira?
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="atv-nf"
              checked={comNotaFiscal}
              onCheckedChange={setComNotaFiscal}
            />
            <Label htmlFor="atv-nf" className="text-xs cursor-pointer">
              Serviço com Nota Fiscal?
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="atv-mapa"
              checked={mapaPreciza}
              onCheckedChange={setMapaPreciza}
            />
            <Label htmlFor="atv-mapa" className="text-xs cursor-pointer">
              Mapa de Origem Preciza?
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="atv-almoco"
              checked={clienteAlmoco}
              onCheckedChange={setClienteAlmoco}
            />
            <Label htmlFor="atv-almoco" className="text-xs cursor-pointer">
              Cliente providencia almoço?
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="atv-caminhoes">Caminhões para aplicar:</Label>
            <Input
              id="atv-caminhoes"
              type="number"
              value={quantosCaminhoes}
              onChange={(e) => setQuantosCaminhoes(parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="atv-desconto">Desconto Manual (R$):</Label>
            <Input
              id="atv-desconto"
              type="number"
              value={descontoManual === null ? '' : descontoManual}
              onChange={(e) => {
                const value = e.target.value;
                setDescontoManual(value === '' ? null : parseFloat(value));
              }}
              min="0"
              placeholder="Ex: 111.19"
            />
          </div>
        </div>

        {/* Product Items Table */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-2">
            <Label className="font-semibold">Produtos e Talhões:</Label>
            <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Produto/Talhão
            </Button>
          </div>

          <div className="space-y-3">
            {itens.map((item, idx) => (
              <div key={idx} className="p-3 border rounded-md bg-muted/30 grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                <div className="md:col-span-2">
                  <Label className="text-xs">Produto</Label>
                  <Select
                    value={item.produto}
                    onValueChange={(val) => handleItemChange(idx, 'produto', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_PRODUCTS.map((prod) => (
                        <SelectItem key={prod} value={prod}>
                          {prod}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Talhão</Label>
                  <Input
                    type="text"
                    value={item.idTalhao || ''}
                    onChange={(e) => handleItemChange(idx, 'idTalhao', e.target.value)}
                    placeholder="Ex: TL44"
                  />
                </div>

                <div>
                  <Label className="text-xs">Área (ha)</Label>
                  <Input
                    type="number"
                    value={item.areaHa}
                    onChange={(e) => handleItemChange(idx, 'areaHa', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Toneladas (Ton)</Label>
                  <Input
                    type="number"
                    value={item.toneladas}
                    onChange={(e) => handleItemChange(idx, 'toneladas', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                  />
                </div>

                <div className="flex items-center space-x-2 pb-2">
                  <Switch
                    id={"frete-" + idx}
                    checked={item.cobraFrete}
                    onCheckedChange={(checked) => handleItemChange(idx, 'cobraFrete', checked)}
                  />
                  <Label htmlFor={"frete-" + idx} className="text-xs cursor-pointer">Frete?</Label>
                </div>

                <div className="flex justify-end pb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={itens.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t space-y-3">
        <h4 className="text-md font-semibold">Valores Calculados:</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground block">Valor Total do Pedido</span>
            <strong className="text-lg text-primary">{atvService.formatCurrency(totalValue)}</strong>
          </div>
          <div className="p-3 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground block">Valor por Alqueire</span>
            <strong className="text-lg">{atvService.formatCurrency(precoPorAlqueire)}/ALQ</strong>
          </div>
          <div className="p-3 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground block">Valor por Tonelada</span>
            <strong className="text-lg">{atvService.formatCurrency(precoPorTonelada)}/TON</strong>
          </div>
          <div className="p-3 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground block">Valor por Carga</span>
            <strong className="text-lg">{atvService.formatCurrency(precoPorCarga)}/CARGA</strong>
          </div>
        </div>

        {details && (
          <div className="mt-4 p-3 border rounded-md text-xs space-y-1.5 bg-muted/20">
            <div className="font-semibold text-sm mb-1 text-muted-foreground">Composição do Pedido (Conforme PEDIDO ATV):</div>

            {custoCarregamento > 0 && (
              <div className="flex justify-between py-1 border-b">
                <span>Carregamento ({diasServico} diária(s) Pá Carregadeira + Prancha 160 Km):</span>
                <span className="font-medium">{atvService.formatCurrency(custoCarregamento)}</span>
              </div>
            )}

            {details.itens.map((it, i) => (
              <div key={i} className="flex justify-between py-1 border-b">
                <span>
                  Serviço Aplic. <strong>{it.produto}</strong> - {it.toneladas} TON {it.idTalhao ? '- ' + it.idTalhao : ''} ({it.areaAlq} alq):
                </span>
                <span className="font-medium">
                  {atvService.formatCurrency(it.investimentoATV)} ({atvService.formatCurrency(it.precoUnitarioAlq)}/alq)
                </span>
              </div>
            ))}

            {calculationResult?.descontoManual && calculationResult.descontoManual > 0 ? (
              <div className="flex justify-between text-destructive py-1 border-b">
                <span>Desconto concedido:</span>
                <span>-{atvService.formatCurrency(calculationResult.descontoManual)}</span>
              </div>
            ) : null}

            {details.jurosFactor > 1 && (
              <div className="flex justify-between text-muted-foreground pt-1">
                <span>Fator de juros até vencimento (1,5%/mês):</span>
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

fs.writeFileSync(path.join(frontendPath, 'src/components/pages/orders/ATVServiceForm.tsx'), atvServiceFormContent, 'utf-8');
console.log('Updated ATVServiceForm.tsx in frontend');
