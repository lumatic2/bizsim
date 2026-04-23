// 라운드 간 변화 분석 — 직전 분기 대비 핵심 지표 delta + 휴리스틱 귀인
// AI 디브리프와 보완 관계: 이쪽은 즉시 결정론적 숫자 비교, AI는 자연어 해석.

import type { Decisions, SimulationResults, RoundEvent, ProductId } from './types';

export type DeltaMetrics = {
  marketShare: number;
  revenueB: number;
  operatingProfitB: number;
  satisfaction: number;
  unitsSold: number;
};

export type AttributionHint = {
  kind: 'price' | 'quality' | 'ad' | 'event' | 'rd' | 'headcount' | 'service' | 'supply' | 'none';
  label: string;
  impact: 'up' | 'down' | 'neutral';
};

export function computeDelta(cur: SimulationResults, prev: SimulationResults): DeltaMetrics {
  return {
    marketShare: Math.round((cur.marketShare - prev.marketShare) * 10) / 10,
    revenueB: Math.round((cur.revenue - prev.revenue) / 100_000_000) / 10,
    operatingProfitB: Math.round((cur.operatingProfit - prev.operatingProfit) / 100_000_000) / 10,
    satisfaction: cur.satisfaction - prev.satisfaction,
    unitsSold: cur.unitsSold - prev.unitsSold,
  };
}

// Top-1 귀인: 가장 큰 의사결정 변화 또는 이벤트/외생요인
export function topAttribution(
  curDecisions: Decisions,
  prevDecisions: Decisions,
  curEvent: RoundEvent,
  supplyIndexDelta: number,
): AttributionHint | null {
  // 이벤트가 비-calm이면 우선
  if (curEvent.id !== 'calm') {
    return {
      kind: 'event',
      label: `이벤트 · ${curEvent.title}`,
      impact: curEvent.severity === 'good' ? 'up' : curEvent.severity === 'bad' ? 'down' : 'neutral',
    };
  }

  // SPI 변화가 10% 이상
  if (Math.abs(supplyIndexDelta) > 0.1) {
    return {
      kind: 'supply',
      label: `공급자 지수 ${supplyIndexDelta > 0 ? '+' : ''}${(supplyIndexDelta * 100).toFixed(1)}%`,
      impact: supplyIndexDelta > 0 ? 'down' : 'up',
    };
  }

  // 가격 변화 (제품별 평균 절댓값)
  const priceDelta = (['A', 'B'] as ProductId[]).reduce((sum, id) => {
    const cur = curDecisions.products.find((p) => p.id === id);
    const prev = prevDecisions.products.find((p) => p.id === id);
    return sum + Math.abs((cur?.price ?? 0) - (prev?.price ?? 0));
  }, 0);

  // 광고 변화
  const adDelta = Math.abs(
    (curDecisions.adBudget.search + curDecisions.adBudget.display + curDecisions.adBudget.influencer) -
    (prevDecisions.adBudget.search + prevDecisions.adBudget.display + prevDecisions.adBudget.influencer)
  );

  // 품질 변화
  const qualityDelta = (['A', 'B'] as ProductId[]).reduce((sum, id) => {
    const cur = curDecisions.products.find((p) => p.id === id);
    const prev = prevDecisions.products.find((p) => p.id === id);
    return sum + Math.abs((cur?.quality ?? 0) - (prev?.quality ?? 0));
  }, 0);

  // 인력 변화
  const headcountDelta = Math.abs(curDecisions.headcount.sales - prevDecisions.headcount.sales)
    + Math.abs(curDecisions.headcount.rd - prevDecisions.headcount.rd);

  // 서비스 capacity 변화
  const serviceDelta = Math.abs(curDecisions.serviceCapacity - prevDecisions.serviceCapacity);

  // Magnitude 기반 우선순위 (가격 1만원 = 광고 1B = 품질 1 = 인력 2명 = 서비스 5천대 ~ 동급)
  const candidates: { kind: AttributionHint['kind']; label: string; magnitude: number; impact: 'up' | 'down' }[] = [];

  if (priceDelta >= 10_000) {
    const curAvg = curDecisions.products.reduce((s, p) => s + p.price, 0) / 2;
    const prevAvg = prevDecisions.products.reduce((s, p) => s + p.price, 0) / 2;
    const direction = curAvg - prevAvg;
    candidates.push({
      kind: 'price',
      label: `평균가 ${direction > 0 ? '+' : ''}${Math.round(direction / 1000)}K원`,
      magnitude: priceDelta / 10_000,
      impact: direction > 0 ? 'down' : 'up',  // 가격 인상은 수요 측면에서 down
    });
  }

  if (adDelta >= 100_000_000) {
    const curTotal = curDecisions.adBudget.search + curDecisions.adBudget.display + curDecisions.adBudget.influencer;
    const prevTotal = prevDecisions.adBudget.search + prevDecisions.adBudget.display + prevDecisions.adBudget.influencer;
    const direction = curTotal - prevTotal;
    candidates.push({
      kind: 'ad',
      label: `광고 ${direction > 0 ? '+' : ''}${(direction / 1_000_000_000).toFixed(1)}B`,
      magnitude: adDelta / 1_000_000_000,
      impact: direction > 0 ? 'up' : 'down',
    });
  }

  if (qualityDelta >= 1) {
    candidates.push({
      kind: 'quality',
      label: `품질 ${qualityDelta > 0 ? '+' : ''}${qualityDelta}`,
      magnitude: qualityDelta,
      impact: 'up',
    });
  }

  if (headcountDelta >= 2) {
    const curTotal = curDecisions.headcount.sales + curDecisions.headcount.rd;
    const prevTotal = prevDecisions.headcount.sales + prevDecisions.headcount.rd;
    const direction = curTotal - prevTotal;
    candidates.push({
      kind: 'headcount',
      label: `인력 ${direction > 0 ? '+' : ''}${direction}명`,
      magnitude: headcountDelta / 2,
      impact: direction > 0 ? 'up' : 'down',
    });
  }

  if (serviceDelta >= 5_000) {
    const direction = curDecisions.serviceCapacity - prevDecisions.serviceCapacity;
    candidates.push({
      kind: 'service',
      label: `서비스 capacity ${direction > 0 ? '+' : ''}${(direction / 1000).toFixed(0)}k`,
      magnitude: serviceDelta / 5_000,
      impact: direction > 0 ? 'up' : 'down',
    });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.magnitude - a.magnitude);
  const top = candidates[0];
  return { kind: top.kind, label: top.label, impact: top.impact };
}
