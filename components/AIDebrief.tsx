'use client';

import { useEffect, useRef, useState } from 'react';
import { SERVER_ERROR_MESSAGE } from '@/lib/errors';

type CommonProps = {
  cachedText?: string;
  onComplete?: (text: string) => void;
};

type Props = CommonProps &
  (
    | {
        mode: 'round';
        round: number;
        payload: unknown;
      }
    | {
        mode: 'final';
        payload: unknown;
      }
  );

export function AIDebrief(props: Props) {
  const hasCache = Boolean(props.cachedText);
  const [text, setText] = useState(props.cachedText ?? '');
  const [status, setStatus] = useState<'loading' | 'streaming' | 'done' | 'error'>(
    hasCache ? 'done' : 'loading',
  );
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const onCompleteRef = useRef(props.onComplete);
  onCompleteRef.current = props.onComplete;

  useEffect(() => {
    if (hasCache) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();
    let collected = '';

    (async () => {
      try {
        const res = await fetch('/api/debrief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(props.payload),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setError(SERVER_ERROR_MESSAGE);
          setStatus('error');
          return;
        }

        setStatus('streaming');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          collected += chunk;
          setText((prev) => prev + chunk);
        }
        setStatus('done');
        if (collected.trim()) {
          onCompleteRef.current?.(collected.trim());
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError(SERVER_ERROR_MESSAGE);
        setStatus('error');
      }
    })();

    return () => controller.abort();
  }, [hasCache]);

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
          {status === 'done' && (hasCache ? '저장됨' : '완료')}
          {status === 'error' && '오류'}
        </span>
      </div>
      {status === 'error' ? (
        <p
          className="text-xs pl-3 border-l-2"
          style={{ color: 'var(--biz-text-muted)', borderLeftColor: '#dc2626' }}
        >
          {error ?? SERVER_ERROR_MESSAGE}
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
