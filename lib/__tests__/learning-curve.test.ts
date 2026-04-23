import { describe, it, expect } from 'vitest';
import { learningCurveMultiplier, LEARNING_RATE, LEARNING_REFERENCE } from '../learning-curve';
import { runSimulation } from '../game-engine';
import { generateFinancials } from '../financial-mapper';
import { INITIAL_COMPETITORS, getMarketSize } from '../competitor-ai';
import type { Decisions, ProductDecision } from '../types';

const PRODUCT_A: ProductDecision = { id: 'A', name: '프리미엄', price: 429_000, quality: 4, production: 8_000 };
const PRODUCT_B: ProductDecision = { id: 'B', name: '밸류', price: 279_000, quality: 3, production: 7_000 };

const DEFAULT_DECISIONS: Decisions = {
  products: [PRODUCT_A, PRODUCT_B],
  rdBudget: 2_100_000_000,
  rdAllocation: { improve: 70, explore: 30 },
  adBudget: { search: 300_000_000, display: 250_000_000, influencer: 250_000_000 },
  channels: { online: 60, mart: 30, direct: 10 },
  financing: { newDebt: 0, newEquity: 0 },
  capexInvestment: 0,
  dividendPayout: 0,
  serviceCapacity: 20_000,
  headcount: { sales: 4, rd: 4 },
  salaryMultiplier: 1.0,
};

describe('learningCurveMultiplier', () => {
  it('returns 1.0 at zero cumulative production (no experience yet)', () => {
    expect(learningCurveMultiplier(0)).toBe(1);
  });

  it('returns 1.0 below reference threshold (initial experience zone)', () => {
    expect(learningCurveMultiplier(LEARNING_REFERENCE - 1)).toBe(1);
    expect(learningCurveMultiplier(1_000)).toBe(1);
  });

  it("applies Wright's Law: doubling cumulative cuts cost to LEARNING_RATE", () => {
    const base = learningCurveMultiplier(LEARNING_REFERENCE);
    const doubled = learningCurveMultiplier(LEARNING_REFERENCE * 2);
    expect(doubled).toBeCloseTo(base * LEARNING_RATE, 5);
  });

  it('is monotonically decreasing as cumulative grows past reference', () => {
    const m1 = learningCurveMultiplier(LEARNING_REFERENCE);
    const m2 = learningCurveMultiplier(LEARNING_REFERENCE * 2);
    const m3 = learningCurveMultiplier(LEARNING_REFERENCE * 4);
    expect(m2).toBeLessThan(m1);
    expect(m3).toBeLessThan(m2);
  });
});

describe('learning curve integration', () => {
  const marketSize = getMarketSize(2);
  const qualityCap = 3;

  it('higher cumulative production reduces cogs at same units sold', () => {
    // 동일한 의사결정·시장 조건에서 누적생산량만 다를 때 cogs 비교.
    // 경험 많은 쪽(high)의 단가가 더 낮아 cogs도 작아야 함.
    const noExp = runSimulation(
      DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 0, B: 0 },
    );
    const highExp = runSimulation(
      DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 100_000, B: 80_000 },
    );
    // 판매량이 같을 때 gross profit은 학습경험 많은 쪽이 커야 함
    expect(highExp.perProduct.A.cogs).toBeLessThan(noExp.perProduct.A.cogs);
    expect(highExp.perProduct.B.cogs).toBeLessThan(noExp.perProduct.B.cogs);
  });

  it('PnL cogs drops with cumulative production (financial-mapper path)', () => {
    const r = runSimulation(
      DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 100_000, B: 80_000 },
    );
    const fLearning = generateFinancials(
      DEFAULT_DECISIONS, r, null, undefined, 0, { A: 100_000, B: 80_000 },
    );
    const fNoLearning = generateFinancials(
      DEFAULT_DECISIONS, r, null, undefined, 0, { A: 0, B: 0 },
    );
    // 학습효과 반영 시 동일 판매량이라도 cogs 감소 → netIncome 증가
    expect(fLearning.pnl.cogs).toBeLessThan(fNoLearning.pnl.cogs);
    expect(fLearning.pnl.netIncome).toBeGreaterThan(fNoLearning.pnl.netIncome);
  });

  it('each product has independent learning stock', () => {
    // A만 경험 많고 B는 신제품. A cogs만 체감되어야 함.
    const r = runSimulation(
      DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 200_000, B: 0 },
    );
    const rBase = runSimulation(
      DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 0, B: 0 },
    );
    expect(r.perProduct.A.cogs).toBeLessThan(rBase.perProduct.A.cogs);
    expect(r.perProduct.B.cogs).toBe(rBase.perProduct.B.cogs);
  });
});
