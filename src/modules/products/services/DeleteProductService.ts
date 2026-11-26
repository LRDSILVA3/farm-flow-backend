import { getCustomRepository, getRepository } from 'typeorm';
import { ProductRepository } from '../typeorm/repositories/ProductsRepository';
import ServiceProduct from '@modules/services/typeorm/entities/ServiceProduct';
import AppError from '@shared/errors/AppError';

interface IRequest {
  id: string;
}

const PROTECTED_SERVICE_PRODUCTS = [
  'calcário calcítico',
  'calcario calcitico',
  'calcário dolomítico',
  'calcario dolomitico',
  'gesso agrícola',
  'gesso agricola',
  'cama de frango',
  'pó de rocha',
  'po de rocha',
  'kcl',
  'superfosfato simples',
  'análise foliar',
  'analise foliar',
  'análise de solo',
  'analise de solo',
];

class DeleteProductService {
  public async execute({ id }: IRequest): Promise<void> {
    const productsRepository = getCustomRepository(ProductRepository);

    const product = await productsRepository.findOne(id);

    if (!product) {
      throw new AppError('Product not found.');
    }

    // 1. Não permitir excluir produtos essenciais de serviços (calcário, gesso, etc.)
    const nameLower = product.name.toLowerCase().trim();
    if (PROTECTED_SERVICE_PRODUCTS.some(kw => nameLower.includes(kw))) {
      throw new AppError(
        `O produto "${product.name}" é um insumo essencial utilizado em serviços e não pode ser excluído do sistema.`,
      );
    }

    // 2. Verificar se o produto está vinculado como insumo/componente na tabela de serviços
    try {
      const serviceProductRepo = getRepository(ServiceProduct);
      const linkedCount = await serviceProductRepo.count({
        where: { product_id: id },
      });
      if (linkedCount > 0) {
        throw new AppError(
          'Este produto não pode ser excluído pois está vinculado a um ou mais serviços do sistema.',
        );
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      // Se a tabela não existir ou erro de query, continua com a verificação padrão
    }

    await productsRepository.remove(product);
  }
}

export default DeleteProductService;
