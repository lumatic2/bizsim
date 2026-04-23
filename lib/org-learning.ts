// 조직 학습 (Organizational Learning) — Argyris·Senge 이론
// Wright's Law의 제품별 학습곡선과 별개로, 조직 전체의 운영 노하우가 라운드 누적으로 발전.
// 공정 최적화, 공급사 관계, 마케팅 경험, 의사결정 품질 모두 포함한 통합 효율성 지수.
//
// 공식 (단순화): multiplier = 1 + min(MAX_ROUNDS, roundsCompleted) × PER_ROUND_GAIN
//   라운드당 +1%, 최대 30라운드까지 → 상한 +30%
//   6분기 게임 완주 시 마지막에 +5% 수준 — 유의미하지만 과하지 않음.
//
// 적용: 원가 체감 (unitCost ÷ orgLearningMultiplier).
// 학습곡선(제품별)·SPI(외생)와 곱셈으로 쌓이므로 multiplicative 누적 이득.

export const ORG_LEARNING_MAX_ROUNDS = 30;
export const ORG_LEARNING_PER_ROUND = 0.01;

export function orgLearningMultiplier(roundsCompleted: number): number {
  const r = Math.max(0, Math.min(ORG_LEARNING_MAX_ROUNDS, roundsCompleted));
  return 1 + r * ORG_LEARNING_PER_ROUND;
}
