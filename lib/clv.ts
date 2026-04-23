// Customer Lifetime Value (CLV) — 고급 마케팅 핵심 지표
// 한 고객이 평생 기여할 총 수익의 기댓값. 신규고객획득비용(CAC)과 비교해 지속가능성을 판단.
//
// BizSim 간소화 공식:
//   retention = 0.5 × (satisfaction/100) + 0.5 × (brandEquity/100)
//   repurchaseCycles = 1 / (1 − retention)     ※ 무한등비급수
//   CLV = AOV × repurchaseCycles
//   AOV = revenue / unitsSold (이번 분기 평균 객단가)
//
// 해석:
//   - 만족도 100, 브랜드 100이면 retention=1 → 무한 반복구매 (상한 clamp)
//   - 만족도 50, 브랜드 50이면 retention=0.5 → 평균 2회 구매
//   - AOV가 높을수록 CLV 비례 증가
//
// 마케팅 의사결정 도움말:
//   - CLV > CAC × 3이면 광고 확대 여유
//   - CLV ≈ CAC이면 리텐션(만족도·브랜드) 투자 우선

export type CLVBreakdown = {
  aov: number;              // 평균 객단가 (원)
  retention: number;        // 0~1, 분기별 재구매 확률
  repurchaseCycles: number; // 기대 재구매 횟수
  clv: number;              // CLV 원
  satisfactionContribution: number; // retention에 기여한 만족도 몫 (0~0.5)
  brandContribution: number;        // retention에 기여한 브랜드 몫 (0~0.5)
};

const MAX_CYCLES = 20;  // retention이 0.95 넘을 때 무한대 방지

export function computeCLV(
  revenue: number,
  unitsSold: number,
  satisfaction: number,
  brandEquity: number,
): CLVBreakdown {
  const aov = unitsSold > 0 ? revenue / unitsSold : 0;
  const satPart = (satisfaction / 100) * 0.5;
  const brandPart = (brandEquity / 100) * 0.5;
  const retention = Math.min(0.95, satPart + brandPart);
  const repurchaseCycles = Math.min(MAX_CYCLES, 1 / Math.max(0.05, 1 - retention));
  const clv = aov * repurchaseCycles;

  return {
    aov,
    retention,
    repurchaseCycles,
    clv,
    satisfactionContribution: satPart,
    brandContribution: brandPart,
  };
}
