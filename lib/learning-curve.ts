// 학습곡선 / 경험곡선 (Wright's Law, 1936)
// 누적 생산량이 2배가 될 때마다 단위당 원가가 학습률만큼 체감한다는 경험법칙.
// 반도체·항공기·자동차 등 제조업에서 실증된 현상이며, BCG 매트릭스의 "Cash Cow" 논리의 핵심 원천.
//
// 공식: unitCost(N) = unitCost(ref) × (N / ref)^log2(learningRate)
//   learningRate 0.8 → 누적 2배 시 단위원가 80% (즉 20% 체감)
//   log2(0.8) ≈ -0.3219  (음수 exponent → 누적이 늘수록 multiplier 감소)
//
// 설계 선택:
// - 누적 생산량이 REFERENCE 이하일 때는 multiplier 1.0 (초기 경험치 구간, 체감 없음)
//   → 게임 초반 cum=0에서 원가 폭등 방지 + 첫 라운드는 기준값 그대로 사용
// - REFERENCE 기준 = 20,000대 (프리미엄+밸류 합 약 1라운드 분량)
//   → 2라운드부터 본격적인 학습효과 반영, 6라운드 누적 ~90k에서 multiplier ≈ 0.57 (43% 체감)
// - 제품 A/B 각각 독립 학습곡선 — Wright's Law 원형도 제품·공정별로 별도 적용.

export const LEARNING_RATE = 0.8;
export const LEARNING_REFERENCE = 20_000;
export const LEARNING_EXPONENT = Math.log2(LEARNING_RATE);

export function learningCurveMultiplier(cumulativeProduction: number): number {
  if (cumulativeProduction <= LEARNING_REFERENCE) return 1;
  const ratio = cumulativeProduction / LEARNING_REFERENCE;
  return Math.pow(ratio, LEARNING_EXPONENT);
}
