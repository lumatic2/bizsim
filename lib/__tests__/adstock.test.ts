import { describe, it, expect } from 'vitest';
import { combineAdstock, EMPTY_ADSTOCK, ADSTOCK_DECAY } from '../adstock';
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
  serviceCapacity: 50_000,
  headcount: { sales: 4, rd: 4 },
};

describe('combineAdstock', () => {
  it('λ=0.5 기본값, 현재 예산 + 0.5 × 전분기 stock', () => {
    const prev = { search: 1_000_000_000, display: 0, influencer: 400_000_000 };
    const cur = { search: 200_000_000, display: 300_000_000, influencer: 100_000_000 };
    const r = combineAdstock(cur, prev);
    expect(r.search).toBe(200_000_000 + 0.5 * 1_000_000_000);
    expect(r.display).toBe(300_000_000 + 0);
    expect(r.influencer).toBe(100_000_000 + 0.5 * 400_000_000);
  });

  it('EMPTY_ADSTOCK 전분기 시 현재 예산 그대로 반환', () => {
    const cur = { search: 500_000_000, display: 100_000_000, influencer: 200_000_000 };
    expect(combineAdstock(cur, EMPTY_ADSTOCK)).toEqual(cur);
  });

  it('decay 값 조정 가능', () => {
    const prev = { search: 1_000_000_000, display: 0, influencer: 0 };
    const cur = { search: 0, display: 0, influencer: 0 };
    expect(combineAdstock(cur, prev, 1.0).search).toBe(1_000_000_000);
    expect(combineAdstock(cur, prev, 0).search).toBe(0);
  });

  it('ADSTOCK_DECAY 상수 = 0.5', () => {
    expect(ADSTOCK_DECAY).toBe(0.5);
  });
});

describe('runSimulation — adstock carryover', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;

  it('전분기 adstock이 있으면 같은 현재 예산에서도 수요 증가', () => {
    const noStock = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    const withStock = runSimulation(
      DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 0, B: 0 }, 1, 0,
      undefined,  // pendingProduction default
      { search: 1_000_000_000, display: 500_000_000, influencer: 500_000_000 },
    );
    const noTotal = Object.values(noStock.segmentDemand).reduce((s, d) => s + d, 0);
    const withTotal = Object.values(withStock.segmentDemand).reduce((s, d) => s + d, 0);
    expect(withTotal).toBeGreaterThan(noTotal);
  });

  it('현재 광고 0 + 전분기 stock 있음 → 완전 0은 아님 (carryover 살아있음)', () => {
    const zeroAd: Decisions = { ...DECISIONS, adBudget: { search: 0, display: 0, influencer: 0 } };
    const withCarryover = runSimulation(
      zeroAd, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 0, B: 0 }, 1, 0,
      undefined,
      { search: 1_000_000_000, display: 500_000_000, influencer: 500_000_000 },
    );
    const totalDemand = Object.values(withCarryover.segmentDemand).reduce((s, d) => s + d, 0);
    expect(totalDemand).toBeGreaterThan(0);
  });

  it('adstock 지정 없을 때 기존 테스트와 동일 동작 (EMPTY_ADSTOCK 기본값)', () => {
    const a = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    const b = runSimulation(
      DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 0, B: 0 }, 1, 0,
      undefined, EMPTY_ADSTOCK,
    );
    expect(a.revenue).toBe(b.revenue);
    expect(a.unitsSold).toBe(b.unitsSold);
  });
});
