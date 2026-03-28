'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, PersonaId, Decisions } from '@/lib/types';

type Props = {
  personaId: PersonaId;
  personaName: string;
  messages: ChatMessage[];
  decisions: Decisions;
  onSend: (message: string) => void;
  isLoading: boolean;
};

export function ChatInterface({ personaName, messages, onSend, isLoading }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs text-gray-400 mb-2 italic">
        {personaName}님에게 자유롭게 질문하세요. 제품 반응, 가격 민감도, 구매 의향을 파악할 수 있습니다.
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[300px] max-h-[400px]">
        {messages.length === 0 && (
          <div className="text-sm text-gray-300 text-center mt-20">
            대화를 시작해보세요
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'ml-auto bg-gray-900 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="소비자에게 질문하세요..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-40"
        >
          {isLoading ? '...' : '전송'}
        </button>
      </form>
    </div>
  );
}
