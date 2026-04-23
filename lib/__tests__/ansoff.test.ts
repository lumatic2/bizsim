import { describe, it, expect } from 'vitest';
import { exploreBoostFrom, DEFAULT_RD_ALLOCATION } from '../ansoff';
import { runSimulation } from '../game-engine';
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

describe('exploreBoostFrom', () => {
  it('returns 0 for zero cumulative explore', () => {
    expect(exploreBoostFrom(0)).toBe(0);
  });

  it('monotonically increases with cumulative', () => {
    expect(exploreBoostFrom(5_000_000_000)).toBeGreaterThan(exploreBoostFrom(1_000_000_000));
    expect(exploreBoostFrom(20_000_000_000)).toBeGreaterThan(exploreBoostFrom(5_000_000_000));
  });

  it('asymptotes below 0.25 max boost', () => {
    expect(exploreBoostFrom(1_000_000_000_000)).toBeLessThan(0.25);
    expect(exploreBoostFrom(1_000_000_000_000)).toBeGreaterThan(0.24);
  });

  it('at half-point 5B gives ~12.5% boost', () => {
    const b = exploreBoostFrom(5_000_000_000);
    expect(b).toBeCloseTo(0.125, 3);
  });
});

describe('Ansoff explore 시장 확장 통합', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;

  it('exploreBoost > 0 시 플레이어 세그먼트 수요 증가', () => {
    const noExplore = runSimulation(
      DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 0, B: 0 }, 1, 0,
    );
    const withExplore = runSimulation(
      DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 0, B: 0 }, 1, 0.2,
    );
    const noTotal = Object.values(noExplore.segmentDemand).reduce((s, d) => s + d, 0);
    const withTotal = Object.values(withExplore.segmentDemand).reduce((s, d) => s + d, 0);
    expect(withTotal).toBeGreaterThan(noTotal);
  });

  it('exploreBoost는 경쟁사 demand에 영향 주지 않음 (플레이어 전용)', () => {
    // 극한: 생산 capacity 작게 잡아서 플레이어 판매량은 같고, 경쟁사 행태만 관찰
    const limited: Decisions = {
      ...DECISIONS,
      products: [
        { ...PRODUCT_A, production: 100 },
        { ...PRODUCT_B, production: 100 },
      ],
    };
    const noExp = runSimulation(limited, INITIAL_COMPETITORS, marketSize, qualityCap, undefined, undefined, Infinity, { A: 0, B: 0 }, 1, 0);
    const exp = runSimulation(limited, INITIAL_COMPETITORS, marketSize, qualityCap, undefined, undefined, Infinity, { A: 0, B: 0 }, 1, 0.2);
    // 경쟁사 판매량은 동일 — 경쟁사는 base marketSize 기반
    expect(exp.competitors[0].unitsSold).toBe(noExp.competitors[0].unitsSold);
    expect(exp.competitors[1].unitsSold).toBe(noExp.competitors[1].unitsSold);
    expect(exp.competitors[2].unitsSold).toBe(noExp.competitors[2].unitsSold);
  });
});

describe('DEFAULT_RD_ALLOCATION', () => {
  it('sums to 100', () => {
    expect(DEFAULT_RD_ALLOCATION.improve + DEFAULT_RD_ALLOCATION.explore).toBe(100);
  });
});
