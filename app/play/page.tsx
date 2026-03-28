'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { DecisionSlider } from '@/components/DecisionSlider';

function formatBillion(v: number) {
  return (v / 1_000_000_000).toFixed(1);
}

function formatMan(v: number) {
  return (v / 10_000).toFixed(1);
}

export default function DecisionPage() {
  const router = useRouter();
  const { decisions, setDecisions, setChannels } = useGameStore();

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

  return (
    <div>
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-6 flex items-center gap-4 text-sm">
        <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-xs">Round 1</span>
        <span>한국 스마트홈 가전 시장 · 2026년 · 경기 보통 · 경쟁사 3개</span>
      </div>

      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">의사결정 레버</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
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
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="text-xs text-gray-400 mb-2">유통 채널 배분</div>
          {(['online', 'mart', 'direct'] as const).map((key) => (
            <div key={key} className="flex items-center gap-2 mb-1 text-sm">
              <span className="w-16 text-xs text-gray-500">
                {key === 'online' ? '온라인' : key === 'mart' ? '대형마트' : '직영'}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={decisions.channels[key]}
                onChange={(e) => handleChannelChange(key, Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-10 text-right text-xs font-mono">{decisions.channels[key]}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <span className="text-sm text-gray-400">
          예상 총 비용: ₩{formatBillion(totalCost)}B
        </span>
        <button
          onClick={() => router.push('/play/interview')}
          className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          의사결정 확정 → 소비자 인터뷰
        </button>
      </div>
    </div>
  );
}
