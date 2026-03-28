import { describe, it, expect } from 'vitest';
import { runSimulation } from '../game-engine';
import type { Decisions } from '../types';

const DEFAULT_DECISIONS: Decisions = {
  price: 349_000,
  rdBudget: 2_100_000_000,
  adBudget: 800_000_000,
  production: 15_000,
  channels: { online: 60, mart: 30, direct: 10 },
  quality: 4,
};

describe('runSimulation', () => {
  it('returns valid market share between 0 and 100', () => {
    const result = runSimulation(DEFAULT_DECISIONS);
    expect(result.marketShare).toBeGreaterThanOrEqual(0);
    expect(result.marketShare).toBeLessThanOrEqual(100);
  });

  it('returns positive revenue when units are sold', () => {
    const result = runSimulation(DEFAULT_DECISIONS);
    expect(result.revenue).toBeGreaterThan(0);
    expect(result.unitsSold).toBeGreaterThan(0);
  });

  it('sells no more than production quantity', () => {
    const decisions = { ...DEFAULT_DECISIONS, production: 100 };
    const result = runSimulation(decisions);
    expect(result.unitsSold).toBeLessThanOrEqual(100);
  });

  it('lower price increases demand', () => {
    const expensive = runSimulation({ ...DEFAULT_DECISIONS, price: 500_000 });
    const cheap = runSimulation({ ...DEFAULT_DECISIONS, price: 200_000 });
    const expTotal = Object.values(expensive.segmentDemand).reduce((s, d) => s + d, 0);
    const cheapTotal = Object.values(cheap.segmentDemand).reduce((s, d) => s + d, 0);
    expect(cheapTotal).toBeGreaterThan(expTotal);
  });

  it('higher quality increases satisfaction', () => {
    const low = runSimulation({ ...DEFAULT_DECISIONS, quality: 1 });
    const high = runSimulation({ ...DEFAULT_DECISIONS, quality: 5 });
    expect(high.satisfaction).toBeGreaterThan(low.satisfaction);
  });

  it('zero ad budget still produces some demand', () => {
    const result = runSimulation({ ...DEFAULT_DECISIONS, adBudget: 0 });
    const totalDemand = Object.values(result.segmentDemand).reduce((s, d) => s + d, 0);
    expect(totalDemand).toBeGreaterThan(0);
  });

  it('all segment demands are non-negative', () => {
    const extreme: Decisions = {
      price: 500_000,
      rdBudget: 0,
      adBudget: 0,
      production: 30_000,
      channels: { online: 100, mart: 0, direct: 0 },
      quality: 1,
    };
    const result = runSimulation(extreme);
    for (const demand of Object.values(result.segmentDemand)) {
      expect(demand).toBeGreaterThanOrEqual(0);
    }
  });
});
