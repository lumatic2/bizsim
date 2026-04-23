'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { ChatInterface } from '@/components/ChatInterface';
import { PERSONAS } from '@/lib/personas';
import { runSimulation } from '@/lib/game-engine';
import { generateFinancials, INITIAL_PPE, productionCapacityFrom } from '@/lib/financial-mapper';
import { getMarketSize } from '@/lib/competitor-ai';
import { exploreBoostFrom } from '@/lib/ansoff';
import { SERVER_ERROR_MESSAGE } from '@/lib/errors';

export default function InterviewPage() {
  const router = useRouter();
  const {
    decisions, chatHistories, selectedPersona, competitors, currentRound, qualityCap, previousBS, currentEvent, brandEquity, cumulativeLoss, cumulativeProduction, supplyIndex, cumulativeExploreRd, pendingProduction, adstock,
    setSelectedPersona, addMessage, appendToLastAssistant,
    setResults, setFinancials,
  } = useGameStore();
  const [isLoading, setIsLoading] = useState(false);

  const persona = PERSONAS.find((p) => p.id === selectedPersona)!;
  const messages = chatHistories[selectedPersona];

  const handleSend = async (content: string) => {
    addMessage(selectedPersona, { role: 'user', content });
    addMessage(selectedPersona, { role: 'assistant', content: '' });
    setIsLoading(true);

    try {
      const allMessages = [...chatHistories[selectedPersona], { role: 'user' as const, content }];
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          personaId: selectedPersona,
          decisions,
        }),
      });

      if (!res.ok) {
        appendToLastAssistant(selectedPersona, `(${SERVER_ERROR_MESSAGE})`);
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          appendToLastAssistant(selectedPersona, chunk);
        }
      }
    } catch {
      appendToLastAssistant(selectedPersona, `(${SERVER_ERROR_MESSAGE})`);
    }
    setIsLoading(false);
  };

  const handleRunSimulation = () => {
    const marketSize = getMarketSize(currentRound);
    const capacity = productionCapacityFrom(previousBS?.ppe ?? INITIAL_PPE);
    const exploreBoost = exploreBoostFrom(cumulativeExploreRd);
    const results = runSimulation(decisions, competitors, marketSize, qualityCap, currentEvent, brandEquity, capacity, cumulativeProduction, supplyIndex, exploreBoost, pendingProduction, adstock);
    setResults(results);
    const financials = generateFinancials(decisions, results, previousBS, currentEvent, cumulativeLoss, cumulativeProduction, supplyIndex);
    setFinancials(financials);
    router.push('/play/results');
  };

  const dnaByPersona = {
    jiyeon: { segment: 'budget', price: 'HIGH', brand: 'LOW', innovation: 'MODERATE' },
    minsoo: { segment: 'early-adopter', price: 'LOW', brand: 'MODERATE', innovation: 'HIGH' },
    soonja: { segment: 'brand-loyal', price: 'MODERATE', brand: 'HIGH', innovation: 'LOW' },
  } as const;

  const dna = dnaByPersona[selectedPersona];

  const badgeStyle = (value: 'HIGH' | 'MODERATE' | 'LOW') => {
    if (value === 'HIGH') return { background: 'var(--biz-warning-bg)', color: 'var(--biz-warning)', borderColor: 'var(--biz-warning)' };
    if (value === 'MODERATE') return { background: 'var(--biz-primary-light)', color: 'var(--biz-primary)', borderColor: 'var(--biz-primary)' };
    return { background: 'var(--biz-border)', color: 'var(--biz-text-muted)', borderColor: 'var(--biz-border)' };
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-[Manrope] font-bold" style={{ color: 'var(--biz-text)' }}>
        소비자 인터뷰
      </h1>
      <div className="text-xs" style={{ color: 'var(--biz-text-muted)' }}>
        소비자에게 직접 물어보세요. 제품 반응, 가격 민감도, 구매 의향을 대화로 파악할 수 있습니다.
      </div>

      <div className="grid gap-4 min-h-[520px] lg:grid-cols-[220px_1fr_200px]">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">소비자 페르소나</h3>
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPersona(p.id)}
              style={{
                background: selectedPersona === p.id ? 'var(--biz-primary-light)' : 'var(--biz-card)',
                borderColor: selectedPersona === p.id ? 'var(--biz-primary)' : 'var(--biz-border)',
              }}
              className="w-full text-left border rounded-lg p-3 transition-colors"
            >
              <div className="text-lg mb-1">{p.emoji}</div>
              <div className="text-sm font-semibold" style={{ color: 'var(--biz-text)' }}>{p.name} ({p.age})</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--biz-text-muted)' }}>{p.description}</div>
              <div className="mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px]" style={{ borderColor: 'var(--biz-border)', color: 'var(--biz-text-muted)' }}>
                {Math.floor(chatHistories[p.id].length / 2)}회 대화
              </div>
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-4">
          <div style={{ borderBottomColor: 'var(--biz-border)' }} className="mb-3 flex items-center justify-between pb-3 border-b">
            <div className="text-sm font-semibold" style={{ color: 'var(--biz-text)' }}>{persona.name}</div>
            <span style={{ background: 'var(--biz-success-bg)', color: 'var(--biz-success)', borderColor: 'var(--biz-success)' }} className="rounded-full border px-2 py-0.5 text-[11px] font-semibold">
              ONLINE
            </span>
          </div>
          <ChatInterface
            personaId={selectedPersona}
            personaName={persona.name}
            messages={messages}
            decisions={decisions}
            onSend={handleSend}
            isLoading={isLoading}
          />
        </div>

        <aside style={{ background: 'var(--biz-primary-light)', borderColor: 'var(--biz-border)' }} className="border rounded-lg p-3">
          <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--biz-text-muted)' }}>Persona DNA</h3>
          <div style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)', color: 'var(--biz-text-muted)' }} className="mb-3 rounded-lg border px-2 py-1.5 text-xs">
            세그먼트: <span className="font-semibold" style={{ color: 'var(--biz-text)' }}>{dna.segment}</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--biz-text-muted)' }}>가격민감도</span>
              <span style={badgeStyle(dna.price)} className="rounded-full border px-2 py-0.5">{dna.price}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--biz-text-muted)' }}>브랜드충성도</span>
              <span style={badgeStyle(dna.brand)} className="rounded-full border px-2 py-0.5">{dna.brand}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--biz-text-muted)' }}>혁신수용도</span>
              <span style={badgeStyle(dna.innovation)} className="rounded-full border px-2 py-0.5">{dna.innovation}</span>
            </div>
          </div>
        </aside>
      </div>

      <div style={{ borderTopColor: 'var(--biz-border)' }} className="flex items-center justify-between border-t pt-4 mt-4">
        <span className="text-xs" style={{ color: 'var(--biz-text-muted)' }}>
          인터뷰 완료 후 시뮬레이션을 실행하세요
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/play')}
            style={{ borderColor: 'var(--biz-border)', color: 'var(--biz-text-muted)' }}
            className="border px-4 py-2 rounded-lg text-sm hover:opacity-75 transition-opacity"
          >
            ← 의사결정 수정
          </button>
          <button
            onClick={handleRunSimulation}
            style={{ background: 'var(--biz-primary)' }}
            className="text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
          >
            시뮬레이션 실행 →
          </button>
        </div>
      </div>
    </div>
  );
}


