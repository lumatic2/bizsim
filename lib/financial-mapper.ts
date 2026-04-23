import type { Decisions, SimulationResults, FinancialStatements, PnL, BalanceSheet, CashFlow, CarryForwardBS, RoundEvent } from './types';
import { CALM_EVENT } from './events';
import { quarterlyCorporateTax, rdTaxCreditFor, applyLossCarryforward } from './tax';

const INITIAL_CASH = 10_000_000_000;
const INITIAL_EQUITY = 8_000_000_000;
const INITIAL_DEBT = 2_000_000_000;
const INTEREST_RATE = 0.05;
export const INITIAL_PPE = 10_000_000_000;
const DEPRECIATION_RATE = 0.125;     // 회계상 정액법 (8분기 내용연수)
const TAX_DEPRECIATION_RATE = 0.25;  // 세법상 가속상각 (4분기 내용연수 가정, 투자 촉진 특례)
const EFFECTIVE_TAX_RATE = 0.19;     // 이연법인세 계산에 쓰는 유효세율 근사 (중간 구간)
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
  const prevRetained = previousBS?.retainedEarnings ?? 0;
  const distributable = Math.max(0, prevRetained + pnl.netIncome);
  const dividendPaid = Math.min(Math.max(0, decisions.dividendPayout), distributable);

  const bs = generateBS(decisions, results, pnl, previousBS, event, dividendPaid);
  const cf = generateCF(decisions, pnl, dividendPaid);
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

  // 세법상 감가상각(가속) — 세법 장부가 기준. 세법·회계 차이가 이연법인세의 원천.
  const prevTaxPpe = previousBS?.taxPpe ?? INITIAL_PPE;
  const taxDepreciation = Math.round(prevTaxPpe * TAX_DEPRECIATION_RATE);
  const depDiff = taxDepreciation - depreciationExpense; // 세법이 더 많이 감가 → 양수 → DTL 증가

  // 세법상 과세표준 = 회계상 pretax − (세법감가 − 회계감가)
  const taxBase = pretaxIncome - depDiff;
  const { taxableIncome } = applyLossCarryforward(taxBase, carryforwardLoss);
  const grossCashTax = quarterlyCorporateTax(taxableIncome);
  const rdTaxCredit = rdTaxCreditFor(rdExpense, grossCashTax);
  const currentTax = Math.max(0, grossCashTax - rdTaxCredit);

  // 이연법인세비용: 일시차이의 당기 변동분 × 유효세율 (음수이면 DTL 환입)
  const deferredTaxExpense = Math.round(depDiff * EFFECTIVE_TAX_RATE);

  const incomeTax = currentTax + deferredTaxExpense; // 회계상 총 법인세비용
  const netIncome = pretaxIncome - incomeTax;

  return {
    revenue, cogs, grossProfit, adExpense, rdExpense, depreciationExpense, otherExpense,
    operatingProfit, interestExpense, pretaxIncome,
    currentTax, deferredTaxExpense, rdTaxCredit, incomeTax, netIncome,
  };
}

function generateBS(decisions: Decisions, results: SimulationResults, pnl: PnL, previousBS: CarryForwardBS | null | undefined, event: RoundEvent, dividendPaid: number): BalanceSheet {
  const prevCash = previousBS?.cash ?? INITIAL_CASH;
  const prevDebt = previousBS?.debt ?? INITIAL_DEBT;
  const prevEquity = previousBS?.equity ?? INITIAL_EQUITY;
  const prevCapitalSurplus = previousBS?.capitalSurplus ?? 0;
  const prevRetained = previousBS?.retainedEarnings ?? 0;
  const prevTaxPayable = previousBS?.taxPayable ?? 0;
  const prevPpe = previousBS?.ppe ?? INITIAL_PPE;
  const prevTaxPpe = previousBS?.taxPpe ?? INITIAL_PPE;
  const prevDTL = previousBS?.deferredTaxLiability ?? 0;

  const { newDebt, newEquity } = decisions.financing;

  const costMult = event.effects.costMultiplier ?? 1;
  const inventory = decisions.products.reduce((sum, p) => {
    const pr = results.perProduct[p.id];
    const unsold = Math.max(0, pr.produced - pr.unitsSold);
    const unitCost = Math.round((120_000 + (p.quality - 1) * 25_000) * costMult);
    return sum + unsold * unitCost;
  }, 0);
  const receivables = Math.round(pnl.revenue * 0.15);

  // 유형자산: 기초 → 감가상각 차감 → CAPEX 가산 → 기말 (회계상)
  const ppe = prevPpe - pnl.depreciationExpense + decisions.capexInvestment;
  // 세법상 유형자산 (가속상각) — 내부 관리용 carry-forward
  const taxDepreciation = Math.round(prevTaxPpe * TAX_DEPRECIATION_RATE);
  const taxPpeNext = Math.max(0, prevTaxPpe - taxDepreciation) + decisions.capexInvestment;
  // 이연법인세부채: 전기 DTL + 당기 이연법인세비용 (음수면 환입), 음수가 되면 DTA 영역이지만 단순화 위해 0 이상 clamp
  const deferredTaxLiability = Math.max(0, prevDTL + pnl.deferredTaxExpense);

  // 배당은 generateFinancials에서 이미 배당가능이익 한도로 clamp된 값이 전달됨

  // 현금흐름 구성:
  //   + netIncome (발생기준)
  //   + 감가상각 (비현금비용 가산)
  //   − 매출채권 증가, − 재고 증가, − 전기말 미지급세금 납부 + 당기 세금 미지급 가산
  //   − CAPEX, + 조달, − 배당
  const cashFromOps = pnl.netIncome + pnl.depreciationExpense - receivables - inventory - prevTaxPayable + pnl.incomeTax;
  const cash = prevCash + cashFromOps - decisions.capexInvestment + newDebt + newEquity - dividendPaid;

  const totalAssets = cash + receivables + inventory + ppe;
  const payables = Math.round(pnl.cogs * 0.1);
  // 미지급법인세는 현금 기준(이연세 제외). 이연법인세는 별도 DTL 항목으로 계상.
  const taxPayable = pnl.currentTax;

  const debt = prevDebt + newDebt;
  // 증자 단순화: 전액 자본잉여금으로 계상. 액면자본금(equity)은 초기값 고정.
  const equity = prevEquity;
  const capitalSurplus = prevCapitalSurplus + newEquity;
  const retainedEarnings = prevRetained + pnl.netIncome - dividendPaid;
  const totalLiabilities = payables + taxPayable + deferredTaxLiability + debt + equity + capitalSurplus + retainedEarnings;

  return {
    cash, receivables, inventory, ppe, taxPpe: taxPpeNext, totalAssets,
    payables, taxPayable, deferredTaxLiability,
    debt, equity, capitalSurplus, retainedEarnings, totalLiabilities,
  };
}

function generateCF(decisions: Decisions, pnl: PnL, dividendPaid: number): CashFlow {
  const { newDebt, newEquity } = decisions.financing;
  // 간접법 간소화: 영업CF = 순이익 + 감가상각(비현금비용 가산).
  const operatingCF = pnl.netIncome + pnl.depreciationExpense;
  // 투자CF: R&D 지출(분기 환산) + 설비투자 모두 유출
  const investingCF = -Math.round(decisions.rdBudget / 4) - decisions.capexInvestment;
  const financingCF = newDebt + newEquity - pnl.interestExpense - dividendPaid;
  const netCashChange = operatingCF + investingCF + financingCF;

  return { operatingCF, investingCF, financingCF, netCashChange };
}
