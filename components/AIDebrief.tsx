'use client';

import { useEffect, useRef, useState } from 'react';

type Props =
  | {
      mode: 'round';
      round: number;
      payload: unknown;
    }
  | {
      mode: 'final';
      payload: unknown;
    };

export function AIDebrief(props: Props) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'loading' | 'streaming' | 'done' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/debrief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(props.payload),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const msg = await res.text().catch(() => `HTTP ${res.status}`);
          setError(msg);
          setStatus('error');
          return;
        }

        setStatus('streaming');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setText((prev) => prev + decoder.decode(value, { stream: true }));
        }
        setStatus('done');
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError((e as Error).message || '알 수 없는 오류');
        setStatus('error');
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <div
      style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }}
      className="border rounded-lg p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--biz-text)' }}>
          AI 디브리프 {props.mode === 'final' ? '· 최종 총평' : ''}
        </h3>
        <span className="text-xs font-mono" style={{ color: 'var(--biz-text-muted)' }}>
          {status === 'loading' && '생성 준비 중…'}
          {status === 'streaming' && '작성 중…'}
          {status === 'done' && '완료'}
          {status === 'error' && '오류'}
        </span>
      </div>
      {status === 'error' ? (
        <p
          className="text-xs pl-3 border-l-2"
          style={{ color: 'var(--biz-text-muted)', borderLeftColor: '#dc2626' }}
        >
          {error ?? '로컬 AI 호출에 실패했습니다.'}
        </p>
      ) : (
        <p
          className="text-sm whitespace-pre-wrap pl-3 border-l-2"
          style={{ color: 'var(--biz-text)', borderLeftColor: 'var(--biz-primary)' }}
        >
          {text || (status === 'loading' ? '' : '\u00A0')}
          {status === 'streaming' && <span className="opacity-60">▌</span>}
        </p>
      )}
    </div>
  );
}
