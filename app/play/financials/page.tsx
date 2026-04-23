'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { FinancialTable } from '@/components/FinancialTable';
import { AIDebrief } from '@/components/AIDebrief';

type Tab = 'pnl' | 'bs' | 'cf';

export default function FinancialsPage() {
  const router = useRouter();
  const { financials, results, decisions, currentRound, maxRounds, advanceRound, gameOver, roundHistory, roundDebriefs, setRoundDebrief, currentEvent, brandEquity } = useGameStore();
  const [tab, setTab] = useState<Tab>('pnl');

  const previousResults = useMemo(() => {
    const prev = roundHistory[roundHistory.length - 1];
    return prev ? prev.results : null;
  }, [roundHistory]);

  const debriefPayload = useMemo(
    () =>
      results
        ? { mode: 'round' as const, round: currentRound, decisions, results, previousResults, event: currentEvent, brandEquity }
        : null,
    [results, currentRound, decisions, previousResults, currentEvent, brandEquity],
  );

  useEffect(() => {
    if (!financials || !results) {
      router.push('/play');
    }
  }, [financials, results, router]);

  if (!financials || !results) {
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
    { label: '감가상각비', value: -pnl.depreciationExpense },
    { label: '인건비·기타', value: -pnl.otherExpense },
    { label: '영업이익', value: pnl.operatingProfit, isTotal: true },
    { label: '영업외', value: 0, isHeader: true },
    { label: '이자비용', value: -pnl.interestExpense },
    { label: '법인세차감전순이익', value: pnl.pretaxIncome, isTotal: true },
    { label: '법인세비용', value: -pnl.incomeTax },
    { label: '  ↳ R&D 세액공제 반영', value: pnl.rdTaxCredit },
    { label: '당기순이익', value: pnl.netIncome, isTotal: true },
  ];

  const bsRows = [
    { label: '자산', value: 0, isHeader: true },
    { label: '현금', value: bs.cash },
    { label: '매출채권', value: bs.receivables },
    { label: '재고자산', value: bs.inventory },
    { label: '유형자산(순액)', value: bs.ppe },
    { label: '총자산', value: bs.totalAssets, isTotal: true },
    { label: '부채', value: 0, isHeader: true },
    { label: '매입채무', value: bs.payables },
    { label: '미지급법인세', value: bs.taxPayable },
    { label: '차입금', value: bs.debt },
    { label: '자본', value: 0, isHeader: true },
    { label: '자본금', value: bs.equity },
    { label: '자본잉여금', value: bs.capitalSurplus },
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
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-[Manrope] font-bold mb-2" style={{ color: 'var(--biz-text)' }}>
        재무제표
      </h1>
      <p style={{ color: 'var(--biz-text-muted)' }} className="text-sm mb-6">
        {currentRound}분기 경영 성과를 재무제표로 분석하세요.
      </p>

      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={
              tab === t.id
                ? { background: 'var(--biz-primary)', borderColor: 'var(--biz-primary)', color: 'white' }
                : { background: 'var(--biz-card)', borderColor: 'var(--biz-border)', color: 'var(--biz-text-muted)' }
            }
            className="px-4 py-2 text-sm rounded-lg border transition-colors font-semibold"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4">
        <FinancialTable rows={tableRows} />
      </div>

      <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4 mt-4 text-sm" >
        <div className="flex items-center gap-3" style={{ color: 'var(--biz-text-muted)' }}>
          <span>
            매출총이익률 <span style={{ color: 'var(--biz-text)' }} className="font-semibold">
              {pnl.revenue > 0 ? ((pnl.grossProfit / pnl.revenue) * 100).toFixed(1) : 0}%
            </span>
          </span>
          <span style={{ color: 'var(--biz-border)' }}>·</span>
          <span>
            {pnl.operatingProfit > 0
              ? <>영업이익 <span style={{ color: 'var(--biz-success, #15803d)' }} className="font-semibold">₩{(pnl.operatingProfit / 1_000_000).toFixed(0)}M</span> 달성</>
              : <>영업손실 <span style={{ color: '#dc2626' }} className="font-semibold">₩{(Math.abs(pnl.operatingProfit) / 1_000_000).toFixed(0)}M</span> — 비용 구조 재검토 필요</>}
          </span>
        </div>
      </div>

      {debriefPayload && (
        <div className="mt-4">
          <AIDebrief
            key={`fin-round-${currentRound}`}
            mode="round"
            round={currentRound}
            payload={debriefPayload}
            cachedText={roundDebriefs[currentRound]}
            onComplete={(text) => setRoundDebrief(currentRound, text)}
          />
        </div>
      )}

      <div style={{ borderTopColor: 'var(--biz-border)' }} className="flex items-center justify-between border-t pt-4 mt-4">
        <button
          onClick={() => router.push('/play/results')}
          style={{ borderColor: 'var(--biz-border)', color: 'var(--biz-text-muted)' }}
          className="border px-4 py-2 rounded-lg text-sm hover:opacity-75 transition-opacity"
        >
          ← 결과 대시보드
        </button>
        <button
          onClick={() => {
            const isFinalRound = currentRound >= maxRounds;
            advanceRound();
            router.push(isFinalRound ? '/play/end' : '/play');
          }}
          style={{ background: 'var(--biz-primary)' }}
          className="text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          {currentRound >= maxRounds ? '게임 종료' : '다음 라운드 →'}
        </button>
      </div>
    </div>
  );
}

