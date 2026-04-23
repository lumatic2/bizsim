import type { RoundEvent } from './types';

export const CALM_EVENT: RoundEvent = {
  id: 'calm',
  title: '평온한 분기',
  description: '시장에 특이사항이 없습니다. 정해진 전략에 집중하세요.',
  severity: 'neutral',
  effects: {},
};

export const EVENT_POOL: RoundEvent[] = [
  {
    id: 'cost_shock',
    title: '원자재 급등',
    description: '반도체·구리 가격 급등으로 이번 분기 단가가 30% 상승합니다.',
    severity: 'bad',
    effects: { costMultiplier: 1.3 },
  },
  {
    id: 'competitor_launch',
    title: '경쟁사 신제품 출시',
    description: '글로벌테크가 프리미엄 라인업을 발표해 경쟁사 평균 품질이 일시적으로 상승합니다.',
    severity: 'bad',
    effects: { competitorQualityBoost: 0.5 },
  },
  {
    id: 'regulation',
    title: '유통 규제 강화',
    description: '대형마트 진열 규제로 마트 채널 효과가 30% 감소합니다.',
    severity: 'bad',
    effects: { martChannelPenalty: 0.7 },
  },
  {
    id: 'pr_crisis',
    title: 'SNS PR 이슈',
    description: '제품 관련 부정 바이럴이 확산돼 만족도와 브랜드 에쿼티가 타격을 입습니다.',
    severity: 'bad',
    effects: { satisfactionPenalty: 15, brandEquityPenalty: 20 },
  },
  {
    id: 'market_boom',
    title: '시장 호황',
    description: '가계 소비 반등으로 이번 분기 전체 시장 규모가 20% 확대됩니다.',
    severity: 'good',
    effects: { marketSizeMultiplier: 1.2 },
  },
  {
    id: 'tech_breakthrough',
    title: '기술 혁신 기회',
    description: '공용 기술 표준 업데이트로 품질 상한이 일시적으로 +0.5 상승합니다.',
    severity: 'good',
    effects: { qualityCapBonus: 0.5 },
  },
];

export function rollEvent(round: number, rng: () => number = Math.random): RoundEvent {
  if (round <= 1) return CALM_EVENT;
  // 라운드 2부터: 20% 확률로 평온, 80% 확률로 이벤트 풀에서 하나
  if (rng() < 0.2) return CALM_EVENT;
  const idx = Math.floor(rng() * EVENT_POOL.length);
  return EVENT_POOL[idx] ?? CALM_EVENT;
}
