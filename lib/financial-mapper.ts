import type { Decisions, SimulationResults, FinancialStatements, PnL, BalanceSheet, CashFlow, CarryForwardBS, RoundEvent } from './types';
import { CALM_EVENT } from './events';

const INITIAL_CASH = 10_000_000_000;
const INITIAL_EQUITY = 8_000_000_000;
const INITIAL_DEBT = 2_000_000_000;
const INTEREST_RATE = 0.05;

export function generateFinancials(
  decisions: Decisions,
  results: SimulationResults,
  previousBS?: CarryForwardBS | null,
  event: RoundEvent = CALM_EVENT,
): FinancialStatements {
  const pnl = generatePnL(decisions, results, event, previousBS);
  const bs = generateBS(decisions, results, pnl, previousBS, event);
  const cf = generateCF(decisions, pnl);
  return { pnl, bs, cf };
}

function generatePnL(decisions: Decisions, results: SimulationResults, event: RoundEvent, previousBS?: CarryForwardBS | null): PnL {
  const revenue = results.revenue;
  const costMult = event.effects.costMultiplier ?? 1;
  const cogs = decisions.products.reduce((sum, p) => {
    const pr = results.perProduct[p.id];
    const unitCost = Math.round((120_000 + (p.quality - 1) * 25_000) * costMult);
    return sum + pr.unitsSold * unitCost;
  }, 0);
  const grossProfit = revenue - cogs;

  const adExpense = decisions.adBudget.search + decisions.adBudget.display + decisions.adBudget.influencer;
  const rdExpense = Math.round(decisions.rdBudget / 4);
  const otherExpense = 100_000_000;
  const operatingProfit = grossProfit - adExpense - rdExpense - otherExpense;

  const prevDebt = previousBS?.debt ?? INITIAL_DEBT;
  const interestExpense = Math.round(prevDebt * INTEREST_RATE / 4);
  const netIncome = operatingProfit - interestExpense;

  return { revenue, cogs, grossProfit, adExpense, rdExpense, otherExpense, operatingProfit, interestExpense, netIncome };
}

function generateBS(decisions: Decisions, results: SimulationResults, pnl: PnL, previousBS: CarryForwardBS | null | undefined, event: RoundEvent): BalanceSheet {
  const prevCash = previousBS?.cash ?? INITIAL_CASH;
  const prevDebt = previousBS?.debt ?? INITIAL_DEBT;
  const prevEquity = previousBS?.equity ?? INITIAL_EQUITY;
  const prevRetained = previousBS?.retainedEarnings ?? 0;

  const { newDebt, newEquity } = decisions.financing;

  const costMult = event.effects.costMultiplier ?? 1;
  const inventory = decisions.products.reduce((sum, p) => {
    const pr = results.perProduct[p.id];
    const unsold = Math.max(0, p.production - pr.unitsSold);
    const unitCost = Math.round((120_000 + (p.quality - 1) * 25_000) * costMult);
    return sum + unsold * unitCost;
  }, 0);
  const receivables = Math.round(pnl.revenue * 0.15);

  const cashFromOps = pnl.netIncome - receivables + inventory * -1;
  const cash = prevCash + cashFromOps + newDebt + newEquity;

  const totalAssets = cash + receivables + inventory;
  const payables = Math.round(pnl.cogs * 0.1);
  const debt = prevDebt + newDebt;
  const equity = prevEquity + newEquity;
  const retainedEarnings = prevRetained + pnl.netIncome;
  const totalLiabilities = payables + debt + equity + retainedEarnings;

  return { cash, receivables, inventory, totalAssets, payables, debt, equity, retainedEarnings, totalLiabilities };
}

function generateCF(decisions: Decisions, pnl: PnL): CashFlow {
  const { newDebt, newEquity } = decisions.financing;
  const operatingCF = pnl.netIncome;
  const investingCF = -Math.round(decisions.rdBudget / 4);
  const financingCF = newDebt + newEquity - pnl.interestExpense;
  const netCashChange = operatingCF + investingCF + financingCF;

  return { operatingCF, investingCF, financingCF, netCashChange };
}
