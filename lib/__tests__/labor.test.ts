import { describe, it, expect } from 'vitest';
import { directChannelMultiplier, rdEffectivenessMultiplier, laborCostOf, LABOR_COST_PER_HEAD, DEFAULT_HEADCOUNT } from '../labor';
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
  channels: { online: 40, mart: 30, direct: 30 },
  financing: { newDebt: 0, newEquity: 0 },
  capexInvestment: 0,
  dividendPayout: 0,
  serviceCapacity: 50_000,
  headcount: { sales: 4, rd: 4 },
};

describe('labor helpers', () => {
  it('DEFAULT_HEADCOUNT = {sales: 4, rd: 4}', () => {
    expect(DEFAULT_HEADCOUNT.sales).toBe(4);
    expect(DEFAULT_HEADCOUNT.rd).toBe(4);
  });

  it('directChannelMultiplier: 4명 → 1.0, 20명 → 1.8', () => {
    expect(directChannelMultiplier(4)).toBeCloseTo(1.0, 3);
    expect(directChannelMultiplier(20)).toBeCloseTo(1.8, 3);
  });

  it('rdEffectivenessMultiplier: 4명 → 1.0, 20명 → 1.8', () => {
    expect(rdEffectivenessMultiplier(4)).toBeCloseTo(1.0, 3);
    expect(rdEffectivenessMultiplier(20)).toBeCloseTo(1.8, 3);
  });

  it('laborCostOf = (sales + rd) × LABOR_COST_PER_HEAD', () => {
    expect(laborCostOf({ sales: 4, rd: 4 })).toBe(8 * LABOR_COST_PER_HEAD);
    expect(laborCostOf({ sales: 10, rd: 20 })).toBe(30 * LABOR_COST_PER_HEAD);
  });
});

describe('runSimulation — 영업팀 규모 직영 채널 효과', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;

  it('salesHeadcount 증가 → 직영 비중 크면 수요 증가', () => {
    const small: Decisions = { ...DECISIONS, headcount: { sales: 2, rd: 4 } };
    const big: Decisions = { ...DECISIONS, headcount: { sales: 20, rd: 4 } };
    const rSmall = runSimulation(small, INITIAL_COMPETITORS, marketSize, qualityCap);
    const rBig = runSimulation(big, INITIAL_COMPETITORS, marketSize, qualityCap);
    const totalSmall = Object.values(rSmall.segmentDemand).reduce((s, d) => s + d, 0);
    const totalBig = Object.values(rBig.segmentDemand).reduce((s, d) => s + d, 0);
    expect(totalBig).toBeGreaterThan(totalSmall);
  });
});

describe('financial-mapper — PnL 분해', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;
  const r = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
  const f = generateFinancials(DECISIONS, r, null);

  it('laborCost = 1인당 × 인원', () => {
    expect(f.pnl.laborCost).toBe(8 * LABOR_COST_PER_HEAD);
  });

  it('serviceCost = serviceCapacity × 50,000', () => {
    expect(f.pnl.serviceCost).toBe(50_000 * 50_000);
  });

  it('maintenanceCost > 0 (초기 PPE 10B × 0.5%)', () => {
    expect(f.pnl.maintenanceCost).toBeGreaterThan(0);
    expect(f.pnl.maintenanceCost).toBe(50_000_000);  // 10B × 0.005
  });

  it('otherExpense = G&A 50M + labor + maintenance + service', () => {
    const expected = 50_000_000 + f.pnl.laborCost + f.pnl.maintenanceCost + f.pnl.serviceCost;
    expect(f.pnl.otherExpense).toBe(expected);
  });
});
