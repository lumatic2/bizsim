import { describe, it, expect } from 'vitest';
import { INITIAL_COMPETITORS, updateCompetitorDecisions } from '../competitor-ai';

const BASE_CONTEXT = {
  round: 2,
  playerShare: 10,          // 리더 아님
  playerRelativeShare: 0.5, // < 1 → 리더 아님
  supplyIndex: 1.0,         // 정상
};

describe('updateCompetitorDecisions — supply power 가격 동조', () => {
  it('supplyIndex > 1.1 시 경쟁사 가격 상승 (50% 전가)', () => {
    const calm = updateCompetitorDecisions(INITIAL_COMPETITORS, BASE_CONTEXT);
    const tight = updateCompetitorDecisions(INITIAL_COMPETITORS, { ...BASE_CONTEXT, supplyIndex: 1.2 });
    for (let i = 0; i < calm.length; i++) {
      expect(tight[i].price).toBeGreaterThan(calm[i].price);
    }
  });

  it('supplyIndex < 0.95 시 경쟁사 가격 소폭 하락 (20% 비대칭 전가)', () => {
    const calm = updateCompetitorDecisions(INITIAL_COMPETITORS, BASE_CONTEXT);
    const slack = updateCompetitorDecisions(INITIAL_COMPETITORS, { ...BASE_CONTEXT, supplyIndex: 0.9 });
    for (let i = 0; i < calm.length; i++) {
      expect(slack[i].price).toBeLessThanOrEqual(calm[i].price);
    }
  });
});

describe('updateCompetitorDecisions — 플레이어 리더 반응', () => {
  it('playerRelativeShare > 1 시 경쟁사 광고 15% 가속', () => {
    const normal = updateCompetitorDecisions(INITIAL_COMPETITORS, BASE_CONTEXT);
    const leader = updateCompetitorDecisions(INITIAL_COMPETITORS, { ...BASE_CONTEXT, playerRelativeShare: 1.5 });
    for (let i = 0; i < normal.length; i++) {
      expect(leader[i].adBudget).toBeGreaterThan(normal[i].adBudget);
    }
  });

  it('플레이어 점유율 25% + 리더일 때 광고 가속 중첩', () => {
    const weak = updateCompetitorDecisions(INITIAL_COMPETITORS, BASE_CONTEXT);
    const star = updateCompetitorDecisions(INITIAL_COMPETITORS, { ...BASE_CONTEXT, playerShare: 30, playerRelativeShare: 1.5 });
    for (let i = 0; i < weak.length; i++) {
      // 중첩이면 1.15 × 1.1 = 1.265 만큼
      expect(star[i].adBudget / weak[i].adBudget).toBeGreaterThan(1.2);
    }
  });
});

describe('updateCompetitorDecisions — R&D 스태미나', () => {
  it('cumulativeRd는 분기마다 증가', () => {
    const next = updateCompetitorDecisions(INITIAL_COMPETITORS, BASE_CONTEXT);
    for (let i = 0; i < next.length; i++) {
      expect(next[i].cumulativeRd).toBeGreaterThan(INITIAL_COMPETITORS[i].cumulativeRd);
    }
  });

  it('스태미나 누적으로 품질 상승 (초기 대비)', () => {
    // 10 라운드 누적 시뮬 후 품질이 시간이 갈수록 상승(혹은 유지) 되어야 함
    let comps = INITIAL_COMPETITORS;
    const initialQualities = comps.map((c) => c.quality);
    for (let r = 2; r <= 10; r++) {
      comps = updateCompetitorDecisions(comps, { ...BASE_CONTEXT, round: r });
    }
    for (let i = 0; i < comps.length; i++) {
      expect(comps[i].quality).toBeGreaterThanOrEqual(initialQualities[i]);
    }
    // 글로벌테크(i=0)가 가장 높은 스태미나 성장률 → 가장 큰 품질 상승
    const growth0 = comps[0].quality - initialQualities[0];
    const growth2 = comps[2].quality - initialQualities[2];
    expect(growth0).toBeGreaterThanOrEqual(growth2);
  });
});
