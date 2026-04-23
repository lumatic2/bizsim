'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { DecisionSlider } from '@/components/DecisionSlider';
import { runSimulation } from '@/lib/game-engine';
import { getMarketSize } from '@/lib/competitor-ai';
import { INITIAL_PPE, productionCapacityFrom } from '@/lib/financial-mapper';
import type { ProductId } from '@/lib/types';

function formatBillion(v: number) {
  return (v / 1_000_000_000).toFixed(1);
}

function formatMan(v: number) {
  return (v / 10_000).toFixed(1);
}

export default function DecisionPage() {
  const router = useRouter();
  const { decisions, setDecisions, setChannels, setProduct, currentRound, competitors, qualityCap, resetGame, roundHistory, currentEvent, brandEquity, cumulativeLoss, previousBS } = useGameStore();
  const [activeProduct, setActiveProduct] = useState<ProductId>('A');
  const capacity = productionCapacityFrom(previousBS?.ppe ?? INITIAL_PPE);
  const preview = useMemo(() => {
    const marketSize = getMarketSize(currentRound);
    return runSimulation(decisions, competitors, marketSize, qualityCap, currentEvent, brandEquity, capacity);
  }, [decisions, currentRound, competitors, qualityCap, currentEvent, brandEquity, capacity]);

  const totalAd = decisions.adBudget.search + decisions.adBudget.display + decisions.adBudget.influencer;
  const totalProductionCost = decisions.products.reduce(
    (sum, p) => sum + p.production * (120_000 + (p.quality - 1) * 25_000),
    0,
  );
  const totalCost = totalAd + decisions.rdBudget / 4 + totalProductionCost + 100_000_000;

  const product = decisions.products.find((p) => p.id === activeProduct) ?? decisions.products[0];

  const handleChannelChange = (key: 'online' | 'mart' | 'direct', value: number) => {
    const others = { ...decisions.channels };
    others[key] = value;
    const total = others.online + others.mart + others.direct;
    if (total !== 100) {
      const remaining = 100 - value;
      const otherKeys = (['online', 'mart', 'direct'] as const).filter((k) => k !== key);
      const otherTotal = otherKeys.reduce((s, k) => s + others[k], 0);
      if (otherTotal > 0) {
        for (const k of otherKeys) {
          others[k] = Math.round((others[k] / otherTotal) * remaining);
        }
        const diff = remaining - otherKeys.reduce((s, k) => s + others[k], 0);
        others[otherKeys[0]] += diff;
      } else {
        others[otherKeys[0]] = remaining;
      }
    }
    setChannels(others);
  };

  const competitorData = useMemo(() => {
    const companyData = competitors.map((c) => ({
      name: c.name,
      revenueB: Number((c.revenue / 1_000_000_000).toFixed(1)),
    }));
    const ours = { name: '우리회사', revenueB: Number((preview.revenue / 1_000_000_000).toFixed(1)) };
    return [ours, ...companyData];
  }, [preview.revenue, competitors]);

  const maxRevenueB = Math.max(...competitorData.map((c) => c.revenueB), 1);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div style={{ background: 'var(--biz-primary-light)', borderColor: 'var(--biz-primary)' }} className="border rounded-lg p-3 mb-2 flex items-center gap-4 text-sm">
        <span style={{ background: 'var(--biz-primary)', color: 'white' }} className="px-2 py-0.5 rounded text-xs font-semibold">Round {currentRound}</span>
        <span style={{ color: 'var(--biz-text)' }}>한국 스마트홈 가전 시장 · 2026년 · 경기 보통 · 경쟁사 3개</span>
        {(currentRound > 1 || roundHistory.length > 0) && (
          <button
            onClick={() => {
              if (confirm('진행 중인 게임을 초기화하시겠습니까? 저장된 라운드 기록이 모두 삭제됩니다.')) {
                resetGame();
              }
            }}
            style={{ color: 'var(--biz-text-muted)', borderColor: 'var(--biz-border)' }}
            className="ml-auto text-xs border px-2 py-0.5 rounded hover:opacity-75"
          >
            게임 초기화
          </button>
        )}
      </div>

      {currentEvent.id !== 'calm' && (
        <div
          className="border-l-4 rounded-md px-4 py-3 text-sm flex items-start gap-3"
          style={{
            background: currentEvent.severity === 'good' ? '#ecfdf5' : '#fef2f2',
            borderColor: currentEvent.severity === 'good' ? '#10b981' : '#ef4444',
            color: 'var(--biz-text)',
          }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: currentEvent.severity === 'good' ? '#047857' : '#b91c1c' }}>
            {currentEvent.severity === 'good' ? '기회' : '리스크'}
          </span>
          <div>
            <div className="font-semibold">{currentEvent.title}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--biz-text-muted)' }}>{currentEvent.description}</div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--biz-text-muted)' }}>
        <span>브랜드 에쿼티</span>
        <div className="flex-1 max-w-xs h-2 rounded-full" style={{ background: '#e2e8f0' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ background: 'var(--biz-primary)', width: `${brandEquity}%` }}
          />
        </div>
        <span className="font-mono" style={{ color: 'var(--biz-text)' }}>{brandEquity.toFixed(0)} / 100</span>
        {cumulativeLoss > 0 && (
          <span className="ml-4" title="이월결손금 — 다음 흑자 분기부터 과세표준에서 차감됨">
            이월결손금 <span className="font-mono" style={{ color: 'var(--biz-text)' }}>₩{formatBillion(cumulativeLoss)}B</span>
          </span>
        )}
      </div>

      <h2 className="text-xs font-[Manrope] font-bold uppercase tracking-wider" style={{ color: 'var(--biz-text-muted)' }}>의사결정 레버</h2>

      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-4">
          <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 space-y-3">
            <div className="flex gap-1 -mt-1 -mx-1">
              {decisions.products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProduct(p.id)}
                  className="flex-1 text-xs px-3 py-2 rounded-md font-semibold transition-colors"
                  style={{
                    background: activeProduct === p.id ? 'var(--biz-primary)' : 'transparent',
                    color: activeProduct === p.id ? 'white' : 'var(--biz-text-muted)',
                    borderColor: activeProduct === p.id ? 'var(--biz-primary)' : 'var(--biz-border)',
                  }}
                >
                  {p.id} · {p.name}
                </button>
              ))}
            </div>
            <DecisionSlider
              label={`${product.name} · 가격`}
              value={product.price}
              min={200_000}
              max={500_000}
              step={10_000}
              unit="/ 대"
              formatValue={(v) => `₩${formatMan(v)}만`}
              onChange={(v) => setProduct(product.id, { price: v })}
            />
            <DecisionSlider
              label={`${product.name} · 품질`}
              value={product.quality}
              min={1}
              max={Math.floor(qualityCap)}
              step={1}
              unit=""
              formatValue={(v) => '★'.repeat(v) + '☆'.repeat(5 - v)}
              onChange={(v) => setProduct(product.id, { quality: v })}
            />
            <DecisionSlider
              label={`${product.name} · 생산`}
              value={product.production}
              min={2_000}
              max={20_000}
              step={500}
              unit="대"
              formatValue={(v) => v.toLocaleString()}
              onChange={(v) => setProduct(product.id, { production: v })}
            />
          </div>

          <DecisionSlider
            label="R&D 투자 (공유)"
            value={decisions.rdBudget}
            min={0}
            max={5_000_000_000}
            step={100_000_000}
            unit="/ 분기"
            formatValue={(v) => `₩${formatBillion(v)}B`}
            onChange={(v) => setDecisions({ rdBudget: v })}
          />
          <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: 'var(--biz-text-muted)' }}>마케팅 믹스 (분기)</div>
              <div className="text-xs font-mono" style={{ color: 'var(--biz-text)' }}>합계 ₩{formatBillion(totalAd)}B</div>
            </div>
            {(
              [
                { key: 'search' as const, label: '검색 광고', hint: '박민수(얼리어답터) 반응 큼' },
                { key: 'display' as const, label: '디스플레이', hint: '이순자(주부) 반응 큼' },
                { key: 'influencer' as const, label: '인플루언서', hint: '김지현(맞벌이) 반응 큼' },
              ]
            ).map(({ key, label, hint }) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--biz-text-muted)' }}>
                    {label}
                    <span className="ml-2 text-[10px]" style={{ color: 'var(--biz-text-muted)', opacity: 0.75 }}>{hint}</span>
                  </span>
                  <span className="font-mono" style={{ color: 'var(--biz-text)' }}>₩{formatBillion(decisions.adBudget[key])}B</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1_000_000_000}
                  step={25_000_000}
                  value={decisions.adBudget[key]}
                  onChange={(e) => setDecisions({ adBudget: { ...decisions.adBudget, [key]: Number(e.target.value) } })}
                  className="w-full accent-gray-900"
                />
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4">
            <div className="text-xs mb-3" style={{ color: 'var(--biz-text-muted)' }}>유통 채널 배분 (공유)</div>
            {(['online', 'mart', 'direct'] as const).map((key) => (
              <div key={key} className="mb-2">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--biz-text-muted)' }}>
                    {key === 'online' ? '온라인' : key === 'mart' ? '대형마트' : '직영'}
                  </span>
                  <span className="font-mono" style={{ color: 'var(--biz-text)' }}>{decisions.channels[key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={decisions.channels[key]}
                  onChange={(e) => handleChannelChange(key, Number(e.target.value))}
                  className="w-full accent-gray-900"
                />
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: 'var(--biz-text-muted)' }}>
                설비투자 (CAPEX)
                <span className="ml-2 text-[10px] opacity-75">8분기 정액법 감가상각, 다음 분기부터 capacity 반영</span>
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--biz-text)' }}>capacity {capacity.toLocaleString()}대</div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span style={{ color: 'var(--biz-text-muted)' }}>이번 분기 설비투자</span>
                <span className="font-mono" style={{ color: 'var(--biz-text)' }}>₩{formatBillion(decisions.capexInvestment)}B</span>
              </div>
              <input
                type="range"
                min={0}
                max={5_000_000_000}
                step={100_000_000}
                value={decisions.capexInvestment}
                onChange={(e) => setDecisions({ capexInvestment: Number(e.target.value) })}
                className="w-full accent-gray-900"
              />
            </div>
          </div>

          <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 space-y-3">
            <div className="text-xs" style={{ color: 'var(--biz-text-muted)' }}>
              배당 · 재무 조달 (선택)
              <span className="ml-2 text-[10px] opacity-75">배당은 배당가능이익 한도 내로 자동 제한</span>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span style={{ color: 'var(--biz-text-muted)' }}>현금 배당 (이익잉여금 차감)</span>
                <span className="font-mono" style={{ color: 'var(--biz-text)' }}>₩{formatBillion(decisions.dividendPayout)}B</span>
              </div>
              <input
                type="range"
                min={0}
                max={3_000_000_000}
                step={100_000_000}
                value={decisions.dividendPayout}
                onChange={(e) => setDecisions({ dividendPayout: Number(e.target.value) })}
                className="w-full accent-gray-900"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span style={{ color: 'var(--biz-text-muted)' }}>신규 차입금</span>
                <span className="font-mono" style={{ color: 'var(--biz-text)' }}>₩{formatBillion(decisions.financing.newDebt)}B</span>
              </div>
              <input
                type="range"
                min={0}
                max={5_000_000_000}
                step={100_000_000}
                value={decisions.financing.newDebt}
                onChange={(e) => setDecisions({ financing: { ...decisions.financing, newDebt: Number(e.target.value) } })}
                className="w-full accent-gray-900"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span style={{ color: 'var(--biz-text-muted)' }}>유상증자</span>
                <span className="font-mono" style={{ color: 'var(--biz-text)' }}>₩{formatBillion(decisions.financing.newEquity)}B</span>
              </div>
              <input
                type="range"
                min={0}
                max={5_000_000_000}
                step={100_000_000}
                value={decisions.financing.newEquity}
                onChange={(e) => setDecisions({ financing: { ...decisions.financing, newEquity: Number(e.target.value) } })}
                className="w-full accent-gray-900"
              />
            </div>
          </div>

          <div style={{ background: 'var(--biz-primary-light)', borderColor: 'var(--biz-border)', color: 'var(--biz-text-muted)' }} className="border rounded-lg px-4 py-3 text-sm">
            예상 총비용: <span className="font-semibold" style={{ color: 'var(--biz-text)' }}>₩{formatBillion(totalCost)}B</span>
          </div>
        </div>

        <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--biz-text)' }}>실시간 미리보기</h3>
          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            <div style={{ background: 'var(--biz-primary-light)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4">
              <div className="text-xs mb-2" style={{ color: 'var(--biz-text-muted)' }}>시장점유율 예측</div>
              <div className="text-4xl font-[Manrope] font-bold" style={{ color: 'var(--biz-primary)' }}>{preview.marketShare}%</div>
            </div>
            <div style={{ background: 'var(--biz-primary-light)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4">
              <div className="text-xs mb-2" style={{ color: 'var(--biz-text-muted)' }}>분기 예상 매출</div>
              <div className="text-3xl font-[Manrope] font-bold" style={{ color: 'var(--biz-primary)' }}>₩{formatBillion(preview.revenue)}B</div>
            </div>
          </div>

          <div style={{ background: 'var(--biz-primary-light)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4">
            <div className="text-xs mb-3" style={{ color: 'var(--biz-text-muted)' }}>경쟁사 비교 (B 단위 매출)</div>
            <div className="space-y-3">
              {competitorData.map((company) => {
                const pct = (company.revenueB / maxRevenueB) * 100;
                return (
                  <div key={company.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span style={{ color: company.name === '우리회사' ? 'var(--biz-text)' : 'var(--biz-text-muted)', fontWeight: company.name === '우리회사' ? 'bold' : 'normal' }}>
                        {company.name}
                      </span>
                      <span className="font-mono" style={{ color: 'var(--biz-text)' }}>{company.revenueB.toFixed(1)}B</span>
                    </div>
                    <div style={{ background: '#e2e8f0' }} className="h-2 rounded-full">
                      <div
                        style={{ background: company.name === '우리회사' ? 'var(--biz-primary)' : '#cbd5e1', width: `${pct}%` }}
                        className="h-2 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push('/play/interview')}
        style={{ background: 'var(--biz-primary)' }}
        className="w-full text-white px-6 py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
      >
        시뮬레이션 실행
      </button>
    </div>
  );
}


