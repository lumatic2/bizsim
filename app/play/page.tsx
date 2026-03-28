'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { DecisionSlider } from '@/components/DecisionSlider';
import { runSimulation } from '@/lib/game-engine';

function formatBillion(v: number) {
  return (v / 1_000_000_000).toFixed(1);
}

function formatMan(v: number) {
  return (v / 10_000).toFixed(1);
}

export default function DecisionPage() {
  const router = useRouter();
  const { decisions, setDecisions, setChannels } = useGameStore();
  const preview = useMemo(() => runSimulation(decisions), [decisions]);

  const totalCost =
    decisions.adBudget +
    decisions.rdBudget / 4 +
    decisions.production * (120_000 + (decisions.quality - 1) * 25_000) +
    100_000_000;

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
    const fixed = [
      { name: '글로벌테크', revenueB: 4.8 },
      { name: '혁신전자', revenueB: 3.2 },
      { name: '로컬베스트', revenueB: 2.1 },
    ];
    const ours = { name: '우리회사', revenueB: Number((preview.revenue / 1_000_000_000).toFixed(1)) };
    return [ours, ...fixed];
  }, [preview.revenue]);

  const maxRevenueB = Math.max(...competitorData.map((c) => c.revenueB), 1);

  return (
    <div className="space-y-6">
      <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 mb-2 flex items-center gap-4 text-sm">
        <span className="bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded text-xs border border-teal-500/40">Round 1</span>
        <span>한국 스마트홈 가전 시장 · 2026년 · 경기 보통 · 경쟁사 3개</span>
      </div>

      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">의사결정 레버</h2>

      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-4">
          <DecisionSlider
            label="제품 가격"
            value={decisions.price}
            min={200_000}
            max={500_000}
            step={10_000}
            unit="/ 대"
            formatValue={(v) => `₩${formatMan(v)}만`}
            onChange={(v) => setDecisions({ price: v })}
          />
          <DecisionSlider
            label="R&D 투자"
            value={decisions.rdBudget}
            min={0}
            max={5_000_000_000}
            step={100_000_000}
            unit="/ 분기"
            formatValue={(v) => `₩${formatBillion(v)}B`}
            onChange={(v) => setDecisions({ rdBudget: v })}
          />
          <DecisionSlider
            label="광고 예산"
            value={decisions.adBudget}
            min={0}
            max={2_000_000_000}
            step={50_000_000}
            unit="/ 분기"
            formatValue={(v) => `₩${formatBillion(v)}B`}
            onChange={(v) => setDecisions({ adBudget: v })}
          />
          <DecisionSlider
            label="생산 수량"
            value={decisions.production}
            min={5_000}
            max={30_000}
            step={1_000}
            unit="대"
            formatValue={(v) => v.toLocaleString()}
            onChange={(v) => setDecisions({ production: v })}
          />
          <DecisionSlider
            label="품질 목표"
            value={decisions.quality}
            min={1}
            max={5}
            step={1}
            unit=""
            formatValue={(v) => '★'.repeat(v) + '☆'.repeat(5 - v)}
            onChange={(v) => setDecisions({ quality: v })}
          />

          <div className="rounded-lg border border-[#334155] bg-[#1e293b] p-4">
            <div className="text-xs text-slate-400 mb-3">유통 채널 배분</div>
            {(['online', 'mart', 'direct'] as const).map((key) => (
              <div key={key} className="mb-2">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    {key === 'online' ? '온라인' : key === 'mart' ? '대형마트' : '직영'}
                  </span>
                  <span className="font-mono text-slate-200">{decisions.channels[key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={decisions.channels[key]}
                  onChange={(e) => handleChannelChange(key, Number(e.target.value))}
                  className="w-full accent-teal-400"
                />
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[#334155] bg-[#0f172a] px-4 py-3 text-sm text-slate-300">
            예상 총비용: <span className="font-semibold text-slate-100">₩{formatBillion(totalCost)}B</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">실시간 미리보기</h3>
          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            <div className="rounded-lg bg-[#0f172a] border border-[#334155] p-4">
              <div className="text-xs text-slate-400 mb-2">시장점유율 예측</div>
              <div className="text-4xl font-bold text-white">{preview.marketShare}%</div>
            </div>
            <div className="rounded-lg bg-[#0f172a] border border-[#334155] p-4">
              <div className="text-xs text-slate-400 mb-2">분기 예상 매출</div>
              <div className="text-3xl font-bold text-white">₩{formatBillion(preview.revenue)}B</div>
            </div>
          </div>

          <div className="rounded-lg bg-[#0f172a] border border-[#334155] p-4">
            <div className="text-xs text-slate-400 mb-3">경쟁사 비교 (B 단위 매출)</div>
            <div className="space-y-3">
              {competitorData.map((company) => {
                const pct = (company.revenueB / maxRevenueB) * 100;
                return (
                  <div key={company.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className={company.name === '우리회사' ? 'text-white font-semibold' : 'text-slate-300'}>
                        {company.name}
                      </span>
                      <span className="font-mono text-slate-200">{company.revenueB.toFixed(1)}B</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#334155]">
                      <div
                        className={`h-2 rounded-full ${company.name === '우리회사' ? 'bg-teal-400' : 'bg-slate-500'}`}
                        style={{ width: `${pct}%` }}
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
        className="w-full bg-teal-500 text-slate-950 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-teal-400 transition-colors"
      >
        시뮬레이션 실행
      </button>
    </div>
  );
}
