import { describe, it, expect } from 'vitest';
import { analyzeCompetitor } from '../competitor-trend';
import type { RoundSnapshot, CompetitorState } from '../types';

function mkCompetitor(name: string, overrides: Partial<CompetitorState> = {}): CompetitorState {
  return {
    name,
    price: 350_000,
    adBudget: 1_000_000_000,
    quality: 3,
    channels: { online: 40, mart: 40, direct: 20 },
    marketShare: 20,
    revenue: 3_000_000_000,
    unitsSold: 15_000,
    cumulativeRd: 2_000_000_000,
    ...overrides,
  };
}

function mkSnapshot(round: number, competitor: CompetitorState): RoundSnapshot {
  return {
    round,
    decisions: {} as RoundSnapshot['decisions'],
    results: { competitors: [competitor] } as RoundSnapshot['results'],
    financials: {} as RoundSnapshot['financials'],
    competitors: [competitor],
    marketSize: 100_000,
    cumulativeRd: 0,
    qualityCap: 3,
    event: { id: 'calm', title: '', description: '', severity: 'neutral', effects: {} },
    brandEquity: 50,
    supplyIndex: 1.0,
  };
}

describe('analyzeCompetitor', () => {
  it('추이 없음 (1개 분기만) → 빈 태그 또는 안정 유지', () => {
    const latest = mkCompetitor('C1');
    const r = analyzeCompetitor('C1', [], latest);
    // 1개 데이터포인트에선 slope 0 → 태그 없음
    expect(r.priceSeries).toHaveLength(1);
  });

  it('가격 인하 추세 감지', () => {
    const history = [
      mkSnapshot(1, mkCompetitor('C1', { price: 380_000 })),
      mkSnapshot(2, mkCompetitor('C1', { price: 370_000 })),
      mkSnapshot(3, mkCompetitor('C1', { price: 360_000 })),
    ];
    const latest = mkCompetitor('C1', { price: 340_000 });
    const r = analyzeCompetitor('C1', history, latest);
    expect(r.tags).toContain('가격 인하 추세');
  });

  it('공격적 가격전략: 가격 하락 + 광고 상승 동시', () => {
    const history = [
      mkSnapshot(1, mkCompetitor('C1', { price: 380_000, adBudget: 600_000_000 })),
      mkSnapshot(2, mkCompetitor('C1', { price: 360_000, adBudget: 800_000_000 })),
    ];
    const latest = mkCompetitor('C1', { price: 330_000, adBudget: 1_100_000_000 });
    const r = analyzeCompetitor('C1', history, latest);
    expect(r.tags).toContain('공격적 가격전략');
  });

  it('품질 추격', () => {
    const history = [
      mkSnapshot(1, mkCompetitor('C1', { quality: 3.0 })),
      mkSnapshot(2, mkCompetitor('C1', { quality: 3.2 })),
    ];
    const latest = mkCompetitor('C1', { quality: 3.5 });
    const r = analyzeCompetitor('C1', history, latest);
    expect(r.tags).toContain('품질 추격');
  });

  it('점유율 상승', () => {
    const history = [
      mkSnapshot(1, mkCompetitor('C1', { marketShare: 15 })),
      mkSnapshot(2, mkCompetitor('C1', { marketShare: 18 })),
    ];
    const latest = mkCompetitor('C1', { marketShare: 22 });
    const r = analyzeCompetitor('C1', history, latest);
    expect(r.tags).toContain('점유율 상승');
  });

  it('시계열 길이는 history+1 (latest 포함)', () => {
    const history = [mkSnapshot(1, mkCompetitor('C1'))];
    const latest = mkCompetitor('C1');
    const r = analyzeCompetitor('C1', history, latest);
    expect(r.priceSeries.length).toBe(2);
    expect(r.qualitySeries.length).toBe(2);
  });
});
