// Ansoff Matrix (Igor Ansoff, 1957) — Growth Strategy 2×2
//   ┌────────────┬───────────────────┬───────────────────┐
//   │            │ 기존 시장          │ 신시장             │
//   ├────────────┼───────────────────┼───────────────────┤
//   │ 기존 제품   │ 시장 침투 (Penetration) │ 시장 개발 (Development) │
//   │ 신제품      │ 제품 개발 (Product Dev)  │ 다각화 (Diversification) │
//   └────────────┴───────────────────┴───────────────────┘
//
// BizSim 단순화:
//   - improve (기존 개선): R&D를 quality cap 상승에 투입 → 시장 침투 + 제품 개발
//   - explore (신시장 탐색): R&D를 신시장 발굴에 투입 → 플레이어 전용 유효시장 확장
//     (경쟁사는 기존 시장에 갇힘. 탐색 R&D로 접근한 세그먼트는 플레이어만 접근 가능)
//
// 디폴트 70/30 — 품질 개선이 여전히 주력이되 탐색이 장기 복리로 작동하도록.
// 실무에서도 R&D의 60~80%는 개선, 20~40%가 탐색/신사업에 배분되는 게 통상적.

export function exploreBoostFrom(cumulativeExploreRd: number): number {
  // 플레이어 전용 유효시장 배수 증분. 0 이상 (0이면 부스트 없음).
  // 누적 1B → ~+4%, 5B → ~+12.5%, 10B → ~+17%, 무한 → +25%.
  const maxBoost = 0.25;
  const halfPoint = 5_000_000_000;
  if (cumulativeExploreRd <= 0) return 0;
  return maxBoost * (cumulativeExploreRd / (cumulativeExploreRd + halfPoint));
}

export const DEFAULT_RD_ALLOCATION = { improve: 70, explore: 30 } as const;
