import type { Decisions, SimulationResults, RoundSnapshot, ProductId } from './types';

// BCG Growth-Share Matrix (Boston Consulting Group, 1970)
// 4 분면:
//   Star         — 상대점유율 ≥ 1.0, 성장률 ≥ HIGH_GROWTH_THRESHOLD
//   Cash Cow     — 상대점유율 ≥ 1.0, 성장률 < HIGH_GROWTH_THRESHOLD
//   Question Mark— 상대점유율 < 1.0, 성장률 ≥ HIGH_GROWTH_THRESHOLD
//   Dog          — 상대점유율 < 1.0, 성장률 < HIGH_GROWTH_THRESHOLD
//
// 해석:
// - 상대점유율: 우리 제품 점유율 ÷ 최대 경쟁사 점유율. 1.0 = 동급, >1 = 시장 리더.
// - 성장률: round-over-round 시장 규모 변동률(%). round 1은 히스토리 없으니 기본값 3%.
// - Star는 공격적 투자, Cash Cow는 현금창출 유지, Question Mark는 선택과 집중, Dog는 퇴출 고려.

export const HIGH_GROWTH_THRESHOLD = 5;  // % — 분면 구분 임계 (연 10%/4 ≈ 분기 2.5%의 2배, 게임 이벤트 반영 레인지)
export const RELATIVE_SHARE_BOUNDARY = 1.0;

export type BCGQuadrant = 'star' | 'cashCow' | 'questionMark' | 'dog';

export type BCGPosition = {
  productId: ProductId;
  name: string;
  relativeShare: number;   // 우리 / 최대 경쟁사 (0 이상)
  productShare: number;    // 시장 점유율 (%)
  growth: number;          // 시장 성장률 (%)
  revenueB: number;        // 매출 (10억 단위, 버블 크기용)
  quadrant: BCGQuadrant;
};

export function classifyQuadrant(relativeShare: number, growth: number): BCGQuadrant {
  const highShare = relativeShare >= RELATIVE_SHARE_BOUNDARY;
  const highGrowth = growth >= HIGH_GROWTH_THRESHOLD;
  if (highShare && highGrowth) return 'star';
  if (highShare && !highGrowth) return 'cashCow';
  if (!highShare && highGrowth) return 'questionMark';
  return 'dog';
}

export function computeMarketGrowth(results: SimulationResults, roundHistory: RoundSnapshot[]): number {
  const prev = roundHistory[roundHistory.length - 1];
  if (!prev || prev.marketSize <= 0) return 3; // 기본 분기 성장률 (getMarketSize 선형 3%)
  return ((results.marketSize - prev.marketSize) / prev.marketSize) * 100;
}

export function computeBCGPositions(
  results: SimulationResults,
  decisions: Decisions,
  roundHistory: RoundSnapshot[],
): BCGPosition[] {
  const growth = computeMarketGrowth(results, roundHistory);

  // totalMarket 복원: 우리 전체 unitsSold가 marketShare에 차지하는 비율의 역산.
  // 기반: runSimulation은 marketShare = totalUnitsSold / totalMarket × 100 으로 산출.
  const totalMarket = results.marketShare > 0 && results.unitsSold > 0
    ? results.unitsSold / (results.marketShare / 100)
    : Math.max(results.marketSize, 1);

  const topCompetitorShare = results.competitors.reduce(
    (max, c) => (c.marketShare > max ? c.marketShare : max),
    0,
  );
  const safeTop = Math.max(topCompetitorShare, 0.1); // div-by-zero 방지 (초반 극단값)

  return decisions.products.map((p) => {
    const pr = results.perProduct[p.id];
    const productShare = totalMarket > 0 ? (pr.unitsSold / totalMarket) * 100 : 0;
    const relativeShare = productShare / safeTop;
    return {
      productId: p.id,
      name: p.name,
      relativeShare,
      productShare,
      growth,
      revenueB: pr.revenue / 1_000_000_000,
      quadrant: classifyQuadrant(relativeShare, growth),
    };
  });
}

export const QUADRANT_LABELS: Record<BCGQuadrant, string> = {
  star: 'Star · 공격 투자',
  cashCow: 'Cash Cow · 현금창출',
  questionMark: 'Question Mark · 선택 집중',
  dog: 'Dog · 퇴출 검토',
};
