// Porter 5 Forces — 공급자 교섭력 (Supplier Power)
// 원자재·부품 공급자가 제조사 원가 구조를 구조적으로 흔드는 힘.
// 반도체 슈퍼사이클, 구리/리튬/니켈 가격 변동, 환율 충격 등이 실제 사례.
//
// 모델: Supply Price Index (SPI). base = 1.0 이면 정상 공급 가격.
//   > 1.0: 원가 상승 (공급 부족·공급자 담합·수요 폭증)
//   < 1.0: 원가 하락 (공급 과잉·대체재 등장·원료 약세)
//
// 동학:
//   - AR(1) 평균회귀 (1.0 균형점으로 서서히 복귀)
//   - 분기별 ±5% 랜덤 충격
//   - +1% drift (공급자 힘의 구조적 상승 편향 — 장기 인플레이션·공급망 리스크)
//   - [0.8, 1.3] clamp: 극단치 방지
//
// 이벤트 카드와 관계:
//   - event.effects.costMultiplier (예: cost_shock 1.3)는 일회성 급등 이벤트
//   - supplyIndex는 상시 배경 변동 — 둘이 곱셈으로 결합해 원가 계산
//   - 따라서 cost_shock + 이미 높은 SPI가 겹치면 진짜 위기 상황

export const DEFAULT_SUPPLY_INDEX = 1.0;
const MEAN_REVERT_STRENGTH = 0.4;
const SHOCK_MAGNITUDE = 0.05;
const STRUCTURAL_DRIFT = 0.01;
const MIN_SPI = 0.8;
const MAX_SPI = 1.3;

export function rollSupplyIndex(
  prevIndex: number,
  rng: () => number = Math.random,
): number {
  const shock = (rng() * 2 - 1) * SHOCK_MAGNITUDE;
  const revert = MEAN_REVERT_STRENGTH * (DEFAULT_SUPPLY_INDEX - prevIndex);
  const next = prevIndex + revert + shock + STRUCTURAL_DRIFT;
  return Math.max(MIN_SPI, Math.min(MAX_SPI, next));
}

export type SupplyPressure = 'favorable' | 'normal' | 'tight' | 'crisis';

export function classifyPressure(index: number): SupplyPressure {
  if (index < 0.95) return 'favorable';
  if (index < 1.05) return 'normal';
  if (index < 1.15) return 'tight';
  return 'crisis';
}

export const PRESSURE_LABELS: Record<SupplyPressure, string> = {
  favorable: '원자재 약세 · 원가 여유',
  normal: '정상 공급',
  tight: '공급 긴장 · 원가 상승',
  crisis: '공급 위기 · 원가 급등',
};
