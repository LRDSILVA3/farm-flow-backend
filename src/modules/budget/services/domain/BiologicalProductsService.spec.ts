import { describe, it, expect } from 'vitest';
import { BiologicalProductsService } from './BiologicalProductsService';

describe('BiologicalProductsService', () => {
  it('should correctly calculate anticipation discount matching Excel LALLEMAND sheet', () => {
    const service = new BiologicalProductsService(1.2);

    // In LALLEMAND sheet, for base date 30/11/2023:
    // If target date is earlier, e.g. around April (240 days earlier):
    // 230 * (1.012 ^ (-240/30)) = 230 * (1.012 ^ -8) = 230 * 0.9088 = 209
    const result = service.calculate({
      items: [
        { productId: '1', quantity: 10 }, // STARFIX: base 230
      ],
      targetDate: '01/04/2023',
      baseDate: '30/11/2023',
    });

    expect(result.items[0].adjustedUnitPrice).toBeLessThan(230);
    expect(result.items[0].adjustedUnitPrice).toBe(209);
    expect(result.totalValue).toBe(2090);
    expect(result.totalDiscount).toBe(210);
  });
});
