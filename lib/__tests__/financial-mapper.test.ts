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
  adBudget: { search: 300_000_000, display: 250_000_000, influencer: 250_000_000 },
  channels: { online: 60, mart: 30, direct: 10 },
  financing: { newDebt: 0, newEquity: 0 },
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

  it('operating profit = gross profit - expenses', () => {
    const expected =
      financials.pnl.grossProfit -
      financials.pnl.adExpense -
      financials.pnl.rdExpense -
      financials.pnl.otherExpense;
    expect(financials.pnl.operatingProfit).toBe(expected);
  });

  it('net income = operating profit - interest', () => {
    expect(financials.pnl.netIncome).toBe(
      financials.pnl.operatingProfit - financials.pnl.interestExpense
    );
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

  it('new equity increases both cash and equity on balance sheet', () => {
    const withEquity: Decisions = { ...DEFAULT_DECISIONS, financing: { newDebt: 0, newEquity: 2_000_000_000 } };
    const r = runSimulation(withEquity, INITIAL_COMPETITORS, marketSize, qualityCap);
    const base = generateFinancials(DEFAULT_DECISIONS, r, null);
    const raised = generateFinancials(withEquity, r, null);
    expect(raised.bs.cash - base.bs.cash).toBe(2_000_000_000);
    expect(raised.bs.equity - base.bs.equity).toBe(2_000_000_000);
  });

  it('previous debt produces non-zero interest expense', () => {
    const prevBS = { cash: 10_000_000_000, debt: 4_000_000_000, equity: 8_000_000_000, retainedEarnings: 0 };
    const r = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
    const withInterest = generateFinancials(DEFAULT_DECISIONS, r, prevBS);
    expect(withInterest.pnl.interestExpense).toBeGreaterThan(0);
  });
});
