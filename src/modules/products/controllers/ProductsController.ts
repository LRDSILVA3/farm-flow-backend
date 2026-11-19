import { Request, Response } from "express";
import ListProductService from "../services/ListProductService";
import ShowProductService from "../services/ShowProductService";
import CreateProductService from "../services/CreateProductService";
import UpdateProductService from "../services/UpdateProductService";
import DeleteProductService from "../services/DeleteProductService";
import { StockMovementService } from "../services/StockMovementService";
import Product from "../typeorm/entities/Product";
import {
  diffObjects,
  formatChangesSummary,
  recordAudit,
  safeFindSnapshot,
} from "@modules/audit/services/AuditLogService";

const PRODUCT_AUDIT_FIELDS = {
  name: "Nome",
  code: "Código/SKU",
  category: "Categoria",
  unit: "Unidade",
  cost_price: { label: "Preço de Custo", format: "currency" as const },
  price: { label: "Preço de Venda", format: "currency" as const },
  quantity: "Quantidade em Estoque",
  min_stock: "Estoque Mínimo",
  controls_stock: "Controla Estoque",
  status: "Status",
};

export default class ProductsController {
  private stockService = new StockMovementService();

  public index = async (request: Request, response: Response): Promise<Response> => {
    const listProducts = new ListProductService();
    const products = await listProducts.execute();
    return response.json(products);
  };

  public show = async (request: Request, response: Response): Promise<Response> => {
    const { id } = request.params;
    const showProduct = new ShowProductService();
    const product = await showProduct.execute({ id });
    return response.json(product);
  };

  public create = async (request: Request, response: Response): Promise<Response> => {
    const createProduct = new CreateProductService();
    const product = await createProduct.execute(request.body);

    await recordAudit({
      req: request,
      module: "products",
      action: "CREATE",
      entityId: product.id,
      entityLabel: product.name,
      summary: `Produto cadastrado: ${product.name}`,
      afterData: product,
    });

    return response.json(product);
  };

  public update = async (request: Request, response: Response): Promise<Response> => {
    const { id } = request.params;
    const before = await safeFindSnapshot(Product, id);

    const updateProduct = new UpdateProductService();
    const product = await updateProduct.execute({ id, ...request.body });
    const changes = diffObjects(before, product, PRODUCT_AUDIT_FIELDS);

    await recordAudit({
      req: request,
      module: "products",
      action: "UPDATE",
      entityId: id,
      entityLabel: product.name || before?.name,
      summary: formatChangesSummary(changes) || `Produto atualizado: ${product.name}`,
      changes,
      beforeData: before,
      afterData: product,
    });

    return response.json(product);
  };

  public delete = async (request: Request, response: Response): Promise<Response> => {
    const { id } = request.params;
    const before = await safeFindSnapshot(Product, id);
    const deleteProduct = new DeleteProductService();
    await deleteProduct.execute({ id });

    await recordAudit({
      req: request,
      module: "products",
      action: "DELETE",
      entityId: id,
      entityLabel: before?.name,
      summary: `Produto excluído: ${before?.name || id}`,
      beforeData: before,
    });

    return response.json([]);
  };

  public summary = async (_request: Request, response: Response): Promise<Response> => {
    const summary = await this.stockService.getSummary();
    return response.json(summary);
  };

  public listMovements = async (request: Request, response: Response): Promise<Response> => {
    const { productId } = request.query;
    const movements = await this.stockService.listMovements(productId as string | undefined);
    return response.json(movements);
  };

  public createMovement = async (request: Request, response: Response): Promise<Response> => {
    const { id } = request.params;
    const result = await this.stockService.createMovement({
      product_id: id,
      ...request.body,
      user_id: request.user?.id,
    });

    await recordAudit({
      req: request,
      module: "stock_movements",
      action: "CREATE",
      entityId: result.movement.id,
      entityLabel: `${result.product.name} (${result.movement.type})`,
      summary: `Movimentação de estoque: ${result.movement.type} de ${result.movement.quantity} ${result.product.unit || 'un'} no produto ${result.product.name}`,
      afterData: result.movement,
    });

    return response.json(result);
  };
}
