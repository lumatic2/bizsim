import type { CompetitorState } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const INITIAL_COMPETITORS: CompetitorState[] = [
  {
    name: '글로벌테크',
    price: 380_000,
    adBudget: 1_200_000_000,
    quality: 4,
    channels: { online: 30, mart: 50, direct: 20 },
    marketShare: 22,
    revenue: 4_800_000_000,
    unitsSold: 22_000,
    cumulativeRd: 6_000_000_000,  // 공격형 리더 — 기초 R&D 많음
  },
  {
    name: '혁신전자',
    price: 320_000,
    adBudget: 800_000_000,
    quality: 3,
    channels: { online: 55, mart: 35, direct: 10 },
    marketShare: 18,
    revenue: 3_200_000_000,
    unitsSold: 18_000,
    cumulativeRd: 3_500_000_000,  // 가성비형 추격자
  },
  {
    name: '로컬베스트',
    price: 280_000,
    adBudget: 500_000_000,
    quality: 3,
    channels: { online: 40, mart: 40, direct: 20 },
    marketShare: 15,
    revenue: 2_100_000_000,
    unitsSold: 15_000,
    cumulativeRd: 1_500_000_000,  // 수비형 — R&D 여유 적음
  },
];

// 각 경쟁사 성향별 R&D 스태미나 증가량 (분기당). 플레이어는 rdBudget 0~5B 자유 결정, 경쟁사는 고정 전략.
const COMPETITOR_RD_GROWTH = [700_000_000, 500_000_000, 300_000_000];

// 경쟁사 품질 상승은 누적 R&D 의존 — diminishing returns (qualityCapFromRd와 유사 공식)
function qualityGainFromRd(cumulativeRd: number): number {
  // 누적 2B 달성 시 +0.15, 10B 달성 시 +0.5 수준
  const halfPoint = 5_000_000_000;
  const maxBoost = 0.6;
  return maxBoost * (cumulativeRd / (cumulativeRd + halfPoint));
}

export type CompetitorUpdateContext = {
  round: number;
  playerShare: number;
  playerRelativeShare: number; // 플레이어 전체 점유율 / 최대 경쟁사 점유율. > 1 이면 플레이어가 리더.
  supplyIndex: number;         // 공급자 교섭력 지수 — 경쟁사도 동일 공급망 노출 가정
};

export function updateCompetitorDecisions(
  competitors: CompetitorState[],
  context: CompetitorUpdateContext,
): CompetitorState[] {
  const { playerShare, playerRelativeShare, supplyIndex } = context;
  const playerIsLeader = playerRelativeShare > 1.0;

  return competitors.map((c, i) => {
    const prev = { ...c };
    let { price, adBudget, quality, cumulativeRd } = prev;

    // (c) R&D 스태미나: 각 경쟁사 분기별 증가 → 품질 상승에 반영
    cumulativeRd += COMPETITOR_RD_GROWTH[i] ?? 400_000_000;
    const rdGain = qualityGainFromRd(cumulativeRd) - qualityGainFromRd(cumulativeRd - (COMPETITOR_RD_GROWTH[i] ?? 400_000_000));
    quality = clamp(quality + rdGain, 1, 5);

    // (a) supplyIndex 가격 동조: 원자재 상승 시 경쟁사도 가격 인상 (완전 전가 X, 50% 전가)
    // 이벤트 cost_shock과 달리 supplyIndex는 구조적 변동 → 경쟁사 원가도 동일하게 흔들림
    if (supplyIndex > 1.1) {
      price = Math.round(price * (1 + (supplyIndex - 1) * 0.5));
    } else if (supplyIndex < 0.95) {
      // 공급 완화 시 경쟁사 일부 인하 (20% 전가 — 비대칭 sticky pricing)
      price = Math.round(price * (1 + (supplyIndex - 1) * 0.2));
    }

    // (b) 플레이어가 리더(Star 영역)이면 경쟁사 광고 가속. 전원 공통 +15%.
    if (playerIsLeader) {
      adBudget = Math.round(adBudget * 1.15);
    }

    // 기존 규칙: 플레이어 전체 점유율이 25% 이상이면 추가 +10% (Star 중첩 가능)
    if (playerShare > 25) {
      adBudget = Math.round(adBudget * 1.1);
    }

    // 성향별 세부 반응
    if (i === 0) {
      // 글로벌테크 (공격형): 점유율 하락 시 광고+15%, 가격-5%
      if (c.marketShare < 20) {
        adBudget = Math.round(adBudget * 1.15);
        price = Math.round(price * 0.95);
      } else if (c.marketShare > 24) {
        price = Math.round(price * 1.03);
      }
    } else if (i === 1) {
      // 혁신전자 (가성비형): 점유율 하락 시 R&D 스태미나 한 번 더 투입 (품질 +0.2 보너스)
      if (c.marketShare < 16) {
        cumulativeRd += 400_000_000;
        quality = clamp(quality + 0.2, 1, 5);
      }
    } else if (i === 2) {
      // 로컬베스트 (수비형): 점유율 하락 시 가격 인하
      if (c.marketShare < 13) {
        price = Math.round(price * 0.92);
      }
    }

    return {
      ...prev,
      price: clamp(price, 200_000, 500_000),
      adBudget: clamp(adBudget, 300_000_000, 2_500_000_000),
      quality: Math.round(quality * 10) / 10,
      cumulativeRd,
    };
  });
}

export function qualityCapFromRd(cumulativeRd: number): number {
  const baseCap = 3;
  const maxBonus = 2;
  const halfPoint = 8_000_000_000;
  const bonus = maxBonus * (cumulativeRd / (cumulativeRd + halfPoint));
  return Math.round((baseCap + bonus) * 10) / 10;
}

export function getMarketSize(round: number): number {
  return Math.round(100_000 * (1 + 0.03 * (round - 1)));
}
