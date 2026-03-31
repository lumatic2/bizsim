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
  },
];

export function updateCompetitorDecisions(
  competitors: CompetitorState[],
  round: number,
  playerShare: number,
): CompetitorState[] {
  return competitors.map((c, i) => {
    const prev = { ...c };
    let { price, adBudget, quality } = prev;

    // 공통: 자체 R&D로 품질 소폭 상승
    quality = clamp(quality + 0.1 + i * 0.05, 1, 5);

    // 플레이어가 25% 이상 점유 시 전체 경쟁사 광고 +10%
    if (playerShare > 25) {
      adBudget = Math.round(adBudget * 1.1);
    }

    if (i === 0) {
      // 글로벌테크 (공격형): 점유율 하락 시 광고+15%, 가격-5%
      if (c.marketShare < 20) {
        adBudget = Math.round(adBudget * 1.15);
        price = Math.round(price * 0.95);
      } else if (c.marketShare > 24) {
        price = Math.round(price * 1.03);
      }
    } else if (i === 1) {
      // 혁신전자 (가성비형): 점유율 하락 시 품질 투자
      if (c.marketShare < 16) {
        quality = clamp(quality + 0.3, 1, 5);
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
      adBudget: clamp(adBudget, 300_000_000, 2_000_000_000),
      quality: Math.round(quality * 10) / 10,
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
