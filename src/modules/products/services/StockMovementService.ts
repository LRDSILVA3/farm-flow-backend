import { getRepository, getCustomRepository } from 'typeorm';
import { ProductRepository } from '../typeorm/repositories/ProductsRepository';
import StockMovement, { StockMovementType } from '../typeorm/entities/StockMovement';
import Product from '../typeorm/entities/Product';
import AppError from '@shared/errors/AppError';

interface ICreateMovementRequest {
  product_id: string;
  type: StockMovementType;
  quantity: number;
  unit_price?: number;
  order_id?: string;
  document_number?: string;
  notes?: string;
  user_id?: string;
}

export class StockMovementService {
  public async createMovement(data: ICreateMovementRequest): Promise<{ movement: StockMovement; product: Product }> {
    const productsRepo = getCustomRepository(ProductRepository);
    const movementsRepo = getRepository(StockMovement);

    const product = await productsRepo.findOne(data.product_id);
    if (!product) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const previous_stock = Number(product.quantity) || 0;
    const qty = Math.abs(Number(data.quantity) || 0);

    if (qty <= 0 && data.type !== 'AJUSTE') {
      throw new AppError('A quantidade para movimentação deve ser maior que zero.');
    }

    let new_stock = previous_stock;

    switch (data.type) {
      case 'ENTRADA':
        new_stock = previous_stock + qty;
        if (data.unit_price && data.unit_price > 0) {
          product.cost_price = Number(data.unit_price);
        }
        break;
      case 'SAIDA_ORDEM':
      case 'SAIDA_AVULSA':
        new_stock = Math.max(0, previous_stock - qty);
        break;
      case 'AJUSTE':
        new_stock = Number(data.quantity) || 0;
        break;
      default:
        throw new AppError('Tipo de movimentação inválido.');
    }

    product.quantity = new_stock;
    await productsRepo.save(product);

    const movement = movementsRepo.create({
      product_id: product.id,
      order_id: data.order_id || undefined,
      type: data.type,
      quantity: qty,
      previous_stock,
      new_stock,
      unit_price: data.unit_price ? Number(data.unit_price) : undefined,
      document_number: data.document_number,
      notes: data.notes,
      user_id: data.user_id,
    });

    await movementsRepo.save(movement);

    return { movement, product };
  }

  public async listMovements(productId?: string): Promise<StockMovement[]> {
    const movementsRepo = getRepository(StockMovement);
    const query = movementsRepo
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.order', 'order')
      .orderBy('movement.created_at', 'DESC');

    if (productId) {
      query.where('movement.product_id = :productId', { productId });
    }

    return query.take(100).getMany();
  }

  public async getSummary(): Promise<{
    totalProducts: number;
    activeProducts: number;
    stockControlledCount: number;
    lowStockCount: number;
    totalStockValue: number;
  }> {
    const productsRepo = getCustomRepository(ProductRepository);
    const products = await productsRepo.find();

    let lowStockCount = 0;
    let totalStockValue = 0;
    let activeProducts = 0;
    let stockControlledCount = 0;

    for (const p of products) {
      if (p.status === 'Ativo') activeProducts++;
      if (p.controls_stock) {
        stockControlledCount++;
        const qty = Number(p.quantity) || 0;
        const cost = Number(p.cost_price) || Number(p.price) || 0;
        const minStock = Number(p.min_stock) || 0;

        totalStockValue += qty * cost;
        if (minStock > 0 && qty <= minStock) {
          lowStockCount++;
        }
      }
    }

    return {
      totalProducts: products.length,
      activeProducts,
      stockControlledCount,
      lowStockCount,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
    };
  }
}
