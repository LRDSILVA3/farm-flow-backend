const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders');

const printDialogContent = `import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Order } from '@/hooks/useOrders';
import { Client } from '@/hooks/useClients';
import { Farm } from '@/hooks/useFarms';
import { Printer, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderPrintDialogProps {
  order: Order | null;
  client?: Client | null;
  farm?: Farm | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderPrintDialog: React.FC<OrderPrintDialogProps> = ({
  order,
  client,
  farm,
  open,
  onOpenChange,
}) => {
  const [viaType, setViaType] = useState<'CLIENTE' | 'EMPRESA'>('CLIENTE');
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const todayStr = format(new Date(), 'dd/MM/yyyy');
  const totalArea = parseFloat(order.area) || 0;
  const orderValue = typeof order.value === 'number' ? order.value : parseFloat(order.value || '0');
  const unitPrice = totalArea > 0 ? (orderValue / totalArea) : 0;
  const areaUnit = 'ALQ'; // Padrão conforme formulário Preciza

  const handlePrint = () => {
    window.print();
  };

  const serviceName = order.serviceName || order.type || 'AGRICULTURA DE PRECISÃO';

  // Identificação do serviço abreviado para o título (ex: "AP", "CONFERENCIA", "DRONE", etc.)
  const getServiceAbbr = (type: string) => {
    if (type.includes('Amostragem') || type.includes('AP')) return 'AP';
    if (type.includes('Conferência') || type.includes('Conferencia')) return 'CONFERÊNCIA';
    if (type.includes('Drone') || type.includes('Mapeamento')) return 'DRONE';
    if (type.includes('Foliar') || type.includes('Folha')) return 'FOLIAR';
    if (type.includes('ATV')) return 'ATV';
    if (type.includes('Compactação') || type.includes('Compacta')) return 'COMPACTAÇÃO';
    if (type.includes('Pulverização')) return 'PULVERIZAÇÃO';
    return type.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 print:p-0 print:m-0 print:max-w-none print:shadow-none print:border-none">
        <DialogHeader className="print:hidden flex flex-row items-center justify-between pb-3 border-b">
          <DialogTitle className="text-lg font-bold text-gray-800">
            Folha de Pedido / Orçamento Oficial
          </DialogTitle>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md shadow-sm border p-0.5 bg-muted">
              <button
                type="button"
                onClick={() => setViaType('CLIENTE')}
                className={\`px-3 py-1 text-xs font-semibold rounded \${viaType === 'CLIENTE' ? 'bg-white shadow text-green-700' : 'text-gray-600'}\`}
              >
                Via Cliente
              </button>
              <button
                type="button"
                onClick={() => setViaType('EMPRESA')}
                className={\`px-3 py-1 text-xs font-semibold rounded \${viaType === 'EMPRESA' ? 'bg-white shadow text-green-700' : 'text-gray-600'}\`}
              >
                Via Empresa
              </button>
            </div>
            <Button size="sm" onClick={handlePrint} className="bg-green-700 hover:bg-green-800 text-white gap-1.5">
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </Button>
          </div>
        </DialogHeader>

        {/* CONTAINER DO DOCUMENTO (ESTILO EXATO FOLHA PRECIZA) */}
        <div
          ref={printRef}
          className="bg-white text-black p-4 font-sans text-xs leading-tight print:p-0 print:w-full print:text-black"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          <style dangerouslySetInnerHTML={{ __html: \`
            @media print {
              body * { visibility: hidden; }
              .print-document-root, .print-document-root * { visibility: visible; }
              .print-document-root {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 10mm;
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
                {/* Ícone logo verde */}
                <svg className="w-8 h-8 text-green-600 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

            {/* 2. BARRA DE TÍTULO */}
            <div className="flex justify-between items-center bg-gray-100 border border-black px-3 py-1 font-bold text-xs">
              <span className="text-red-700">
                PEDIDO VIA {viaType} - {getServiceAbbr(serviceName)}
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
              <div className="grid grid-cols-3 gap-2">
                <div>Lote......................: <span className="font-normal">{farm?.lot || '-'}</span></div>
                <div>Matricula..............: <span className="font-normal">{farm?.registration || '-'}</span></div>
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
                <div>Consultor........: <span className="font-semibold">VICTOR / PRECIZA</span></div>
              </div>
              <div className="border border-black p-2 space-y-1 min-w-[130px] text-[11px]">
                <div className="flex items-center justify-between">
                  <span>BOLETO</span>
                  <span className="border border-black w-4 h-4 inline-block text-center text-xs leading-4">
                    {order.payment === 'Aguardando' || order.payment === 'Pendente' ? '✓' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>CHEQUE</span>
                  <span className="border border-black w-4 h-4 inline-block"></span>
                </div>
                <div className="flex items-center justify-between">
                  <span>CARTEIRA</span>
                  <span className="border border-black w-4 h-4 inline-block"></span>
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
                  {/* Linha principal do serviço */}
                  <tr className="border-b border-gray-300">
                    <td className="border-r border-black p-1 text-center font-medium">
                      {totalArea > 0 ? totalArea.toFixed(2) : '1,00'}
                    </td>
                    <td className="border-r border-black p-1 text-center">{areaUnit}</td>
                    <td className="border-r border-black p-1 px-2 font-semibold">
                      SERVIÇO {serviceName.toUpperCase()}
                    </td>
                    <td className="border-r border-black p-1 text-right px-2">
                      R$ {unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-1 text-right px-2 font-semibold">
                      R$ {orderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Linhas discriminativas complementares padrão Preciza */}
                  <tr className="border-b border-gray-200 text-gray-700">
                    <td className="border-r border-black p-1 text-center">-</td>
                    <td className="border-r border-black p-1 text-center">PTOS</td>
                    <td className="border-r border-black p-1 px-2">ANÁLISE INCLUSA (GRADE REGULAR AMOSTRAL)</td>
                    <td className="border-r border-black p-1 text-right px-2">-</td>
                    <td className="p-1 text-right px-2">R$ 0,00</td>
                  </tr>
                  <tr className="border-b border-gray-200 text-gray-700">
                    <td className="border-r border-black p-1 text-center"></td>
                    <td className="border-r border-black p-1 text-center"></td>
                    <td className="border-r border-black p-1 px-2">RECOMENDAÇÕES DE CORRETIVOS E ADUBAÇÃO DE TAXA VARIÁVEL</td>
                    <td className="border-r border-black p-1 text-right px-2"></td>
                    <td className="p-1 text-right px-2">R$ 0,00</td>
                  </tr>
                  <tr className="border-b border-gray-200 text-gray-700">
                    <td className="border-r border-black p-1 text-center"></td>
                    <td className="border-r border-black p-1 text-center"></td>
                    <td className="border-r border-black p-1 px-2">MAPAS TEMÁTICOS, RELATÓRIOS TÉCNICOS E ARQUIVOS PARA CONTROLADOR</td>
                    <td className="border-r border-black p-1 text-right px-2"></td>
                    <td className="p-1 text-right px-2">R$ 0,00</td>
                  </tr>

                  {/* Linhas vazias estéticas para compor o corpo do pedido como no modelo impresso */}
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
                      R$ {unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border-r border-black p-1.5 text-right px-2 text-sm tracking-wider">
                      TOTAL
                    </td>
                    <td colSpan={2} className="p-1.5 text-right px-2 text-base text-black">
                      R$ {orderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

fs.writeFileSync(path.join(targetDir, 'OrderPrintDialog.tsx'), printDialogContent, 'utf8');
console.log('OrderPrintDialog.tsx created successfully.');
