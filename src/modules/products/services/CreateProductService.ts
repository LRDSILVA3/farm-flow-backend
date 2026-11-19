import { getCustomRepository } from 'typeorm';
import { ProductRepository } from '../typeorm/repositories/ProductsRepository';
import AppError from '@shared/errors/AppError';
import Product from '../typeorm/entities/Product';

interface IRequest {
  name: string;
  code?: string;
  category?: string;
  unit?: string;
  cost_price?: number;
  price?: number;
  quantity?: number;
  min_stock?: number;
  supplier?: string;
  status?: string;
  description?: string;
}

class CreateProductService {
  public async execute(data: IRequest): Promise<Product> {
    const productsRepository = getCustomRepository(ProductRepository);
    const productExists = await productsRepository.findByName(data.name);

    if (productExists) {
      throw new AppError('Já existe um produto cadastrado com este nome!');
    }

    const product = productsRepository.create({
      name: data.name,
      code: data.code,
      category: data.category || 'Outro',
      unit: data.unit || 'un',
      cost_price: Number(data.cost_price) || 0,
      price: Number(data.price) || 0,
      quantity: Number(data.quantity) || 0,
      min_stock: Number(data.min_stock) || 0,
      supplier: data.supplier,
      status: data.status || 'Ativo',
      description: data.description,
    });

    await productsRepository.save(product);

    return product;
  }
}

export default CreateProductService;
