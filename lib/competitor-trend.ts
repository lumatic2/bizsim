// 경쟁사 전략 추이 분석 — roundHistory에서 각 경쟁사의 시계열 추출 및 전략 태그 추론

import type { RoundSnapshot, CompetitorState } from './types';

export type CompetitorTrend = {
  name: string;
  priceSeries: number[];
  qualitySeries: number[];
  adSeries: number[];
  shareSeries: number[];
  tags: string[];  // 전략 태그 (가격 공격 / 품질 추격 / 광고 공세 / 수비 전환 등)
};

function linearSlope(series: number[]): number {
  const n = series.length;
  if (n < 2) return 0;
  // 최소제곱 회귀선 기울기 — 추세 강도
  const meanX = (n - 1) / 2;
  const meanY = series.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (series[i] - meanY);
    den += (i - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function analyzeCompetitor(name: string, history: RoundSnapshot[], latest: CompetitorState): CompetitorTrend {
  const pastSnapshots = history
    .map((snap) => snap.competitors.find((c) => c.name === name))
    .filter((c): c is CompetitorState => c !== undefined);
  const series = [...pastSnapshots, latest];
  const priceSeries = series.map((c) => c.price);
  const qualitySeries = series.map((c) => c.quality);
  const adSeries = series.map((c) => c.adBudget);
  const shareSeries = series.map((c) => c.marketShare);

  const priceSlope = linearSlope(priceSeries);
  const qualitySlope = linearSlope(qualitySeries);
  const adSlope = linearSlope(adSeries);
  const shareSlope = linearSlope(shareSeries);

  const tags: string[] = [];
  if (priceSlope < -3_000 && adSlope > 50_000_000) tags.push('공격적 가격전략');
  else if (priceSlope < -3_000) tags.push('가격 인하 추세');
  if (qualitySlope > 0.05) tags.push('품질 추격');
  if (adSlope > 100_000_000) tags.push('광고 공세');
  if (shareSlope < -0.3 && adSlope > 0) tags.push('수비 전환');
  if (shareSlope > 0.3) tags.push('점유율 상승');
  if (tags.length === 0 && series.length >= 2) tags.push('안정 유지');

  return { name, priceSeries, qualitySeries, adSeries, shareSeries, tags };
}
