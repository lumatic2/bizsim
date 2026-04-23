'use client';

import { useState } from 'react';

type Step = {
  title: string;
  body: string;
  highlight?: string;
};

const STEPS: Step[] = [
  {
    title: 'BizSim에 오신 것을 환영합니다',
    body: '스마트홈 가전 시장에서 **6분기** 동안 CEO 역할로 경영 의사결정을 내리는 **경영학 이론 기반 시뮬**입니다.',
    highlight: '재무회계·전략론·운영관리·고급 마케팅·조직경제학이 실제 레버로 작동',
  },
  {
    title: '한 분기의 흐름',
    body: '**① 의사결정** (제품·마케팅·R&D·운영·자본 5개 탭, 20+ 레버) → **② 소비자 인터뷰** (AI 페르소나 3명) → **③ 결과** (BCG·STP·CLV·프레임워크 태그) → **④ 재무제표** (PnL·BS·CF·제품별)',
    highlight: '매 분기 의사결정은 다음 분기에 누적되며, 경쟁사 3개와 원자재 공급망이 동시에 반응',
  },
  {
    title: '내재된 경영학 프레임워크',
    body: '**Porter 5 Forces · BCG 매트릭스 · Ansoff · Wright\'s Law(경험곡선) · M/M/1 대기행렬 · EOQ · Bullwhip · CLV · Adstock(Koyck) · STP**',
    highlight: '각 레버와 수치가 해당 이론의 실제 공식으로 계산됩니다 — 차트·태그·AI 디브리프로 피드백',
  },
];

const STORAGE_KEY = 'bizsim-onboarded';

export function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(STORAGE_KEY) === 'true';
}

export function markOnboardingSeen(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, 'true');
}

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const close = () => {
    markOnboardingSeen();
    onClose();
  };

  // body에 **굵은** 마크다운을 간단 파싱
  const renderBody = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i} style={{ color: 'var(--biz-text)' }}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.5)' }}
      onClick={close}
    >
      <div
        className="w-full max-w-lg rounded-lg shadow-xl border"
        style={{ background: 'var(--biz-card)', borderColor: 'var(--biz-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-3">
          <div className="flex items-center gap-2 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all"
                style={{ background: i <= step ? 'var(--biz-primary)' : '#e2e8f0' }}
              />
            ))}
          </div>
          <h2 className="text-xl font-[Manrope] font-bold mb-3" style={{ color: 'var(--biz-text)' }}>
            {s.title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--biz-text-muted)' }}>
            {renderBody(s.body)}
          </p>
          {s.highlight && (
            <div
              className="mt-3 text-xs px-3 py-2 rounded border-l-4"
              style={{ background: 'var(--biz-primary-light)', borderColor: 'var(--biz-primary)', color: 'var(--biz-text)' }}
            >
              {s.highlight}
            </div>
          )}
        </div>
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--biz-border)' }}
        >
          <button
            onClick={close}
            className="text-xs hover:opacity-75"
            style={{ color: 'var(--biz-text-muted)' }}
          >
            건너뛰기
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="border px-4 py-2 rounded-lg text-sm hover:opacity-75"
                style={{ borderColor: 'var(--biz-border)', color: 'var(--biz-text-muted)' }}
              >
                이전
              </button>
            )}
            {isLast ? (
              <button
                onClick={close}
                style={{ background: 'var(--biz-primary)' }}
                className="text-white px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90"
              >
                시작하기 →
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                style={{ background: 'var(--biz-primary)' }}
                className="text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              >
                다음
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
