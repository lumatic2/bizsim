'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { MetricCard } from '@/components/MetricCard';
import { PERSONAS } from '@/lib/personas';

function formatKRW(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `₩${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `₩${(value / 1_000_000).toFixed(0)}M`;
  return `₩${value.toLocaleString()}`;
}

export default function ResultsPage() {
  const router = useRouter();
  const { results } = useGameStore();

  if (!results) {
    router.push('/play');
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-[Manrope] font-bold mb-2" style={{ color: 'var(--biz-text)' }}>
        시뮬레이션 결과
      </h1>
      <p style={{ color: 'var(--biz-text-muted)' }} className="text-sm mb-6">
        1분기 경영 시뮬레이션의 최종 결과입니다.
      </p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <MetricCard label="시장점유율" value={`${results.marketShare}%`} delta="시장 진입" deltaUp />
        <MetricCard label="매출" value={formatKRW(results.revenue)} delta="Round 1" deltaUp={results.revenue > 0} />
        <MetricCard
          label="영업이익"
          value={formatKRW(results.operatingProfit)}
          delta={results.operatingProfit > 0 ? '흑자' : '적자'}
          deltaUp={results.operatingProfit > 0}
        />
        <MetricCard label="고객 만족도" value={`${results.satisfaction}`} delta="/100" deltaUp={results.satisfaction > 50} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--biz-text)' }}>세그먼트별 판매량</h3>
          <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 space-y-3">
            {PERSONAS.map((p) => {
              const demand = results.segmentDemand[p.id];
              const maxDemand = Math.max(...Object.values(results.segmentDemand));
              const pct = maxDemand > 0 ? (demand / maxDemand) * 100 : 0;
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--biz-text)' }}>
                    <span>{p.emoji} {p.name}</span>
                    <span className="font-mono">{demand.toLocaleString()}대</span>
                  </div>
                  <div style={{ background: '#e2e8f0' }} className="h-2 rounded-full">
                    <div style={{ background: 'var(--biz-primary)', width: `${pct}%` }} className="h-2 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--biz-text)' }}>판매 요약</h3>
          <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)', color: 'var(--biz-text)' }} className="border rounded-lg p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span style={{ color: 'var(--biz-text-muted)' }}>총 수요</span>
              <span>{Object.values(results.segmentDemand).reduce((s, d) => s + d, 0).toLocaleString()}대</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--biz-text-muted)' }}>실제 판매</span>
              <span>{results.unitsSold.toLocaleString()}대</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--biz-text-muted)' }}>단가</span>
              <span>₩{(results.revenue / results.unitsSold).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--biz-text)' }}>AI 디브리프</h3>
        <div className="space-y-2 text-sm" style={{ color: 'var(--biz-text-muted)' }}>
          <p style={{ borderLeftColor: 'var(--biz-primary)' }} className="pl-3 border-l-2">
            시장점유율 {results.marketShare}%로 시장에 진입했습니다.
            {results.operatingProfit > 0
              ? ' 영업 흑자를 달성하여 지속 가능한 출발입니다.'
              : ' 영업 적자 상태이므로 비용 구조 개선이 필요합니다.'}
          </p>
          <p style={{ borderLeftColor: 'var(--biz-primary)' }} className="pl-3 border-l-2">
            {PERSONAS.reduce((best, p) =>
              results.segmentDemand[p.id] > results.segmentDemand[best.id] ? p : best
            ).name} 세그먼트에서 가장 높은 반응을 보였습니다.
          </p>
        </div>
      </div>

      <div style={{ borderTopColor: 'var(--biz-border)' }} className="flex items-center justify-between border-t pt-4">
        <button
          onClick={() => router.push('/play')}
          style={{ borderColor: 'var(--biz-border)', color: 'var(--biz-text-muted)' }}
          className="border px-4 py-2 rounded-lg text-sm hover:opacity-75 transition-opacity"
        >
          ← 의사결정 다시보기
        </button>
        <button
          onClick={() => router.push('/play/financials')}
          style={{ background: 'var(--biz-primary)' }}
          className="text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          재무제표 보기 →
        </button>
      </div>
    </div>
  );
}


