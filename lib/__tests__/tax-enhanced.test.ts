import { describe, it, expect } from 'vitest';
import { investmentTaxCreditFor, INVESTMENT_TAX_CREDIT_RATE, expireOldLosses, LOSS_CARRYFORWARD_QUARTERS } from '../tax';
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
  salaryMultiplier: 1.0,
};

describe('investmentTaxCreditFor', () => {
  it('CAPEX 0이면 공제 0', () => {
    expect(investmentTaxCreditFor(0, 100_000_000)).toBe(0);
  });

  it(`CAPEX × ${INVESTMENT_TAX_CREDIT_RATE * 100}% 공제 (cap 미충돌)`, () => {
    expect(investmentTaxCreditFor(1_000_000_000, 1_000_000_000)).toBe(70_000_000);
  });

  it('산출세액의 70% 한도 적용', () => {
    // CAPEX 100B × 7% = 7B credit, grossTax 1B × 70% = 700M → cap 적용
    expect(investmentTaxCreditFor(100_000_000_000, 1_000_000_000)).toBe(700_000_000);
  });
});

describe('expireOldLosses', () => {
  it(`${LOSS_CARRYFORWARD_QUARTERS}분기 초과는 제거`, () => {
    const history = [
      { round: 1, amount: 1_000_000_000 },
      { round: 30, amount: 500_000_000 },
    ];
    const filtered = expireOldLosses(history, 1 + LOSS_CARRYFORWARD_QUARTERS + 1);
    // round 1은 만료, round 30은 유지
    expect(filtered).toHaveLength(1);
    expect(filtered[0].round).toBe(30);
  });

  it('모두 유효하면 그대로 반환', () => {
    const history = [{ round: 5, amount: 100_000_000 }];
    expect(expireOldLosses(history, 10)).toEqual(history);
  });
});

describe('financial-mapper — 투자세액공제 통합', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;

  it('CAPEX 있을 때 investmentTaxCredit > 0 (흑자 가정)', () => {
    const withCapex: Decisions = { ...DECISIONS, capexInvestment: 2_000_000_000 };
    const r = runSimulation(withCapex, INITIAL_COMPETITORS, marketSize, qualityCap);
    const f = generateFinancials(withCapex, r, null);
    if (f.pnl.pretaxIncome > 0) {
      expect(f.pnl.investmentTaxCredit).toBeGreaterThan(0);
    }
  });

  it('CAPEX 0이면 investmentTaxCredit = 0', () => {
    const r = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    const f = generateFinancials(DECISIONS, r, null);
    expect(f.pnl.investmentTaxCredit).toBe(0);
  });

  it('investmentTaxCredit이 currentTax를 추가로 감소시킴', () => {
    const noCapex: Decisions = { ...DECISIONS, capexInvestment: 0 };
    const withCapex: Decisions = { ...DECISIONS, capexInvestment: 3_000_000_000 };
    const rNo = runSimulation(noCapex, INITIAL_COMPETITORS, marketSize, qualityCap);
    const rCap = runSimulation(withCapex, INITIAL_COMPETITORS, marketSize, qualityCap);
    const fNo = generateFinancials(noCapex, rNo, null);
    const fCap = generateFinancials(withCapex, rCap, null);
    if (fNo.pnl.pretaxIncome > 0) {
      expect(fCap.pnl.currentTax).toBeLessThan(fNo.pnl.currentTax);
    }
  });
});

describe('financial-mapper — DTA/DTL 분리', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;

  it('초기 BS에 deferredTaxAsset 필드 존재', () => {
    const r = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    const f = generateFinancials(DECISIONS, r, null);
    expect(typeof f.bs.deferredTaxAsset).toBe('number');
    expect(f.bs.deferredTaxAsset).toBeGreaterThanOrEqual(0);
  });

  it('DTL과 DTA는 동시에 양수일 수 없음 (순효과 재분류)', () => {
    const r = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    const f = generateFinancials(DECISIONS, r, null);
    expect(f.bs.deferredTaxLiability * f.bs.deferredTaxAsset).toBe(0);
  });
});
