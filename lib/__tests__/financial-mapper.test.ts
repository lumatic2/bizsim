import { describe, it, expect } from 'vitest';
import { generateFinancials } from '../financial-mapper';
import { runSimulation } from '../game-engine';
import { INITIAL_COMPETITORS, getMarketSize } from '../competitor-ai';
import type { Decisions } from '../types';

const DEFAULT_DECISIONS: Decisions = {
  price: 349_000,
  rdBudget: 2_100_000_000,
  adBudget: 800_000_000,
  production: 15_000,
  channels: { online: 60, mart: 30, direct: 10 },
  quality: 4,
};

describe('generateFinancials', () => {
  const marketSize = getMarketSize(1);
  const qualityCap = 3;
  const results = runSimulation(DEFAULT_DECISIONS, INITIAL_COMPETITORS, marketSize, qualityCap);
  const financials = generateFinancials(DEFAULT_DECISIONS, results, null);

  it('revenue matches units sold times price', () => {
    expect(financials.pnl.revenue).toBe(results.unitsSold * DEFAULT_DECISIONS.price);
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

  it('inventory reflects unsold units', () => {
    const totalDemand = Object.values(results.segmentDemand).reduce((s, d) => s + d, 0);
    const unsold = Math.max(0, DEFAULT_DECISIONS.production - Math.min(totalDemand, DEFAULT_DECISIONS.production));
    const unitCost = 120_000 + (DEFAULT_DECISIONS.quality - 1) * 25_000;
    expect(financials.bs.inventory).toBe(unsold * unitCost);
  });

  it('ad expense matches decision', () => {
    expect(financials.pnl.adExpense).toBe(DEFAULT_DECISIONS.adBudget);
  });

  it('R&D expense is quarterly', () => {
    expect(financials.pnl.rdExpense).toBe(Math.round(DEFAULT_DECISIONS.rdBudget / 4));
  });
});
