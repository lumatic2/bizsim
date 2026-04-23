import { describe, it, expect } from 'vitest';
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
  serviceCapacity: 50_000,  // 서비스 overflow 제거로 순수 리드타임 효과 관찰
};

describe('runSimulation — 생산 리드타임', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;

  it('pendingProduction 미지정 시 레거시 즉시생산 동작 (기존 테스트 호환)', () => {
    // decisions.products.production이 그대로 effectiveProduction으로 사용되어야 함
    const r = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    expect(r.perProduct.A.produced).toBe(PRODUCT_A.production);
    expect(r.perProduct.B.produced).toBe(PRODUCT_B.production);
  });

  it('pendingProduction 지정 시 decisions.products.production 무시, pending만 실현', () => {
    // 이번 분기 실현은 pending, decisions.production은 다음 분기용 (현재 시뮬에선 무영향)
    const pending = { A: 3_000, B: 2_000 };
    const r = runSimulation(
      DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 0, B: 0 }, 1, 0,
      pending,
    );
    expect(r.perProduct.A.produced).toBe(3_000);
    expect(r.perProduct.B.produced).toBe(2_000);
  });

  it('pendingProduction 부족 시 수요 초과 판매 불가 (품절)', () => {
    // 수요는 충분, pending은 1,000대만 생산 → unitsSold는 1,000 이하
    const pending = { A: 1_000, B: 1_000 };
    const r = runSimulation(
      DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, Infinity, { A: 0, B: 0 }, 1, 0,
      pending,
    );
    expect(r.perProduct.A.unitsSold).toBeLessThanOrEqual(1_000);
    expect(r.perProduct.B.unitsSold).toBeLessThanOrEqual(1_000);
  });

  it('capacityRatio는 pendingProduction 합계 기준으로 계산', () => {
    // pending 합 10k, capacity 5k → 50% 비례 축소
    const pending = { A: 6_000, B: 4_000 };
    const r = runSimulation(
      DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap,
      undefined, undefined, 5_000, { A: 0, B: 0 }, 1, 0,
      pending,
    );
    expect(r.perProduct.A.produced + r.perProduct.B.produced).toBeLessThanOrEqual(5_000);
    // 비례: A 생산 ~ 3,000, B ~ 2,000
    expect(r.perProduct.A.produced).toBeCloseTo(3_000, -2);
    expect(r.perProduct.B.produced).toBeCloseTo(2_000, -2);
  });
});
