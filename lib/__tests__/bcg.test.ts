import { describe, it, expect } from 'vitest';
import { classifyQuadrant, computeBCGPositions, computeMarketGrowth, HIGH_GROWTH_THRESHOLD } from '../bcg';
import type { Decisions, ProductDecision, SimulationResults, RoundSnapshot, FinancialStatements } from '../types';

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

function mockResults(overrides: Partial<SimulationResults> = {}): SimulationResults {
  return {
    marketShare: 20,
    revenue: 5_000_000_000,
    operatingProfit: 500_000_000,
    satisfaction: 60,
    unitsSold: 20_000,
    segmentDemand: { jiyeon: 7_000, minsoo: 6_000, soonja: 7_000 },
    marketSize: 100_000,
    competitors: [
      { name: 'C1', price: 380_000, adBudget: 1_200_000_000, quality: 4, channels: { online: 30, mart: 50, direct: 20 }, marketShare: 30, revenue: 4_000_000_000, unitsSold: 30_000, cumulativeRd: 0 },
      { name: 'C2', price: 320_000, adBudget: 800_000_000, quality: 3, channels: { online: 55, mart: 35, direct: 10 }, marketShare: 15, revenue: 3_000_000_000, unitsSold: 15_000, cumulativeRd: 0 },
      { name: 'C3', price: 280_000, adBudget: 500_000_000, quality: 3, channels: { online: 40, mart: 40, direct: 20 }, marketShare: 10, revenue: 2_000_000_000, unitsSold: 10_000, cumulativeRd: 0 },
    ],
    perProduct: {
      A: { id: 'A', name: '프리미엄', produced: 8_000, unitsSold: 8_000, revenue: 3_432_000_000, cogs: 1_400_000_000, grossProfit: 2_032_000_000, allocatedOverhead: 600_000_000, segmentProfit: 1_432_000_000, segmentDemand: { jiyeon: 3_000, minsoo: 2_500, soonja: 2_500 } },
      B: { id: 'B', name: '밸류', produced: 12_000, unitsSold: 12_000, revenue: 3_348_000_000, cogs: 2_040_000_000, grossProfit: 1_308_000_000, allocatedOverhead: 500_000_000, segmentProfit: 808_000_000, segmentDemand: { jiyeon: 4_000, minsoo: 3_500, soonja: 4_500 } },
    },
    ...overrides,
  };
}

describe('classifyQuadrant', () => {
  it('high share + high growth = star', () => {
    expect(classifyQuadrant(1.5, HIGH_GROWTH_THRESHOLD + 5)).toBe('star');
  });
  it('high share + low growth = cash cow', () => {
    expect(classifyQuadrant(1.5, HIGH_GROWTH_THRESHOLD - 1)).toBe('cashCow');
  });
  it('low share + high growth = question mark', () => {
    expect(classifyQuadrant(0.5, HIGH_GROWTH_THRESHOLD + 5)).toBe('questionMark');
  });
  it('low share + low growth = dog', () => {
    expect(classifyQuadrant(0.5, HIGH_GROWTH_THRESHOLD - 1)).toBe('dog');
  });
});

describe('computeMarketGrowth', () => {
  it('returns 3% default when no prior round', () => {
    expect(computeMarketGrowth(mockResults(), [])).toBe(3);
  });

  it('computes round-over-round growth from snapshot', () => {
    const prev = { marketSize: 100_000 } as unknown as RoundSnapshot;
    const now = mockResults({ marketSize: 110_000 });
    expect(computeMarketGrowth(now, [prev])).toBeCloseTo(10, 3);
  });
});

describe('computeBCGPositions', () => {
  it('produces a position for each product', () => {
    const positions = computeBCGPositions(mockResults(), DECISIONS, []);
    expect(positions).toHaveLength(2);
    expect(positions.map((p) => p.productId).sort()).toEqual(['A', 'B']);
  });

  it('relative share < 1 when top competitor outshares product', () => {
    // top competitor at 30% share, our products ~8% and ~12% each → rel < 1
    const positions = computeBCGPositions(mockResults(), DECISIONS, []);
    for (const p of positions) {
      expect(p.relativeShare).toBeLessThan(1);
    }
  });

  it('classifies dog when both share and growth are low', () => {
    // default growth = 3% < 5% threshold, rel < 1 → dog
    const positions = computeBCGPositions(mockResults(), DECISIONS, []);
    for (const p of positions) {
      expect(p.quadrant).toBe('dog');
    }
  });

  it('classifies star when leading and growing fast', () => {
    // 우리 unitsSold 비중 크게, 경쟁사 점유율 작게 — 상대점유율 > 1
    // + roundHistory로 성장률 10% 유도
    const leadResults = mockResults({
      marketShare: 60,
      unitsSold: 60_000,
      marketSize: 110_000,
      competitors: [
        { name: 'C1', price: 380_000, adBudget: 1_200_000_000, quality: 4, channels: { online: 30, mart: 50, direct: 20 }, marketShare: 15, revenue: 2_000_000_000, unitsSold: 15_000, cumulativeRd: 0 },
        { name: 'C2', price: 320_000, adBudget: 800_000_000, quality: 3, channels: { online: 55, mart: 35, direct: 10 }, marketShare: 10, revenue: 1_500_000_000, unitsSold: 10_000, cumulativeRd: 0 },
        { name: 'C3', price: 280_000, adBudget: 500_000_000, quality: 3, channels: { online: 40, mart: 40, direct: 20 }, marketShare: 5, revenue: 1_000_000_000, unitsSold: 5_000, cumulativeRd: 0 },
      ],
      perProduct: {
        A: { id: 'A', name: '프리미엄', produced: 30_000, unitsSold: 30_000, revenue: 12_870_000_000, cogs: 5_000_000_000, grossProfit: 7_870_000_000, allocatedOverhead: 1_000_000_000, segmentProfit: 6_870_000_000, segmentDemand: { jiyeon: 10_000, minsoo: 10_000, soonja: 10_000 } },
        B: { id: 'B', name: '밸류', produced: 30_000, unitsSold: 30_000, revenue: 8_370_000_000, cogs: 5_000_000_000, grossProfit: 3_370_000_000, allocatedOverhead: 900_000_000, segmentProfit: 2_470_000_000, segmentDemand: { jiyeon: 10_000, minsoo: 10_000, soonja: 10_000 } },
      },
    });
    const prev: RoundSnapshot = {
      round: 1,
      decisions: DECISIONS,
      results: leadResults,
      financials: {} as FinancialStatements,
      competitors: leadResults.competitors,
      marketSize: 100_000,
      cumulativeRd: 0,
      qualityCap: 3,
      event: { id: 'calm', title: '', description: '', severity: 'neutral', effects: {} },
      brandEquity: 50,
    };
    const positions = computeBCGPositions(leadResults, DECISIONS, [prev]);
    for (const p of positions) {
      expect(p.relativeShare).toBeGreaterThan(1);
      expect(p.growth).toBeCloseTo(10, 3);
      expect(p.quadrant).toBe('star');
    }
  });
});
