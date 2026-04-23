'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { DecisionSlider } from '@/components/DecisionSlider';
import { runSimulation } from '@/lib/game-engine';
import { getMarketSize } from '@/lib/competitor-ai';
import { INITIAL_PPE, productionCapacityFrom } from '@/lib/financial-mapper';
import { learningCurveMultiplier } from '@/lib/learning-curve';
import { classifyPressure, PRESSURE_LABELS } from '@/lib/supply';
import { exploreBoostFrom } from '@/lib/ansoff';
import { LABOR_COST_PER_HEAD, directChannelMultiplier, rdEffectivenessMultiplier } from '@/lib/labor';
import { economicOrderQuantity } from '@/lib/eoq';
import { playerDemandVolatility, BULLWHIP_THRESHOLD } from '@/lib/bullwhip';
import { orgLearningMultiplier } from '@/lib/org-learning';
import type { ProductId } from '@/lib/types';

function formatBillion(v: number) {
  return (v / 1_000_000_000).toFixed(1);
}

function formatMan(v: number) {
  return (v / 10_000).toFixed(1);
}

type TabId = 'product' | 'marketing' | 'rd' | 'ops' | 'capital';
type IssueSeverity = 'ok' | 'info' | 'warn' | 'bad';

type TabIssue = { severity: IssueSeverity; text: string };

const TAB_META: { id: TabId; label: string }[] = [
  { id: 'product', label: '제품' },
  { id: 'marketing', label: '마케팅' },
  { id: 'rd', label: 'R&D' },
  { id: 'ops', label: '운영' },
  { id: 'capital', label: '자본' },
];

const SEVERITY_STYLE: Record<IssueSeverity, { bg: string; color: string }> = {
  ok:   { bg: '#ecfdf5', color: '#047857' },
  info: { bg: '#eff6ff', color: '#1d4ed8' },
  warn: { bg: '#fff7ed', color: '#b45309' },
  bad:  { bg: '#fef2f2', color: '#b91c1c' },
};

export default function DecisionPage() {
  const router = useRouter();
  const {
    decisions, setDecisions, setChannels, setProduct,
    currentRound, competitors, qualityCap, resetGame, roundHistory,
    currentEvent, brandEquity, cumulativeLoss, previousBS,
    cumulativeProduction, supplyIndex, cumulativeExploreRd, cumulativeImproveRd,
    pendingProduction, adstock,
  } = useGameStore();
  const [activeProduct, setActiveProduct] = useState<ProductId>('A');
  const [activeTab, setActiveTab] = useState<TabId>('product');
  const capacity = productionCapacityFrom(previousBS?.ppe ?? INITIAL_PPE);
  const exploreBoost = exploreBoostFrom(cumulativeExploreRd);
  const roundsCompleted = roundHistory.length;
  const orgLearning = orgLearningMultiplier(roundsCompleted);
  const marketSize = getMarketSize(currentRound);
  const preview = useMemo(() => {
    return runSimulation(decisions, competitors, marketSize, qualityCap, currentEvent, brandEquity, capacity, cumulativeProduction, supplyIndex, exploreBoost, pendingProduction, adstock, roundsCompleted);
  }, [decisions, marketSize, competitors, qualityCap, currentEvent, brandEquity, capacity, cumulativeProduction, supplyIndex, exploreBoost, pendingProduction, adstock, roundsCompleted]);

  // 민감도 분석: 현재 결정에서 레버를 한 단계 조정했을 때 매출·점유·만족도 변화량.
  // 각 레버당 추가 runSimulation 1회 — 순수 함수, <1ms로 렌더마다 재계산 가능.
  const runScenario = (mutator: (d: typeof decisions) => typeof decisions) => {
    const perturbed = mutator(JSON.parse(JSON.stringify(decisions)));
    return runSimulation(perturbed, competitors, marketSize, qualityCap, currentEvent, brandEquity, capacity, cumulativeProduction, supplyIndex, exploreBoost, pendingProduction, adstock, roundsCompleted);
  };

  const sensitivity = useMemo(() => {
    type ScenarioResult = ReturnType<typeof runScenario>;
    const delta = (r: ScenarioResult) => ({
      revenueB: (r.revenue - preview.revenue) / 1_000_000_000,
      share: r.marketShare - preview.marketShare,
      profitB: (r.operatingProfit - preview.operatingProfit) / 1_000_000_000,
      satisfaction: r.satisfaction - preview.satisfaction,
    });
    const pid = activeProduct;
    const pIdx = decisions.products.findIndex((p) => p.id === pid);
    const curPrice = decisions.products[pIdx].price;
    const curQuality = decisions.products[pIdx].quality;
    const curProd = decisions.products[pIdx].production;

    const priceDown = curPrice >= 210_000
      ? delta(runScenario((d) => { d.products[pIdx].price = curPrice - 10_000; return d; }))
      : null;
    const qualityUp = curQuality < Math.floor(qualityCap)
      ? delta(runScenario((d) => { d.products[pIdx].quality = curQuality + 1; return d; }))
      : null;
    const productionUp = curProd <= 19_000
      ? delta(runScenario((d) => { d.products[pIdx].production = curProd + 1_000; return d; }))
      : null;
    const adUp = delta(runScenario((d) => { d.adBudget = { ...d.adBudget, search: d.adBudget.search + 100_000_000 }; return d; }));
    const serviceUp = decisions.serviceCapacity <= 59_000
      ? delta(runScenario((d) => { d.serviceCapacity = d.serviceCapacity + 5_000; return d; }))
      : null;

    return { priceDown, qualityUp, productionUp, adUp, serviceUp };
  }, [decisions, preview, activeProduct, qualityCap, marketSize, competitors, currentEvent, brandEquity, capacity, cumulativeProduction, supplyIndex, exploreBoost, pendingProduction, adstock]);

  const totalAd = decisions.adBudget.search + decisions.adBudget.display + decisions.adBudget.influencer;
  // 이번 분기 제조원가는 pendingProduction 기준 (리드타임: 전 분기 결정분이 이번에 생산·투입)
  const totalProductionCost = decisions.products.reduce(
    (sum, p) => sum + (pendingProduction[p.id] ?? p.production) * (120_000 + (p.quality - 1) * 25_000),
    0,
  );
  const serviceOpex = decisions.serviceCapacity * 50_000;
  const laborCost = (decisions.headcount.sales + decisions.headcount.rd) * LABOR_COST_PER_HEAD;
  const totalCost = totalAd + decisions.rdBudget / 4 + totalProductionCost + 50_000_000 + laborCost + serviceOpex;

  // Bullwhip 경고: 이번 preview.unitsSold vs 직전 분기 unitsSold 변동률 계산
  const lastRoundUnitsSold = roundHistory[roundHistory.length - 1]?.results.unitsSold ?? 0;
  const projectedVolatility = lastRoundUnitsSold > 0
    ? playerDemandVolatility(preview.unitsSold, lastRoundUnitsSold)
    : 0;

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

  // 탭별 "이 분기 쟁점" 배지 계산
  const tabIssues: Record<TabId, TabIssue> = useMemo(() => {
    // 제품: 수요-생산 미스매치 체크
    const prA = preview.perProduct.A;
    const prB = preview.perProduct.B;
    const demA = Object.values(prA.segmentDemand).reduce((s, d) => s + d, 0);
    const demB = Object.values(prB.segmentDemand).reduce((s, d) => s + d, 0);
    const shortA = demA - prA.unitsSold;
    const shortB = demB - prB.unitsSold;
    const unsoldA = Math.max(0, prA.produced - prA.unitsSold);
    const unsoldB = Math.max(0, prB.produced - prB.unitsSold);
    let productIssue: TabIssue;
    if (shortA + shortB > 2_000) {
      productIssue = { severity: 'warn', text: `수요 대비 생산 부족 ${(shortA + shortB).toLocaleString()}대` };
    } else if (unsoldA + unsoldB > 2_000) {
      productIssue = { severity: 'warn', text: `과잉 재고 ${(unsoldA + unsoldB).toLocaleString()}대 (재고유지비 부담)` };
    } else if (decisions.products.some((p) => p.quality >= Math.floor(qualityCap))) {
      productIssue = { severity: 'info', text: `품질 상한 ${qualityCap.toFixed(1)} 도달 — R&D 개선 투자로 상한 확장` };
    } else {
      productIssue = { severity: 'ok', text: '수요·생산 균형' };
    }

    // 마케팅: 브랜드 에쿼티와 광고비 체크
    const revB = preview.revenue / 1_000_000_000;
    const adBillion = totalAd / 1_000_000_000;
    const adToRev = revB > 0 ? adBillion / revB : 0;
    let marketingIssue: TabIssue;
    if (brandEquity < 30) {
      marketingIssue = { severity: 'bad', text: `브랜드 에쿼티 ${brandEquity.toFixed(0)} (낮음) — 광고 확대 필요` };
    } else if (adToRev > 0.4) {
      marketingIssue = { severity: 'warn', text: `광고 과다 — 매출 대비 ${(adToRev * 100).toFixed(0)}%` };
    } else if (adToRev < 0.08 && revB > 2) {
      marketingIssue = { severity: 'info', text: `광고 여유 — 매출 대비 ${(adToRev * 100).toFixed(0)}%, 추가 투자 여지` };
    } else {
      marketingIssue = { severity: 'ok', text: `광고/매출 비율 ${(adToRev * 100).toFixed(0)}% 정상` };
    }

    // R&D: qualityCap 진행 상황 + explore boost
    let rdIssue: TabIssue;
    const totalRd = cumulativeImproveRd + cumulativeExploreRd;
    if (decisions.rdBudget < 500_000_000) {
      rdIssue = { severity: 'warn', text: `R&D 미투입 — 경쟁사 품질 추격 가속 중` };
    } else if (exploreBoost > 0.1) {
      rdIssue = { severity: 'ok', text: `시장 확장 +${(exploreBoost * 100).toFixed(1)}% · qualityCap ${qualityCap.toFixed(1)}` };
    } else if (totalRd < 1_000_000_000) {
      rdIssue = { severity: 'info', text: `누적 R&D 초기 단계 · 장기 복리 투자` };
    } else {
      rdIssue = { severity: 'ok', text: `개선 ₩${formatBillion(cumulativeImproveRd)}B · 탐색 ₩${formatBillion(cumulativeExploreRd)}B` };
    }

    // 운영: 서비스 큐 utilization + CAPEX capacity
    const util = preview.serviceQueue.utilization;
    let opsIssue: TabIssue;
    if (preview.serviceQueue.overflow > 0) {
      opsIssue = { severity: 'bad', text: `서비스 overflow ${preview.serviceQueue.overflow.toLocaleString()}대 — 판매 손실` };
    } else if (util === Infinity || util >= 0.9) {
      opsIssue = { severity: 'warn', text: `서비스 부하 ρ ${util.toFixed(2)} — 만족도 하락` };
    } else {
      const prodReq = decisions.products.reduce((s, p) => s + p.production, 0);
      if (prodReq > capacity) {
        opsIssue = { severity: 'warn', text: `생산 ${prodReq.toLocaleString()} > 공장 capacity ${capacity.toLocaleString()} — 설비투자 검토` };
      } else {
        opsIssue = { severity: 'ok', text: `ρ ${util.toFixed(2)} · 공장 여유 ${(capacity - prodReq).toLocaleString()}대` };
      }
    }

    // 자본: 현금·부채비율
    const prevCash = previousBS?.cash ?? 10_000_000_000;
    const prevDebt = previousBS?.debt ?? 2_000_000_000;
    const prevEquity = (previousBS?.equity ?? 8_000_000_000) + (previousBS?.capitalSurplus ?? 0) + (previousBS?.retainedEarnings ?? 0);
    const debtRatio = prevEquity > 0 ? prevDebt / prevEquity : 0;
    let capitalIssue: TabIssue;
    if (prevCash < 2_000_000_000) {
      capitalIssue = { severity: 'bad', text: `현금 부족 ₩${formatBillion(prevCash)}B — 차입 또는 증자 검토` };
    } else if (debtRatio > 1.0) {
      capitalIssue = { severity: 'warn', text: `부채비율 ${(debtRatio * 100).toFixed(0)}% — 이자 부담 증가` };
    } else if (decisions.dividendPayout > 0) {
      capitalIssue = { severity: 'info', text: `배당 ₩${formatBillion(decisions.dividendPayout)}B 집행 예정` };
    } else {
      capitalIssue = { severity: 'ok', text: `현금 ₩${formatBillion(prevCash)}B · 부채비율 ${(debtRatio * 100).toFixed(0)}%` };
    }

    return { product: productIssue, marketing: marketingIssue, rd: rdIssue, ops: opsIssue, capital: capitalIssue };
  }, [preview, decisions, qualityCap, brandEquity, totalAd, cumulativeImproveRd, cumulativeExploreRd, exploreBoost, previousBS, capacity]);

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
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* 상단 상태바 */}
      <div style={{ background: 'var(--biz-primary-light)', borderColor: 'var(--biz-primary)' }} className="border rounded-lg p-3 flex items-center gap-4 text-sm">
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

      {/* 핵심 지표 대시보드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-3 border rounded-md px-3 py-2" style={{ borderColor: 'var(--biz-border)', background: 'var(--biz-card)' }}>
          <span style={{ color: 'var(--biz-text-muted)' }}>브랜드 에쿼티</span>
          <div className="flex-1 h-2 rounded-full" style={{ background: '#e2e8f0' }}>
            <div className="h-2 rounded-full transition-all" style={{ background: 'var(--biz-primary)', width: `${brandEquity}%` }} />
          </div>
          <span className="font-mono" style={{ color: 'var(--biz-text)' }}>{brandEquity.toFixed(0)}</span>
        </div>
        <div
          className="flex items-center gap-3 border rounded-md px-3 py-2"
          style={{
            borderColor: 'var(--biz-border)',
            background: classifyPressure(supplyIndex) === 'crisis' ? '#fef2f2'
              : classifyPressure(supplyIndex) === 'tight' ? '#fff7ed'
              : classifyPressure(supplyIndex) === 'favorable' ? '#ecfdf5'
              : 'var(--biz-card)',
          }}
          title="Porter 5 Forces · 공급자 교섭력 — 원자재 가격 지수. 이벤트 카드와 곱셈으로 결합되어 유닛 원가에 반영됨."
        >
          <span style={{ color: 'var(--biz-text-muted)' }}>공급자 지수</span>
          <span className="font-mono" style={{ color: 'var(--biz-text)' }}>×{supplyIndex.toFixed(3)}</span>
          <span className="ml-auto" style={{ color: 'var(--biz-text-muted)' }}>{PRESSURE_LABELS[classifyPressure(supplyIndex)]}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="text-[11px] px-3 py-1 rounded border"
          style={{ borderColor: 'var(--biz-border)', color: 'var(--biz-text-muted)', background: roundsCompleted > 0 ? '#ecfdf5' : 'var(--biz-card)' }}
          title="조직 학습 — 운영 경험이 누적되어 전 부문 원가 효율성이 상승. 라운드당 +1%, 최대 +30%."
        >
          조직 학습 <span className="font-mono" style={{ color: 'var(--biz-text)' }}>×{orgLearning.toFixed(3)}</span>
          <span className="ml-1 opacity-75">(누적 {roundsCompleted}라운드 · 전 부문 원가 −{((orgLearning - 1) * 100).toFixed(1)}%)</span>
        </div>
        {cumulativeLoss > 0 && (
          <div className="text-[11px] px-3 py-1 rounded border" style={{ borderColor: 'var(--biz-border)', color: 'var(--biz-text-muted)', background: 'var(--biz-card)' }} title="이월결손금 — 다음 흑자 분기부터 과세표준에서 차감됨">
            이월결손금 <span className="font-mono" style={{ color: 'var(--biz-text)' }}>₩{formatBillion(cumulativeLoss)}B</span> (다음 흑자 분기 과세표준 차감 예정)
          </div>
        )}
      </div>
      {projectedVolatility > BULLWHIP_THRESHOLD && (
        <div
          className="text-[11px] px-3 py-1.5 rounded border-l-4"
          style={{ borderColor: '#f59e0b', background: '#fff7ed', color: '#b45309' }}
          title="Bullwhip 효과 — 수요 급변이 공급망 상류(공급자·경쟁사)로 증폭됨. 다음 분기 SPI 상승압력 + 경쟁사 광고 과잉반응 예상."
        >
          <span className="font-bold uppercase tracking-wider">Bullwhip 경고</span>
          <span className="ml-2 font-mono">판매 변동률 {(projectedVolatility * 100).toFixed(1)}%</span>
          <span className="ml-2 opacity-75">(임계 {(BULLWHIP_THRESHOLD * 100).toFixed(0)}% 초과 시 SPI drift +{((projectedVolatility - BULLWHIP_THRESHOLD) * 5).toFixed(1)}% / 경쟁사 광고 +{((projectedVolatility - BULLWHIP_THRESHOLD) * 100).toFixed(0)}%)</span>
        </div>
      )}

      {/* 본문: 탭 + 프리뷰 */}
      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-3">
          {/* 탭 바 — 모바일에선 가로 스크롤 가능 */}
          <div className="flex gap-1 border rounded-lg p-1 overflow-x-auto" style={{ borderColor: 'var(--biz-border)', background: 'var(--biz-card)' }}>
            {TAB_META.map((t) => {
              const issue = tabIssues[t.id];
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="flex-1 min-w-[60px] px-2 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    background: active ? 'var(--biz-primary)' : 'transparent',
                    color: active ? 'white' : 'var(--biz-text-muted)',
                  }}
                  title={issue.text}
                >
                  <span>{t.label}</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{ background: SEVERITY_STYLE[issue.severity].color }}
                  />
                </button>
              );
            })}
          </div>

          {/* 활성 탭 쟁점 배지 */}
          <div
            className="border rounded-md px-3 py-2 text-xs flex items-center gap-2"
            style={{
              borderColor: 'var(--biz-border)',
              background: SEVERITY_STYLE[tabIssues[activeTab].severity].bg,
              color: SEVERITY_STYLE[tabIssues[activeTab].severity].color,
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">이 분기 쟁점</span>
            <span>{tabIssues[activeTab].text}</span>
          </div>

          {/* 제품 탭 */}
          {activeTab === 'product' && (
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
              <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--biz-text-muted)' }}>
                <span>학습곡선 누적 {cumulativeProduction[product.id].toLocaleString()}대</span>
                <span className="font-mono" title="Wright's Law 80% 학습률 — 누적 2배 시 단위원가 80% 체감">
                  원가계수 ×{learningCurveMultiplier(cumulativeProduction[product.id]).toFixed(3)}
                </span>
              </div>
              <div
                className="text-[11px] px-2 py-1 rounded border"
                style={{ borderColor: 'var(--biz-border)', background: 'var(--biz-primary-light)', color: 'var(--biz-text-muted)' }}
                title="생산 리드타임 — 이번 분기 결정은 다음 분기 생산으로 실현됨. 이번 분기 판매 가능량은 전 분기 결정분."
              >
                이번 분기 실현 생산(전 분기 결정분): <span className="font-mono" style={{ color: 'var(--biz-text)' }}>A {pendingProduction.A.toLocaleString()} · B {pendingProduction.B.toLocaleString()}대</span>
              </div>
              <div
                className="text-[11px] px-2 py-1 rounded border"
                style={{ borderColor: 'var(--biz-border)', background: 'var(--biz-card)', color: 'var(--biz-text-muted)' }}
                title="EOQ(Harris 1913) = √(2×D×S/H). D=이번 분기 예상 수요, S=셋업비 50M, H=단위당 분기 유지비. 참고용 권장 배치 크기."
              >
                {(() => {
                  const demandA = Object.values(preview.perProduct.A.segmentDemand).reduce((s, d) => s + d, 0);
                  const demandB = Object.values(preview.perProduct.B.segmentDemand).reduce((s, d) => s + d, 0);
                  const eoqA = economicOrderQuantity(demandA);
                  const eoqB = economicOrderQuantity(demandB);
                  return (
                    <>EOQ 권장 배치: <span className="font-mono" style={{ color: 'var(--biz-text)' }}>A ~{eoqA.toLocaleString()} · B ~{eoqB.toLocaleString()}대</span> <span className="opacity-75">(재고유지비 ↔ 셋업비 trade-off 최적)</span></>
                  );
                })()}
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
                label={`${product.name} · 생산 지시 (다음 분기 실현)`}
                value={product.production}
                min={2_000}
                max={20_000}
                step={500}
                unit="대"
                formatValue={(v) => v.toLocaleString()}
                onChange={(v) => setProduct(product.id, { production: v })}
              />
            </div>
          )}

          {/* 마케팅 탭 */}
          {activeTab === 'marketing' && (
            <>
              <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs" style={{ color: 'var(--biz-text-muted)' }}>
                    마케팅 믹스 (분기)
                    <span className="ml-2 text-[10px] opacity-75">Koyck adstock λ=0.5 — 전분기 50% carryover</span>
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--biz-text)' }}>합계 ₩{formatBillion(totalAd)}B</div>
                </div>
                {(adstock.search + adstock.display + adstock.influencer) > 0 && (
                  <div className="text-[11px] px-2 py-1 rounded border" style={{ borderColor: 'var(--biz-border)', background: 'var(--biz-primary-light)', color: 'var(--biz-text-muted)' }}>
                    전분기 광고 carryover 입력: 검색 ₩{formatBillion(adstock.search * 0.5)}B · 디스플레이 ₩{formatBillion(adstock.display * 0.5)}B · 인플루언서 ₩{formatBillion(adstock.influencer * 0.5)}B (이번 분기 효과에 가산)
                  </div>
                )}
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
            </>
          )}

          {/* R&D 탭 */}
          {activeTab === 'rd' && (
            <>
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
              <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--biz-text-muted)' }}>
                    Ansoff R&D 분배
                    <span className="ml-2 text-[10px] opacity-75">개선 = 품질상한 상승 · 탐색 = 신시장(플레이어 전용 시장 확장)</span>
                  </span>
                  <span className="font-mono" style={{ color: 'var(--biz-text)' }}>
                    개선 {decisions.rdAllocation.improve}% · 탐색 {decisions.rdAllocation.explore}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={decisions.rdAllocation.improve}
                  onChange={(e) => {
                    const improve = Number(e.target.value);
                    setDecisions({ rdAllocation: { improve, explore: 100 - improve } });
                  }}
                  className="w-full accent-gray-900"
                />
                <div className="text-[11px] font-mono flex items-center justify-between" style={{ color: 'var(--biz-text-muted)' }}>
                  <span>누적 개선 ₩{formatBillion(cumulativeImproveRd)}B · 탐색 ₩{formatBillion(cumulativeExploreRd)}B</span>
                  <span title="신시장 R&D 누적에 따른 플레이어 전용 유효시장 배수 (최대 +25%)">
                    시장확장 +{(exploreBoost * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </>
          )}

          {/* 운영 탭 */}
          {activeTab === 'ops' && (
            <>
              <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs" style={{ color: 'var(--biz-text-muted)' }}>
                    인력 편성 (영업·R&D)
                    <span className="ml-2 text-[10px] opacity-75">1인당 ₩{(LABOR_COST_PER_HEAD / 1_000_000).toFixed(0)}M/분기</span>
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--biz-text)' }}>
                    총 {decisions.headcount.sales + decisions.headcount.rd}명 · ₩{formatBillion(laborCost)}B/분기
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--biz-text-muted)' }}>
                      영업팀
                      <span className="ml-2 text-[10px] opacity-75">직영 채널 효과 ×{directChannelMultiplier(decisions.headcount.sales).toFixed(2)}</span>
                    </span>
                    <span className="font-mono" style={{ color: 'var(--biz-text)' }}>{decisions.headcount.sales}명</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={decisions.headcount.sales}
                    onChange={(e) => setDecisions({ headcount: { ...decisions.headcount, sales: Number(e.target.value) } })}
                    className="w-full accent-gray-900"
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--biz-text-muted)' }}>
                      R&D팀
                      <span className="ml-2 text-[10px] opacity-75">R&D 실효 ×{rdEffectivenessMultiplier(decisions.headcount.rd).toFixed(2)} (개선·탐색 stock에 누적)</span>
                    </span>
                    <span className="font-mono" style={{ color: 'var(--biz-text)' }}>{decisions.headcount.rd}명</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={decisions.headcount.rd}
                    onChange={(e) => setDecisions({ headcount: { ...decisions.headcount, rd: Number(e.target.value) } })}
                    className="w-full accent-gray-900"
                  />
                </div>
              </div>

              <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs" style={{ color: 'var(--biz-text-muted)' }}>
                    서비스 capacity (A/S·상담·배송)
                    <span className="ml-2 text-[10px] opacity-75">대당 50,000원/분기 · 초과 판매는 오버플로로 소실</span>
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--biz-text)' }}>
                    ρ {preview.serviceQueue.utilization === Infinity ? '∞' : preview.serviceQueue.utilization.toFixed(2)}
                    {preview.serviceQueue.overflow > 0 && (
                      <span className="ml-2" style={{ color: '#b91c1c' }}>overflow {preview.serviceQueue.overflow.toLocaleString()}대</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--biz-text-muted)' }}>분기 서비스 처리능력</span>
                    <span className="font-mono" style={{ color: 'var(--biz-text)' }}>{decisions.serviceCapacity.toLocaleString()}대 · ₩{formatBillion(serviceOpex)}B</span>
                  </div>
                  <input
                    type="range"
                    min={5_000}
                    max={60_000}
                    step={1_000}
                    value={decisions.serviceCapacity}
                    onChange={(e) => setDecisions({ serviceCapacity: Number(e.target.value) })}
                    className="w-full accent-gray-900"
                  />
                </div>
              </div>

              <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs" style={{ color: 'var(--biz-text-muted)' }}>
                    설비투자 (CAPEX)
                    <span className="ml-2 text-[10px] opacity-75">8분기 정액법 감가상각, 다음 분기부터 capacity 반영</span>
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--biz-text)' }}>공장 capacity {capacity.toLocaleString()}대</div>
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
            </>
          )}

          {/* 자본 탭 */}
          {activeTab === 'capital' && (
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
          )}

          {/* 총비용 푸터 — 항상 표시 */}
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

          {/* 민감도 분석: 활성 탭 기준 주요 레버의 증분 효과 */}
          <SensitivityPanel
            activeTab={activeTab}
            activeProduct={activeProduct}
            sensitivity={sensitivity}
          />

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

type ScenarioDelta = {
  revenueB: number;
  share: number;
  profitB: number;
  satisfaction: number;
} | null;

type SensitivityState = {
  priceDown: ScenarioDelta;
  qualityUp: ScenarioDelta;
  productionUp: ScenarioDelta;
  adUp: ScenarioDelta;
  serviceUp: ScenarioDelta;
};

type SensitivityPanelProps = {
  activeTab: TabId;
  activeProduct: ProductId;
  sensitivity: SensitivityState;
};

function SensitivityPanel({ activeTab, activeProduct, sensitivity }: SensitivityPanelProps) {
  type Row = { label: string; delta: ScenarioDelta };

  let rows: Row[] = [];
  if (activeTab === 'product') {
    rows = [
      { label: `제품 ${activeProduct} · 가격 −1만원`, delta: sensitivity.priceDown },
      { label: `제품 ${activeProduct} · 품질 +1`, delta: sensitivity.qualityUp },
      { label: `제품 ${activeProduct} · 생산 지시 +1,000대`, delta: sensitivity.productionUp },
    ];
  } else if (activeTab === 'marketing') {
    rows = [
      { label: '검색 광고 +0.1B', delta: sensitivity.adUp },
    ];
  } else if (activeTab === 'rd') {
    // R&D는 이번 분기 즉시 효과 없음 — 장기 효과 메시지로 대체
    rows = [];
  } else if (activeTab === 'ops') {
    rows = [
      { label: '서비스 capacity +5,000대', delta: sensitivity.serviceUp },
    ];
  } else {
    rows = [];
  }

  if (rows.length === 0 && activeTab !== 'rd' && activeTab !== 'capital') {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 mb-4" style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }}>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--biz-text-muted)' }}>민감도 분석</h3>
        <span className="text-[10px]" style={{ color: 'var(--biz-text-muted)' }}>현재 결정 기준 1단계 조정 시 변화</span>
      </div>
      {activeTab === 'rd' && (
        <div className="text-[11px] px-2 py-1.5 rounded" style={{ background: 'var(--biz-primary-light)', color: 'var(--biz-text-muted)' }}>
          R&D 투자는 <span style={{ color: 'var(--biz-text)', fontWeight: 600 }}>다음 분기부터</span> 품질상한·시장확장으로 실현.<br />이번 분기 손익에는 비용만 반영.
        </div>
      )}
      {activeTab === 'capital' && (
        <div className="text-[11px] px-2 py-1.5 rounded" style={{ background: 'var(--biz-primary-light)', color: 'var(--biz-text-muted)' }}>
          자본 조달은 시뮬 결과(매출·점유)에 직접 영향 없음.<br />현금·부채·자본잉여금·이자비용에만 반영.
        </div>
      )}
      {rows.length > 0 && (
        <div className="space-y-1.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-[11px] py-1" style={{ borderBottomColor: 'var(--biz-border)' }}>
              <span style={{ color: 'var(--biz-text-muted)' }}>{r.label}</span>
              {r.delta ? (
                <span className="font-mono" style={{ color: 'var(--biz-text)' }}>
                  <DeltaChip value={r.delta.profitB} unit="B 이익" digits={2} />
                  <DeltaChip value={r.delta.share} unit="%p 점유" digits={1} />
                  {r.delta.satisfaction !== 0 && (
                    <DeltaChip value={r.delta.satisfaction} unit=" 만족도" digits={0} />
                  )}
                </span>
              ) : (
                <span className="text-[10px]" style={{ color: 'var(--biz-text-muted)', opacity: 0.6 }}>범위 밖</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeltaChip({ value, unit, digits }: { value: number; unit: string; digits: number }) {
  const color = value > 0.001 ? '#047857' : value < -0.001 ? '#b91c1c' : 'var(--biz-text-muted)';
  const sign = value > 0 ? '+' : '';
  return (
    <span className="ml-2" style={{ color }}>
      {sign}{value.toFixed(digits)}{unit}
    </span>
  );
}
