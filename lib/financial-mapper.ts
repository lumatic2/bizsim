import type { Decisions, SimulationResults, FinancialStatements, PnL, BalanceSheet, CashFlow, CarryForwardBS, RoundEvent } from './types';
import { CALM_EVENT } from './events';
import { quarterlyCorporateTax, rdTaxCreditFor, applyLossCarryforward } from './tax';

const INITIAL_CASH = 10_000_000_000;
const INITIAL_EQUITY = 8_000_000_000;
const INITIAL_DEBT = 2_000_000_000;
const INTEREST_RATE = 0.05;
export const INITIAL_PPE = 10_000_000_000;
const DEPRECIATION_RATE = 0.125; // 분기당 (정액법 8분기 내용연수)
export const PPE_PER_UNIT = 500_000; // 유형자산 장부가 500,000원당 분기 생산 capacity 1대

/** 기초 유형자산(감가상각 전) 장부가 → 이번 분기 생산 capacity */
export function productionCapacityFrom(ppe: number): number {
  return Math.floor(ppe / PPE_PER_UNIT);
}

export function generateFinancials(
  decisions: Decisions,
  results: SimulationResults,
  previousBS?: CarryForwardBS | null,
  event: RoundEvent = CALM_EVENT,
  carryforwardLoss: number = 0,
): FinancialStatements {
  const pnl = generatePnL(decisions, results, event, previousBS, carryforwardLoss);
  const bs = generateBS(decisions, results, pnl, previousBS, event);
  const cf = generateCF(decisions, pnl);
  return { pnl, bs, cf };
}

function generatePnL(decisions: Decisions, results: SimulationResults, event: RoundEvent, previousBS: CarryForwardBS | null | undefined, carryforwardLoss: number): PnL {
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
  const prevPpe = previousBS?.ppe ?? INITIAL_PPE;
  const depreciationExpense = Math.round(prevPpe * DEPRECIATION_RATE);
  const otherExpense = 100_000_000;
  const operatingProfit = grossProfit - adExpense - rdExpense - depreciationExpense - otherExpense;

  const prevDebt = previousBS?.debt ?? INITIAL_DEBT;
  const interestExpense = Math.round(prevDebt * INTEREST_RATE / 4);
  const pretaxIncome = operatingProfit - interestExpense;

  // 이월결손금 공제 후 과세표준 → 법인세 → R&D 세액공제
  const { taxableIncome } = applyLossCarryforward(pretaxIncome, carryforwardLoss);
  const grossTax = quarterlyCorporateTax(taxableIncome);
  const rdTaxCredit = rdTaxCreditFor(rdExpense, grossTax);
  const incomeTax = Math.max(0, grossTax - rdTaxCredit);
  const netIncome = pretaxIncome - incomeTax;

  return { revenue, cogs, grossProfit, adExpense, rdExpense, depreciationExpense, otherExpense, operatingProfit, interestExpense, pretaxIncome, incomeTax, rdTaxCredit, netIncome };
}

function generateBS(decisions: Decisions, results: SimulationResults, pnl: PnL, previousBS: CarryForwardBS | null | undefined, event: RoundEvent): BalanceSheet {
  const prevCash = previousBS?.cash ?? INITIAL_CASH;
  const prevDebt = previousBS?.debt ?? INITIAL_DEBT;
  const prevEquity = previousBS?.equity ?? INITIAL_EQUITY;
  const prevCapitalSurplus = previousBS?.capitalSurplus ?? 0;
  const prevRetained = previousBS?.retainedEarnings ?? 0;
  const prevTaxPayable = previousBS?.taxPayable ?? 0;
  const prevPpe = previousBS?.ppe ?? INITIAL_PPE;

  const { newDebt, newEquity } = decisions.financing;

  const costMult = event.effects.costMultiplier ?? 1;
  const inventory = decisions.products.reduce((sum, p) => {
    const pr = results.perProduct[p.id];
    const unsold = Math.max(0, pr.produced - pr.unitsSold);
    const unitCost = Math.round((120_000 + (p.quality - 1) * 25_000) * costMult);
    return sum + unsold * unitCost;
  }, 0);
  const receivables = Math.round(pnl.revenue * 0.15);

  // 유형자산: 기초 → 감가상각 차감 → CAPEX 가산 → 기말
  const ppe = prevPpe - pnl.depreciationExpense + decisions.capexInvestment;

  // 현금흐름 구성:
  //   + netIncome (발생기준)
  //   + 감가상각 (비현금비용 가산)
  //   − 매출채권 증가, − 재고 증가, − 전기말 미지급세금 납부 + 당기 세금 미지급 가산
  //   − CAPEX, + 조달
  const cashFromOps = pnl.netIncome + pnl.depreciationExpense - receivables - inventory - prevTaxPayable + pnl.incomeTax;
  const cash = prevCash + cashFromOps - decisions.capexInvestment + newDebt + newEquity;

  const totalAssets = cash + receivables + inventory + ppe;
  const payables = Math.round(pnl.cogs * 0.1);
  const taxPayable = pnl.incomeTax;

  const debt = prevDebt + newDebt;
  // 증자 단순화: 전액 자본잉여금으로 계상. 액면자본금(equity)은 초기값 고정.
  const equity = prevEquity;
  const capitalSurplus = prevCapitalSurplus + newEquity;
  const retainedEarnings = prevRetained + pnl.netIncome;
  const totalLiabilities = payables + taxPayable + debt + equity + capitalSurplus + retainedEarnings;

  return { cash, receivables, inventory, ppe, totalAssets, payables, taxPayable, debt, equity, capitalSurplus, retainedEarnings, totalLiabilities };
}

function generateCF(decisions: Decisions, pnl: PnL): CashFlow {
  const { newDebt, newEquity } = decisions.financing;
  // 간접법 간소화: 영업CF = 순이익 + 감가상각(비현금비용 가산).
  const operatingCF = pnl.netIncome + pnl.depreciationExpense;
  // 투자CF: R&D 지출(분기 환산) + 설비투자 모두 유출
  const investingCF = -Math.round(decisions.rdBudget / 4) - decisions.capexInvestment;
  const financingCF = newDebt + newEquity - pnl.interestExpense;
  const netCashChange = operatingCF + investingCF + financingCF;

  return { operatingCF, investingCF, financingCF, netCashChange };
}
