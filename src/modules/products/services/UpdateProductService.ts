import { getCustomRepository } from 'typeorm';
import { ProductRepository } from '../typeorm/repositories/ProductsRepository';
import Product from '../typeorm/entities/Product';
import AppError from '@shared/errors/AppError';

interface IRequest {
  id: string;
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

class UpdateProductService {
  public async execute(data: IRequest): Promise<Product> {
    const productsRepository = getCustomRepository(ProductRepository);

    const product = await productsRepository.findOne(data.id);

    if (!product) {
      throw new AppError('Produto não encontrado.', 404);
    }

    if (data.name && data.name !== product.name) {
      const productExists = await productsRepository.findByName(data.name);
      if (productExists && productExists.id !== product.id) {
        throw new AppError('Já existe um produto cadastrado com este nome!');
      }
      product.name = data.name;
    }

    if (data.code !== undefined) product.code = data.code;
    if (data.category !== undefined) product.category = data.category;
    if (data.unit !== undefined) product.unit = data.unit;
    if (data.cost_price !== undefined) product.cost_price = Number(data.cost_price);
    if (data.price !== undefined) product.price = Number(data.price);
    if (data.quantity !== undefined) product.quantity = Number(data.quantity);
    if (data.min_stock !== undefined) product.min_stock = Number(data.min_stock);
    if (data.supplier !== undefined) product.supplier = data.supplier;
    if (data.status !== undefined) product.status = data.status;
    if (data.description !== undefined) product.description = data.description;

    await productsRepository.save(product);
    return product;
  }
}

export default UpdateProductService;
