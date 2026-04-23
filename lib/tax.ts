// 한국 법인세 누진세율 (연 기준) — 과세표준 구간별 한계세율
// 2025 기준:
//   2억 이하        9%
//   2억 ~ 200억    19% (2억 초과분)
//   200억 ~ 3000억 21%
//   3000억 초과    24%
//
// BizSim은 분기 단위이므로 "연환산(×4) → 연세액 계산 → 분기세액(÷4)" 방식으로 근사.
// 결과적으로 분기 과세표준에 대해 직접 같은 누진세율표를 적용한 것과 수학적으로 동일하지 않지만,
// 실무에서 분기 예납이 이런 식으로 연환산 기반이라 게임상 합리적 근사.

const BRACKETS: ReadonlyArray<{ limit: number; rate: number }> = [
  { limit: 200_000_000, rate: 0.09 },
  { limit: 20_000_000_000, rate: 0.19 },
  { limit: 300_000_000_000, rate: 0.21 },
  { limit: Infinity, rate: 0.24 },
];

function annualTax(annualBase: number): number {
  if (annualBase <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of BRACKETS) {
    if (annualBase <= limit) {
      tax += (annualBase - prev) * rate;
      return tax;
    }
    tax += (limit - prev) * rate;
    prev = limit;
  }
  return tax;
}

/** 분기 과세표준 → 분기 법인세 산출세액 (세액공제 전) */
export function quarterlyCorporateTax(quarterlyBase: number): number {
  if (quarterlyBase <= 0) return 0;
  return Math.round(annualTax(quarterlyBase * 4) / 4);
}

/**
 * R&D 세액공제 — 조세특례제한법 §10 (중소기업 일반 R&D 25% 가정).
 * 산출세액의 일정 한도까지만 공제 가능 (실제 법상 한도는 복잡 — 게임에서는 산출세액의 50% 한도로 단순화).
 */
export function rdTaxCreditFor(rdExpense: number, grossTax: number): number {
  const credit = rdExpense * 0.25;
  const cap = grossTax * 0.5;
  return Math.max(0, Math.round(Math.min(credit, cap)));
}

/**
 * 투자세액공제 — 조세특례제한법 §24 (통합투자세액공제 중소기업 일반 7% 가정).
 * CAPEX의 7%를 산출세액에서 공제. R&D 공제와 합산하여 산출세액의 70% 한도 (단순화).
 */
export const INVESTMENT_TAX_CREDIT_RATE = 0.07;

export function investmentTaxCreditFor(capexInvestment: number, grossTaxAfterRd: number): number {
  const credit = capexInvestment * INVESTMENT_TAX_CREDIT_RATE;
  const cap = grossTaxAfterRd * 0.7;
  return Math.max(0, Math.round(Math.min(credit, cap)));
}

/** 이월결손금 15년 한도 (게임 단순화: 1라운드 = 1분기 → 60분기). 만료된 loss는 제거. */
export const LOSS_CARRYFORWARD_QUARTERS = 60;

export type LossLot = { round: number; amount: number };

export function expireOldLosses(history: LossLot[], currentRound: number): LossLot[] {
  return history.filter((lot) => currentRound - lot.round <= LOSS_CARRYFORWARD_QUARTERS);
}

/** 이월결손금 공제 후 과세표준 계산. 당해 공제 사용분을 함께 반환. */
export function applyLossCarryforward(pretaxIncome: number, carryforwardLoss: number): { taxableIncome: number; usedLoss: number } {
  if (pretaxIncome <= 0) return { taxableIncome: 0, usedLoss: 0 };
  const used = Math.min(pretaxIncome, carryforwardLoss);
  return { taxableIncome: pretaxIncome - used, usedLoss: used };
}
