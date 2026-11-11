import { Request, Response } from "express";
import ListProductService from "../services/ListProductService";
import ShowProductService from "../services/ShowProductService";
import CreateProductService from "../services/CreateProductService";
import UpdateProductService from "../services/UpdateProductService";
import DeleteProductService from "../services/DeleteProductService";
import Product from "../typeorm/entities/Product";
import {
  diffObjects,
  formatChangesSummary,
  recordAudit,
  safeFindSnapshot,
} from "@modules/audit/services/AuditLogService";

const PRODUCT_AUDIT_FIELDS = {
  name: "Nome",
  price: { label: "Preço", format: "currency" as const },
  quantity: "Quantidade",
};

export default class ProductsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const listProducts = new ListProductService();
    const products = await listProducts.execute();
    return response.json(products);
  }

  public async show(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const showProduct = new ShowProductService();
    const products = await showProduct.execute({ id });
    return response.json(products);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const { name, price, quantity } = request.body;
    const createProduct = new CreateProductService();
    const product = await createProduct.execute({ name, price, quantity });

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
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { name, price, quantity } = request.body;
    const { id } = request.params;
    const before = await safeFindSnapshot(Product, id);

    const updateProduct = new UpdateProductService();
    const product = await updateProduct.execute({ id, name, price, quantity });
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
  }

  public async delete(request: Request, response: Response): Promise<Response> {
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
  }
}
