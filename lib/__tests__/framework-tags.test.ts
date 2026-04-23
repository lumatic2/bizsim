import { describe, it, expect } from 'vitest';
import { matchFrameworkTags } from '../framework-tags';
import { runSimulation } from '../game-engine';
import { INITIAL_COMPETITORS, getMarketSize } from '../competitor-ai';
import type { Decisions, ProductDecision } from '../types';

const PRODUCT_A: ProductDecision = { id: 'A', name: '프리미엄', price: 429_000, quality: 4, production: 8_000 };
const PRODUCT_B: ProductDecision = { id: 'B', name: '밸류', price: 279_000, quality: 3, production: 7_000 };
const BASE_DECISIONS: Decisions = {
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
  salaryMultiplier: 1.0,
};

describe('matchFrameworkTags', () => {
  const results = runSimulation(BASE_DECISIONS, INITIAL_COMPETITORS, getMarketSize(1), 3);

  it('태그 배열 반환 (빈 배열 가능)', () => {
    const tags = matchFrameworkTags({
      decisions: BASE_DECISIONS, results, roundHistory: [],
      brandEquity: 50, supplyIndex: 1.0,
      cumulativeProduction: { A: 0, B: 0 }, cumulativeExploreRd: 0,
    });
    expect(Array.isArray(tags)).toBe(true);
  });

  it('저가 전략 시 Porter 비용우위 태그', () => {
    const cheap: Decisions = {
      ...BASE_DECISIONS,
      products: [
        { ...PRODUCT_A, price: 250_000, quality: 3 },
        { ...PRODUCT_B, price: 210_000, quality: 3 },
      ],
    };
    const r = runSimulation(cheap, INITIAL_COMPETITORS, getMarketSize(1), 3);
    const tags = matchFrameworkTags({
      decisions: cheap, results: r, roundHistory: [],
      brandEquity: 50, supplyIndex: 1.0,
      cumulativeProduction: { A: 0, B: 0 }, cumulativeExploreRd: 0,
    });
    expect(tags.find((t) => t.id === 'porter-cost')).toBeDefined();
  });

  it('고품질 프리미엄 시 Porter 차별화 태그', () => {
    const premium: Decisions = {
      ...BASE_DECISIONS,
      products: [
        { ...PRODUCT_A, price: 450_000, quality: 5 },
        { ...PRODUCT_B, price: 400_000, quality: 5 },
      ],
    };
    const r = runSimulation(premium, INITIAL_COMPETITORS, getMarketSize(1), 5);
    const tags = matchFrameworkTags({
      decisions: premium, results: r, roundHistory: [],
      brandEquity: 70, supplyIndex: 1.0,
      cumulativeProduction: { A: 0, B: 0 }, cumulativeExploreRd: 0,
    });
    expect(tags.find((t) => t.id === 'porter-differentiation')).toBeDefined();
  });

  it('SPI crisis 시 공급자 위기 태그 (priority 높음)', () => {
    const tags = matchFrameworkTags({
      decisions: BASE_DECISIONS, results, roundHistory: [],
      brandEquity: 50, supplyIndex: 1.2,
      cumulativeProduction: { A: 0, B: 0 }, cumulativeExploreRd: 0,
    });
    const crisisTag = tags.find((t) => t.id === 'porter-supplier-crisis');
    expect(crisisTag).toBeDefined();
    expect(crisisTag?.priority).toBeGreaterThanOrEqual(80);
  });

  it('경험곡선 효과 (누적 생산 많을 때)', () => {
    const tags = matchFrameworkTags({
      decisions: BASE_DECISIONS, results, roundHistory: [],
      brandEquity: 50, supplyIndex: 1.0,
      cumulativeProduction: { A: 100_000, B: 100_000 }, cumulativeExploreRd: 0,
    });
    expect(tags.find((t) => t.id === 'experience-curve')).toBeDefined();
  });

  it('탐색 R&D 누적 시 Ansoff 시장개발 태그', () => {
    const tags = matchFrameworkTags({
      decisions: BASE_DECISIONS, results, roundHistory: [],
      brandEquity: 50, supplyIndex: 1.0,
      cumulativeProduction: { A: 0, B: 0 }, cumulativeExploreRd: 10_000_000_000,
    });
    expect(tags.find((t) => t.id === 'ansoff-dev')).toBeDefined();
  });

  it('태그는 priority 내림차순 정렬', () => {
    const tags = matchFrameworkTags({
      decisions: BASE_DECISIONS, results, roundHistory: [],
      brandEquity: 80, supplyIndex: 1.2,  // 여러 태그 트리거
      cumulativeProduction: { A: 100_000, B: 100_000 }, cumulativeExploreRd: 10_000_000_000,
    });
    for (let i = 1; i < tags.length; i++) {
      expect(tags[i].priority).toBeLessThanOrEqual(tags[i - 1].priority);
    }
  });
});
