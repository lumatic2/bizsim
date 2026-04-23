import { describe, it, expect } from 'vitest';
import { orgLearningMultiplier, ORG_LEARNING_MAX_ROUNDS, ORG_LEARNING_PER_ROUND } from '../org-learning';
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
  serviceCapacity: 50_000,
  headcount: { sales: 4, rd: 4 },
};

describe('orgLearningMultiplier', () => {
  it('0 라운드 → 1.0 (보너스 없음)', () => {
    expect(orgLearningMultiplier(0)).toBe(1.0);
  });

  it('라운드당 PER_ROUND_GAIN 만큼 증가', () => {
    expect(orgLearningMultiplier(5)).toBeCloseTo(1 + 5 * ORG_LEARNING_PER_ROUND, 5);
  });

  it(`${ORG_LEARNING_MAX_ROUNDS} 초과는 cap`, () => {
    expect(orgLearningMultiplier(ORG_LEARNING_MAX_ROUNDS + 10)).toBe(1 + ORG_LEARNING_MAX_ROUNDS * ORG_LEARNING_PER_ROUND);
  });

  it('음수 입력 clamp to 0', () => {
    expect(orgLearningMultiplier(-5)).toBe(1);
  });
});

describe('runSimulation — 조직 학습 누적 원가 체감', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;

  it('roundsCompleted 증가 → cogs 감소 (동일 판매량 기준)', () => {
    const rNew = runSimulation(
      DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 0, B: 0 }, 1, 0,
      undefined, undefined, 0,
    );
    const rVeteran = runSimulation(
      DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 0, B: 0 }, 1, 0,
      undefined, undefined, 10,
    );
    expect(rVeteran.perProduct.A.cogs).toBeLessThan(rNew.perProduct.A.cogs);
    expect(rVeteran.operatingProfit).toBeGreaterThan(rNew.operatingProfit);
  });

  it('financial-mapper cogs도 roundsCompleted 반영', () => {
    const r = runSimulation(
      DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 0, B: 0 }, 1, 0,
      undefined, undefined, 10,
    );
    const fNew = generateFinancials(DECISIONS, r, null, undefined, 0, { A: 0, B: 0 }, 1, 0);
    const fVeteran = generateFinancials(DECISIONS, r, null, undefined, 0, { A: 0, B: 0 }, 1, 10);
    expect(fVeteran.pnl.cogs).toBeLessThan(fNew.pnl.cogs);
    expect(fVeteran.pnl.netIncome).toBeGreaterThan(fNew.pnl.netIncome);
  });
});
