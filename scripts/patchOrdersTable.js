const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/OrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add History to imports from lucide-react
content = content.replace(
  'import { Edit, CheckCircle2, Play, Calendar, DollarSign, Ban, Printer } from "lucide-react";',
  'import { Edit, CheckCircle2, Play, Calendar, DollarSign, Ban, Printer, History } from "lucide-react";'
);

// 2. Import OrderHistoryDialog
content = content.replace(
  'import { OrderPrintDialog } from "./OrderPrintDialog";',
  'import { OrderPrintDialog } from "./OrderPrintDialog";\nimport { OrderHistoryDialog } from "./OrderHistoryDialog";'
);

// 3. Add state selectedOrderForHistory
content = content.replace(
  '  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);',
  '  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);\n  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState<Order | null>(null);'
);

// 4. Add History button after Printer button
const oldPrinterButton = `                        {/* Botão Imprimir Folha de Pedido */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                              onClick={() => setSelectedOrderForPrint(order)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Imprimir Folha de Pedido / Orçamento</TooltipContent>
                        </Tooltip>`;

const newButtons = `                        {/* Botão Imprimir Folha de Pedido */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                              onClick={() => setSelectedOrderForPrint(order)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Imprimir Folha de Pedido / Orçamento</TooltipContent>
                        </Tooltip>

                        {/* Botão Histórico de Ações */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              onClick={() => setSelectedOrderForHistory(order)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Histórico de Ações / Auditoria</TooltipContent>
                        </Tooltip>`;

content = content.replace(oldPrinterButton, newButtons);

// 5. Render OrderHistoryDialog
const oldDialogs = `      {/* Modal de Impressão de Folha de Pedido */}
      <OrderPrintDialog
        order={selectedOrderForPrint}
        client={selectedOrderForPrint ? clients.find((c) => c.id === selectedOrderForPrint.clientId) : null}
        farm={selectedOrderForPrint ? farms.find((f) => f.id === selectedOrderForPrint.farmId) : null}
        open={!!selectedOrderForPrint}
        onOpenChange={(open) => !open && setSelectedOrderForPrint(null)}
      />`;

const newDialogs = `      {/* Modal de Impressão de Folha de Pedido */}
      <OrderPrintDialog
        order={selectedOrderForPrint}
        client={selectedOrderForPrint ? clients.find((c) => c.id === selectedOrderForPrint.clientId) : null}
        farm={selectedOrderForPrint ? farms.find((f) => f.id === selectedOrderForPrint.farmId) : null}
        open={!!selectedOrderForPrint}
        onOpenChange={(open) => !open && setSelectedOrderForPrint(null)}
      />

      {/* Modal de Histórico de Ações */}
      <OrderHistoryDialog
        order={selectedOrderForHistory}
        open={!!selectedOrderForHistory}
        onOpenChange={(open) => !open && setSelectedOrderForHistory(null)}
      />`;

content = content.replace(oldDialogs, newDialogs);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ OrdersTable.tsx patched with OrderHistoryDialog!');
