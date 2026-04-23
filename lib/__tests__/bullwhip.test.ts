import { describe, it, expect } from 'vitest';
import { playerDemandVolatility, bullwhipExcess, bullwhipSupplyDrift, bullwhipCompetitorAmp, BULLWHIP_THRESHOLD } from '../bullwhip';
import { rollSupplyIndex } from '../supply';
import { updateCompetitorDecisions, INITIAL_COMPETITORS } from '../competitor-ai';

describe('playerDemandVolatility', () => {
  it('첫 분기 (prev 없음) → 0', () => {
    expect(playerDemandVolatility(15_000, 0)).toBe(0);
  });

  it('변동 없음 → 0', () => {
    expect(playerDemandVolatility(15_000, 15_000)).toBe(0);
  });

  it('판매 50% 증가 → 0.5', () => {
    expect(playerDemandVolatility(15_000, 10_000)).toBeCloseTo(0.5, 5);
  });

  it('판매 30% 감소 → 0.3 (절대값)', () => {
    expect(playerDemandVolatility(7_000, 10_000)).toBeCloseTo(0.3, 5);
  });
});

describe('bullwhipExcess', () => {
  it('임계 이하 → 0', () => {
    expect(bullwhipExcess(0.15)).toBe(0);
    expect(bullwhipExcess(BULLWHIP_THRESHOLD)).toBe(0);
  });

  it('임계 초과분만 반환', () => {
    expect(bullwhipExcess(0.4)).toBeCloseTo(0.2, 5);
  });
});

describe('bullwhipSupplyDrift + rollSupplyIndex 결합', () => {
  it('Bullwhip drift가 SPI 상승압력으로 전달', () => {
    const noShock = () => 0.5;
    const baseDrift = rollSupplyIndex(1.0, noShock, 0);
    const withBullwhip = rollSupplyIndex(1.0, noShock, 0.02);  // +2% 추가 drift
    expect(withBullwhip).toBeGreaterThan(baseDrift);
  });
});

describe('bullwhipCompetitorAmp + updateCompetitorDecisions 결합', () => {
  it('bullwhipAmp > 0 시 경쟁사 광고 증가 가속', () => {
    const calm = updateCompetitorDecisions(INITIAL_COMPETITORS, {
      round: 3, playerShare: 10, playerRelativeShare: 0.5, supplyIndex: 1.0, bullwhipAmp: 0,
    });
    const storm = updateCompetitorDecisions(INITIAL_COMPETITORS, {
      round: 3, playerShare: 10, playerRelativeShare: 0.5, supplyIndex: 1.0, bullwhipAmp: 0.3,
    });
    for (let i = 0; i < calm.length; i++) {
      expect(storm[i].adBudget).toBeGreaterThan(calm[i].adBudget);
    }
  });
});
