const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../farm-flow-frontend/src/hooks/useOrders.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add OrderActionLog interface
const orderActionLogInterface = `export interface OrderActionLog {
  id: string;
  action: string;
  userName: string;
  timestamp: string;
  details?: string;
}

export interface OrderPayment {`;

content = content.replace('export interface OrderPayment {', orderActionLogInterface);

// 2. Add logs to Order interface
content = content.replace(
  '  payments: OrderPayment[];\n  executedArea: number;',
  '  payments: OrderPayment[];\n  logs: OrderActionLog[];\n  executedArea: number;'
);

// 3. Add logs to OrderDB
content = content.replace(
  '  payments?: any[];\n  executed_area?: number | string | null;',
  '  payments?: any[];\n  logs?: any[];\n  executed_area?: number | string | null;'
);

// 4. Update mapFromDB to include logs
content = content.replace(
  '    payments: Array.isArray(db.payments) ? db.payments : [],\n    executedArea: numExecuted,',
  '    payments: Array.isArray(db.payments) ? db.payments : [],\n    logs: Array.isArray(db.logs) ? db.logs : [],\n    executedArea: numExecuted,'
);

// 5. Update initial formData to include logs: []
content = content.replace(
  '    payments: [],\n    executedArea: 0,',
  '    payments: [],\n    logs: [],\n    executedArea: 0,'
);

// 6. Insert createLogEntry helper right before const addOrder
const createLogHelper = `  const createLogEntry = (action: string, details?: string): OrderActionLog => {
    let userName = "Administrador FarmFlow";
    try {
      const raw = localStorage.getItem("@FarmFlow:user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.name) userName = parsed.name;
      }
    } catch {}
    return {
      id: crypto.randomUUID(),
      action,
      userName,
      timestamp: new Date().toISOString(),
      details,
    };
  };

  const addOrder = async (order: Omit<Order, 'id'>) => {`;

content = content.replace('  const addOrder = async (order: Omit<Order, \'id\'>) => {', createLogHelper);

// 7. Update addOrder to set initial log
const oldAddOrderBody = `      try {
        const created = await api.post<any>('/orders', {
          client_id: order.clientId || null,
          farm_id: order.farmId || null,
          type: order.type || "Serviço",
          service_name: sName,
          products_data: order.productsData || [],
          service_group: order.serviceGroup || null,
          area: numArea,
          value: numVal,
          status: order.status || "Pendente",
          payment: order.payment || "Aguardando",
          executions: [],
          schedules: [],
          payments: [],
          executed_area: 0,
          paid_amount: 0
        });`;

const newAddOrderBody = `      const initLog = createLogEntry("Criação", \`Pedido criado no valor de \${formatCurrencyBRL(numVal || 0)} para o serviço \${sName}\`);
      const initialLogs = order.logs && order.logs.length > 0 ? order.logs : [initLog];

      try {
        const created = await api.post<any>('/orders', {
          client_id: order.clientId || null,
          farm_id: order.farmId || null,
          type: order.type || "Serviço",
          service_name: sName,
          products_data: order.productsData || [],
          service_group: order.serviceGroup || null,
          area: numArea,
          value: numVal,
          status: order.status || "Pendente",
          payment: order.payment || "Aguardando",
          executions: [],
          schedules: [],
          payments: [],
          logs: initialLogs,
          executed_area: 0,
          paid_amount: 0
        });`;

content = content.replace(oldAddOrderBody, newAddOrderBody);

// 8. Update updateOrder to send logs
const oldUpdateOrderBody = `      try {
        const updated = await api.put<any>(\`/orders/\${order.id}\`, {
          client_id: order.clientId || null,
          farm_id: order.farmId || null,
          type: order.type || "Serviço",
          service_name: sName,
          products_data: order.productsData || [],
          service_group: order.serviceGroup || null,
          area: numArea,
          value: numVal,
          status: order.status || "Pendente",
          payment: order.payment || "Aguardando",
          executions: order.executions || [],
          schedules: order.schedules || [],
          payments: order.payments || [],
          executed_area: order.executedArea || 0,
          paid_amount: order.paidAmount || 0
        });`;

const newUpdateOrderBody = `      try {
        const updated = await api.put<any>(\`/orders/\${order.id}\`, {
          client_id: order.clientId || null,
          farm_id: order.farmId || null,
          type: order.type || "Serviço",
          service_name: sName,
          products_data: order.productsData || [],
          service_group: order.serviceGroup || null,
          area: numArea,
          value: numVal,
          status: order.status || "Pendente",
          payment: order.payment || "Aguardando",
          executions: order.executions || [],
          schedules: order.schedules || [],
          payments: order.payments || [],
          logs: order.logs || [],
          executed_area: order.executedArea || 0,
          paid_amount: order.paidAmount || 0
        });`;

content = content.replace(oldUpdateOrderBody, newUpdateOrderBody);

// 9. Update approveOrder to append log
const oldApproveOrder = `  const approveOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      await updateOrder({ ...order, status: "Aprovado" });
      toast({
        title: "Pedido Aprovado",
        description: "O pedido foi aprovado com sucesso.",
      });
    } catch (err: any) {`;

const newApproveOrder = `  const approveOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const appLog = createLogEntry("Aprovação", "Pedido aprovado para execução operacional");
      const updatedLogs = [...(order.logs || []), appLog];
      await updateOrder({ ...order, status: "Aprovado", logs: updatedLogs });
      toast({
        title: "Pedido Aprovado",
        description: "O pedido foi aprovado com sucesso.",
      });
    } catch (err: any) {`;

content = content.replace(oldApproveOrder, newApproveOrder);

// 10. Update cancelOrder to append log
const oldCancelOrder = `  const cancelOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      await updateOrder({ ...order, status: "Cancelado" });
      toast({
        title: "Pedido Cancelado",
        description: "O pedido foi cancelado.",
      });
    } catch (err: any) {`;

const newCancelOrder = `  const cancelOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const canLog = createLogEntry("Cancelamento", "Pedido cancelado no sistema");
      const updatedLogs = [...(order.logs || []), canLog];
      await updateOrder({ ...order, status: "Cancelado", logs: updatedLogs });
      toast({
        title: "Pedido Cancelado",
        description: "O pedido foi cancelado.",
      });
    } catch (err: any) {`;

content = content.replace(oldCancelOrder, newCancelOrder);

// 11. Update recordExecution to append log
const oldRecordExec = `      await updateOrder({
        ...order,
        executions: updatedExecutions,
        executedArea: newExecutedArea,
        status: newStatus
      });`;

const newRecordExec = `      const execLog = createLogEntry("Execução", \`Execução de \${execution.areaExecuted} ha registrada (\${percentage.toFixed(1)}% concluído). Responsável: \${execution.collaboratorName || 'Não informado'}. Obs: \${execution.notes || 'Sem observações'}\`);
      const updatedLogs = [...(order.logs || []), execLog];

      await updateOrder({
        ...order,
        executions: updatedExecutions,
        executedArea: newExecutedArea,
        status: newStatus,
        logs: updatedLogs
      });`;

content = content.replace(oldRecordExec, newRecordExec);

// 12. Update addSchedule to append log
const oldAddSched = `      await updateOrder({
        ...order,
        schedules: updatedSchedules,
      });`;

const newAddSched = `      const schedLog = createLogEntry("Agendamento", \`Serviço agendado para \${schedule.scheduledDate}. Detalhes: \${schedule.description}\`);
      const updatedLogs = [...(order.logs || []), schedLog];

      await updateOrder({
        ...order,
        schedules: updatedSchedules,
        logs: updatedLogs
      });`;

content = content.replace(oldAddSched, newAddSched);

// 13. Update recordPayment to append log and add markOrderAsPaid
const oldRecordPay = `      await updateOrder({
        ...order,
        payments: updatedPayments,
        paidAmount: newPaidAmount,
        payment: newPaymentStatus
      });`;

const newRecordPay = `      const payLog = createLogEntry("Pagamento", \`Pagamento de \${formatCurrencyBRL(payment.amount)} registrado via \${payment.method}. Status financeiro: \${newPaymentStatus}\`);
      const updatedLogs = [...(order.logs || []), payLog];

      await updateOrder({
        ...order,
        payments: updatedPayments,
        paidAmount: newPaidAmount,
        payment: newPaymentStatus,
        logs: updatedLogs
      });`;

content = content.replace(oldRecordPay, newRecordPay);

// 14. Add markOrderAsPaid method before return
const markOrderAsPaidFunc = `  // Ação financeira: Dar Baixa Direta
  const markOrderAsPaid = async (orderId: string, paymentDetails: { amount?: number; method: string; notes?: string }) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const orderTotal = order.numericValue || parseValue(order.value) || 0;
      const payAmount = paymentDetails.amount !== undefined ? paymentDetails.amount : orderTotal;
      const newPaidAmount = (order.paidAmount || 0) + payAmount;
      const isTotal = newPaidAmount >= orderTotal && orderTotal > 0;
      const newPaymentStatus = isTotal ? "Pago" : "Parcial";

      const newPayment: OrderPayment = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        amount: payAmount,
        method: paymentDetails.method || "PIX",
        notes: paymentDetails.notes,
        createdAt: new Date().toISOString()
      };

      const updatedPayments = [...(order.payments || []), newPayment];
      const baixaLog = createLogEntry("Baixa Financeira", \`Baixa financeira de \${formatCurrencyBRL(payAmount)} via \${paymentDetails.method || 'PIX'}. Status do pagamento: \${newPaymentStatus}\`);
      const updatedLogs = [...(order.logs || []), baixaLog];

      await updateOrder({
        ...order,
        payments: updatedPayments,
        paidAmount: newPaidAmount,
        payment: newPaymentStatus,
        logs: updatedLogs
      });

      toast({
        title: "Baixa financeira realizada",
        description: \`Pagamento de \${formatCurrencyBRL(payAmount)} registrado com sucesso.\`,
      });
    } catch (err: any) {
      toast({
        title: "Erro ao dar baixa",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return {`;

content = content.replace('  return {', markOrderAsPaidFunc);

// 15. Export markOrderAsPaid in return object
content = content.replace(
  '    recordPayment,\n    refetch: fetchOrders',
  '    recordPayment,\n    markOrderAsPaid,\n    refetch: fetchOrders'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ useOrders.ts patched with action logs, authoring and markOrderAsPaid!');
