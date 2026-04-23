'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { AIDebrief } from '@/components/AIDebrief';
import { MetricCard } from '@/components/MetricCard';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function formatKRW(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `₩${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `₩${(value / 1_000_000).toFixed(0)}M`;
  return `₩${value.toLocaleString()}`;
}

export default function GameEndPage() {
  const router = useRouter();
  const { roundHistory, resetGame, finalDebrief, setFinalDebrief } = useGameStore();

  useEffect(() => {
    if (roundHistory.length === 0) {
      router.push('/play');
    }
  }, [roundHistory.length, router]);

  const { totalRevenue, totalProfit, avgShare, finalShare, chartData } = useMemo(() => {
    const totalRevenue = roundHistory.reduce((s, r) => s + r.results.revenue, 0);
    const totalProfit = roundHistory.reduce((s, r) => s + r.results.operatingProfit, 0);
    const avgShare =
      roundHistory.reduce((s, r) => s + r.results.marketShare, 0) /
      Math.max(1, roundHistory.length);
    const finalShare = roundHistory[roundHistory.length - 1]?.results.marketShare ?? 0;
    const chartData = roundHistory.map((r) => ({
      round: `R${r.round}`,
      점유율: r.results.marketShare,
      '매출 (₩B)': Number((r.results.revenue / 1_000_000_000).toFixed(2)),
      '영업이익 (₩B)': Number((r.results.operatingProfit / 1_000_000_000).toFixed(2)),
    }));
    return { totalRevenue, totalProfit, avgShare, finalShare, chartData };
  }, [roundHistory]);

  const finalPayload = useMemo(
    () => ({ mode: 'final' as const, history: roundHistory }),
    [roundHistory],
  );

  if (roundHistory.length === 0) {
    return null;
  }

  const grade =
    totalProfit > 5_000_000_000
      ? { label: 'A', color: '#15803d' }
      : totalProfit > 0
        ? { label: 'B', color: '#2563eb' }
        : totalProfit > -5_000_000_000
          ? { label: 'C', color: '#d97706' }
          : { label: 'D', color: '#dc2626' };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1
            className="text-3xl font-[Manrope] font-bold mb-1"
            style={{ color: 'var(--biz-text)' }}
          >
            게임 종료 · 최종 성과
          </h1>
          <p style={{ color: 'var(--biz-text-muted)' }} className="text-sm">
            {roundHistory.length}분기 누적 성과를 정리합니다.
          </p>
        </div>
        <div
          style={{ background: grade.color, color: 'white' }}
          className="px-6 py-3 rounded-lg text-4xl font-[Manrope] font-bold"
        >
          {grade.label}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="누적 매출"
          value={formatKRW(totalRevenue)}
          delta={`${roundHistory.length}분기 합계`}
          deltaUp
        />
        <MetricCard
          label="누적 영업이익"
          value={formatKRW(totalProfit)}
          delta={totalProfit > 0 ? '흑자' : '적자'}
          deltaUp={totalProfit > 0}
        />
        <MetricCard
          label="평균 점유율"
          value={`${avgShare.toFixed(1)}%`}
          delta="기간 평균"
          deltaUp
        />
        <MetricCard
          label="최종 점유율"
          value={`${finalShare}%`}
          delta={`R${roundHistory.length}`}
          deltaUp
        />
      </div>

      <AIDebrief
        key="final"
        mode="final"
        payload={finalPayload}
        cachedText={finalDebrief ?? undefined}
        onComplete={(text) => setFinalDebrief(text)}
      />

      <DecisionTimeline roundHistory={roundHistory} />

      <div
        style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }}
        className="border rounded-lg p-4 mb-6"
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--biz-text)' }}>
          분기별 매출·영업이익 추이
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 24, bottom: 10, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--biz-border)" />
            <XAxis
              dataKey="round"
              style={{ fontSize: '12px', fill: 'var(--biz-text-muted)' }}
              label={{ value: '분기', position: 'insideBottom', offset: -4, style: { fontSize: 11, fill: 'var(--biz-text-muted)' } }}
            />
            <YAxis
              style={{ fontSize: '12px', fill: 'var(--biz-text-muted)' }}
              label={{ value: '₩ 십억', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--biz-text-muted)', textAnchor: 'middle' } }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--biz-card)',
                border: '1px solid var(--biz-border)',
                borderRadius: '6px',
              }}
              formatter={(value: number) => [`₩${value.toFixed(2)}B`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={0} stroke="var(--biz-border)" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="매출 (₩B)" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="영업이익 (₩B)" stroke="#15803d" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }}
        className="border rounded-lg p-4 mb-6"
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--biz-text)' }}>
          분기별 시장점유율
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 10, right: 24, bottom: 10, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--biz-border)" />
            <XAxis
              dataKey="round"
              style={{ fontSize: '12px', fill: 'var(--biz-text-muted)' }}
              label={{ value: '분기', position: 'insideBottom', offset: -4, style: { fontSize: 11, fill: 'var(--biz-text-muted)' } }}
            />
            <YAxis
              domain={[0, 'auto']}
              style={{ fontSize: '12px', fill: 'var(--biz-text-muted)' }}
              unit="%"
              label={{ value: '시장점유율 (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--biz-text-muted)', textAnchor: 'middle' } }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--biz-card)',
                border: '1px solid var(--biz-border)',
                borderRadius: '6px',
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, '시장점유율']}
            />
            <Line type="monotone" dataKey="점유율" stroke="#9333ea" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{ borderTopColor: 'var(--biz-border)' }}
        className="flex items-center justify-between border-t pt-4"
      >
        <button
          onClick={() => router.push('/play/financials')}
          style={{ borderColor: 'var(--biz-border)', color: 'var(--biz-text-muted)' }}
          className="border px-4 py-2 rounded-lg text-sm hover:opacity-75 transition-opacity"
        >
          ← 마지막 분기 재무제표
        </button>
        <button
          onClick={() => {
            resetGame();
            router.push('/play');
          }}
          style={{ background: 'var(--biz-primary)' }}
          className="text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          새 게임 시작 →
        </button>
      </div>
    </div>
  );
}

type DecisionTimelineProps = {
  roundHistory: import('@/lib/types').RoundSnapshot[];
};

function DecisionTimeline({ roundHistory }: DecisionTimelineProps) {
  const rows = useMemo(() => {
    return roundHistory.map((r) => {
      const avgPrice = r.decisions.products.reduce((s, p) => s + p.price, 0) / r.decisions.products.length;
      const avgQuality = r.decisions.products.reduce((s, p) => s + p.quality, 0) / r.decisions.products.length;
      const totalAd = r.decisions.adBudget.search + r.decisions.adBudget.display + r.decisions.adBudget.influencer;
      return {
        round: r.round,
        avgPrice,
        avgQuality,
        totalAd,
        rdBudget: r.decisions.rdBudget,
        improvePct: r.decisions.rdAllocation.improve,
        serviceCapacity: r.decisions.serviceCapacity,
        headcount: r.decisions.headcount.sales + r.decisions.headcount.rd,
        brandEquity: r.brandEquity,
        supplyIndex: r.supplyIndex,
        profitB: r.results.operatingProfit / 1_000_000_000,
        shareChange: r.results.marketShare,
        event: r.event,
      };
    });
  }, [roundHistory]);

  // heatmap 색상: value / maxAbs 0-1 → green ↔ red
  const maxProfit = Math.max(...rows.map((r) => Math.abs(r.profitB)), 0.01);
  const profitColor = (v: number) => {
    const intensity = Math.min(1, Math.abs(v) / maxProfit);
    if (v > 0) return `rgba(16, 185, 129, ${0.15 + intensity * 0.4})`;
    return `rgba(239, 68, 68, ${0.15 + intensity * 0.4})`;
  };

  return (
    <div className="border rounded-lg p-4 mb-6" style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--biz-text)' }}>
        분기별 의사결정 · 성과 타임라인
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--biz-border)' }}>
              <th className="text-left px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>분기</th>
              <th className="text-right px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>평균가</th>
              <th className="text-right px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>평균품질</th>
              <th className="text-right px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>광고</th>
              <th className="text-right px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>R&D</th>
              <th className="text-right px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>개선%</th>
              <th className="text-right px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>서비스</th>
              <th className="text-right px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>인력</th>
              <th className="text-right px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>브랜드</th>
              <th className="text-right px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>SPI</th>
              <th className="text-right px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>영업이익</th>
              <th className="text-right px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>점유</th>
              <th className="text-left px-2 py-1.5" style={{ color: 'var(--biz-text-muted)' }}>이벤트</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const prev = i > 0 ? rows[i - 1] : null;
              const priceChanged = prev && Math.abs(r.avgPrice - prev.avgPrice) > 5_000;
              const qualityChanged = prev && r.avgQuality !== prev.avgQuality;
              const adChanged = prev && Math.abs(r.totalAd - prev.totalAd) > 100_000_000;
              const serviceChanged = prev && r.serviceCapacity !== prev.serviceCapacity;
              const headcountChanged = prev && r.headcount !== prev.headcount;
              const improveChanged = prev && r.improvePct !== prev.improvePct;

              const chip = (changed: boolean | null) => changed ? { background: '#fff7ed', fontWeight: 600 } : {};

              return (
                <tr key={r.round} style={{ borderBottom: '1px solid var(--biz-border)' }}>
                  <td className="px-2 py-1.5 font-semibold" style={{ color: 'var(--biz-text)' }}>R{r.round}</td>
                  <td className="text-right px-2 py-1.5 font-mono" style={{ ...chip(priceChanged), color: 'var(--biz-text)' }}>
                    {(r.avgPrice / 10_000).toFixed(0)}만
                  </td>
                  <td className="text-right px-2 py-1.5 font-mono" style={{ ...chip(qualityChanged), color: 'var(--biz-text)' }}>
                    {r.avgQuality.toFixed(1)}
                  </td>
                  <td className="text-right px-2 py-1.5 font-mono" style={{ ...chip(adChanged), color: 'var(--biz-text)' }}>
                    {(r.totalAd / 1_000_000_000).toFixed(1)}B
                  </td>
                  <td className="text-right px-2 py-1.5 font-mono" style={{ color: 'var(--biz-text)' }}>
                    {(r.rdBudget / 1_000_000_000).toFixed(1)}B
                  </td>
                  <td className="text-right px-2 py-1.5 font-mono" style={{ ...chip(improveChanged), color: 'var(--biz-text)' }}>
                    {r.improvePct}%
                  </td>
                  <td className="text-right px-2 py-1.5 font-mono" style={{ ...chip(serviceChanged), color: 'var(--biz-text)' }}>
                    {(r.serviceCapacity / 1000).toFixed(0)}k
                  </td>
                  <td className="text-right px-2 py-1.5 font-mono" style={{ ...chip(headcountChanged), color: 'var(--biz-text)' }}>
                    {r.headcount}명
                  </td>
                  <td className="text-right px-2 py-1.5 font-mono" style={{ color: 'var(--biz-text)' }}>
                    {r.brandEquity.toFixed(0)}
                  </td>
                  <td
                    className="text-right px-2 py-1.5 font-mono"
                    style={{
                      background: r.supplyIndex > 1.1 ? '#fef2f2' : r.supplyIndex < 0.95 ? '#ecfdf5' : 'transparent',
                      color: 'var(--biz-text)',
                    }}
                  >
                    ×{r.supplyIndex.toFixed(2)}
                  </td>
                  <td className="text-right px-2 py-1.5 font-mono" style={{ background: profitColor(r.profitB), color: 'var(--biz-text)' }}>
                    {r.profitB >= 0 ? '+' : ''}{r.profitB.toFixed(1)}B
                  </td>
                  <td className="text-right px-2 py-1.5 font-mono" style={{ color: 'var(--biz-text)' }}>
                    {r.shareChange}%
                  </td>
                  <td className="px-2 py-1.5 text-[10px]" style={{ color: 'var(--biz-text-muted)' }}>
                    {r.event.id !== 'calm' ? (
                      <span
                        className="px-1 py-0.5 rounded"
                        style={{
                          background: r.event.severity === 'good' ? '#ecfdf5' : '#fef2f2',
                          color: r.event.severity === 'good' ? '#047857' : '#b91c1c',
                        }}
                      >
                        {r.event.title}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-[10px]" style={{ color: 'var(--biz-text-muted)' }}>
        <span style={{ background: '#fff7ed', padding: '1px 4px', borderRadius: 2 }}>하이라이트</span> = 이전 분기 대비 변경된 결정
        · 영업이익 셀 색상 = 흑자(녹색)/적자(적색) 강도
      </div>
    </div>
  );
}
