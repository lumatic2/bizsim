import { describe, it, expect } from 'vitest';
import { economicOrderQuantity, inventoryHoldingCostOf, SETUP_COST, INVENTORY_HOLDING_RATE, UNIT_HOLDING_COST_PROXY } from '../eoq';

describe('economicOrderQuantity', () => {
  it('0 수요면 0 반환', () => {
    expect(economicOrderQuantity(0)).toBe(0);
  });

  it('Q* = sqrt(2×D×S/H) 공식 검증', () => {
    const D = 15_000;
    const S = SETUP_COST;
    const H = UNIT_HOLDING_COST_PROXY;
    const expected = Math.round(Math.sqrt((2 * D * S) / H));
    expect(economicOrderQuantity(D)).toBe(expected);
  });

  it('수요 증가 → Q* 증가 (√D 비례)', () => {
    const q1 = economicOrderQuantity(10_000);
    const q2 = economicOrderQuantity(40_000);
    // D가 4배 되면 Q*는 2배
    expect(q2 / q1).toBeCloseTo(2, 1);
  });

  it('setupCost 증가 → Q* 증가', () => {
    const qLow = economicOrderQuantity(15_000, 10_000_000);
    const qHigh = economicOrderQuantity(15_000, 100_000_000);
    expect(qHigh).toBeGreaterThan(qLow);
  });

  it('holdingCost 증가 → Q* 감소', () => {
    const qCheap = economicOrderQuantity(15_000, SETUP_COST, 3_000);
    const qExpensive = economicOrderQuantity(15_000, SETUP_COST, 20_000);
    expect(qExpensive).toBeLessThan(qCheap);
  });
});

describe('inventoryHoldingCostOf', () => {
  it('기본 5% rate 적용', () => {
    expect(inventoryHoldingCostOf(1_000_000_000)).toBe(50_000_000);
  });

  it('INVENTORY_HOLDING_RATE = 0.05', () => {
    expect(INVENTORY_HOLDING_RATE).toBe(0.05);
  });

  it('0 재고 → 0 유지비', () => {
    expect(inventoryHoldingCostOf(0)).toBe(0);
  });
});
