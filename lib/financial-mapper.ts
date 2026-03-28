import type { Decisions, SimulationResults, FinancialStatements, PnL, BalanceSheet, CashFlow } from './types';

const INITIAL_CASH = 10_000_000_000;
const INITIAL_EQUITY = 8_000_000_000;
const INITIAL_DEBT = 2_000_000_000;
const INTEREST_RATE = 0.05;

export function generateFinancials(decisions: Decisions, results: SimulationResults): FinancialStatements {
  const pnl = generatePnL(decisions, results);
  const bs = generateBS(decisions, results, pnl);
  const cf = generateCF(decisions, pnl);
  return { pnl, bs, cf };
}

function generatePnL(decisions: Decisions, results: SimulationResults): PnL {
  const revenue = results.revenue;
  const unitCost = 120_000 + (decisions.quality - 1) * 25_000;
  const cogs = results.unitsSold * unitCost;
  const grossProfit = revenue - cogs;

  const adExpense = decisions.adBudget;
  const rdExpense = Math.round(decisions.rdBudget / 4);
  const otherExpense = 100_000_000;
  const operatingProfit = grossProfit - adExpense - rdExpense - otherExpense;

  const interestExpense = Math.round(INITIAL_DEBT * INTEREST_RATE / 4);
  const netIncome = operatingProfit - interestExpense;

  return { revenue, cogs, grossProfit, adExpense, rdExpense, otherExpense, operatingProfit, interestExpense, netIncome };
}

function generateBS(decisions: Decisions, results: SimulationResults, pnl: PnL): BalanceSheet {
  const unsold = Math.max(0, decisions.production - results.unitsSold);
  const unitCost = 120_000 + (decisions.quality - 1) * 25_000;
  const inventory = unsold * unitCost;
  const receivables = Math.round(pnl.revenue * 0.15);

  const cashFromOps = pnl.netIncome - receivables + inventory * -1;
  const cash = INITIAL_CASH + cashFromOps;

  const totalAssets = cash + receivables + inventory;
  const payables = Math.round(pnl.cogs * 0.1);
  const debt = INITIAL_DEBT;
  const equity = INITIAL_EQUITY;
  const retainedEarnings = pnl.netIncome;
  const totalLiabilities = payables + debt + equity + retainedEarnings;

  return { cash, receivables, inventory, totalAssets, payables, debt, equity, retainedEarnings, totalLiabilities };
}

function generateCF(decisions: Decisions, pnl: PnL): CashFlow {
  const operatingCF = pnl.netIncome;
  const investingCF = -Math.round(decisions.rdBudget / 4);
  const financingCF = -Math.round(INITIAL_DEBT * INTEREST_RATE / 4);
  const netCashChange = operatingCF + investingCF + financingCF;

  return { operatingCF, investingCF, financingCF, netCashChange };
}
