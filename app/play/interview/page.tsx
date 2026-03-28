'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { ChatInterface } from '@/components/ChatInterface';
import { PERSONAS } from '@/lib/personas';
import { runSimulation } from '@/lib/game-engine';
import { generateFinancials } from '@/lib/financial-mapper';

export default function InterviewPage() {
  const router = useRouter();
  const {
    decisions, chatHistories, selectedPersona,
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
        appendToLastAssistant(selectedPersona, '(API 연결 오류 — .env.local에 ANTHROPIC_API_KEY를 설정해주세요)');
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
      appendToLastAssistant(selectedPersona, '(네트워크 오류가 발생했습니다. 다시 시도해주세요.)');
    }
    setIsLoading(false);
  };

  const handleRunSimulation = () => {
    const results = runSimulation(decisions);
    setResults(results);
    const financials = generateFinancials(decisions, results);
    setFinancials(financials);
    router.push('/play/results');
  };

  const dnaByPersona = {
    jiyeon: { segment: 'budget', price: 'HIGH', brand: 'LOW', innovation: 'MODERATE' },
    minsoo: { segment: 'early-adopter', price: 'LOW', brand: 'MODERATE', innovation: 'HIGH' },
    soonja: { segment: 'brand-loyal', price: 'MODERATE', brand: 'HIGH', innovation: 'LOW' },
  } as const;

  const dna = dnaByPersona[selectedPersona];

  const badgeClass = (value: 'HIGH' | 'MODERATE' | 'LOW') => {
    if (value === 'HIGH') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (value === 'MODERATE') return 'bg-[#38debb]/20 text-[#38debb] border-[#38debb]/40';
    return 'bg-[#27354c] text-[#b6c6ed] border-[#3c4a45]';
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-[#bacac3]">
        소비자에게 직접 물어보세요. 제품 반응, 가격 민감도, 구매 의향을 대화로 파악할 수 있습니다.
      </div>

      <div className="grid gap-4 min-h-[520px] lg:grid-cols-[220px_1fr_200px]">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#bacac3] uppercase mb-3">소비자 페르소나</h3>
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPersona(p.id)}
              className={`w-full text-left border rounded-lg p-3 transition-colors bg-[#112036] ${
                selectedPersona === p.id
                  ? 'border-[#38debb]'
                  : 'border-[#3c4a45] hover:border-[#bacac3]'
              }`}
            >
              <div className="text-lg mb-1">{p.emoji}</div>
              <div className="text-sm font-semibold text-[#d6e3ff]">{p.name} ({p.age})</div>
              <div className="text-xs text-[#bacac3] mt-0.5">{p.description}</div>
              <div className="mt-2 inline-flex rounded-full border border-[#3c4a45] px-2 py-0.5 text-[11px] text-[#bacac3]">
                {Math.floor(chatHistories[p.id].length / 2)}회 대화
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-[#3c4a45] bg-[#041329] p-4">
          <div className="mb-3 flex items-center justify-between border-b border-[#3c4a45]/20 pb-3">
            <div className="text-sm font-semibold text-[#d6e3ff]">{persona.name}</div>
            <span className="rounded-full border border-[#38debb]/40 bg-[#38debb]/20 px-2 py-0.5 text-[11px] font-semibold text-[#38debb]">
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

        <aside className="rounded-xl border border-[#3c4a45] bg-[#0d1c32] p-3">
          <h3 className="text-xs font-semibold text-[#bacac3] uppercase mb-3">Persona DNA</h3>
          <div className="mb-3 rounded-lg border border-[#3c4a45] bg-[#112036] px-2 py-1.5 text-xs text-[#bacac3]">
            세그먼트: <span className="font-semibold text-[#d6e3ff]">{dna.segment}</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#bacac3]">가격민감도</span>
              <span className={`rounded-full border px-2 py-0.5 ${badgeClass(dna.price)}`}>{dna.price}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#bacac3]">브랜드충성도</span>
              <span className={`rounded-full border px-2 py-0.5 ${badgeClass(dna.brand)}`}>{dna.brand}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#bacac3]">혁신수용도</span>
              <span className={`rounded-full border px-2 py-0.5 ${badgeClass(dna.innovation)}`}>{dna.innovation}</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="flex items-center justify-between border-t border-[#3c4a45]/20 pt-4 mt-4">
        <span className="text-xs text-[#bacac3]">
          인터뷰 완료 후 시뮬레이션을 실행하세요
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/play')}
            className="border border-[#3c4a45] text-[#bacac3] px-4 py-2 rounded-lg text-sm hover:bg-[#0d1c32]"
          >
            ← 의사결정 수정
          </button>
          <button
            onClick={handleRunSimulation}
            className="bg-[#38debb] text-[#041329] px-6 py-2.5 rounded-lg text-sm font-bold hover:brightness-110 shadow-[0_0_15px_rgba(56,222,187,0.4)]"
          >
            시뮬레이션 실행 →
          </button>
        </div>
      </div>
    </div>
  );
}


