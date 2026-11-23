import { getCustomRepository } from 'typeorm';
import { OrdersRepository } from '../typeorm/repositories/OrdersRepository';
import Order from '../typeorm/entities/Order';
import AppError from '@shared/errors/AppError';

export class OrdersService {
  public async list(): Promise<Order[]> {
    const repo = getCustomRepository(OrdersRepository);
    return repo.find({ relations: ['client', 'farm'], order: { created_at: 'DESC' } });
  }

  public async create(data: Partial<Order>): Promise<Order> {
    if (!data.client_id || data.client_id.trim() === '') {
      throw new AppError('O cliente é obrigatório para cadastrar o pedido.', 400);
    }
    const isProductOrder = data.type === 'Produto' || data.service_name === 'Venda de Produtos';
    const numArea = Number(data.area || 0);
    if (!isProductOrder && (!numArea || numArea <= 0)) {
      throw new AppError('A área deve ser informada e maior que zero.', 400);
    }

    const repo = getCustomRepository(OrdersRepository);
    const order = repo.create({
      ...data,
      area: isProductOrder ? (numArea || 0) : numArea,
    });
    await repo.save(order);
    return order;
  }

  public async update(id: string, data: Partial<Order>): Promise<Order> {
    const repo = getCustomRepository(OrdersRepository);
    const order = await repo.findOne(id);
    if (!order) throw new AppError('Order not found', 404);

    const isPending =
      order.status === 'Pendente' ||
      order.status === 'pending' ||
      order.status === 'Aguardando' ||
      order.status === 'Aguardando Aprovação';

    const isApproving =
      data.status &&
      (data.status === 'Aprovado' ||
        data.status === 'approved' ||
        data.status === 'Em Andamento' ||
        data.status === 'Concluído');

    if (isPending && !isApproving) {
      // Bloqueia adição de agendamentos em pedidos pendentes de aprovação
      const prevSchedules = Array.isArray(order.schedules) ? order.schedules : [];
      const nextSchedules = Array.isArray(data.schedules) ? data.schedules : null;
      if (nextSchedules && nextSchedules.length > prevSchedules.length) {
        throw new AppError(
          'O pedido não pode ser agendado pois está aguardando aprovação. Aprove o pedido antes de definir agendamentos.',
          400,
        );
      }

      // Bloqueia adição de execuções ou avanço de área executada em pedidos pendentes de aprovação
      const prevExecutions = Array.isArray(order.executions) ? order.executions : [];
      const nextExecutions = Array.isArray(data.executions) ? data.executions : null;
      const nextExecutedArea = Number(data.executed_area || 0);
      const prevExecutedArea = Number(order.executed_area || 0);
      const nextExecutedSamples = Number(data.executed_samples || 0);
      const prevExecutedSamples = Number(order.executed_samples || 0);

      if (
        (nextExecutions && nextExecutions.length > prevExecutions.length) ||
        nextExecutedArea > prevExecutedArea ||
        nextExecutedSamples > prevExecutedSamples
      ) {
        throw new AppError(
          'O pedido não pode ser executado pois está aguardando aprovação. Aprove o pedido antes de registrar execuções.',
          400,
        );
      }
    }

    if (!isPending) {
      // Bloqueia edição dos dados do pedido após aprovação (comparação normalizada para evitar falsos positivos de "100" vs "100.00" ou null vs "")
      const normStr = (v: any) => (v === null || v === undefined ? '' : String(v).trim());
      const numDiff = (a: any, b: any) => {
        const na = Number(a || 0);
        const nb = Number(b || 0);
        if (isNaN(na) || isNaN(nb)) return normStr(a) !== normStr(b);
        return Math.abs(na - nb) > 0.009;
      };
      const normArr = (v: any) => JSON.stringify(Array.isArray(v) ? v : []);

      const isEditingContract =
        (data.client_id !== undefined && normStr(data.client_id) !== normStr(order.client_id)) ||
        (data.farm_id !== undefined && normStr(data.farm_id) !== normStr(order.farm_id)) ||
        (data.service_name !== undefined && normStr(data.service_name) !== normStr(order.service_name)) ||
        (data.type !== undefined && normStr(data.type) !== normStr(order.type)) ||
        (data.service_group !== undefined && normStr(data.service_group) !== normStr(order.service_group)) ||
        (data.area !== undefined && numDiff(data.area, order.area)) ||
        (data.value !== undefined && numDiff(data.value, order.value)) ||
        (data.sampling_grid_ha !== undefined && numDiff(data.sampling_grid_ha, order.sampling_grid_ha)) ||
        (data.depth !== undefined && normStr(data.depth) !== normStr(order.depth)) ||
        (data.products_data !== undefined && normArr(data.products_data) !== normArr(order.products_data)) ||
        (data.plots_data !== undefined && normArr(data.plots_data) !== normArr(order.plots_data));

      if (isEditingContract) {
        throw new AppError(
          'Depois de aprovado, o pedido não pode ser editado.',
          400,
        );
      }
    }

    Object.assign(order, data);
    await repo.save(order);
    return order;
  }

  public async delete(id: string): Promise<void> {
    const repo = getCustomRepository(OrdersRepository);
    const order = await repo.findOne(id);
    if (!order) throw new AppError('Order not found', 404);
    await repo.remove(order);
  }
}
