// Operations Management — Service Queue (간소 M/M/1 근사)
// 고객 서비스·A/S 채널의 대기시간이 만족도에 주는 영향을 분기별 집계 수준에서 모델링.
//
// 입력:
//   arrivalRate = 분기 판매 대수 (실제 서비스 수요의 프록시)
//   serviceRate = 서비스 처리 능력 (serviceCapacity)
//
// 핵심 지표:
//   utilization ρ = arrivalRate / serviceRate
//   ρ < 1.0 일 때 M/M/1 기대 대기시간: W = ρ / (μ − λ) (단위: 분기 대비 시간)
//   ρ ≥ 1.0 오버플로 → 실질 판매 손실 + 만족도 급락
//
// BizSim 단순화:
//   /lab/queue의 디스크릿 이벤트 시뮬은 별도 유지. 여기서는 분기 집계 수준의 analytical 근사.
//   만족도 델타를 단조 함수로 정의해 ρ가 0.9 이상일 때 급격히 감소.

export type QueueMetrics = {
  utilization: number;      // ρ = λ/μ
  satisfactionDelta: number; // 만족도 가산 (양수=만족↑, 음수=불만↑)
  effectiveSales: number;   // 실제 서비스 가능한 판매 (overflow 시 capacity cap)
  overflow: number;         // 용량 초과로 판매 불가했던 수량 (ρ > 1 시)
};

export function serviceQueueImpact(arrivalRate: number, serviceRate: number): QueueMetrics {
  if (serviceRate <= 0) {
    return { utilization: Infinity, satisfactionDelta: -25, effectiveSales: 0, overflow: arrivalRate };
  }
  const utilization = arrivalRate / serviceRate;

  let satisfactionDelta: number;
  if (utilization < 0.7) {
    // 여유 용량 — 서비스 만족 보너스
    satisfactionDelta = 5;
  } else if (utilization < 0.9) {
    // 정상 범위 — 중립
    satisfactionDelta = 0;
  } else if (utilization < 1.0) {
    // 대기 길어짐 — 선형 페널티 0 → -10
    satisfactionDelta = -10 * (utilization - 0.9) / 0.1;
  } else {
    // 오버플로 — 추가 페널티 (ρ 1.0 → -15, 2.0 → -25에서 clamp)
    const overflowExcess = Math.min(utilization - 1, 1);
    satisfactionDelta = -15 - 10 * overflowExcess;
  }

  const overflow = utilization > 1 ? Math.round(arrivalRate - serviceRate) : 0;
  const effectiveSales = utilization > 1 ? serviceRate : arrivalRate;

  return {
    utilization,
    satisfactionDelta: Math.round(satisfactionDelta * 10) / 10,
    effectiveSales: Math.round(effectiveSales),
    overflow,
  };
}

export const SERVICE_COST_PER_UNIT = 50_000;  // 대당 분기 서비스 capex·opex (AS·상담·배송 등)
