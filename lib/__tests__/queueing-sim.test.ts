import {
  computeLittleLaw,
  createEmptySnapshot,
  getModelCatalog,
  getDefaultControlsForModel,
  sampleExponential,
  sampleExponentialByMean,
} from '@/lib/queueing-sim';

describe('queueing simulator math helpers', () => {
  it('computes exponential inter-arrival time from lambda', () => {
    const sample = sampleExponential(12, () => 0.5);
    expect(sample).toBeCloseTo(3.47, 2);
  });

  it('computes exponential service time from mean seconds', () => {
    const sample = sampleExponentialByMean(42, () => 0.5);
    expect(sample).toBeCloseTo(29.11, 2);
  });

  it('computes little law estimate', () => {
    expect(computeLittleLaw(18, 240)).toBeCloseTo(72, 5);
  });

  it('builds an M/M/c snapshot with one stage and configured server count', () => {
    const controls = getDefaultControlsForModel('mmc');
    const snapshot = createEmptySnapshot(controls);

    expect(snapshot.modelId).toBe('mmc');
    expect(snapshot.stages).toHaveLength(1);
    expect(snapshot.stages[0].serverCount).toBe(controls.primaryServerCount);
  });

  it('builds a cafeteria snapshot with three sequential stages', () => {
    const controls = getDefaultControlsForModel('cafeteria');
    const snapshot = createEmptySnapshot(controls);

    expect(snapshot.stages).toHaveLength(3);
    expect(snapshot.stages.map((stage) => stage.label)).toEqual(['결제', '배식', '식사']);
  });

  it('exposes the added scenario presets and network models', () => {
    const models = getModelCatalog();
    const ids = models.map((model) => model.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        'mg1',
        'gg1',
        'prioritynp',
        'priorityresume',
        'priorityrepeat',
        'closed',
        'processor',
        'polling',
        'forkjoin',
        'retrial',
        'statedependent',
        'bulk',
        'airport',
        'airplane',
        'hospital',
        'callcenter',
        'logistics',
        'mall',
        'themepark',
        'baggage',
        'evcharging',
        'port',
        'ward',
        'amr',
        'erlangb',
        'jackson',
      ]),
    );

    expect(models.every((model) => model.theorySummary.length <= 500)).toBe(true);
  });

  it('builds a mall snapshot with chooser, express, regular stages', () => {
    const controls = getDefaultControlsForModel('mall');
    const snapshot = createEmptySnapshot(controls);

    expect(snapshot.stages.map((stage) => stage.label)).toEqual(['라인 선택', 'Express', 'Regular']);
  });

  it('builds an airplane boarding snapshot with luggage stow before seating', () => {
    const controls = getDefaultControlsForModel('airplane');
    const snapshot = createEmptySnapshot(controls);

    expect(snapshot.stages.map((stage) => stage.label)).toEqual(['게이트', '통로 이동', '짐 적재', '착석']);
  });

  it('uses airplane defaults that support boarding strategy and seat interference', () => {
    const controls = getDefaultControlsForModel('airplane');

    expect(controls.boardingStrategy).toBe('random');
    expect(controls.routingProbability).toBeGreaterThan(0);
    expect(controls.seatInterferenceSeconds).toBeGreaterThan(0);
  });

  it('builds an erlang-b snapshot without waiting room capacity beyond servers', () => {
    const controls = getDefaultControlsForModel('erlangb');
    const snapshot = createEmptySnapshot(controls);

    expect(snapshot.stages).toHaveLength(1);
    expect(snapshot.stages[0].serverCount).toBe(controls.primaryServerCount);
  });
});
