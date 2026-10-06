const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/OrdersTable.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add OrderPrintDialog import
if (!content.includes('OrderPrintDialog')) {
  content = content.replace(
    'import { OrderPaymentDialog } from "./OrderPaymentDialog";',
    'import { OrderPaymentDialog } from "./OrderPaymentDialog";\nimport { OrderPrintDialog } from "./OrderPrintDialog";'
  );
}

// 2. Add Printer icon import if not present
if (!content.includes('Printer')) {
  content = content.replace(
    'import { Edit, CheckCircle2, Play, Calendar, DollarSign, Ban } from "lucide-react";',
    'import { Edit, CheckCircle2, Play, Calendar, DollarSign, Ban, Printer } from "lucide-react";'
  );
}

// 3. Add state
if (!content.includes('selectedOrderForPrint')) {
  content = content.replace(
    'const [selectedOrderForPay, setSelectedOrderForPay] = useState<Order | null>(null);',
    'const [selectedOrderForPay, setSelectedOrderForPay] = useState<Order | null>(null);\n  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);'
  );
}

// 4. Add Print action button in table row
const printButtonCode = `                        {/* Botão Imprimir Folha de Pedido */}
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

`;

if (!content.includes('Botão Imprimir Folha de Pedido')) {
  content = content.replace(
    '{/* Botão Editar */}',
    printButtonCode + '                        {/* Botão Editar */}'
  );
}

// 5. Render OrderPrintDialog
const dialogRenderCode = `
      {/* Modal de Impressão de Folha de Pedido */}
      <OrderPrintDialog
        order={selectedOrderForPrint}
        client={selectedOrderForPrint ? clients.find((c) => c.id === selectedOrderForPrint.clientId) : null}
        farm={selectedOrderForPrint ? farms.find((f) => f.id === selectedOrderForPrint.farmId) : null}
        open={!!selectedOrderForPrint}
        onOpenChange={(open) => !open && setSelectedOrderForPrint(null)}
      />
`;

if (!content.includes('Modal de Impressão de Folha de Pedido')) {
  content = content.replace(
    '</TooltipProvider>',
    dialogRenderCode + '    </TooltipProvider>'
  );
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('OrdersTable.tsx successfully integrated with OrderPrintDialog.');
