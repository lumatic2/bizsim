// 프레임워크 자동 매칭 — 분기 상태를 경영학 교과서 프레임워크와 연결.
// Rule-based: 임계값 기반으로 해당 분기에 가장 두드러지는 전략 상황 3-5개 태깅.

import type { Decisions, SimulationResults, RoundSnapshot, ProductId } from './types';
import { learningCurveMultiplier } from './learning-curve';
import { classifyPressure } from './supply';
import { exploreBoostFrom } from './ansoff';
import { computeBCGPositions } from './bcg';
import { playerDemandVolatility, BULLWHIP_THRESHOLD } from './bullwhip';

export type FrameworkCategory = 'porter' | 'bcg' | 'ansoff' | 'experience' | 'marketing' | 'ops' | 'finance';

export type FrameworkTag = {
  id: string;
  category: FrameworkCategory;
  label: string;        // 짧은 태그 (8자 이내)
  insight: string;      // 한 줄 해설
  sentiment: 'positive' | 'warning' | 'neutral';
  priority: number;     // 정렬 우선순위 (0~100, 높을수록 위)
};

export type FrameworkContext = {
  decisions: Decisions;
  results: SimulationResults;
  roundHistory: RoundSnapshot[];
  brandEquity: number;
  supplyIndex: number;
  cumulativeProduction: Record<ProductId, number>;
  cumulativeExploreRd: number;
};

export function matchFrameworkTags(ctx: FrameworkContext): FrameworkTag[] {
  const { decisions, results, roundHistory, brandEquity, supplyIndex, cumulativeProduction, cumulativeExploreRd } = ctx;
  const tags: FrameworkTag[] = [];

  // 평균 가격·품질 비교
  const avgPlayerPrice = decisions.products.reduce((s, p) => s + p.price, 0) / decisions.products.length;
  const avgPlayerQuality = decisions.products.reduce((s, p) => s + p.quality, 0) / decisions.products.length;
  const avgCompetitorPrice = results.competitors.reduce((s, c) => s + c.price, 0) / Math.max(1, results.competitors.length);
  const avgCompetitorQuality = results.competitors.reduce((s, c) => s + c.quality, 0) / Math.max(1, results.competitors.length);

  const priceRatio = avgPlayerPrice / avgCompetitorPrice;
  const qualityDelta = avgPlayerQuality - avgCompetitorQuality;

  // Porter Generic Strategies
  if (priceRatio < 0.93 && qualityDelta <= 0.3) {
    tags.push({
      id: 'porter-cost',
      category: 'porter', label: 'Porter 비용우위', sentiment: 'positive', priority: 85,
      insight: `평균가 ${(avgPlayerPrice / 10_000).toFixed(0)}만 vs 경쟁사 ${(avgCompetitorPrice / 10_000).toFixed(0)}만 — 저가 포지셔닝으로 시장 침투`,
    });
  } else if (qualityDelta > 0.5 && priceRatio > 0.95) {
    tags.push({
      id: 'porter-differentiation',
      category: 'porter', label: 'Porter 차별화', sentiment: 'positive', priority: 85,
      insight: `품질 ${avgPlayerQuality.toFixed(1)} vs ${avgCompetitorQuality.toFixed(1)} — 프리미엄 차별화 전략`,
    });
  } else if (results.marketShare < 15 && brandEquity > 60) {
    tags.push({
      id: 'porter-focus',
      category: 'porter', label: 'Porter 집중화', sentiment: 'neutral', priority: 70,
      insight: `점유 ${results.marketShare}%는 낮지만 브랜드 에쿼티 ${brandEquity.toFixed(0)} — 니치 집중 포지션`,
    });
  }

  // BCG 분면
  const bcgPositions = computeBCGPositions(results, decisions, roundHistory);
  for (const pos of bcgPositions) {
    if (pos.quadrant === 'star') {
      tags.push({
        id: `bcg-star-${pos.productId}`,
        category: 'bcg', label: `${pos.productId} Star`, sentiment: 'positive', priority: 80,
        insight: `${pos.name}: 상대점유 ${pos.relativeShare.toFixed(2)} + 고성장 — 공격적 투자 구간`,
      });
    } else if (pos.quadrant === 'cashCow') {
      tags.push({
        id: `bcg-cow-${pos.productId}`,
        category: 'bcg', label: `${pos.productId} Cash Cow`, sentiment: 'positive', priority: 75,
        insight: `${pos.name}: 리더(rel ${pos.relativeShare.toFixed(2)}) + 저성장 — 현금창출, 수익 회수`,
      });
    } else if (pos.quadrant === 'dog') {
      tags.push({
        id: `bcg-dog-${pos.productId}`,
        category: 'bcg', label: `${pos.productId} Dog`, sentiment: 'warning', priority: 65,
        insight: `${pos.name}: 후발(rel ${pos.relativeShare.toFixed(2)}) + 저성장 — 퇴출 또는 재정의 검토`,
      });
    }
  }

  // Ansoff 시장개발
  const exploreBoost = exploreBoostFrom(cumulativeExploreRd);
  if (exploreBoost > 0.08) {
    tags.push({
      id: 'ansoff-dev',
      category: 'ansoff', label: 'Ansoff 시장개발', sentiment: 'positive', priority: 70,
      insight: `탐색 R&D 누적 효과 +${(exploreBoost * 100).toFixed(1)}% — 신시장 개척 모멘텀`,
    });
  } else if (decisions.rdAllocation.improve >= 80) {
    tags.push({
      id: 'ansoff-penetration',
      category: 'ansoff', label: 'Ansoff 시장침투', sentiment: 'neutral', priority: 60,
      insight: `R&D ${decisions.rdAllocation.improve}%가 기존 제품 개선 — 핵심 시장 침투 우선`,
    });
  }

  // 경험곡선 (Wright's Law)
  const avgLearningMult = (
    learningCurveMultiplier(cumulativeProduction.A) +
    learningCurveMultiplier(cumulativeProduction.B)
  ) / 2;
  if (avgLearningMult < 0.85) {
    tags.push({
      id: 'experience-curve',
      category: 'experience', label: '경험곡선 효과', sentiment: 'positive', priority: 75,
      insight: `누적 생산으로 원가 계수 평균 ×${avgLearningMult.toFixed(3)} — 규모경제 실현 중`,
    });
  }

  // 공급자 교섭력
  const pressure = classifyPressure(supplyIndex);
  if (pressure === 'crisis') {
    tags.push({
      id: 'porter-supplier-crisis',
      category: 'porter', label: 'Porter 공급자 위기', sentiment: 'warning', priority: 90,
      insight: `SPI ×${supplyIndex.toFixed(2)} — 원가 급등, 가격 전가 또는 재고 비축 검토`,
    });
  } else if (pressure === 'tight') {
    tags.push({
      id: 'porter-supplier-tight',
      category: 'porter', label: 'Porter 공급긴장', sentiment: 'warning', priority: 70,
      insight: `SPI ×${supplyIndex.toFixed(2)} — 원가 상승 압력, 마진 관리 주의`,
    });
  }

  // Bullwhip
  const prevSnapshot = roundHistory[roundHistory.length - 1];
  if (prevSnapshot) {
    const volatility = playerDemandVolatility(results.unitsSold, prevSnapshot.results.unitsSold);
    if (volatility > BULLWHIP_THRESHOLD) {
      tags.push({
        id: 'ops-bullwhip',
        category: 'ops', label: 'Bullwhip 주의', sentiment: 'warning', priority: 80,
        insight: `판매 변동률 ${(volatility * 100).toFixed(1)}% — 다음 분기 공급망·경쟁사 반응 증폭 예상`,
      });
    }
  }

  // 서비스 overflow (운영 실패)
  if (results.serviceQueue.overflow > 0) {
    tags.push({
      id: 'ops-overflow',
      category: 'ops', label: '서비스 overflow', sentiment: 'warning', priority: 85,
      insight: `capacity 초과 ${results.serviceQueue.overflow.toLocaleString()}대 판매 손실 — 인프라 확장 필요`,
    });
  }

  // 마케팅 — 브랜드 에쿼티
  if (brandEquity > 70) {
    tags.push({
      id: 'marketing-brand-strong',
      category: 'marketing', label: '브랜드 강건', sentiment: 'positive', priority: 65,
      insight: `에쿼티 ${brandEquity.toFixed(0)} — 가격 저항력·재구매 탄력 확보`,
    });
  } else if (brandEquity < 25) {
    tags.push({
      id: 'marketing-brand-weak',
      category: 'marketing', label: '브랜드 취약', sentiment: 'warning', priority: 70,
      insight: `에쿼티 ${brandEquity.toFixed(0)} — 광고 carryover + adstock 투자 시급`,
    });
  }

  // 재무 — Overtrading (매출 급증 + 영업이익 적자)
  if (prevSnapshot) {
    const revGrowth = (results.revenue - prevSnapshot.results.revenue) / Math.max(1, prevSnapshot.results.revenue);
    if (revGrowth > 0.25 && results.operatingProfit < 0) {
      tags.push({
        id: 'finance-overtrading',
        category: 'finance', label: 'Overtrading 경계', sentiment: 'warning', priority: 85,
        insight: `매출 +${(revGrowth * 100).toFixed(0)}% 성장 vs 영업적자 — 운전자본 부담 큼, 재무 건전성 점검`,
      });
    }
  }

  // 정렬: priority 내림차순, 같으면 sentiment 경고 우선
  tags.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const sentOrder = { warning: 0, positive: 1, neutral: 2 };
    return sentOrder[a.sentiment] - sentOrder[b.sentiment];
  });

  return tags;
}
