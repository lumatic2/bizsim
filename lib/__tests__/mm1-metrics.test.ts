import { describe, it, expect } from 'vitest';
import { computeMM1 } from '../mm1-metrics';

describe('computeMM1', () => {
  it('안정 상태 (ρ < 1) 표준 공식', () => {
    // λ=5, μ=10 → ρ=0.5, L=1, Lq=0.5, W=0.2, Wq=0.1
    const m = computeMM1(5, 10);
    expect(m.utilization).toBeCloseTo(0.5, 5);
    expect(m.systemSize).toBeCloseTo(1.0, 5);
    expect(m.queueSize).toBeCloseTo(0.5, 5);
    expect(m.systemTime).toBeCloseTo(0.2, 5);
    expect(m.queueTime).toBeCloseTo(0.1, 5);
  });

  it('ρ=0에서 시스템 비어있음 확률 = 1', () => {
    const m = computeMM1(0, 10);
    expect(m.distribution[0].probability).toBeCloseTo(1, 5);
  });

  it('ρ ≥ 1 포화 상태 → 모든 지표 Infinity', () => {
    const m = computeMM1(15, 10);
    expect(m.utilization).toBeGreaterThan(1);
    expect(m.systemSize).toBe(Infinity);
    expect(m.queueSize).toBe(Infinity);
    expect(m.distribution).toHaveLength(0);
  });

  it('serviceRate 0 → Infinity + 분포 없음', () => {
    const m = computeMM1(10, 0);
    expect(m.utilization).toBe(Infinity);
    expect(m.distribution).toHaveLength(0);
  });

  it('분포 확률 합 ≈ 1 (k=0..∞ 기하분포)', () => {
    // k=0..9만 계산. 나머지는 ρ^10 (1-ρ)까지 수렴
    const m = computeMM1(3, 10);  // ρ=0.3
    const sum = m.distribution.reduce((s, d) => s + d.probability, 0);
    // k=0..9 → 누적 확률 = 1 - ρ^10 ≈ 0.999994
    expect(sum).toBeGreaterThan(0.99);
    expect(sum).toBeLessThanOrEqual(1);
  });

  it('Little\'s Law 검증 L = λW', () => {
    const m = computeMM1(5, 10);
    expect(m.systemSize).toBeCloseTo(5 * m.systemTime, 5);
  });
});
