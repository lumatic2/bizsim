// M/M/1 대기행렬 표준 공식 (Kendall 표기 Markov arrival / Markov service / 1 server)
// 분기 집계 수준의 analytical 지표. /lab/queue의 discrete-event 시뮬은 시간대별 변동 확인용.
//
//   ρ = λ/μ (utilization)
//   P(N=k) = (1-ρ) ρ^k        (시스템 내 k명 존재 확률)
//   L = ρ / (1-ρ)             (시스템 평균 인원)
//   Lq = ρ² / (1-ρ)           (대기열 평균 인원)
//   W = 1 / (μ-λ)             (시스템 체류 평균시간)
//   Wq = ρ / (μ-λ)            (대기 평균시간)
//
// ρ ≥ 1 이면 포화 → 무한 대기. 게임에선 overflow로 처리 (service-queue.ts 참조).

export type MM1Metrics = {
  utilization: number;
  systemSize: number;         // L
  queueSize: number;          // Lq
  systemTime: number;         // W (service time 단위)
  queueTime: number;          // Wq
  distribution: { k: number; probability: number }[];  // k = 0..9, P(N=k)
};

export function computeMM1(arrivalRate: number, serviceRate: number): MM1Metrics {
  if (serviceRate <= 0) {
    return {
      utilization: Infinity, systemSize: Infinity, queueSize: Infinity,
      systemTime: Infinity, queueTime: Infinity,
      distribution: [],
    };
  }
  const rho = arrivalRate / serviceRate;
  const stable = rho < 1;
  const L = stable ? rho / (1 - rho) : Infinity;
  const Lq = stable ? (rho * rho) / (1 - rho) : Infinity;
  const W = stable ? 1 / (serviceRate - arrivalRate) : Infinity;
  const Wq = stable ? rho / (serviceRate - arrivalRate) : Infinity;

  const distribution: { k: number; probability: number }[] = [];
  if (stable) {
    for (let k = 0; k <= 9; k++) {
      distribution.push({ k, probability: (1 - rho) * Math.pow(rho, k) });
    }
  }
  return { utilization: rho, systemSize: L, queueSize: Lq, systemTime: W, queueTime: Wq, distribution };
}
