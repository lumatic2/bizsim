// Bullwhip Effect (Forrester 1961, Lee·Padmanabhan·Whang 1997)
// 공급망 상류로 갈수록 주문 변동성이 증폭되는 현상.
// 원인: 수요예측 오차, 배치 주문, 가격 변동 대응, 공급 할당 게임.
//
// BizSim 모델: 플레이어 판매량의 round-over-round 변동률을 "volatility"로 정의.
// 이 값이 임계(20%) 초과 시:
//   (a) 다음 분기 SPI drift에 추가 (공급자가 변동성 프리미엄 부과)
//   (b) 경쟁사 광고 증가율 증폭 (따라 붙는 hog-cycling 반응)
//
// 실제 사례: 스마트폰 시장에서 공격적 가격 인하 → 경쟁사 판촉 폭탄 → 연쇄 출혈

export const BULLWHIP_THRESHOLD = 0.2;  // 변동률 20% 이상부터 증폭 발동
export const BULLWHIP_SPI_DRIFT_PER_UNIT = 0.05;  // 임계 초과 1당 +5% drift (즉 +40% 변동 → +1% 추가 SPI)
export const BULLWHIP_COMPETITOR_AMP = 1.0;  // 임계 초과분이 경쟁사 광고 증가율에 선형 가산

export function playerDemandVolatility(currentUnitsSold: number, previousUnitsSold: number): number {
  if (previousUnitsSold <= 0) return 0;
  return Math.abs(currentUnitsSold - previousUnitsSold) / previousUnitsSold;
}

// 초과분만 반환 (임계 이하는 0)
export function bullwhipExcess(volatility: number): number {
  return Math.max(0, volatility - BULLWHIP_THRESHOLD);
}

export function bullwhipSupplyDrift(volatility: number): number {
  return bullwhipExcess(volatility) * BULLWHIP_SPI_DRIFT_PER_UNIT;
}

export function bullwhipCompetitorAmp(volatility: number): number {
  return bullwhipExcess(volatility) * BULLWHIP_COMPETITOR_AMP;
}
