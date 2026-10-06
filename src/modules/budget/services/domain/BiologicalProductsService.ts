import { differenceInDays } from 'date-fns';

export interface BiologicalProductItem {
  id: string;
  name: string;
  category: 'INOCULANTE' | 'INSETICIDA' | 'NEMATICIDA';
  packaging: string;
  basePrice: number;
}

export const BIOLOGICAL_PRODUCTS_CATALOG: BiologicalProductItem[] = [
  { id: '1', name: 'STARFIX SOJA - B. JAPONICUM', category: 'INOCULANTE', packaging: '3 Lt (50 doses x 60ml)', basePrice: 230 },
  { id: '2', name: 'CRYSTAL (BT)', category: 'INSETICIDA', packaging: '5 Lt', basePrice: 325 },
  { id: '3', name: 'CRYSTAL (BT)', category: 'INSETICIDA', packaging: 'Lt', basePrice: 65 },
  { id: '4', name: 'GRANADA', category: 'INSETICIDA', packaging: 'Kg (vácuo)', basePrice: 350 },
  { id: '5', name: 'LAL GUARD JAVA', category: 'INSETICIDA', packaging: 'Kg (vácuo)', basePrice: 485 },
  { id: '6', name: 'LAL NIX RESIST (CISTO)', category: 'NEMATICIDA', packaging: 'Kg (vácuo)', basePrice: 660 },
  { id: '7', name: 'ONIX', category: 'NEMATICIDA', packaging: 'Lt', basePrice: 320 },
  { id: '8', name: 'RIZOS', category: 'NEMATICIDA', packaging: 'Lt', basePrice: 320 },
];

export interface SelectedBiologicalItem {
  productId: string;
  quantity: number;
}

export interface BiologicalOrderParams {
  items: SelectedBiologicalItem[];
  targetDate: string; // DD/MM/YYYY
  baseDate?: string; // DD/MM/YYYY, defaults to '30/11/2023' or equivalent deadline
  monthlyRate?: number; // e.g. 1.2% a.m.
}

export interface BiologicalOrderCalculationResult {
  totalValue: number;
  totalOriginal: number;
  totalDiscount: number;
  discountFactor: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    basePrice: number;
    adjustedUnitPrice: number;
    subtotal: number;
  }>;
}

export class BiologicalProductsService {
  private monthlyRate: number;

  constructor(monthlyRate = 1.2) {
    this.monthlyRate = monthlyRate;
  }

  public calculate(params: BiologicalOrderParams): BiologicalOrderCalculationResult {
    const { items, targetDate, baseDate = '30/11/2023', monthlyRate = this.monthlyRate } = params;

    const [tDay, tMonth, tYear] = targetDate.split('/').map(Number);
    const [bDay, bMonth, bYear] = baseDate.split('/').map(Number);

    const target = new Date(tYear, tMonth - 1, tDay);
    const base = new Date(bYear, bMonth - 1, bDay);

    const diffDays = differenceInDays(target, base);
    // Excel formula: ROUND($J8 * (POWER(1.012, DAYS(target, base)/30)), 0)
    const factor = Math.pow(1 + monthlyRate / 100, diffDays / 30);

    let totalValue = 0;
    let totalOriginal = 0;

    const calculatedItems = items.map((item) => {
      const product = BIOLOGICAL_PRODUCTS_CATALOG.find((p) => p.id === item.productId);
      if (!product) {
        return {
          productId: item.productId,
          productName: 'Produto desconhecido',
          quantity: item.quantity,
          basePrice: 0,
          adjustedUnitPrice: 0,
          subtotal: 0,
        };
      }

      const adjustedUnitPrice = Math.round(product.basePrice * factor);
      const subtotal = adjustedUnitPrice * item.quantity;
      const originalSubtotal = product.basePrice * item.quantity;

      totalValue += subtotal;
      totalOriginal += originalSubtotal;

      return {
        productId: product.id,
        productName: `${product.category} - ${product.name} (${product.packaging})`,
        quantity: item.quantity,
        basePrice: product.basePrice,
        adjustedUnitPrice,
        subtotal,
      };
    });

    const totalDiscount = totalOriginal - totalValue;

    return {
      totalValue,
      totalOriginal,
      totalDiscount,
      discountFactor: factor,
      items: calculatedItems,
    };
  }

  public formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
