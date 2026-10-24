import {
  distribuicaoSchema,
  itemDistribuicaoSchema,
  reservarStockSchema,
} from '@/modules/distribuicoes/schemas';

describe('validação de distribuições', () => {
  it('rejeita distribuição sem agregado', () => {
    expect(distribuicaoSchema.safeParse({ household_id: '' }).success).toBe(false);
  });

  it('aceita distribuição mínima', () => {
    expect(distribuicaoSchema.safeParse({ household_id: 'agg-1' }).success).toBe(true);
  });

  it('item exige quantidade não negativa', () => {
    expect(
      itemDistribuicaoSchema.safeParse({ distribution_id: 'd1', quantity_requested: -1 }).success,
    ).toBe(false);
    expect(
      itemDistribuicaoSchema.safeParse({ distribution_id: 'd1', quantity_requested: 5 }).success,
    ).toBe(true);
  });

  it('reserva de stock exige quantidade positiva', () => {
    expect(
      reservarStockSchema.safeParse({
        distribution_item_id: 'i1',
        batch_id: 'b1',
        quantity: 0,
      }).success,
    ).toBe(false);
    expect(
      reservarStockSchema.safeParse({
        distribution_item_id: 'i1',
        batch_id: 'b1',
        quantity: 2,
      }).success,
    ).toBe(true);
  });
});
