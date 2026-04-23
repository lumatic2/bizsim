import { describe, it, expect } from 'vitest';
import { computeSegmentProfiles } from '../stp';
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
  salaryMultiplier: 1.0,
};

describe('computeSegmentProfiles', () => {
  const results = runSimulation(DECISIONS, INITIAL_COMPETITORS, getMarketSize(1), 3);

  it('3 페르소나 모두 프로파일 반환', () => {
    const profiles = computeSegmentProfiles(results, DECISIONS);
    expect(profiles).toHaveLength(3);
    expect(profiles.map((p) => p.personaId).sort()).toEqual(['jiyeon', 'minsoo', 'soonja']);
  });

  it('매력도 내림차순 정렬', () => {
    const profiles = computeSegmentProfiles(results, DECISIONS);
    for (let i = 1; i < profiles.length; i++) {
      expect(profiles[i].attractiveness).toBeLessThanOrEqual(profiles[i - 1].attractiveness);
    }
  });

  it('topChannel이 persona의 최대 adResponse와 일치', () => {
    const profiles = computeSegmentProfiles(results, DECISIONS);
    // jiyeon: influencer(0.4)가 최대
    const jiyeon = profiles.find((p) => p.personaId === 'jiyeon');
    expect(jiyeon?.topChannel).toBe('influencer');
    // minsoo: search(0.55)가 최대
    const minsoo = profiles.find((p) => p.personaId === 'minsoo');
    expect(minsoo?.topChannel).toBe('search');
    // soonja: display(0.7)가 최대
    const soonja = profiles.find((p) => p.personaId === 'soonja');
    expect(soonja?.topChannel).toBe('display');
  });

  it('captured 합 = results.unitsSold (세그먼트 획득 합)', () => {
    const profiles = computeSegmentProfiles(results, DECISIONS);
    const sum = profiles.reduce((s, p) => s + p.captured, 0);
    // 실제 unitsSold는 생산/capacity에 의해 capped될 수 있음 — 여기서는 segmentDemand 합과 비교
    const totalDemand = Object.values(results.segmentDemand).reduce((s, d) => s + d, 0);
    expect(sum).toBe(totalDemand);
  });

  it('광고 많을수록 adReachScore 증가', () => {
    const lowAd: Decisions = { ...DECISIONS, adBudget: { search: 50_000_000, display: 50_000_000, influencer: 50_000_000 } };
    const highAd: Decisions = { ...DECISIONS, adBudget: { search: 1_000_000_000, display: 1_000_000_000, influencer: 1_000_000_000 } };
    const rLow = runSimulation(lowAd, INITIAL_COMPETITORS, getMarketSize(1), 3);
    const rHigh = runSimulation(highAd, INITIAL_COMPETITORS, getMarketSize(1), 3);
    const pLow = computeSegmentProfiles(rLow, lowAd);
    const pHigh = computeSegmentProfiles(rHigh, highAd);
    for (const id of ['jiyeon', 'minsoo', 'soonja'] as const) {
      const low = pLow.find((p) => p.personaId === id)!;
      const high = pHigh.find((p) => p.personaId === id)!;
      expect(high.adReachScore).toBeGreaterThan(low.adReachScore);
    }
  });
});
