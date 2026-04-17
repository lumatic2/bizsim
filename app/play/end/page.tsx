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

      <div className="grid grid-cols-4 gap-3 mb-6">
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
