import { describe, it, expect } from 'vitest';
import { runSimulation } from '../game-engine';
import { INITIAL_COMPETITORS, getMarketSize } from '../competitor-ai';
import { CALM_EVENT, EVENT_POOL } from '../events';
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
};

function withProducts(base: Decisions, products: [ProductDecision, ProductDecision]): Decisions {
  return { ...base, products };
}

describe('runSimulation', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;

  it('returns valid market share between 0 and 100', () => {
    const result = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    expect(result.marketShare).toBeGreaterThanOrEqual(0);
    expect(result.marketShare).toBeLessThanOrEqual(100);
  });

  it('returns positive revenue when units are sold', () => {
    const result = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    expect(result.revenue).toBeGreaterThan(0);
    expect(result.unitsSold).toBeGreaterThan(0);
  });

  it('sells no more than total production across products', () => {
    const tightProduction = withProducts(DEFAULT_DECISIONS, [
      { ...PRODUCT_A, production: 100 },
      { ...PRODUCT_B, production: 100 },
    ]);
    const result = runSimulation(tightProduction, INITIAL_COMPETITORS, marketSize, qualityCap);
    expect(result.unitsSold).toBeLessThanOrEqual(200);
  });

  it('lower price increases demand', () => {
    const expensiveProducts: [ProductDecision, ProductDecision] = [
      { ...PRODUCT_A, price: 500_000 },
      { ...PRODUCT_B, price: 500_000 },
    ];
    const cheapProducts: [ProductDecision, ProductDecision] = [
      { ...PRODUCT_A, price: 200_000 },
      { ...PRODUCT_B, price: 200_000 },
    ];
    const expensive = runSimulation(withProducts(DEFAULT_DECISIONS, expensiveProducts), INITIAL_COMPETITORS, marketSize, qualityCap);
    const cheap = runSimulation(withProducts(DEFAULT_DECISIONS, cheapProducts), INITIAL_COMPETITORS, marketSize, qualityCap);
    const expTotal = Object.values(expensive.segmentDemand).reduce((s, d) => s + d, 0);
    const cheapTotal = Object.values(cheap.segmentDemand).reduce((s, d) => s + d, 0);
    expect(cheapTotal).toBeGreaterThan(expTotal);
  });

  it('higher quality increases satisfaction', () => {
    const lowQ: [ProductDecision, ProductDecision] = [
      { ...PRODUCT_A, quality: 1 },
      { ...PRODUCT_B, quality: 1 },
    ];
    const highQ: [ProductDecision, ProductDecision] = [
      { ...PRODUCT_A, quality: 3 },
      { ...PRODUCT_B, quality: 3 },
    ];
    const low = runSimulation(withProducts(DEFAULT_DECISIONS, lowQ), INITIAL_COMPETITORS, marketSize, qualityCap);
    const high = runSimulation(withProducts(DEFAULT_DECISIONS, highQ), INITIAL_COMPETITORS, marketSize, qualityCap);
    expect(high.satisfaction).toBeGreaterThan(low.satisfaction);
  });

  it('zero ad budget still produces some demand', () => {
    const result = runSimulation(
      { ...DEFAULT_DECISIONS, adBudget: { search: 0, display: 0, influencer: 0 } },
      INITIAL_COMPETITORS, marketSize, qualityCap,
    );
    const totalDemand = Object.values(result.segmentDemand).reduce((s, d) => s + d, 0);
    expect(totalDemand).toBeGreaterThan(0);
  });

  it('all segment demands are non-negative', () => {
    const extreme: Decisions = {
      products: [
        { ...PRODUCT_A, price: 500_000, quality: 1, production: 30_000 },
        { ...PRODUCT_B, price: 500_000, quality: 1, production: 30_000 },
      ],
      rdBudget: 0,
      rdAllocation: { improve: 70, explore: 30 },
      adBudget: { search: 0, display: 0, influencer: 0 },
      channels: { online: 100, mart: 0, direct: 0 },
      financing: { newDebt: 0, newEquity: 0 },
      capexInvestment: 0,
      dividendPayout: 0,
      serviceCapacity: 20_000,
    };
    const result = runSimulation(extreme, INITIAL_COMPETITORS, marketSize, qualityCap);
    for (const demand of Object.values(result.segmentDemand)) {
      expect(demand).toBeGreaterThanOrEqual(0);
    }
  });

  it('ad mix biased toward a persona increases their demand', () => {
    const displayHeavy: Decisions = { ...DEFAULT_DECISIONS, adBudget: { search: 100_000_000, display: 700_000_000, influencer: 0 } };
    const searchHeavy: Decisions = { ...DEFAULT_DECISIONS, adBudget: { search: 700_000_000, display: 100_000_000, influencer: 0 } };
    const d = runSimulation(displayHeavy, INITIAL_COMPETITORS, marketSize, qualityCap);
    const s = runSimulation(searchHeavy, INITIAL_COMPETITORS, marketSize, qualityCap);
    expect(d.segmentDemand.soonja).toBeGreaterThan(s.segmentDemand.soonja);
    expect(s.segmentDemand.minsoo).toBeGreaterThan(d.segmentDemand.minsoo);
  });

  it('includes competitors in results', () => {
    const result = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    expect(result.competitors).toBeDefined();
    expect(result.competitors.length).toBe(3);
  });

  it('market_boom event expands effective market size', () => {
    const boom = EVENT_POOL.find((e) => e.id === 'market_boom')!;
    const base = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap, CALM_EVENT);
    const boosted = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap, boom);
    expect(boosted.marketSize).toBeGreaterThan(base.marketSize);
    expect(boosted.unitsSold).toBeGreaterThanOrEqual(base.unitsSold);
  });

  it('pr_crisis event reduces satisfaction', () => {
    const crisis = EVENT_POOL.find((e) => e.id === 'pr_crisis')!;
    const calm = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap, CALM_EVENT);
    const hit = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap, crisis);
    expect(hit.satisfaction).toBeLessThan(calm.satisfaction);
  });

  it('higher brand equity increases player share at premium price', () => {
    // 수요가 segmentShare 상한에 걸리지 않도록 극단적 프리미엄 가격 + 낮은 생산
    const premiumProducts: [ProductDecision, ProductDecision] = [
      { ...PRODUCT_A, price: 500_000, production: 4_000 },
      { ...PRODUCT_B, price: 500_000, production: 4_000 },
    ];
    const premium = withProducts(DEFAULT_DECISIONS, premiumProducts);
    const weak = runSimulation(premium, INITIAL_COMPETITORS, marketSize, qualityCap, CALM_EVENT, 10);
    const strong = runSimulation(premium, INITIAL_COMPETITORS, marketSize, qualityCap, CALM_EVENT, 90);
    // 상한에 걸려서 unitsSold가 같더라도 raw 세그먼트 수요는 늘어야 함
    const weakDemand = Object.values(weak.segmentDemand).reduce((s, d) => s + d, 0);
    const strongDemand = Object.values(strong.segmentDemand).reduce((s, d) => s + d, 0);
    expect(strongDemand).toBeGreaterThanOrEqual(weakDemand);
    expect(strong.marketShare).toBeGreaterThanOrEqual(weak.marketShare);
  });

  it('two products produce separate perProduct results', () => {
    const result = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    expect(result.perProduct.A).toBeDefined();
    expect(result.perProduct.B).toBeDefined();
    expect(result.perProduct.A.unitsSold + result.perProduct.B.unitsSold).toBe(result.unitsSold);
    expect(result.perProduct.A.revenue + result.perProduct.B.revenue).toBe(result.revenue);
  });

  it('perProduct reports cogs, grossProfit, and allocatedOverhead', () => {
    const result = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    for (const pid of ['A', 'B'] as const) {
      const pr = result.perProduct[pid];
      expect(pr.cogs).toBeGreaterThanOrEqual(0);
      expect(pr.grossProfit).toBe(pr.revenue - pr.cogs);
      expect(pr.allocatedOverhead).toBeGreaterThanOrEqual(0);
      expect(pr.segmentProfit).toBe(pr.grossProfit - pr.allocatedOverhead);
    }
    // 배분 합은 runtime overhead 근사 (광고 + R&D/4 + 100M) — 반올림 오차 허용
    const totalOH = result.perProduct.A.allocatedOverhead + result.perProduct.B.allocatedOverhead;
    const runtimeOH = (DEFAULT_DECISIONS.adBudget.search + DEFAULT_DECISIONS.adBudget.display + DEFAULT_DECISIONS.adBudget.influencer)
      + DEFAULT_DECISIONS.rdBudget / 4 + 100_000_000;
    expect(Math.abs(totalOH - runtimeOH)).toBeLessThan(10);
  });

  it('production capacity caps actual production proportionally', () => {
    // 요청 생산: 8k + 7k = 15k. capacity 10k로 제한 → 각 제품 실제 생산 비례 축소
    const capped = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap, CALM_EVENT, 50, 10_000);
    expect(capped.perProduct.A.produced + capped.perProduct.B.produced).toBeLessThanOrEqual(10_000);
    // capacity가 무제한이면 원래 production 상한까지 가능
    const free = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap, CALM_EVENT, 50, Infinity);
    expect(free.perProduct.A.produced).toBe(PRODUCT_A.production);
  });
});
