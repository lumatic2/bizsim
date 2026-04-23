import { describe, it, expect } from 'vitest';
import { generateFinancials } from '../financial-mapper';
import { runSimulation } from '../game-engine';
import { INITIAL_COMPETITORS, getMarketSize } from '../competitor-ai';
import type { Decisions, ProductDecision, CarryForwardBS } from '../types';

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

describe('간접법 CF 정식화', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;
  const r = runSimulation(DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);

  it('netCashChange = operatingCF + investingCF + financingCF (CF 자체 합계)', () => {
    const f = generateFinancials(DECISIONS, r, null);
    expect(f.cf.netCashChange).toBe(f.cf.operatingCF + f.cf.investingCF + f.cf.financingCF);
  });

  it('BS cash 변동 = CF netCashChange (BS ↔ CF 일관성)', () => {
    const f = generateFinancials(DECISIONS, r, null);
    const prevCash = 10_000_000_000;  // INITIAL_CASH 기본값
    expect(f.bs.cash - prevCash).toBe(f.cf.netCashChange);
  });

  it('투자CF = −CAPEX만 (R&D 미포함, 중복 제거)', () => {
    const withCapex: Decisions = { ...DECISIONS, capexInvestment: 3_000_000_000 };
    const r2 = runSimulation(withCapex, INITIAL_COMPETITORS, marketSize, qualityCap);
    const f = generateFinancials(withCapex, r2, null);
    expect(f.cf.investingCF).toBe(-3_000_000_000);
  });

  it('재무CF = newDebt + newEquity − 배당 (이자 미포함, 중복 제거)', () => {
    const raise: Decisions = { ...DECISIONS, financing: { newDebt: 1_000_000_000, newEquity: 2_000_000_000 } };
    const r2 = runSimulation(raise, INITIAL_COMPETITORS, marketSize, qualityCap);
    const f = generateFinancials(raise, r2, null);
    expect(f.cf.financingCF).toBe(1_000_000_000 + 2_000_000_000);
  });

  it('재고 증가 → CFO 감소 (ΔInv 차감 반영)', () => {
    const prev: CarryForwardBS = {
      cash: 10_000_000_000, receivables: 1_000_000_000, inventory: 0, payables: 200_000_000,
      debt: 2_000_000_000, equity: 8_000_000_000, capitalSurplus: 0, retainedEarnings: 0,
      taxPayable: 0, ppe: 10_000_000_000, taxPpe: 10_000_000_000,
      deferredTaxLiability: 0, deferredTaxAsset: 0,
    };
    const prevHighInv: CarryForwardBS = { ...prev, inventory: 2_000_000_000 };
    const fNoInv = generateFinancials(DECISIONS, r, prev);
    const fHighInv = generateFinancials(DECISIONS, r, prevHighInv);
    // 전기 재고가 이미 많았으면 이번 기 재고 증가(ΔInv)가 작아져 CFO가 큼
    expect(fHighInv.cf.operatingCF).toBeGreaterThan(fNoInv.cf.operatingCF);
  });

  it('매입채무 증가 → CFO 증가 (ΔAP 가산)', () => {
    const prevLowAP: CarryForwardBS = {
      cash: 10_000_000_000, receivables: 0, inventory: 0, payables: 0,
      debt: 2_000_000_000, equity: 8_000_000_000, capitalSurplus: 0, retainedEarnings: 0,
      taxPayable: 0, ppe: 10_000_000_000, taxPpe: 10_000_000_000,
      deferredTaxLiability: 0, deferredTaxAsset: 0,
    };
    const prevHighAP: CarryForwardBS = { ...prevLowAP, payables: 500_000_000 };
    const fLow = generateFinancials(DECISIONS, r, prevLowAP);
    const fHigh = generateFinancials(DECISIONS, r, prevHighAP);
    // 전기 AP 많았으면 이번 기 ΔAP 작아져 CFO 감소
    expect(fLow.cf.operatingCF).toBeGreaterThan(fHigh.cf.operatingCF);
  });

  it('deferredTaxExpense 비현금 가산 (DTL 증가는 CFO 깎지 않음)', () => {
    const f = generateFinancials(DECISIONS, r, null);
    // NI에는 deferredTaxExpense가 이미 차감돼 있음. CFO에 다시 더해 비현금 환입.
    // 즉 CFO는 최소한 (NI + depExp)보다 작아지지 않음 (워킹캐피탈 변동 무시 시).
    // 본 테스트에서는 DTL이 양수(가속상각 때문) → deferredTaxExpense > 0 → CFO에 양수 가산
    expect(f.pnl.deferredTaxExpense).toBeGreaterThan(0);
    // CFO 식 자체 검증
    const expected = f.pnl.netIncome + f.pnl.depreciationExpense + f.pnl.deferredTaxExpense
      - f.bs.receivables - f.bs.inventory + f.bs.payables + f.bs.taxPayable;
    expect(f.cf.operatingCF).toBe(expected);
  });
});
