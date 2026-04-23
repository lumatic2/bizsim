import { describe, it, expect } from 'vitest';
import { computeCLV } from '../clv';

describe('computeCLV', () => {
  it('returns zero CLV when no units sold', () => {
    const c = computeCLV(0, 0, 50, 50);
    expect(c.aov).toBe(0);
    expect(c.clv).toBe(0);
  });

  it('AOV = revenue / unitsSold', () => {
    const c = computeCLV(10_000_000, 100, 50, 50);
    expect(c.aov).toBe(100_000);
  });

  it('retention = 0.5·sat + 0.5·brand (normalized)', () => {
    const c = computeCLV(1_000_000, 10, 100, 100);
    expect(c.retention).toBeCloseTo(0.95, 3);  // max clamped
  });

  it('higher satisfaction + brand → higher CLV at same AOV', () => {
    const low = computeCLV(1_000_000, 10, 40, 40);
    const high = computeCLV(1_000_000, 10, 90, 90);
    expect(high.clv).toBeGreaterThan(low.clv);
  });

  it('repurchase cycles clamp at 20 (무한 retention 방지)', () => {
    const c = computeCLV(1_000_000, 10, 100, 100);
    expect(c.repurchaseCycles).toBeLessThanOrEqual(20);
  });

  it('breakdown parts sum matches retention', () => {
    const c = computeCLV(1_000_000, 10, 60, 80);
    expect(c.satisfactionContribution + c.brandContribution).toBeCloseTo(c.retention, 5);
  });

  it('retention 0 → CLV ≈ AOV (1 cycle only)', () => {
    const c = computeCLV(1_000_000, 10, 0, 0);
    expect(c.retention).toBe(0);
    expect(c.repurchaseCycles).toBeCloseTo(1, 3);
    expect(c.clv).toBeCloseTo(100_000, 3);
  });
});
