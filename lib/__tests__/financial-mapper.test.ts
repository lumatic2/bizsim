import { describe, it, expect } from 'vitest';
import { generateFinancials } from '../financial-mapper';
import { runSimulation } from '../game-engine';
import { INITIAL_COMPETITORS, getMarketSize } from '../competitor-ai';
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

const TOTAL_AD = DEFAULT_DECISIONS.adBudget.search + DEFAULT_DECISIONS.adBudget.display + DEFAULT_DECISIONS.adBudget.influencer;

describe('generateFinancials', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;
  const results = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
  const financials = generateFinancials(DEFAULT_DECISIONS, results, null);

  it('revenue matches the sum of per-product revenue', () => {
    const expected = results.perProduct.A.revenue + results.perProduct.B.revenue;
    expect(financials.pnl.revenue).toBe(expected);
  });

  it('gross profit = revenue - cogs', () => {
    expect(financials.pnl.grossProfit).toBe(financials.pnl.revenue - financials.pnl.cogs);
  });

  it('operating profit = gross profit - operating expenses', () => {
    const expected =
      financials.pnl.grossProfit -
      financials.pnl.adExpense -
      financials.pnl.rdExpense -
      financials.pnl.depreciationExpense -
      financials.pnl.otherExpense;
    expect(financials.pnl.operatingProfit).toBe(expected);
  });

  it('pretax income = operating profit - interest', () => {
    expect(financials.pnl.pretaxIncome).toBe(
      financials.pnl.operatingProfit - financials.pnl.interestExpense
    );
  });

  it('net income = pretax income - income tax', () => {
    expect(financials.pnl.netIncome).toBe(financials.pnl.pretaxIncome - financials.pnl.incomeTax);
  });

  it('loss yields no cash tax (but deferred tax may still apply from depreciation diff)', () => {
    const lossDecisions: Decisions = {
      ...DEFAULT_DECISIONS,
      adBudget: { search: 5_000_000_000, display: 5_000_000_000, influencer: 5_000_000_000 },
    };
    const r = runSimulation(lossDecisions, INITIAL_COMPETITORS, marketSize, qualityCap);
    const f = generateFinancials(lossDecisions, r, null);
    expect(f.pnl.pretaxIncome).toBeLessThan(0);
    expect(f.pnl.currentTax).toBe(0);
  });

  it('R&D tax credit reduces income tax', () => {
    const highRd: Decisions = { ...DEFAULT_DECISIONS, rdBudget: 4_000_000_000 };
    const lowRd: Decisions = { ...DEFAULT_DECISIONS, rdBudget: 100_000_000 };
    const rHigh = runSimulation(highRd, INITIAL_COMPETITORS, marketSize, qualityCap);
    const rLow = runSimulation(lowRd, INITIAL_COMPETITORS, marketSize, qualityCap);
    const fHigh = generateFinancials(highRd, rHigh, null);
    const fLow = generateFinancials(lowRd, rLow, null);
    // 흑자일 때만 의미있는 비교
    if (fHigh.pnl.pretaxIncome > 0 && fLow.pnl.pretaxIncome > 0) {
      expect(fHigh.pnl.rdTaxCredit).toBeGreaterThan(fLow.pnl.rdTaxCredit);
    }
  });

  it('tax payable on BS equals current period cash tax (not total income tax)', () => {
    expect(financials.bs.taxPayable).toBe(financials.pnl.currentTax);
  });

  it('incomeTax = currentTax + deferredTaxExpense', () => {
    expect(financials.pnl.incomeTax).toBe(financials.pnl.currentTax + financials.pnl.deferredTaxExpense);
  });

  it('first quarter with gains produces positive deferred tax liability (accelerated tax dep > acct dep)', () => {
    // 초기 ppe 10B, 회계 12.5% = 1.25B, 세법 25% = 2.5B → depDiff 1.25B 양수 → DTL 증가
    const r = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    const f = generateFinancials(DEFAULT_DECISIONS, r, null);
    expect(f.pnl.deferredTaxExpense).toBeGreaterThan(0);
    expect(f.bs.deferredTaxLiability).toBeGreaterThan(0);
  });

  it('dividend payout reduces cash and retained earnings by same amount', () => {
    const highDividend: Decisions = { ...DEFAULT_DECISIONS, dividendPayout: 500_000_000 };
    const r = runSimulation(highDividend, INITIAL_COMPETITORS, marketSize, qualityCap);
    const base = generateFinancials(DEFAULT_DECISIONS, r, null);
    const paid = generateFinancials(highDividend, r, null);
    // 배당은 배당가능이익 한도 내에서만 — 흑자 분기라 500M은 가능
    if (paid.pnl.netIncome > 500_000_000) {
      expect(base.bs.cash - paid.bs.cash).toBe(500_000_000);
      expect(base.bs.retainedEarnings - paid.bs.retainedEarnings).toBe(500_000_000);
    }
  });

  it('dividend is capped at distributable retained earnings (no deficit distribution)', () => {
    // 과도한 배당 요청: 실제 지급액은 distributable(prev retained + netIncome) 한도로 clamp
    const greedy: Decisions = { ...DEFAULT_DECISIONS, dividendPayout: 50_000_000_000 }; // 500억 시도
    const r = runSimulation(greedy, INITIAL_COMPETITORS, marketSize, qualityCap);
    const noDividend: Decisions = { ...DEFAULT_DECISIONS, dividendPayout: 0 };
    const fNone = generateFinancials(noDividend, r, null);
    const fGreedy = generateFinancials(greedy, r, null);
    const cashDelta = fNone.bs.cash - fGreedy.bs.cash;
    const distributable = Math.max(0, fNone.bs.retainedEarnings);
    expect(cashDelta).toBeLessThanOrEqual(distributable);
  });

  it('inventory reflects unsold units across products', () => {
    const expected = DEFAULT_DECISIONS.products.reduce((sum, p) => {
      const pr = results.perProduct[p.id];
      const unsold = Math.max(0, p.production - pr.unitsSold);
      const unitCost = 120_000 + (p.quality - 1) * 25_000;
      return sum + unsold * unitCost;
    }, 0);
    expect(financials.bs.inventory).toBe(expected);
  });

  it('ad expense matches total ad spend', () => {
    expect(financials.pnl.adExpense).toBe(TOTAL_AD);
  });

  it('R&D expense is quarterly', () => {
    expect(financials.pnl.rdExpense).toBe(Math.round(DEFAULT_DECISIONS.rdBudget / 4));
  });

  it('new debt increases both cash and debt on balance sheet', () => {
    const withDebt: Decisions = { ...DEFAULT_DECISIONS, financing: { newDebt: 1_000_000_000, newEquity: 0 } };
    const r = runSimulation(withDebt, INITIAL_COMPETITORS, marketSize, qualityCap);
    const base = generateFinancials(DEFAULT_DECISIONS, r, null);
    const levered = generateFinancials(withDebt, r, null);
    expect(levered.bs.cash - base.bs.cash).toBe(1_000_000_000);
    expect(levered.bs.debt - base.bs.debt).toBe(1_000_000_000);
  });

  it('new equity increases cash and capital surplus (equity issuance priced above par)', () => {
    const withEquity: Decisions = { ...DEFAULT_DECISIONS, financing: { newDebt: 0, newEquity: 2_000_000_000 } };
    const r = runSimulation(withEquity, INITIAL_COMPETITORS, marketSize, qualityCap);
    const base = generateFinancials(DEFAULT_DECISIONS, r, null);
    const raised = generateFinancials(withEquity, r, null);
    expect(raised.bs.cash - base.bs.cash).toBe(2_000_000_000);
    expect(raised.bs.capitalSurplus - base.bs.capitalSurplus).toBe(2_000_000_000);
  });

  it('previous debt produces non-zero interest expense', () => {
    const prevBS = {
      cash: 10_000_000_000, debt: 4_000_000_000, equity: 8_000_000_000,
      capitalSurplus: 0, retainedEarnings: 0, taxPayable: 0,
      ppe: 10_000_000_000, taxPpe: 10_000_000_000, deferredTaxLiability: 0,
    };
    const r = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    const withInterest = generateFinancials(DEFAULT_DECISIONS, r, prevBS);
    expect(withInterest.pnl.interestExpense).toBeGreaterThan(0);
  });

  it('depreciation expense is non-zero with initial PPE', () => {
    const r = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    const f = generateFinancials(DEFAULT_DECISIONS, r, null);
    expect(f.pnl.depreciationExpense).toBeGreaterThan(0);
  });

  it('capex investment increases PPE and reduces cash', () => {
    const withCapex: Decisions = { ...DEFAULT_DECISIONS, capexInvestment: 2_000_000_000 };
    const r = runSimulation(withCapex, INITIAL_COMPETITORS, marketSize, qualityCap);
    const base = generateFinancials(DEFAULT_DECISIONS, r, null);
    const invested = generateFinancials(withCapex, r, null);
    expect(invested.bs.ppe - base.bs.ppe).toBe(2_000_000_000);
    expect(base.bs.cash - invested.bs.cash).toBe(2_000_000_000);
  });

  it('loss carryforward reduces taxable income next quarter', () => {
    const r = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    const noCarry = generateFinancials(DEFAULT_DECISIONS, r, null, undefined, 0);
    const withCarry = generateFinancials(DEFAULT_DECISIONS, r, null, undefined, 500_000_000);
    // 이월결손금이 있으면 과세표준 줄어들어 법인세가 작아야 함 (흑자 가정)
    if (noCarry.pnl.pretaxIncome > 500_000_000) {
      expect(withCarry.pnl.incomeTax).toBeLessThan(noCarry.pnl.incomeTax);
    }
  });
});
