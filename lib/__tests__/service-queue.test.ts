import { describe, it, expect } from 'vitest';
import { serviceQueueImpact, SERVICE_COST_PER_UNIT } from '../service-queue';
import { runSimulation } from '../game-engine';
import { generateFinancials } from '../financial-mapper';
import { INITIAL_COMPETITORS, getMarketSize } from '../competitor-ai';
import type { Decisions, ProductDecision } from '../types';

const PRODUCT_A: ProductDecision = { id: 'A', name: '프리미엄', price: 429_000, quality: 4, production: 8_000 };
const PRODUCT_B: ProductDecision = { id: 'B', name: '밸류', price: 279_000, quality: 3, production: 7_000 };
const DECISIONS: Decisions = {
  products: [PRODUCT_A, PRODUCT_B],
  rdBudget: 2_100_000_000,
  rdAllocation: { improve: 70, explore: 30 },
  adBudget: { search: 300_000_000, display: 250_000_000, influencer: 250_000_000 },
  channels: { online: 60, mart: 30, direct: 10 },
  financing: { newDebt: 0, newEquity: 0 },
  capexInvestment: 0,
  dividendPayout: 0,
  serviceCapacity: 20_000,
};

describe('serviceQueueImpact', () => {
  it('ρ < 0.7 시 만족도 보너스 +5', () => {
    const m = serviceQueueImpact(5_000, 10_000);
    expect(m.utilization).toBeCloseTo(0.5, 3);
    expect(m.satisfactionDelta).toBe(5);
    expect(m.overflow).toBe(0);
    expect(m.effectiveSales).toBe(5_000);
  });

  it('0.7 ≤ ρ < 0.9 정상 범위 — 만족도 중립', () => {
    const m = serviceQueueImpact(8_000, 10_000);
    expect(m.satisfactionDelta).toBe(0);
  });

  it('0.9 ≤ ρ < 1.0 — 만족도 선형 감소', () => {
    const m95 = serviceQueueImpact(9_500, 10_000);
    const m99 = serviceQueueImpact(9_900, 10_000);
    expect(m95.satisfactionDelta).toBeLessThan(0);
    expect(m99.satisfactionDelta).toBeLessThan(m95.satisfactionDelta);
  });

  it('ρ ≥ 1.0 — overflow + 큰 페널티', () => {
    const m = serviceQueueImpact(15_000, 10_000);
    expect(m.utilization).toBeCloseTo(1.5, 3);
    expect(m.satisfactionDelta).toBeLessThan(-10);
    expect(m.overflow).toBe(5_000);
    expect(m.effectiveSales).toBe(10_000);
  });

  it('serviceRate 0 — 무한 utilization, 최악 페널티', () => {
    const m = serviceQueueImpact(1000, 0);
    expect(m.utilization).toBe(Infinity);
    expect(m.satisfactionDelta).toBe(-25);
    expect(m.effectiveSales).toBe(0);
  });
});

describe('runSimulation — 서비스 큐 통합', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;

  it('충분한 serviceCapacity는 overflow 0', () => {
    const generous: Decisions = { ...DECISIONS, serviceCapacity: 50_000 };
    const r = runSimulation(generous, INITIAL_COMPETITORS, marketSize, qualityCap);
    expect(r.serviceQueue.overflow).toBe(0);
  });

  it('부족한 serviceCapacity는 unitsSold를 capacity로 클램프', () => {
    const tight: Decisions = { ...DECISIONS, serviceCapacity: 3_000 };
    const r = runSimulation(tight, INITIAL_COMPETITORS, marketSize, qualityCap);
    expect(r.unitsSold).toBeLessThanOrEqual(3_000);
    expect(r.serviceQueue.overflow).toBeGreaterThan(0);
  });

  it('낮은 serviceCapacity는 만족도 페널티', () => {
    const generous: Decisions = { ...DECISIONS, serviceCapacity: 50_000 };
    const tight: Decisions = { ...DECISIONS, serviceCapacity: 3_000 };
    const rGen = runSimulation(generous, INITIAL_COMPETITORS, marketSize, qualityCap);
    const rTight = runSimulation(tight, INITIAL_COMPETITORS, marketSize, qualityCap);
    expect(rTight.satisfaction).toBeLessThan(rGen.satisfaction);
  });

  it('클램프 후 perProduct 합 = unitsSold (반올림 오차 허용)', () => {
    const tight: Decisions = { ...DECISIONS, serviceCapacity: 3_000 };
    const r = runSimulation(tight, INITIAL_COMPETITORS, marketSize, qualityCap);
    const sum = r.perProduct.A.unitsSold + r.perProduct.B.unitsSold;
    expect(Math.abs(sum - r.unitsSold)).toBeLessThan(3);
  });
});

describe('financial-mapper — serviceCost가 otherExpense에 가산', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;

  it('serviceCapacity 증가 → otherExpense 증가', () => {
    const small: Decisions = { ...DECISIONS, serviceCapacity: 10_000 };
    const big: Decisions = { ...DECISIONS, serviceCapacity: 30_000 };
    const rSmall = runSimulation(small, INITIAL_COMPETITORS, marketSize, qualityCap);
    const rBig = runSimulation(big, INITIAL_COMPETITORS, marketSize, qualityCap);
    const fSmall = generateFinancials(small, rSmall, null);
    const fBig = generateFinancials(big, rBig, null);
    const delta = fBig.pnl.otherExpense - fSmall.pnl.otherExpense;
    expect(delta).toBe(20_000 * SERVICE_COST_PER_UNIT);
  });
});
