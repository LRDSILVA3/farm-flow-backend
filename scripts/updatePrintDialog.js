const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/OrderPrintDialog.tsx');

const content = `import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Order } from '@/hooks/useOrders';
import { Client } from '@/hooks/useClients';
import { Farm } from '@/hooks/useFarms';
import { Printer, Check, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

interface OrderPrintDialogProps {
  order: Order | null;
  client?: Client | null;
  farm?: Farm | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ServiceTemplate {
  titleSuffix: string;
  defaultUnit: string;
  mainItemDescription: string;
  complementaryItems: {
    quantity?: string;
    unit?: string;
    description: string;
    unitPrice?: string;
    totalPrice?: string;
  }[];
}

const parseNum = (v: any): number => {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (!v) return 0;
  const str = String(v).trim();
  if (str.includes(',')) {
    const cleaned = str.replace(/[^\\d,-]/g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  const cleaned = str.replace(/[^\\d.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

const formatBRL = (val: number): string => {
  if (isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const getServiceTemplate = (rawServiceName: string, rawType: string): ServiceTemplate => {
  const combined = ((rawServiceName || '') + ' ' + (rawType || '')).toLowerCase();

  if (combined.includes('confer')) {
    return {
      titleSuffix: 'CONFERÊNCIA',
      defaultUnit: 'ALQ',
      mainItemDescription: 'SERVIÇO DE COLETA DE ANÁLISE DE CONFERÊNCIA',
      complementaryItems: [
        { quantity: '-', unit: 'PTOS', description: 'ANÁLISE DE SOLO (MACRO + S + P-REM) INCLUSA', totalPrice: 'R$ 0,00' },
        { quantity: '', unit: '', description: 'ANÁLISE DE SOLO 20-40 CM (MACRO + S)', totalPrice: 'R$ 0,00' },
        { quantity: '', unit: '', description: 'ANÁLISE FÍSICA DE SOLO E LAUDOS TÉCNICOS', totalPrice: 'R$ 0,00' },
      ],
    };
  }

  if (combined.includes('drone') && (combined.includes('map') || combined.includes('voo'))) {
    return {
      titleSuffix: 'MAPEAMENTO COM DRONE',
      defaultUnit: 'ALQ',
      mainItemDescription: 'ORTOMOSAICO / MAPEAMENTO AÉREO COM DRONE',
      complementaryItems: [
        { quantity: '-', unit: 'KM', description: 'DESLOCAMENTO TÉCNICO E PROCESSAMENTO DE IMAGENS', totalPrice: 'R$ 0,00' },
        { quantity: '', unit: '', description: 'MODELO DIGITAL DE ELEVAÇÃO (MDE) E ANÁLISE TOPOGRÁFICA', totalPrice: 'R$ 0,00' },
        { quantity: '', unit: '', description: 'RELATÓRIO DE FALHAS DE PLANTIO E DADOS VETORIAIS', totalPrice: 'R$ 0,00' },
      ],
    };
  }

  if (combined.includes('compacta')) {
    return {
      titleSuffix: 'COMPACTAÇÃO DE SOLO',
      defaultUnit: 'PTOS',
      mainItemDescription: 'AVALIAÇÃO DE COMPACTAÇÃO DO SOLO (PENETROMETRIA)',
      complementaryItems: [
        { quantity: '-', unit: 'KM', description: 'DESLOCAMENTO TÉCNICO E AMOSTRAGEM GEORREFERENCIADA', totalPrice: 'R$ 0,00' },
        { quantity: '', unit: '', description: 'MAPAS DE RESISTÊNCIA À PENETRAÇÃO EM DIFERENTES PROFUNDIDADES', totalPrice: 'R$ 0,00' },
        { quantity: '', unit: '', description: 'RELATÓRIO TÉCNICO DE MANEJO DE SUBSOLAGEM', totalPrice: 'R$ 0,00' },
      ],
    };
  }

  if (combined.includes('folia') || combined.includes('folha')) {
    return {
      titleSuffix: 'ANÁLISE FOLIAR',
      defaultUnit: 'ALQ',
      mainItemDescription: 'SERVIÇO DE COLETA DE ANÁLISE FOLIAR',
      complementaryItems: [
        { quantity: '-', unit: 'PTOS', description: 'ANÁLISE FOLIAR LABORATORIAL INCLUSA (MACRO + MICRONUTRIENTES)', totalPrice: 'R$ 0,00' },
        { quantity: '', unit: '', description: 'DIAGNÓSTICO DA COMPOSIÇÃO NUTRICIONAL DA CULTURA', totalPrice: 'R$ 0,00' },
        { quantity: '', unit: '', description: 'RECOMENDAÇÃO TÉCNICA DE CORREÇÃO FOLIAR', totalPrice: 'R$ 0,00' },
      ],
    };
  }

  if (combined.includes('atv')) {
    return {
      titleSuffix: 'APLICAÇÃO ATV',
      defaultUnit: 'ALQ',
      mainItemDescription: 'SERVIÇO DE APLICAÇÃO A TAXA VARIÁVEL (ATV)',
      complementaryItems: [
        { quantity: '-', unit: 'DIÁRIA', description: 'CARREGAMENTO E TRANSPORTE DE CORRETIVOS / FERTILIZANTES', totalPrice: 'R$ 0,00' },
        { quantity: '', unit: '', description: 'DISTRIBUIÇÃO GEORREFERENCIADA EM TAXA VARIÁVEL', totalPrice: 'R$ 0,00' },
        { quantity: '', unit: '', description: 'MAPA DE APLICAÇÃO REALIZADA (AS-APPLIED)', totalPrice: 'R$ 0,00' },
      ],
    };
  }

  if (combined.includes('pulveriz')) {
    return {
      titleSuffix: 'PULVERIZAÇÃO COM DRONE',
      defaultUnit: 'HA',
      mainItemDescription: 'SERVIÇO DE PULVERIZAÇÃO AGRÍCOLA COM DRONE',
      complementaryItems: [
        { quantity: '-', unit: 'HA', description: 'CALIBRAÇÃO RTK E DESVIO DE OBSTÁCULOS', totalPrice: 'R$ 0,00' },
        { quantity: '', unit: '', description: 'APLICAÇÃO ULTRA-BAIXO VOLUME COM COBERTURA UNIFORME', totalPrice: 'R$ 0,00' },
        { quantity: '', unit: '', description: 'RELATÓRIO TÉCNICO DE APLICAÇÃO E CONDIÇÕES METEOROLÓGICAS', totalPrice: 'R$ 0,00' },
      ],
    };
  }

  // Padrão: AP
  return {
    titleSuffix: 'AP',
    defaultUnit: 'ALQ',
    mainItemDescription: 'SERVIÇO AGRICULTURA DE PRECISÃO',
    complementaryItems: [
      { quantity: '-', unit: 'PTOS', description: 'ANÁLISE INCLUSA (GRADE REGULAR AMOSTRAL)', totalPrice: 'R$ 0,00' },
      { quantity: '', unit: '', description: 'RECOMENDAÇÕES DE CORRETIVOS E ADUBAÇÃO DE BASE', totalPrice: 'R$ 0,00' },
      { quantity: '', unit: '', description: 'ENXOFRE, MICRO, ANÁLISE DE 20-40CM E ARQUIVOS PARA CONTROLADOR', totalPrice: 'R$ 0,00' },
    ],
  };
};

export const OrderPrintDialog: React.FC<OrderPrintDialogProps> = ({
  order,
  client,
  farm,
  open,
  onOpenChange,
}) => {
  const [viaType, setViaType] = useState<'CLIENTE' | 'EMPRESA'>('CLIENTE');
  const [paymentMethod, setPaymentMethod] = useState<'BOLETO' | 'CHEQUE' | 'CARTEIRA'>('BOLETO');
  const [consultor, setConsultor] = useState('VICTOR / PRECIZA');
  const [lote, setLote] = useState('');
  const [matricula, setMatricula] = useState('');
  const [isEditingHeaders, setIsEditingHeaders] = useState(false);

  useEffect(() => {
    if (farm) {
      setLote(farm.lot || '');
      setMatricula(farm.registration || '');
    }
  }, [farm, open]);

  if (!order) return null;

  const todayStr = format(new Date(), 'dd/MM/yyyy');
  const orderTotal = (order.numericValue !== undefined && order.numericValue !== null)
    ? order.numericValue
    : parseNum(order.value);

  const totalArea = parseNum(order.area);
  const unitPrice = totalArea > 0 ? (orderTotal / totalArea) : 0;

  const serviceTemplate = getServiceTemplate(order.serviceName, order.type);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 print:p-0 print:m-0 print:max-w-none print:shadow-none print:border-none">
        <DialogHeader className="print:hidden flex flex-row items-center justify-between pb-3 border-b">
          <DialogTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Folha de Pedido / Orçamento Oficial
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingHeaders(!isEditingHeaders)}
              className="text-xs h-7 gap-1"
            >
              <Edit2 className="h-3 w-3" />
              {isEditingHeaders ? 'Concluir Ajustes' : 'Editar Campos'}
            </Button>
          </DialogTitle>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md shadow-sm border p-0.5 bg-muted">
              <button
                type="button"
                onClick={() => setViaType('CLIENTE')}
                className={\`px-3 py-1 text-xs font-semibold rounded transition-colors \${viaType === 'CLIENTE' ? 'bg-white shadow text-green-700' : 'text-gray-600 hover:text-gray-900'}\`}
              >
                Via Cliente
              </button>
              <button
                type="button"
                onClick={() => setViaType('EMPRESA')}
                className={\`px-3 py-1 text-xs font-semibold rounded transition-colors \${viaType === 'EMPRESA' ? 'bg-white shadow text-green-700' : 'text-gray-600 hover:text-gray-900'}\`}
              >
                Via Empresa
              </button>
            </div>
            <Button size="sm" onClick={handlePrint} className="bg-green-700 hover:bg-green-800 text-white gap-1.5 shadow-sm">
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </Button>
          </div>
        </DialogHeader>

        {/* CONTAINER DA FOLHA (ESTILO OFICIAL PRECIZA) */}
        <div
          className="bg-white text-black p-4 font-sans text-xs leading-tight print:p-0 print:w-full print:text-black"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          <style dangerouslySetInnerHTML={{ __html: \`
            @media print {
              body * { visibility: hidden !important; }
              .print-document-root, .print-document-root * { visibility: visible !important; }
              .print-document-root {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 5mm !important;
              }
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
            }
          \` }} />

          <div className="print-document-root border-2 border-black p-3 space-y-2">
            {/* 1. CABEÇALHO EMPRESA */}
            <div className="text-center pb-2 border-b border-black">
              <div className="flex items-center justify-center gap-2 mb-1">
                <svg className="w-8 h-8 text-green-700 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="text-left inline-block">
                  <h1 className="text-2xl font-black tracking-wider leading-none text-black">PRECIZA</h1>
                  <p className="text-[10px] font-bold tracking-widest text-black">AGRICULTURA DE PRECISÃO</p>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-gray-800">
                <span>www.preciza.com.br</span> &nbsp;•&nbsp; <span>(45) 3242-2210</span>
              </div>
              <div className="text-[10px] text-gray-700 mt-0.5">
                RUA HORTENCIA, 112, SALA 02 &nbsp;•&nbsp; CORBÉLIA - PARANÁ &nbsp;•&nbsp; CEP: 85.420-000
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-700 mt-0.5 px-2">
                <span>CNPJ: 06.697.836.0001/73</span>
                <span>FONE: (45) 3242-2210</span>
                <span>V.:Versão: 45791</span>
              </div>
            </div>

            {/* 2. BARRA DE TÍTULO DINÂMICA CONFORME O SERVIÇO */}
            <div className="flex justify-between items-center bg-gray-100 border border-black px-3 py-1 font-bold text-xs">
              <span className="text-red-700">
                PEDIDO VIA {viaType} - {serviceTemplate.titleSuffix}
              </span>
              <span>HOJE: {todayStr}</span>
            </div>

            {/* 3. DADOS DO CLIENTE */}
            <div className="border border-black p-2 space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold w-full">Cliente......................: <span className="font-normal">{client?.name || 'Produtor / Cliente'}</span></span>
              </div>
              <div className="flex justify-between">
                <span className="w-full">Endereço.................: <span className="font-normal">{client?.city ? client.city + (client.state ? ' - ' + client.state : '') : '-'}</span></span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>Município................: <span className="font-normal">{client?.city || '-'}</span></div>
                <div>Estado: <span className="font-normal">{client?.state || 'PR'}</span> &nbsp;&nbsp; E-mail: <span className="font-normal">{client?.email || '-'}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>CGC/CPF..................: <span className="font-normal">{client?.cpf || '-'}</span></div>
                <div>Nascimento: <span className="font-normal">{client?.birthDate || '-'}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>Inscr. Estadual.....: <span className="font-normal">{client?.cadPro || '-'}</span></div>
                <div>Fone: <span className="font-normal">{client?.phone || '-'}</span></div>
              </div>
            </div>

            {/* 4. DADOS DA ÁREA / FAZENDA */}
            <div className="border border-black p-2 space-y-1">
              <div>Nome da area......: <span className="font-semibold">{farm?.name || 'Fazenda Principal'}</span></div>
              <div>Data Prov. Coleta..: <span className="font-normal">{todayStr}</span></div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-1">
                  <span>Lote......................:</span>
                  {isEditingHeaders ? (
                    <input
                      type="text"
                      value={lote}
                      onChange={(e) => setLote(e.target.value)}
                      placeholder="Nº do Lote"
                      className="border border-gray-400 px-1 py-0.5 h-6 text-xs w-28 rounded"
                    />
                  ) : (
                    <span className="font-normal">{lote || '-'}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span>Matricula..............:</span>
                  {isEditingHeaders ? (
                    <input
                      type="text"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="Nº Matrícula"
                      className="border border-gray-400 px-1 py-0.5 h-6 text-xs w-28 rounded"
                    />
                  ) : (
                    <span className="font-normal">{matricula || '-'}</span>
                  )}
                </div>
                <div>Município.............: <span className="font-normal">{farm?.city || client?.city || '-'}</span></div>
              </div>
              <div className="text-[10px] font-bold text-red-600 mt-1">
                OBS: LAUDOS INCOMPLETOS OU INCORRETOS, SERÃO ALTERADOS A UM CUSTO DE R$25,00.
              </div>
            </div>

            {/* 5. CONDIÇÕES COMERCIAIS */}
            <div className="border border-black p-2 flex justify-between items-start">
              <div className="space-y-1">
                <div>Vencimento.....: <span className="font-semibold">{todayStr}</span></div>
                <div>Juros até venc...: <span className="font-normal">0,0%</span></div>
                <div>Juros após venc.: <span className="font-normal">1,5% A.M.</span></div>
                <div>Equipamento.: <span className="font-normal">FarmFlow Precision Tech</span></div>
                <div className="flex items-center gap-1">
                  <span>Consultor........:</span>
                  {isEditingHeaders ? (
                    <input
                      type="text"
                      value={consultor}
                      onChange={(e) => setConsultor(e.target.value)}
                      className="border border-gray-400 px-1 py-0.5 h-6 text-xs w-36 rounded font-semibold"
                    />
                  ) : (
                    <span className="font-semibold">{consultor}</span>
                  )}
                </div>
              </div>
              <div className="border border-black p-2 space-y-1 min-w-[140px] text-[11px]">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setPaymentMethod('BOLETO')}
                >
                  <span className={paymentMethod === 'BOLETO' ? 'font-bold' : ''}>BOLETO</span>
                  <span className="border border-black w-4 h-4 inline-flex items-center justify-center text-xs">
                    {paymentMethod === 'BOLETO' ? '✓' : ''}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setPaymentMethod('CHEQUE')}
                >
                  <span className={paymentMethod === 'CHEQUE' ? 'font-bold' : ''}>CHEQUE</span>
                  <span className="border border-black w-4 h-4 inline-flex items-center justify-center text-xs">
                    {paymentMethod === 'CHEQUE' ? '✓' : ''}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setPaymentMethod('CARTEIRA')}
                >
                  <span className={paymentMethod === 'CARTEIRA' ? 'font-bold' : ''}>CARTEIRA</span>
                  <span className="border border-black w-4 h-4 inline-flex items-center justify-center text-xs">
                    {paymentMethod === 'CARTEIRA' ? '✓' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. TABELA DE DISCRIMINAÇÃO E VALORES */}
            <div className="border border-black">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-gray-200 border-b border-black font-bold text-center">
                    <th className="border-r border-black p-1 w-20">Quantidade</th>
                    <th className="border-r border-black p-1 w-16">Unidade</th>
                    <th className="border-r border-black p-1 text-left px-2">Discriminação</th>
                    <th className="border-r border-black p-1 w-24 text-right px-2">R$/Unid</th>
                    <th className="p-1 w-28 text-right px-2">R$ TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Linha Principal do Serviço */}
                  <tr className="border-b border-gray-300">
                    <td className="border-r border-black p-1 text-center font-medium">
                      {totalArea > 0 ? totalArea.toFixed(2) : '1,00'}
                    </td>
                    <td className="border-r border-black p-1 text-center font-medium">
                      {serviceTemplate.defaultUnit}
                    </td>
                    <td className="border-r border-black p-1 px-2 font-semibold">
                      {serviceTemplate.mainItemDescription}
                    </td>
                    <td className="border-r border-black p-1 text-right px-2 font-medium">
                      {formatBRL(unitPrice)}
                    </td>
                    <td className="p-1 text-right px-2 font-semibold">
                      {formatBRL(orderTotal)}
                    </td>
                  </tr>

                  {/* Linhas Complementares Específicas do Serviço */}
                  {serviceTemplate.complementaryItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200 text-gray-700">
                      <td className="border-r border-black p-1 text-center">{item.quantity || ''}</td>
                      <td className="border-r border-black p-1 text-center">{item.unit || ''}</td>
                      <td className="border-r border-black p-1 px-2">{item.description}</td>
                      <td className="border-r border-black p-1 text-right px-2">{item.unitPrice || ''}</td>
                      <td className="p-1 text-right px-2">{item.totalPrice || 'R$ 0,00'}</td>
                    </tr>
                  ))}

                  {/* Linhas vazias estéticas para compor o corpo visual da folha */}
                  <tr className="border-b border-gray-200 h-5">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                  <tr className="border-b border-gray-200 h-5">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-black text-xs">
                    <td colSpan={2} className="border-r border-black p-1.5 text-center text-sm">
                      {formatBRL(unitPrice)}
                    </td>
                    <td className="border-r border-black p-1.5 text-right px-2 text-sm tracking-wider">
                      TOTAL
                    </td>
                    <td colSpan={2} className="p-1.5 text-right px-2 text-base text-black">
                      {formatBRL(orderTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 7. OBSERVAÇÕES E VALIDADE */}
            <div className="border border-black p-2 space-y-1">
              <div className="border-b border-dotted border-gray-400 h-4"></div>
              <div className="border-b border-dotted border-gray-400 h-4"></div>
              <div className="border-b border-dotted border-gray-400 h-4"></div>
              <div className="text-[10px] font-bold text-red-600 pt-1">
                OBS: Validade do orçamento: 60 dias
              </div>
            </div>

            {/* 8. ASSINATURAS */}
            <div className="pt-6 pb-2 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-t border-black w-4/5 mx-auto pt-1 font-bold">
                  PRECIZA AGRICULTURA DE PRECISÃO
                </div>
                <div className="text-[10px] text-gray-600">Representante Autorizado</div>
              </div>
              <div>
                <div className="border-t border-black w-4/5 mx-auto pt-1 font-bold">
                  {client?.name || 'CLIENTE / PRODUTOR'}
                </div>
                <div className="text-[10px] text-gray-600">Assinatura do Contratante</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('OrderPrintDialog.tsx updated with precision fixes.');
