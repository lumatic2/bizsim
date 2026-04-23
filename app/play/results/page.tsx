'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { MetricCard } from '@/components/MetricCard';
import { AIDebrief } from '@/components/AIDebrief';
import { PERSONAS } from '@/lib/personas';
import { computeBCGPositions } from '@/lib/bcg';
import { computeCLV } from '@/lib/clv';
import { computeDelta, topAttribution } from '@/lib/round-delta';
import { analyzeCompetitor } from '@/lib/competitor-trend';
import type { SimulationResults, Decisions, RoundSnapshot } from '@/lib/types';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer, ZAxis } from 'recharts';

function formatKRW(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `₩${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `₩${(value / 1_000_000).toFixed(0)}M`;
  return `₩${value.toLocaleString()}`;
}

export default function ResultsPage() {
  const router = useRouter();
  const { results, decisions, currentRound, roundHistory, roundDebriefs, setRoundDebrief, currentEvent, brandEquity, supplyIndex, cumulativeProduction, cumulativeImproveRd, cumulativeExploreRd } = useGameStore();
  const [competitorTab, setCompetitorTab] = useState<'market' | 'ads' | 'channels'>('market');

  const previousResults = useMemo(() => {
    const prev = roundHistory[roundHistory.length - 1];
    return prev ? prev.results : null;
  }, [roundHistory]);

  const debriefPayload = useMemo(
    () =>
      results
        ? { mode: 'round' as const, round: currentRound, decisions, results, previousResults, event: currentEvent, brandEquity, supplyIndex, cumulativeProduction, cumulativeImproveRd, cumulativeExploreRd, roundHistory }
        : null,
    [results, currentRound, decisions, previousResults, currentEvent, brandEquity, supplyIndex, cumulativeProduction, cumulativeImproveRd, cumulativeExploreRd, roundHistory],
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

      <div className="grid grid-cols-4 gap-3 mb-4">
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

      {/* 라운드 간 변화 카드 */}
      {previousResults && (
        <RoundChangeCard
          cur={results}
          prev={previousResults}
          curDecisions={decisions}
          prevDecisions={roundHistory[roundHistory.length - 1]!.decisions}
          curEvent={currentEvent}
          supplyIndexDelta={supplyIndex - (roundHistory[roundHistory.length - 1]?.supplyIndex ?? supplyIndex)}
        />
      )}

      {/* CLV 대시보드 */}
      <CLVCard results={results} brandEquity={brandEquity} />


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

      {/* BCG 매트릭스 — 상대점유율 × 시장성장률 */}
      <BCGMatrix results={results} decisions={decisions} roundHistory={roundHistory} />

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

            {/* 우리 회사 제품 A/B */}
            <Scatter
              name="우리회사"
              data={decisions.products.map((p) => ({
                x: 15 - ((p.price - 200_000) / 300_000) * 30,
                y: (p.quality - 3) * 4,
                z: 200,
                name: `${p.id}·${p.name}`,
              }))}
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

      {/* 경쟁사 프로파일 드릴다운 — 전략 추이 + 태그 */}
      <CompetitorProfiles results={results} roundHistory={roundHistory} />

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
                    <th className="text-right px-3 py-2 text-white font-semibold">검색</th>
                    <th className="text-right px-3 py-2 text-white font-semibold">디스플레이</th>
                    <th className="text-right px-3 py-2 text-white font-semibold">인플루언서</th>
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
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(decisions.adBudget.search / 1_000_000).toFixed(0)}M</td>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(decisions.adBudget.display / 1_000_000).toFixed(0)}M</td>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(decisions.adBudget.influencer / 1_000_000).toFixed(0)}M</td>
                    <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{((decisions.adBudget.search + decisions.adBudget.display + decisions.adBudget.influencer) / 1_000_000).toFixed(0)}M</td>
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
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(c.adBudget / 3 / 1_000_000).toFixed(0)}M</td>
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(c.adBudget / 3 / 1_000_000).toFixed(0)}M</td>
                      <td className="text-right px-3 py-2" style={{ color: 'var(--biz-text)' }}>{(c.adBudget / 3 / 1_000_000).toFixed(0)}M</td>
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

function CompetitorProfiles({ results, roundHistory }: { results: SimulationResults; roundHistory: RoundSnapshot[] }) {
  const trends = useMemo(
    () => results.competitors.map((c) => analyzeCompetitor(c.name, roundHistory, c)),
    [results.competitors, roundHistory],
  );
  if (roundHistory.length === 0) return null;

  return (
    <div className="border rounded-lg p-4 mb-6" style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }}>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--biz-text)' }}>경쟁사 프로파일 드릴다운</h3>
        <span className="text-[11px]" style={{ color: 'var(--biz-text-muted)' }}>라운드 추이 + 전략 태그</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {trends.map((t, i) => {
          const latest = results.competitors[i];
          return (
            <div key={t.name} className="border rounded p-3" style={{ borderColor: 'var(--biz-border)' }}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--biz-text)' }}>{t.name}</span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--biz-text)' }}>{latest.marketShare}%</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {t.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: tag === '공격적 가격전략' || tag === '광고 공세' ? '#fef2f2'
                        : tag === '품질 추격' || tag === '점유율 상승' ? '#fff7ed'
                        : tag === '수비 전환' ? '#eff6ff'
                        : 'var(--biz-primary-light)',
                      color: tag === '공격적 가격전략' || tag === '광고 공세' ? '#b91c1c'
                        : tag === '품질 추격' || tag === '점유율 상승' ? '#b45309'
                        : tag === '수비 전환' ? '#1d4ed8'
                        : 'var(--biz-text-muted)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]" style={{ color: 'var(--biz-text-muted)' }}>
                <Sparkline label="가격" series={t.priceSeries} format={(v) => `${(v / 10_000).toFixed(0)}만`} />
                <Sparkline label="품질" series={t.qualitySeries} format={(v) => v.toFixed(1)} />
                <Sparkline label="광고" series={t.adSeries} format={(v) => `${(v / 1_000_000_000).toFixed(1)}B`} />
                <Sparkline label="점유" series={t.shareSeries} format={(v) => `${v.toFixed(1)}%`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Sparkline({ label, series, format }: { label: string; series: number[]; format: (v: number) => string }) {
  if (series.length === 0) return null;
  const width = 60;
  const height = 16;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const points = series.map((v, i) => {
    const x = (i / Math.max(1, series.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  const last = series[series.length - 1];
  const first = series[0];
  const direction = last - first;
  const color = direction > 0 ? '#047857' : direction < 0 ? '#b91c1c' : 'var(--biz-text-muted)';

  return (
    <div className="flex items-center justify-between gap-1">
      <span className="whitespace-nowrap">{label}</span>
      <svg width={width} height={height} style={{ flexShrink: 0 }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
      </svg>
      <span className="font-mono" style={{ color: 'var(--biz-text)' }}>{format(last)}</span>
    </div>
  );
}

type RoundChangeCardProps = {
  cur: SimulationResults;
  prev: SimulationResults;
  curDecisions: Decisions;
  prevDecisions: Decisions;
  curEvent: import('@/lib/types').RoundEvent;
  supplyIndexDelta: number;
};

function RoundChangeCard({ cur, prev, curDecisions, prevDecisions, curEvent, supplyIndexDelta }: RoundChangeCardProps) {
  const d = useMemo(() => computeDelta(cur, prev), [cur, prev]);
  const attribution = useMemo(
    () => topAttribution(curDecisions, prevDecisions, curEvent, supplyIndexDelta),
    [curDecisions, prevDecisions, curEvent, supplyIndexDelta],
  );

  const Item = ({ label, value, digits = 1, suffix = '' }: { label: string; value: number; digits?: number; suffix?: string }) => {
    const color = value > 0.001 ? '#047857' : value < -0.001 ? '#b91c1c' : 'var(--biz-text-muted)';
    const sign = value > 0 ? '+' : '';
    return (
      <div className="flex flex-col items-center px-3 py-2 border rounded" style={{ borderColor: 'var(--biz-border)' }}>
        <span className="text-[10px]" style={{ color: 'var(--biz-text-muted)' }}>{label}</span>
        <span className="text-sm font-mono font-semibold" style={{ color }}>{sign}{value.toFixed(digits)}{suffix}</span>
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 mb-4" style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }}>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--biz-text)' }}>이전 분기 대비 변화</h3>
        {attribution && (
          <span
            className="text-[11px] px-2 py-0.5 rounded border"
            style={{
              borderColor: 'var(--biz-border)',
              background: attribution.impact === 'up' ? '#ecfdf5' : attribution.impact === 'down' ? '#fef2f2' : 'var(--biz-card)',
              color: attribution.impact === 'up' ? '#047857' : attribution.impact === 'down' ? '#b91c1c' : 'var(--biz-text-muted)',
            }}
          >
            주요 변수: {attribution.label}
          </span>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2">
        <Item label="점유율" value={d.marketShare} digits={1} suffix="%p" />
        <Item label="매출" value={d.revenueB} digits={1} suffix="B" />
        <Item label="영업이익" value={d.operatingProfitB} digits={1} suffix="B" />
        <Item label="만족도" value={d.satisfaction} digits={0} />
        <Item label="판매" value={d.unitsSold} digits={0} suffix="대" />
      </div>
    </div>
  );
}

type CLVCardProps = {
  results: SimulationResults;
  brandEquity: number;
};

function CLVCard({ results, brandEquity }: CLVCardProps) {
  const clv = useMemo(
    () => computeCLV(results.revenue, results.unitsSold, results.satisfaction, brandEquity),
    [results.revenue, results.unitsSold, results.satisfaction, brandEquity],
  );
  const clvMillion = clv.clv / 1_000_000;
  const retentionPct = clv.retention * 100;
  return (
    <div
      className="border rounded-lg p-4 mb-6"
      style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--biz-text)' }}>Customer Lifetime Value (CLV)</h3>
        <span className="text-[11px]" style={{ color: 'var(--biz-text-muted)' }}>평균 객단가 × 기대 재구매 횟수</span>
      </div>
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div style={{ background: 'var(--biz-primary-light)', borderColor: 'var(--biz-border)' }} className="border rounded-md p-3">
          <div className="text-[11px]" style={{ color: 'var(--biz-text-muted)' }}>CLV</div>
          <div className="text-xl font-[Manrope] font-bold" style={{ color: 'var(--biz-primary)' }}>
            ₩{clvMillion >= 1 ? `${clvMillion.toFixed(2)}M` : `${(clv.clv / 1_000).toFixed(0)}K`}
          </div>
        </div>
        <div className="border rounded-md p-3" style={{ borderColor: 'var(--biz-border)' }}>
          <div className="text-[11px]" style={{ color: 'var(--biz-text-muted)' }}>평균 객단가 (AOV)</div>
          <div className="text-base font-mono" style={{ color: 'var(--biz-text)' }}>
            ₩{clv.aov >= 1_000_000 ? `${(clv.aov / 1_000_000).toFixed(2)}M` : `${(clv.aov / 10_000).toFixed(1)}만`}
          </div>
        </div>
        <div className="border rounded-md p-3" style={{ borderColor: 'var(--biz-border)' }}>
          <div className="text-[11px]" style={{ color: 'var(--biz-text-muted)' }}>분기 재구매 확률</div>
          <div className="text-base font-mono" style={{ color: 'var(--biz-text)' }}>{retentionPct.toFixed(1)}%</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--biz-text-muted)' }}>
            만족 {(clv.satisfactionContribution * 100).toFixed(0)}% + 브랜드 {(clv.brandContribution * 100).toFixed(0)}%
          </div>
        </div>
        <div className="border rounded-md p-3" style={{ borderColor: 'var(--biz-border)' }}>
          <div className="text-[11px]" style={{ color: 'var(--biz-text-muted)' }}>기대 재구매 횟수</div>
          <div className="text-base font-mono" style={{ color: 'var(--biz-text)' }}>{clv.repurchaseCycles.toFixed(1)}회</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--biz-text-muted)' }}>무한등비급수 근사, 상한 20회</div>
        </div>
      </div>
      <div className="text-[11px] mt-3 px-3 py-2 rounded" style={{ background: 'var(--biz-primary-light)', color: 'var(--biz-text-muted)' }}>
        {clv.retention >= 0.7
          ? `로열티 강함 — 광고 확대로 신규 유입해도 회수 가능 (CLV 기여 ${clv.repurchaseCycles.toFixed(1)}회)`
          : clv.retention >= 0.5
          ? `리텐션 정상 범위 — 만족도·브랜드 투자가 CLV 복리로 작용`
          : `리텐션 낮음 — 가격 인하·광고 확대 전에 만족도(서비스 capacity, 품질)·브랜드 우선 회복 권장`}
      </div>
    </div>
  );
}

type BCGMatrixProps = {
  results: SimulationResults;
  decisions: Decisions;
  roundHistory: RoundSnapshot[];
};

function BCGMatrix({ results, decisions, roundHistory }: BCGMatrixProps) {
  const positions = useMemo(
    () => computeBCGPositions(results, decisions, roundHistory),
    [results, decisions, roundHistory],
  );

  // 차트 범위 고정 — 제품이 축 바깥에 있으면 clamp (1 이상 상대점유율은 리더 영역으로 시각화)
  const maxRel = Math.max(2.0, ...positions.map((p) => p.relativeShare));
  const xMax = Math.min(3.0, Math.ceil(maxRel * 2) / 2);
  const yMin = -5;
  const yMax = Math.max(15, ...positions.map((p) => p.growth + 2));

  const chartData = positions.map((p) => ({
    x: Math.min(p.relativeShare, xMax),
    y: p.growth,
    z: Math.max(50, Math.min(400, p.revenueB * 60 + 80)),
    name: `${p.productId}·${p.name}`,
    quadrant: p.quadrant,
    relativeShare: p.relativeShare.toFixed(2),
    productShare: p.productShare.toFixed(1),
    revenueB: p.revenueB.toFixed(1),
  }));

  return (
    <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--biz-text)' }}>BCG 매트릭스 — 상대점유율 × 시장성장률</h3>
        <span className="text-[11px]" style={{ color: 'var(--biz-text-muted)' }}>버블 크기 = 제품 매출</span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--biz-border)" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, xMax]}
            label={{ value: '상대 시장점유율 (우리 / 최대 경쟁사)', position: 'insideBottomRight', offset: -10 }}
            style={{ fontSize: '12px', fill: 'var(--biz-text-muted)' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[yMin, yMax]}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            label={{ value: '시장 성장률', angle: -90, position: 'insideLeft' }}
            style={{ fontSize: '12px', fill: 'var(--biz-text-muted)' }}
          />
          <ZAxis type="number" dataKey="z" range={[60, 400]} />

          {/* 4분면 라벨 배경 */}
          <ReferenceArea x1={1} x2={xMax} y1={5} y2={yMax} fill="#fef3c7" fillOpacity={0.35} label={{ value: 'Star', position: 'insideTopRight', fill: '#b45309', fontSize: 11, fontWeight: 600 }} />
          <ReferenceArea x1={1} x2={xMax} y1={yMin} y2={5} fill="#dbeafe" fillOpacity={0.35} label={{ value: 'Cash Cow', position: 'insideBottomRight', fill: '#1e40af', fontSize: 11, fontWeight: 600 }} />
          <ReferenceArea x1={0} x2={1} y1={5} y2={yMax} fill="#ede9fe" fillOpacity={0.35} label={{ value: 'Question Mark', position: 'insideTopLeft', fill: '#6d28d9', fontSize: 11, fontWeight: 600 }} />
          <ReferenceArea x1={0} x2={1} y1={yMin} y2={5} fill="#f1f5f9" fillOpacity={0.5} label={{ value: 'Dog', position: 'insideBottomLeft', fill: '#475569', fontSize: 11, fontWeight: 600 }} />

          <ReferenceLine x={1} stroke="var(--biz-border)" strokeDasharray="5 5" />
          <ReferenceLine y={5} stroke="var(--biz-border)" strokeDasharray="5 5" />

          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ background: 'var(--biz-card)', border: '1px solid var(--biz-border)', borderRadius: '6px', fontSize: '12px' }}
            labelStyle={{ color: 'var(--biz-text)' }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const d = payload[0].payload as typeof chartData[number];
              return (
                <div style={{ background: 'var(--biz-card)', border: '1px solid var(--biz-border)', borderRadius: 6, padding: 8, fontSize: 12, color: 'var(--biz-text)' }}>
                  <div style={{ fontWeight: 600 }}>{d.name}</div>
                  <div>상대점유율 <span style={{ fontFamily: 'monospace' }}>{d.relativeShare}</span></div>
                  <div>시장점유율 <span style={{ fontFamily: 'monospace' }}>{d.productShare}%</span></div>
                  <div>매출 <span style={{ fontFamily: 'monospace' }}>₩{d.revenueB}B</span></div>
                  <div style={{ marginTop: 2, color: 'var(--biz-text-muted)', fontSize: 11 }}>{d.quadrant === 'star' ? 'Star · 공격 투자' : d.quadrant === 'cashCow' ? 'Cash Cow · 현금창출' : d.quadrant === 'questionMark' ? 'Question Mark · 선택 집중' : 'Dog · 퇴출 검토'}</div>
                </div>
              );
            }}
          />
          <Scatter name="제품" data={chartData} fill="#0066cc" />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]" style={{ color: 'var(--biz-text-muted)' }}>
        {positions.map((p) => (
          <div key={p.productId} className="flex items-center justify-between border rounded px-2 py-1" style={{ borderColor: 'var(--biz-border)' }}>
            <span style={{ color: 'var(--biz-text)', fontWeight: 600 }}>{p.productId}·{p.name}</span>
            <span className="font-mono">rel {p.relativeShare.toFixed(2)} · g {p.growth.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}


