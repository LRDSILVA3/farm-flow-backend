const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/SoilSamplingServiceForm.tsx');

const content = `import React, { useState, useEffect, useMemo } from 'react';
import { SoilSamplingService, SoilSamplingCalculationResult } from '../../../services/SoilSamplingService';
import { useCostVariables } from '../../../hooks/useCostVariables';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Info, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface SoilSamplingServiceFormProps {
  initialAlqueires: number;
  initialNumPontos: number;
  onValuesChange: (calculatedValue: number) => void;
}

export const SoilSamplingServiceForm: React.FC<SoilSamplingServiceFormProps> = ({
  initialAlqueires,
  initialNumPontos,
  onValuesChange,
}) => {
  const { costVariables, loading: loadingCostVariables } = useCostVariables();

  const [alqueires, setAlqueires] = useState<number | null>(initialAlqueires === 0 ? null : initialAlqueires);
  const [numPontos, setNumPontos] = useState<number | null>(initialNumPontos === 0 ? null : initialNumPontos);
  const [vencimentoServico, setVencimentoServico] = useState<Date | undefined>(undefined);
  const [isReanalise, setIsReanalise] = useState<boolean>(false);
  const [comNotaFiscal, setComNotaFiscal] = useState<boolean>(true);

  // Chemical determination selections
  const [desejaAduboBase, setDesejaAduboBase] = useState<boolean>(true);
  const [desejaEnxofre, setDesejaEnxofre] = useState<boolean>(true);
  const [desejaMicronutrientes, setDesejaMicronutrientes] = useState<boolean>(true);
  const [desejaAnalise20_40cm, setDesejaAnalise20_40cm] = useState<boolean>(true);
  const [desejaAnaliseFisica, setDesejaAnaliseFisica] = useState<boolean>(false);

  // Discount & Final Closed Value (INPUT DADOS Linha 9 / PEDIDO Linha 44)
  const [descontoManual, setDescontoManual] = useState<number | null>(null);
  const [valorFechadoManual, setValorFechadoManual] = useState<number | null>(null);

  const [calculationResult, setCalculationResult] = useState<SoilSamplingCalculationResult | null>(null);

  const soilSamplingService = useMemo(() => {
    if (costVariables.length > 0) {
      return new SoilSamplingService(costVariables);
    }
    return null;
  }, [costVariables]);

  useEffect(() => {
    setAlqueires(initialAlqueires === 0 ? null : initialAlqueires);
  }, [initialAlqueires]);

  // Recalculate
  useEffect(() => {
    if (soilSamplingService) {
      const formattedVencimento = vencimentoServico ? format(vencimentoServico, 'dd/MM/yyyy') : undefined;
      const alq = alqueires === null ? 0 : alqueires;

      // Minimum analyses suggestion if not provided
      const defaultPoints =
        numPontos === null ? (alq < 5 ? Math.floor(alq) + 1 : Math.floor((alq * 2.42) / 3) + 1) : numPontos;

      const result = soilSamplingService.calculate({
        isReanalise,
        comNotaFiscal,
        alqueires: alq,
        numPontos: defaultPoints,
        vencimentoServico: formattedVencimento,
        desejaAduboBase,
        desejaEnxofre,
        desejaMicronutrientes,
        desejaAnalise20_40cm,
        desejaAnaliseFisica,
        descontoManual: descontoManual === null ? undefined : descontoManual,
        valorFechadoManual: valorFechadoManual === null ? undefined : valorFechadoManual,
      });

      setCalculationResult(result);
      onValuesChange(result.totalValue);
    }
  }, [
    alqueires,
    numPontos,
    vencimentoServico,
    isReanalise,
    comNotaFiscal,
    desejaAduboBase,
    desejaEnxofre,
    desejaMicronutrientes,
    desejaAnalise20_40cm,
    desejaAnaliseFisica,
    descontoManual,
    valorFechadoManual,
    onValuesChange,
    soilSamplingService,
  ]);

  if (loadingCostVariables) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando variáveis de custo...</p>
      </div>
    );
  }

  if (!soilSamplingService) {
    return (
      <div className="text-red-500 p-4 border border-red-500 rounded-md">
        As variáveis de custo não foram carregadas. O cálculo não pode ser realizado.
      </div>
    );
  }

  const totalValue = calculationResult?.totalValue ?? 0;
  const valorTotalSugerido = calculationResult?.valorTotalSugerido ?? 0;
  const desconto = calculationResult?.desconto ?? 0;
  const descontoPercentual = calculationResult?.descontoPercentual ?? 0;
  const totalValuePerAlq = calculationResult?.totalValuePerAlq ?? 0;
  const totalValuePerPoint = calculationResult?.totalValuePerPoint ?? 0;
  const sugeridoPerAlq = calculationResult?.sugeridoPerAlq ?? 0;
  const details = calculationResult?.details;

  const alqVal = alqueires || 0;
  const descontoPerAlq = alqVal > 0 ? desconto / alqVal : 0;

  return (
    <div className="space-y-4 p-4 border rounded-md bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cálculo de Amostragem de Solo (AP / Reanálise)</h3>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3.5 w-3.5" />
          Sincronizado com budget.xlsm (INPUT DADOS / PEDIDO VIA CLIENTE)
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="ap-reanalise"
              checked={isReanalise}
              onCheckedChange={setIsReanalise}
            />
            <Label htmlFor="ap-reanalise">Reanálise de Solo (Área já trabalhada)?</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ap-nf"
              checked={comNotaFiscal}
              onCheckedChange={setComNotaFiscal}
            />
            <Label htmlFor="ap-nf">Cliente deseja nota fiscal?</Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="ap-alqueires">Área em Alqueires:</Label>
            <Input
              id="ap-alqueires"
              type="number"
              value={alqueires === null ? '' : alqueires}
              onChange={(e) => {
                const value = e.target.value;
                setAlqueires(value === '' ? null : parseFloat(value));
              }}
              min="0"
              placeholder="Ex: 50"
            />
          </div>

          <div>
            <Label htmlFor="ap-hectares">Hectares (ha):</Label>
            <Input
              id="ap-hectares"
              type="number"
              value={((alqueires || 0) * 2.42).toFixed(2)}
              readOnly
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="ap-pontos">Número de Pontos de Amostragem:</Label>
            <Input
              id="ap-pontos"
              type="number"
              value={numPontos === null ? '' : numPontos}
              onChange={(e) => {
                const value = e.target.value;
                setNumPontos(value === '' ? null : parseInt(value));
              }}
              min="0"
              placeholder={'Sugerido: ' + (details?.numMinimoAnalises || 0)}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="ap-vencimento">Vencimento do serviço (opcional):</Label>
            {vencimentoServico && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setVencimentoServico(undefined)}
              >
                <X className="h-3 w-3 mr-1" />
                Mudar para À Vista (Sem juros)
              </Button>
            )}
          </div>
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
                {vencimentoServico ? (
                  format(vencimentoServico, "PPP", { locale: ptBR })
                ) : (
                  <span>À Vista (Sem acréscimo de juros)</span>
                )}
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

        {/* Determinations selection */}
        <div className="p-3 border rounded-md bg-muted/20 space-y-3">
          <Label className="font-semibold block text-sm">Determinações no Laudo / Book de Fertilidade:</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <Switch id="ap-adubo" checked={desejaAduboBase} onCheckedChange={setDesejaAduboBase} />
              <Label htmlFor="ap-adubo" className="text-xs cursor-pointer">Adubo de Base (+R$ 35,30)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="ap-enxofre" checked={desejaEnxofre} onCheckedChange={setDesejaEnxofre} />
              <Label htmlFor="ap-enxofre" className="text-xs cursor-pointer">Enxofre (+R$ 17,70)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="ap-micro" checked={desejaMicronutrientes} onCheckedChange={setDesejaMicronutrientes} />
              <Label htmlFor="ap-micro" className="text-xs cursor-pointer">Micronutrientes (+R$ 20,00)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="ap-20-40" checked={desejaAnalise20_40cm} onCheckedChange={setDesejaAnalise20_40cm} />
              <Label htmlFor="ap-20-40" className="text-xs cursor-pointer">Camada 20-40cm (Gesso)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="ap-fisica" checked={desejaAnaliseFisica} onCheckedChange={setDesejaAnaliseFisica} />
              <Label htmlFor="ap-fisica" className="text-xs cursor-pointer">Análise Física (+R$ 42,30)</Label>
            </div>
          </div>
        </div>

        {/* Campos de Desconto e Negociação (Excel INPUT DADOS Linha 9 / PEDIDO Linha 44) */}
        <div className="p-3 border rounded-md bg-muted/20 space-y-3">
          <div className="flex justify-between items-center">
            <Label className="font-semibold text-sm">Negociação de Preço / Desconto:</Label>
            {desconto > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                Desconto de -{descontoPercentual.toFixed(2)}% (-{soilSamplingService.formatCurrency(descontoPerAlq)}/alq)
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ap-desconto" className="text-xs">Desconto Manual (R$):</Label>
              <Input
                id="ap-desconto"
                type="number"
                value={descontoManual === null ? '' : descontoManual}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setDescontoManual(null);
                    setValorFechadoManual(null);
                  } else {
                    const desc = parseFloat(val) || 0;
                    setDescontoManual(desc);
                    setValorFechadoManual(null);
                  }
                }}
                min="0"
                step="0.01"
                placeholder="Ex: 1319.88"
              />
            </div>

            <div>
              <Label htmlFor="ap-valor-fechado" className="text-xs">Valor Total Fechado (R$):</Label>
              <Input
                id="ap-valor-fechado"
                type="number"
                value={valorFechadoManual === null ? '' : valorFechadoManual}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setValorFechadoManual(null);
                    setDescontoManual(null);
                  } else {
                    const fechado = parseFloat(val) || 0;
                    setValorFechadoManual(fechado);
                    setDescontoManual(null);
                  }
                }}
                min="0"
                step="0.01"
                placeholder={'Sugerido: ' + valorTotalSugerido.toFixed(2)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t space-y-3">
        <h4 className="text-md font-semibold">Valores Calculados:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground block">
              {desconto > 0 ? 'Valor Total Fechado' : 'Valor Total Sugerido'}
            </span>
            <strong className="text-lg text-primary">{soilSamplingService.formatCurrency(totalValue)}</strong>
            {desconto > 0 && (
              <span className="text-xs text-muted-foreground block line-through">
                Sugerido: {soilSamplingService.formatCurrency(valorTotalSugerido)}
              </span>
            )}
          </div>
          <div className="p-3 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground block">Valor por Alqueire</span>
            <strong className="text-lg">{soilSamplingService.formatCurrency(totalValuePerAlq)}/ALQ</strong>
            {desconto > 0 && (
              <span className="text-xs text-muted-foreground block">
                Sugerido: {soilSamplingService.formatCurrency(sugeridoPerAlq)}/alq
              </span>
            )}
          </div>
          <div className="p-3 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground block">Valor por Ponto</span>
            <strong className="text-lg">{soilSamplingService.formatCurrency(totalValuePerPoint)}/PTO</strong>
          </div>
        </div>

        {details && (
          <div className="mt-4 p-3 border rounded-md text-xs space-y-1.5 bg-muted/20">
            <div className="font-semibold text-sm mb-1 text-muted-foreground">Composição do Pedido (Conforme PEDIDO VIA CLIENTE):</div>
            
            <div className="flex justify-between py-1 border-b">
              <span>
                <strong>{isReanalise ? 'SERVIÇO A.P. - REANÁLISE' : 'SERVIÇO AGRICULTURA DE PRECISÃO'}</strong> ({alqueires || 0} ALQ):
              </span>
              <span className="font-medium">
                {soilSamplingService.formatCurrency(valorTotalSugerido)} ({soilSamplingService.formatCurrency(sugeridoPerAlq)}/alq)
              </span>
            </div>

            <div className="flex justify-between py-1 border-b">
              <span>ANÁLISE INCLUSA ({details.haPorPonto.toFixed(2)} ha/ponto) - {numPontos || 0} PTOS:</span>
              <span className="text-muted-foreground">R$ 0,00</span>
            </div>

            <div className="flex justify-between py-1 border-b">
              <span>RECOMENDAÇÕES DE CORRETIVOS{desejaAduboBase ? ' E ADUBAÇÃO DE BASE' : ''}:</span>
              <span className="text-muted-foreground">R$ 0,00</span>
            </div>

            {details.determinationsSummary && (
              <div className="flex justify-between py-1 border-b">
                <span>{details.determinationsSummary}:</span>
                <span className="text-muted-foreground">R$ 0,00</span>
              </div>
            )}

            {desconto > 0 && (
              <div className="flex justify-between text-destructive py-1 border-b font-medium">
                <span>DESCONTO DE -{descontoPercentual.toFixed(2)}% (-{soilSamplingService.formatCurrency(descontoPerAlq)}/alq):</span>
                <span>-{soilSamplingService.formatCurrency(desconto)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b font-bold text-sm text-foreground">
              <span>TOTAL DO PEDIDO:</span>
              <span>{soilSamplingService.formatCurrency(totalValue)} ({soilSamplingService.formatCurrency(totalValuePerAlq)}/alq)</span>
            </div>

            {details.jurosFactor > 1 && (
              <div className="flex justify-between text-muted-foreground pt-1">
                <span>Fator de juros até vencimento (1,5%/mês):</span>
                <span>{details.jurosFactor.toFixed(4)}x</span>
              </div>
            )}

            <div className="pt-2 text-[11px] text-muted-foreground italic border-t">
              OBS: Validade do orçamento: 60 dias
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully written SoilSamplingServiceForm.tsx');
