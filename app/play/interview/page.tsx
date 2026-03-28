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

  return (
    <div>
      <div className="text-xs text-gray-400 mb-4">
        소비자에게 직접 물어보세요. 제품 반응, 가격 민감도, 구매 의향을 대화로 파악할 수 있습니다.
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-4 min-h-[450px]">
        <div className="border-r border-gray-200 pr-4 space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">소비자 페르소나</h3>
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPersona(p.id)}
              className={`w-full text-left border rounded-lg p-3 transition-colors ${
                selectedPersona === p.id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-lg mb-1">{p.emoji}</div>
              <div className="text-sm font-semibold">{p.name} ({p.age})</div>
              <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>
              {chatHistories[p.id].length > 0 && (
                <div className="text-xs text-blue-500 mt-1">
                  {Math.floor(chatHistories[p.id].length / 2)}회 대화
                </div>
              )}
            </button>
          ))}
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

      <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
        <span className="text-xs text-gray-400">
          인터뷰 완료 후 시뮬레이션을 실행하세요
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/play')}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            ← 의사결정 수정
          </button>
          <button
            onClick={handleRunSimulation}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            시뮬레이션 실행 →
          </button>
        </div>
      </div>
    </div>
  );
}
