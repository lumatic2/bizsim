'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { MetricCard } from '@/components/MetricCard';
import { AIDebrief } from '@/components/AIDebrief';
import { PERSONAS } from '@/lib/personas';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, ZAxis } from 'recharts';

function formatKRW(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `₩${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `₩${(value / 1_000_000).toFixed(0)}M`;
  return `₩${value.toLocaleString()}`;
}

export default function ResultsPage() {
  const router = useRouter();
  const { results, decisions, currentRound, roundHistory, roundDebriefs, setRoundDebrief } = useGameStore();
  const [competitorTab, setCompetitorTab] = useState<'market' | 'ads' | 'channels'>('market');

  const previousResults = useMemo(() => {
    const prev = roundHistory[roundHistory.length - 1];
    return prev ? prev.results : null;
  }, [roundHistory]);

  const debriefPayload = useMemo(
    () =>
      results
        ? { mode: 'round' as const, round: currentRound, decisions, results, previousResults }
        : null,
    [results, currentRound, decisions, previousResults],
  );

  useEffect(() => {
    if (!results) {
      router.push('/play');
    }
  }, [results, router]);

  if (!results) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-[Manrope] font-bold mb-2" style={{ color: 'var(--biz-text)' }}>
        {currentRound}분기 시뮬레이션 결과
      </h1>
      <p style={{ color: 'var(--biz-text-muted)' }} className="text-sm mb-6">
        {currentRound}분기 경영 시뮬레이션의 최종 결과입니다.
      </p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <MetricCard label="시장점유율" value={`${results.marketShare}%`} delta={`Round ${currentRound}`} deltaUp />
        <MetricCard label="매출" value={formatKRW(results.revenue)} delta={`Round ${currentRound}`} deltaUp={results.revenue > 0} />
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

      {debriefPayload && (
        <AIDebrief
          key={`round-${currentRound}`}
          mode="round"
          round={currentRound}
          payload={debriefPayload}
          cachedText={roundDebriefs[currentRound]}
          onComplete={(text) => setRoundDebrief(currentRound, text)}
        />
      )}

      {/* 포지셔닝 맵 */}
      <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--biz-text)' }}>포지셔닝 맵 — Economy × Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--biz-border)" />
            <XAxis
              type="number"
              dataKey="x"
              label={{ value: 'Economy (저가 ↔ 고가)', position: 'insideBottomRight', offset: -10 }}
              style={{ fontSize: '12px', fill: 'var(--biz-text-muted)' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              label={{ value: 'Performance', angle: -90, position: 'insideLeft' }}
              style={{ fontSize: '12px', fill: 'var(--biz-text-muted)' }}
            />
            <ZAxis type="number" dataKey="z" range={[50, 200]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ background: 'var(--biz-card)', border: '1px solid var(--biz-border)', borderRadius: '6px' }}
              labelStyle={{ color: 'var(--biz-text)' }}
              formatter={(value) => value}
              labelFormatter={(label) => `${label}`}
            />
            <ReferenceLine x={0} stroke="var(--biz-border)" strokeDasharray="5 5" />
            <ReferenceLine y={0} stroke="var(--biz-border)" strokeDasharray="5 5" />

            {/* 우리 회사 */}
            <Scatter
              name="우리회사"
              data={[{
                x: 15 - ((decisions.price - 200_000) / 300_000) * 30,
                y: (decisions.quality - 3) * 4,
                z: 200,
                name: '우리회사'
              }]}
              fill="#0066cc"
            />

            {/* 경쟁사 */}
            <Scatter
              name="경쟁사"
              data={results.competitors.map((c) => ({
                x: 15 - ((c.price - 200_000) / 300_000) * 30,
                y: (c.quality - 3) * 4,
                z: 150,
                name: c.name,
              }))}
              fill="#94a3b8"
            />

            {/* 이상점 (고객 세그먼트 중심) */}
            <Scatter
              name="이상점"
              data={[
                { x: -10, y: 12, z: 80, name: '얼리어답터' },
                { x: -5,  y: 5,  z: 80, name: '브랜드충성' },
                { x: 10,  y: -5, z: 80, name: '가성비추구' },
              ]}
              fill="#fbbf24"
              fillOpacity={0.7}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* 경쟁사 인텔리전스 */}
      <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--biz-text)' }}>경쟁사 인텔리전스</h3>

        {/* 탭 버튼 */}
        <div className="flex gap-2 mb-4 border-b" style={{ borderBottomColor: 'var(--biz-border)' }}>
          {[
            { id: 'market' as const, label: '시장 현황' },
            { id: 'ads' as const, label: '광고 지출' },
            { id: 'channels' as const, label: '유통 채널' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCompetitorTab(tab.id)}
              className="px-4 py-2 text-sm font-medium transition-colors rounded-t-lg"
              style={{
                background: competitorTab === tab.id ? 'var(--biz-primary)' : 'transparent',
                color: competitorTab === tab.id ? 'white' : 'var(--biz-text-muted)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--biz-primary)' }}>
                <th className="text-left px-3 py-2 text-white font-semibold">회사</th>
                {competitorTab === 'market' && (
                  <>
                    <th className="text-right px-3 py-2 text-white font-semibold">시장점유율</th>
                    <th className="text-right px-3 py-2 text-white font-semibold">매출</th>
                    <th className="text-right px-3 py-2 text-white font-semibold">판매량</th>
                  </>
                )}
                {competitorTab === 'ads' && (
                  <>
                    <th className="text-right px-3 py-2 text-white font-semibold">온라인</th>
                    <th className="text-right px-3 py-2 text-white font-semibold">마트</th>
                    <th className="text-right px-3 py-2 text-white font-semibold">직영</th>
                    <th className="text-right px-3 py-2 text-white font-semibold">합계</th>
                  </>
                )}
                {competitorTab === 'channels' && (
                  <>
                    <th className="text-right px-3 py-2 text-white font-semibold">온라인</th>
                    <th className="text-right px-3 py-2 text-white font-semibold">마트</th>
                    <th className="text-right px-3 py-2 text-white font-semibold">직영</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {/* 우리 회사 */}
              <tr style={{ background: '#fef9c3' }}>
                <td className="px-3 py-2" style={{ color: 'var(--biz-text)' }}>우리회사</td>
                {competitorTab === 'market' && (
                  <>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{results.marketShare}%</td>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{formatKRW(results.revenue)}</td>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{results.unitsSold.toLocaleString()}대</td>
                  </>
                )}
                {competitorTab === 'ads' && (
                  <>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(decisions.adBudget * 0.4 / 1_000_000).toFixed(0)}M</td>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(decisions.adBudget * 0.35 / 1_000_000).toFixed(0)}M</td>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(decisions.adBudget * 0.25 / 1_000_000).toFixed(0)}M</td>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(decisions.adBudget / 1_000_000).toFixed(0)}M</td>
                  </>
                )}
                {competitorTab === 'channels' && (
                  <>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{decisions.channels.online}%</td>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{decisions.channels.mart}%</td>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{decisions.channels.direct}%</td>
                  </>
                )}
              </tr>

              {/* 경쟁사 동적 렌더링 */}
              {results.competitors.map((c, idx) => (
                <tr key={c.name} style={{ borderBottomColor: 'var(--biz-border)' }} className={idx === results.competitors.length - 1 ? '' : 'border-b'}>
                  <td className="px-3 py-2" style={{ color: 'var(--biz-text)' }}>{c.name}</td>
                  {competitorTab === 'market' && (
                    <>
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{c.marketShare}%</td>
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{formatKRW(c.revenue)}</td>
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{c.unitsSold.toLocaleString()}대</td>
                    </>
                  )}
                  {competitorTab === 'ads' && (
                    <>
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(c.adBudget * 0.4 / 1_000_000).toFixed(0)}M</td>
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(c.adBudget * 0.35 / 1_000_000).toFixed(0)}M</td>
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(c.adBudget * 0.25 / 1_000_000).toFixed(0)}M</td>
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(c.adBudget / 1_000_000).toFixed(0)}M</td>
                    </>
                  )}
                  {competitorTab === 'channels' && (
                    <>
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{c.channels.online}%</td>
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{c.channels.mart}%</td>
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{c.channels.direct}%</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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


