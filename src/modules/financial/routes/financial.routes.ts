import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import ensureAuthenticated from '@shared/http/middlewares/ensureAuthenticated';
import { ensurePermission } from '@shared/http/middlewares/ensurePermission';
import FinancialTransaction from '../typeorm/entities/FinancialTransaction';
import {
  diffObjects,
  formatChangesSummary,
  recordAudit,
} from '@modules/audit/services/AuditLogService';

const FINANCIAL_AUDIT_FIELDS = {
  description: 'Descrição',
  type: 'Tipo',
  category: 'Categoria',
  amount: { label: 'Valor', format: 'currency' as const },
  status: 'Status',
  due_date: 'Vencimento',
  payment_date: 'Data Pagamento',
  payment_method: 'Forma Pagamento',
};

const financialRouter = Router();

financialRouter.use(ensureAuthenticated);

// Listar transações com filtros
financialRouter.get('/transactions', ensurePermission('financial'), async (req: Request, res: Response) => {
  const repo = getRepository(FinancialTransaction);
  const { type, status, category } = req.query;

  const query = repo.createQueryBuilder('t');

  if (type && type !== 'all') {
    query.andWhere('t.type = :type', { type });
  }

  if (status && status !== 'all') {
    query.andWhere('t.status = :status', { status });
  }

  if (category && category !== 'all') {
    query.andWhere('t.category = :category', { category });
  }

  query.orderBy('t.created_at', 'DESC');
  const items = await query.getMany();
  return res.json(items);
});

// Resumo financeiro consolidado
financialRouter.get('/summary', ensurePermission('financial'), async (req: Request, res: Response) => {
  const repo = getRepository(FinancialTransaction);
  const all = await repo.find();

  let incomePaid = 0;
  let incomePending = 0;
  let expensePaid = 0;
  let expensePending = 0;

  all.forEach((t) => {
    const val = Number(t.amount) || 0;
    if (t.type === 'income') {
      if (t.status === 'paid') incomePaid += val;
      else if (t.status === 'pending') incomePending += val;
    } else if (t.type === 'expense') {
      if (t.status === 'paid') expensePaid += val;
      else if (t.status === 'pending') expensePending += val;
    }
  });

  const netBalance = incomePaid - expensePaid;

  return res.json({
    incomePaid,
    incomePending,
    expensePaid,
    expensePending,
    netBalance,
    totalTransactions: all.length,
  });
});

// Criar nova transação
financialRouter.post('/transactions', ensurePermission('financial', 'orders'), async (req: Request, res: Response) => {
  const repo = getRepository(FinancialTransaction);
  const transaction = repo.create({
    description: req.body.description,
    type: req.body.type || 'income',
    category: req.body.category || 'Geral',
    amount: req.body.amount,
    due_date: req.body.due_date || req.body.dueDate || new Date().toISOString().split('T')[0],
    payment_date: req.body.payment_date || req.body.paymentDate || null,
    status: req.body.status || 'pending',
    payment_method: req.body.payment_method || req.body.paymentMethod || null,
    notes: req.body.notes || null,
    order_id: req.body.order_id || req.body.orderId || null,
    client_id: req.body.client_id || req.body.clientId || null,
  });

  await repo.save(transaction);
  await recordAudit({
    req,
    module: 'financial',
    action: 'CREATE',
    entityId: transaction.id,
    entityLabel: transaction.description,
    summary: `Lançamento financeiro criado: ${transaction.description} (${Number(transaction.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
    afterData: transaction,
  });
  return res.status(201).json(transaction);
});

// Atualizar transação
financialRouter.put('/transactions/:id', ensurePermission('financial'), async (req: Request, res: Response) => {
  const repo = getRepository(FinancialTransaction);
  const transaction = await repo.findOne(req.params.id);

  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const beforeSnapshot = { ...transaction };

  if (req.body.description !== undefined) transaction.description = req.body.description;
  if (req.body.type !== undefined) transaction.type = req.body.type;
  if (req.body.category !== undefined) transaction.category = req.body.category;
  if (req.body.amount !== undefined) transaction.amount = req.body.amount;
  if (req.body.due_date !== undefined) transaction.due_date = req.body.due_date;
  if (req.body.payment_date !== undefined) transaction.payment_date = req.body.payment_date;
  if (req.body.status !== undefined) transaction.status = req.body.status;
  if (req.body.payment_method !== undefined) transaction.payment_method = req.body.payment_method;
  if (req.body.notes !== undefined) transaction.notes = req.body.notes;

  await repo.save(transaction);
  const changes = diffObjects(beforeSnapshot, transaction, FINANCIAL_AUDIT_FIELDS);
  await recordAudit({
    req,
    module: 'financial',
    action: 'UPDATE',
    entityId: transaction.id,
    entityLabel: transaction.description,
    summary: formatChangesSummary(changes) || `Lançamento atualizado: ${transaction.description}`,
    changes,
    beforeData: beforeSnapshot,
    afterData: transaction,
  });
  return res.json(transaction);
});

// Excluir transação
financialRouter.delete('/transactions/:id', ensurePermission('financial'), async (req: Request, res: Response) => {
  const repo = getRepository(FinancialTransaction);
  const before = await repo.findOne(req.params.id);
  await repo.delete(req.params.id);
  await recordAudit({
    req,
    module: 'financial',
    action: 'DELETE',
    entityId: req.params.id,
    entityLabel: before?.description,
    summary: `Lançamento excluído: ${before?.description || req.params.id}`,
    beforeData: before,
  });
  return res.status(204).send();
});

export default financialRouter;
