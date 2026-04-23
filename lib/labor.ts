// 인사·조직경제학 — 인력 규모 레버와 otherExpense 분해
// "인건비는 고정비인가?" — 단기적으론 고정이지만 headcount 조정으로 중기 변동 가능.
// 경영 시뮬에서 인력 결정은 "채널 운영 역량·R&D 실효 생산성"에 영향을 주는 전략적 선택.
//
// 1인당 분기 인건비 = 25,000,000원 (연봉 약 8,000만 + 세금·복리·공간 등 1.25배 가산)
// 기본 편성 sales=4, rd=4 → 8명 × 25M = 200M/분기
//
// 효과:
//   - 영업팀(sales): 직영 채널 효과 배수 = 0.8 + sales × 0.05 (4명=1.0 baseline, 20명=1.8)
//   - R&D팀(rd): cumulativeImproveRd 실효 배수 = 0.8 + rd × 0.05 (같은 구조)
//   - 둘 다 diminishing returns 없이 선형 — 게임 단순화 (실무는 S-curve)
//
// 설비유지비 (maintenanceCost): PPE × 0.5% per 분기 (연 2%) — 감가상각과 별개의 실물 유지 opex.
// 일반관리비 baseline 50M (임대·세금·감사 등 고정) — 기존 100M에서 분리.

export const LABOR_COST_PER_HEAD = 25_000_000;
export const MAINTENANCE_RATE = 0.005;
export const G_AND_A_BASELINE = 50_000_000;
export const DEFAULT_HEADCOUNT = { sales: 4, rd: 4 } as const;
export const DEFAULT_SALARY_MULTIPLIER = 1.0;

export function directChannelMultiplier(salesHeadcount: number): number {
  return 0.8 + salesHeadcount * 0.05;
}

export function rdEffectivenessMultiplier(rdHeadcount: number): number {
  return 0.8 + rdHeadcount * 0.05;
}

export function laborCostOf(headcount: { sales: number; rd: number }, salaryMultiplier: number = 1): number {
  return (headcount.sales + headcount.rd) * LABOR_COST_PER_HEAD * salaryMultiplier;
}

// 이직률 (자연 감소율). salaryMultiplier < 1 일 때 증가.
// multiplier 1.0 → 0%, 0.8 → 4%, 0.6 → 8%, 0.7 → 6%. 상한 20% (심각한 저임금).
export function attritionRate(salaryMultiplier: number): number {
  if (salaryMultiplier >= 1.0) return 0;
  return Math.min(0.2, (1.0 - salaryMultiplier) * 0.2);
}

// 이탈 적용 후 headcount (각 부서 최소 1명 floor).
export function applyAttrition(headcount: { sales: number; rd: number }, salaryMultiplier: number): {
  headcount: { sales: number; rd: number };
  attrition: { sales: number; rd: number };
} {
  const rate = attritionRate(salaryMultiplier);
  const newSales = Math.max(1, Math.floor(headcount.sales * (1 - rate)));
  const newRd = Math.max(1, Math.floor(headcount.rd * (1 - rate)));
  return {
    headcount: { sales: newSales, rd: newRd },
    attrition: { sales: headcount.sales - newSales, rd: headcount.rd - newRd },
  };
}
