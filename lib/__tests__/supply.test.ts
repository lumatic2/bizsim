import { describe, it, expect } from 'vitest';
import { rollSupplyIndex, classifyPressure, DEFAULT_SUPPLY_INDEX } from '../supply';
import { runSimulation } from '../game-engine';
import { generateFinancials } from '../financial-mapper';
import { INITIAL_COMPETITORS, getMarketSize } from '../competitor-ai';
import { CALM_EVENT, EVENT_POOL } from '../events';
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
  headcount: { sales: 4, rd: 4 },
  salaryMultiplier: 1.0,
};

describe('rollSupplyIndex', () => {
  it('stays within [0.8, 1.3] clamp regardless of shock direction', () => {
    // 극단 shock으로 clamp 경계 테스트
    const maxShock = () => 1; // (rng*2-1)=1 → +max shock
    const minShock = () => 0; // -max shock
    expect(rollSupplyIndex(1.25, maxShock)).toBeLessThanOrEqual(1.3);
    expect(rollSupplyIndex(0.85, minShock)).toBeGreaterThanOrEqual(0.8);
  });

  it('mean-reverts toward 1.0 when no shock and no drift would take over', () => {
    const noShock = () => 0.5; // shock = 0
    // 1.2 → 평균회귀 끌림으로 1.2보다 낮아져야 함
    const next = rollSupplyIndex(1.2, noShock);
    expect(next).toBeLessThan(1.2);
    // 0.9 → 끌림으로 0.9보다 높아져야 함
    const next2 = rollSupplyIndex(0.9, noShock);
    expect(next2).toBeGreaterThan(0.9);
  });

  it('over long horizon stays near 1.0 in expectation', () => {
    // 2000번 시뮬 평균이 1.0 + drift 누적 상한 근방 (AR(1) 정상분포 평균)
    let idx = DEFAULT_SUPPLY_INDEX;
    let sum = 0;
    const N = 2000;
    let seed = 42;
    const lcg = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed & 0x7fffffff) / 0x7fffffff;
    };
    for (let i = 0; i < N; i++) {
      idx = rollSupplyIndex(idx, lcg);
      sum += idx;
    }
    const mean = sum / N;
    // 평균 회귀 0.4 + drift 0.01 균형 → 평균 약 1.025 ± α
    expect(mean).toBeGreaterThan(0.95);
    expect(mean).toBeLessThan(1.1);
  });
});

describe('classifyPressure', () => {
  it('maps index to pressure bucket', () => {
    expect(classifyPressure(0.9)).toBe('favorable');
    expect(classifyPressure(1.0)).toBe('normal');
    expect(classifyPressure(1.1)).toBe('tight');
    expect(classifyPressure(1.2)).toBe('crisis');
  });
});

describe('supply index integration', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;

  it('higher supply index increases unit cost (cogs up, operating profit down)', () => {
    const low = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap, CALM_EVENT, 50, Infinity, { A: 0, B: 0 }, 0.9);
    const high = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap, CALM_EVENT, 50, Infinity, { A: 0, B: 0 }, 1.2);
    // 판매량은 수요 모델상 동일 → cogs만 차이
    expect(high.perProduct.A.cogs).toBeGreaterThan(low.perProduct.A.cogs);
    expect(high.operatingProfit).toBeLessThan(low.operatingProfit);
  });

  it('supply index stacks with event cost_shock multiplicatively', () => {
    const shock = EVENT_POOL.find((e) => e.id === 'cost_shock')!;
    const calm = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap, CALM_EVENT, 50, Infinity, { A: 0, B: 0 }, 1.2);
    const stacked = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap, shock, 50, Infinity, { A: 0, B: 0 }, 1.2);
    // cost_shock(1.3) 추가 시 cogs 더 커져야 함
    expect(stacked.perProduct.A.cogs).toBeGreaterThan(calm.perProduct.A.cogs);
  });

  it('financial-mapper cogs reflects supplyIndex', () => {
    const r = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap, CALM_EVENT, 50, Infinity, { A: 0, B: 0 }, 1.2);
    const fHigh = generateFinancials(DECISIONS, r, null, CALM_EVENT, 0, { A: 0, B: 0 }, 1.2);
    const fBase = generateFinancials(DECISIONS, r, null, CALM_EVENT, 0, { A: 0, B: 0 }, 1.0);
    expect(fHigh.pnl.cogs).toBeGreaterThan(fBase.pnl.cogs);
  });
});
