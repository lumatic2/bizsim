import type { Decisions, SimulationResults, FinancialStatements, PnL, BalanceSheet, CashFlow, CarryForwardBS, RoundEvent, ProductId } from './types';
import { CALM_EVENT } from './events';
import { quarterlyCorporateTax, rdTaxCreditFor, investmentTaxCreditFor, applyLossCarryforward } from './tax';
import { learningCurveMultiplier } from './learning-curve';
import { SERVICE_COST_PER_UNIT } from './service-queue';
import { laborCostOf, G_AND_A_BASELINE, MAINTENANCE_RATE } from './labor';
import { inventoryHoldingCostOf } from './eoq';
import { orgLearningMultiplier } from './org-learning';

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
  cumulativeProduction: Record<ProductId, number> = { A: 0, B: 0 },
  supplyIndex: number = 1,
  roundsCompleted: number = 0,
): FinancialStatements {
  const pnl = generatePnL(decisions, results, event, previousBS, carryforwardLoss, cumulativeProduction, supplyIndex, roundsCompleted);
  const prevRetained = previousBS?.retainedEarnings ?? 0;
  const distributable = Math.max(0, prevRetained + pnl.netIncome);
  const dividendPaid = Math.min(Math.max(0, decisions.dividendPayout), distributable);

  const bs = generateBS(decisions, results, pnl, previousBS, event, dividendPaid, cumulativeProduction, supplyIndex, roundsCompleted);
  const cf = generateCF(decisions, pnl, previousBS, bs, dividendPaid);
  return { pnl, bs, cf };
}

function generatePnL(decisions: Decisions, results: SimulationResults, event: RoundEvent, previousBS: CarryForwardBS | null | undefined, carryforwardLoss: number, cumulativeProduction: Record<ProductId, number>, supplyIndex: number, roundsCompleted: number): PnL {
  const revenue = results.revenue;
  const costMult = event.effects.costMultiplier ?? 1;
  const orgLearning = orgLearningMultiplier(roundsCompleted);
  const cogs = decisions.products.reduce((sum, p) => {
    const pr = results.perProduct[p.id];
    const learningMult = learningCurveMultiplier(cumulativeProduction[p.id] ?? 0);
    const unitCost = Math.round((120_000 + (p.quality - 1) * 25_000) * costMult * learningMult * supplyIndex / orgLearning);
    return sum + pr.unitsSold * unitCost;
  }, 0);
  const grossProfit = revenue - cogs;

  const adExpense = decisions.adBudget.search + decisions.adBudget.display + decisions.adBudget.influencer;
  const rdExpense = Math.round(decisions.rdBudget / 4);
  const prevPpe = previousBS?.ppe ?? INITIAL_PPE;
  const depreciationExpense = Math.round(prevPpe * DEPRECIATION_RATE);
  // otherExpense 분해: G&A baseline + 인건비 + 설비유지비 + 서비스 opex + 재고유지비
  const laborCost = laborCostOf(decisions.headcount, decisions.salaryMultiplier);
  const maintenanceCost = Math.round(prevPpe * MAINTENANCE_RATE);
  const serviceCost = decisions.serviceCapacity * SERVICE_COST_PER_UNIT;
  // 기말 재고 평가: (produced - sold) × unit cost (학습곡선·공급지수·조직학습 적용)
  const endInventoryValue = decisions.products.reduce((sum, p) => {
    const pr = results.perProduct[p.id];
    const unsold = Math.max(0, pr.produced - pr.unitsSold);
    const learningMult = learningCurveMultiplier(cumulativeProduction[p.id] ?? 0);
    const unitCost = Math.round((120_000 + (p.quality - 1) * 25_000) * (event.effects.costMultiplier ?? 1) * learningMult * supplyIndex / orgLearning);
    return sum + unsold * unitCost;
  }, 0);
  const inventoryHoldingCost = inventoryHoldingCostOf(endInventoryValue);
  const otherExpense = G_AND_A_BASELINE + laborCost + maintenanceCost + serviceCost + inventoryHoldingCost;
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
  const afterRd = Math.max(0, grossCashTax - rdTaxCredit);
  const investmentTaxCredit = investmentTaxCreditFor(decisions.capexInvestment, afterRd);
  const currentTax = Math.max(0, afterRd - investmentTaxCredit);

  // 이연법인세비용: 일시차이의 당기 변동분 × 유효세율 (음수이면 DTL 환입)
  const deferredTaxExpense = Math.round(depDiff * EFFECTIVE_TAX_RATE);

  const incomeTax = currentTax + deferredTaxExpense; // 회계상 총 법인세비용
  const netIncome = pretaxIncome - incomeTax;

  return {
    revenue, cogs, grossProfit, adExpense, rdExpense, depreciationExpense,
    laborCost, maintenanceCost, serviceCost, inventoryHoldingCost, otherExpense,
    operatingProfit, interestExpense, pretaxIncome,
    currentTax, deferredTaxExpense, rdTaxCredit, investmentTaxCredit, incomeTax, netIncome,
  };
}

function generateBS(decisions: Decisions, results: SimulationResults, pnl: PnL, previousBS: CarryForwardBS | null | undefined, event: RoundEvent, dividendPaid: number, cumulativeProduction: Record<ProductId, number>, supplyIndex: number, roundsCompleted: number): BalanceSheet {
  const prevCash = previousBS?.cash ?? INITIAL_CASH;
  const prevDebt = previousBS?.debt ?? INITIAL_DEBT;
  const prevEquity = previousBS?.equity ?? INITIAL_EQUITY;
  const prevCapitalSurplus = previousBS?.capitalSurplus ?? 0;
  const prevRetained = previousBS?.retainedEarnings ?? 0;
  const prevTaxPayable = previousBS?.taxPayable ?? 0;
  const prevPpe = previousBS?.ppe ?? INITIAL_PPE;
  const prevTaxPpe = previousBS?.taxPpe ?? INITIAL_PPE;
  const prevDTL = previousBS?.deferredTaxLiability ?? 0;
  const prevDTA = previousBS?.deferredTaxAsset ?? 0;

  const { newDebt, newEquity } = decisions.financing;

  const costMult = event.effects.costMultiplier ?? 1;
  const orgLearning = orgLearningMultiplier(roundsCompleted);
  const inventory = decisions.products.reduce((sum, p) => {
    const pr = results.perProduct[p.id];
    const unsold = Math.max(0, pr.produced - pr.unitsSold);
    const learningMult = learningCurveMultiplier(cumulativeProduction[p.id] ?? 0);
    const unitCost = Math.round((120_000 + (p.quality - 1) * 25_000) * costMult * learningMult * supplyIndex / orgLearning);
    return sum + unsold * unitCost;
  }, 0);
  const receivables = Math.round(pnl.revenue * 0.15);

  // 유형자산: 기초 → 감가상각 차감 → CAPEX 가산 → 기말 (회계상)
  const ppe = prevPpe - pnl.depreciationExpense + decisions.capexInvestment;
  // 세법상 유형자산 (가속상각) — 내부 관리용 carry-forward
  const taxDepreciation = Math.round(prevTaxPpe * TAX_DEPRECIATION_RATE);
  const taxPpeNext = Math.max(0, prevTaxPpe - taxDepreciation) + decisions.capexInvestment;
  // 이연법인세부채/자산 분리: 누적 차이 순효과 = (prevDTL - prevDTA) + 당기 이연법인세비용.
  // 양수면 DTL, 음수면 DTA로 재분류.
  const netTempDiffEffect = prevDTL - prevDTA + pnl.deferredTaxExpense;
  const deferredTaxLiability = Math.max(0, netTempDiffEffect);
  const deferredTaxAsset = Math.max(0, -netTempDiffEffect);

  // 배당은 generateFinancials에서 이미 배당가능이익 한도로 clamp된 값이 전달됨

  const payables = Math.round(pnl.cogs * 0.1);
  const taxPayable = pnl.currentTax;  // 미지급법인세는 현금 기준 (이연법인세는 DTL/DTA 별도)

  // 간접법 CF — 워킹캐피탈 변동 정식 반영:
  //   CFO = NI + Dep + 이연법인세비용(비현금) − ΔAR − ΔInv + ΔAP + ΔTaxPayable
  const prevAR = previousBS?.receivables ?? 0;
  const prevInv = previousBS?.inventory ?? 0;
  const prevAP = previousBS?.payables ?? 0;
  const operatingCF = pnl.netIncome + pnl.depreciationExpense + pnl.deferredTaxExpense
    - (receivables - prevAR)
    - (inventory - prevInv)
    + (payables - prevAP)
    + (taxPayable - prevTaxPayable);
  const investingCF = -decisions.capexInvestment;  // R&D는 NI에 이미 비용 반영 → CFI 중복 제거
  const financingCF = newDebt + newEquity - dividendPaid;  // 이자는 NI에 이미 반영 (한국·IFRS는 CFO/CFF 선택 가능)
  const netCashChange = operatingCF + investingCF + financingCF;
  const cash = prevCash + netCashChange;

  const totalAssets = cash + receivables + inventory + ppe + deferredTaxAsset;

  const debt = prevDebt + newDebt;
  // 증자 단순화: 전액 자본잉여금으로 계상. 액면자본금(equity)은 초기값 고정.
  const equity = prevEquity;
  const capitalSurplus = prevCapitalSurplus + newEquity;
  const retainedEarnings = prevRetained + pnl.netIncome - dividendPaid;
  const totalLiabilities = payables + taxPayable + deferredTaxLiability + debt + equity + capitalSurplus + retainedEarnings;

  return {
    cash, receivables, inventory, ppe, taxPpe: taxPpeNext, totalAssets,
    payables, taxPayable, deferredTaxLiability, deferredTaxAsset,
    debt, equity, capitalSurplus, retainedEarnings, totalLiabilities,
  };
}

function generateCF(
  decisions: Decisions,
  pnl: PnL,
  previousBS: CarryForwardBS | null | undefined,
  bs: BalanceSheet,
  dividendPaid: number,
): CashFlow {
  const { newDebt, newEquity } = decisions.financing;
  const prevAR = previousBS?.receivables ?? 0;
  const prevInv = previousBS?.inventory ?? 0;
  const prevAP = previousBS?.payables ?? 0;
  const prevTaxPayable = previousBS?.taxPayable ?? 0;

  // 간접법 CFO: NI + 비현금비용 가산 + 워킹캐피탈 변동 조정
  //   ΔAR↑ → 판매는 기록됐으나 현금 미수 → 차감
  //   ΔInv↑ → 재고 쌓임 → 현금 유출 → 차감
  //   ΔAP↑ → 공급사 대금 미지급 → 현금 보유 → 가산
  //   ΔTaxPayable↑ → 세금 이연 납부 → 현금 보유 → 가산
  //   deferredTaxExpense: NI에 차감된 비현금 이연법인세비용 환입
  const operatingCF = pnl.netIncome
    + pnl.depreciationExpense
    + pnl.deferredTaxExpense
    - (bs.receivables - prevAR)
    - (bs.inventory - prevInv)
    + (bs.payables - prevAP)
    + (bs.taxPayable - prevTaxPayable);

  // 투자CF: CAPEX만. R&D는 발생기준 비용으로 NI에 이미 반영 (operating expense).
  const investingCF = -decisions.capexInvestment;

  // 재무CF: 조달 — 배당. 이자는 NI에 비용 처리 (K-IFRS·IFRS 1001 CFO/CFF 선택 중 CFO로).
  const financingCF = newDebt + newEquity - dividendPaid;

  const netCashChange = operatingCF + investingCF + financingCF;

  return { operatingCF, investingCF, financingCF, netCashChange };
}
