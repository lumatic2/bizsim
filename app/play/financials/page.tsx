'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { FinancialTable } from '@/components/FinancialTable';

type Tab = 'pnl' | 'bs' | 'cf';

export default function FinancialsPage() {
  const router = useRouter();
  const { financials, results } = useGameStore();
  const [tab, setTab] = useState<Tab>('pnl');

  if (!financials || !results) {
    router.push('/play');
    return null;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pnl', label: '손익계산서' },
    { id: 'bs', label: '재무상태표' },
    { id: 'cf', label: '현금흐름표' },
  ];

  const { pnl, bs, cf } = financials;

  const pnlRows = [
    { label: '매출', value: 0, isHeader: true },
    { label: '제품 매출', value: pnl.revenue },
    { label: '매출원가', value: -pnl.cogs },
    { label: '매출총이익', value: pnl.grossProfit, isTotal: true },
    { label: '판매관리비', value: 0, isHeader: true },
    { label: '광고선전비', value: -pnl.adExpense },
    { label: '연구개발비', value: -pnl.rdExpense },
    { label: '인건비·기타', value: -pnl.otherExpense },
    { label: '영업이익', value: pnl.operatingProfit, isTotal: true },
    { label: '영업외', value: 0, isHeader: true },
    { label: '이자비용', value: -pnl.interestExpense },
    { label: '당기순이익', value: pnl.netIncome, isTotal: true },
  ];

  const bsRows = [
    { label: '자산', value: 0, isHeader: true },
    { label: '현금', value: bs.cash },
    { label: '매출채권', value: bs.receivables },
    { label: '재고자산', value: bs.inventory },
    { label: '총자산', value: bs.totalAssets, isTotal: true },
    { label: '부채 및 자본', value: 0, isHeader: true },
    { label: '매입채무', value: bs.payables },
    { label: '차입금', value: bs.debt },
    { label: '자본금', value: bs.equity },
    { label: '이익잉여금', value: bs.retainedEarnings },
    { label: '총부채 및 자본', value: bs.totalLiabilities, isTotal: true },
  ];

  const cfRows = [
    { label: '영업활동 현금흐름', value: cf.operatingCF },
    { label: '투자활동 현금흐름', value: cf.investingCF },
    { label: '재무활동 현금흐름', value: cf.financingCF },
    { label: '현금 증감', value: cf.netCashChange, isTotal: true },
  ];

  const tableRows = tab === 'pnl' ? pnlRows : tab === 'bs' ? bsRows : cfRows;

  return (
    <div>
      <div className="flex gap-0 border-b border-gray-200 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              tab === t.id
                ? 'border-gray-900 text-gray-900 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <FinancialTable rows={tableRows} />
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
        <h3 className="text-sm font-semibold mb-2">인사이트</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p className="pl-3 border-l-2 border-gray-300">
            매출총이익률: {pnl.revenue > 0 ? ((pnl.grossProfit / pnl.revenue) * 100).toFixed(1) : 0}%
          </p>
          <p className="pl-3 border-l-2 border-gray-300">
            {pnl.operatingProfit > 0
              ? `영업이익 ₩${(pnl.operatingProfit / 1_000_000).toFixed(0)}M 달성`
              : `영업손실 ₩${(Math.abs(pnl.operatingProfit) / 1_000_000).toFixed(0)}M — 비용 구조 재검토 필요`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
        <button
          onClick={() => router.push('/play/results')}
          className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
        >
          ← 결과 대시보드
        </button>
        <button
          onClick={() => router.push('/play')}
          className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          다음 라운드 →
        </button>
      </div>
    </div>
  );
}
