'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRightLeft,
  Clock3,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { CafeteriaSimulationCanvas } from '@/components/CafeteriaSimulationCanvas';
import { QueueMetricCard } from '@/components/QueueMetricCard';
import {
  AIRPLANE_BOARDING_STRATEGY_LABELS,
  createEmptySnapshot,
  DEFAULT_CONTROLS,
  formatDuration,
  getDefaultControlsForModel,
  getModelCatalog,
  isGridScenario,
  type AirplaneBoardingStrategy,
  type ControlField,
  type QueueingModelId,
  type SimulationControls,
  type SimulationSnapshot,
} from '@/lib/queueing-sim';

const ui = {
  text: '#2f1c12',
  muted: '#6b5a4f',
  card: '#fffaf5',
  cardDark: '#2f1c12',
  border: '#decfbe',
  primary: '#2563eb',
  primarySoft: '#eef5ff',
} as const;

export default function Home() {
  const models = useMemo(() => getModelCatalog(), []);
  const [controls, setControls] = useState<SimulationControls>(DEFAULT_CONTROLS);
  const [running, setRunning] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(createEmptySnapshot(DEFAULT_CONTROLS));

  const activeModel = useMemo(
    () => models.find((model) => model.id === controls.modelId) ?? models[0],
    [controls.modelId, models],
  );
  const usesGridView = isGridScenario(controls.modelId);

  const updateNumericControl = (field: ControlField, nextValue: number) => {
    if (Number.isNaN(nextValue)) {
      return;
    }

    const clamped = Math.min(field.max, Math.max(field.min, nextValue));
    const precision = field.precision ?? (field.step < 1 ? 1 : 0);
    const normalized = precision > 0 ? Number(clamped.toFixed(precision)) : Math.round(clamped);

    setControls((prev) => ({
      ...prev,
      [field.key]: normalized,
    }));

    if (controls.modelId === 'airplane' && field.key === 'tertiaryServerCount') {
      setResetKey((prev) => prev + 1);
    }
  };

  const handleModelChange = (modelId: QueueingModelId) => {
    setControls((prev) => ({
      ...getDefaultControlsForModel(modelId),
      speed: prev.speed,
    }));
    setResetKey((prev) => prev + 1);
  };

  const handleAirplaneStrategyChange = (boardingStrategy: AirplaneBoardingStrategy) => {
    setControls((prev) => ({
      ...prev,
      boardingStrategy,
    }));
    setResetKey((prev) => prev + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 0.85fr)',
          gap: 24,
          borderRadius: 32,
          border: `1px solid ${ui.border}`,
          background: ui.card,
          padding: 24,
          boxShadow: '0 24px 80px rgba(75,53,29,0.12)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'inline-flex', alignSelf: 'flex-start', borderRadius: 999, background: ui.primarySoft, padding: '6px 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: ui.primary }}>
            {usesGridView ? 'Grid Queue Lab' : 'Generic Queueing Simulator'}
          </div>
          <h2 style={{ maxWidth: 760, margin: 0, color: ui.text, fontSize: 44, fontWeight: 800, lineHeight: 1.15 }}>
            {usesGridView ? '공간 점유형 큐잉 시나리오를' : '큐잉 모델을 바꿔가며'}
            <br />
            {usesGridView ? 'grid scene으로 직접 관찰합니다.' : '병목, 체류시간, 처리량을 동시에 실험합니다.'}
          </h2>
          <p style={{ maxWidth: 860, margin: 0, color: ui.muted, fontSize: 16, lineHeight: 1.8 }}>
            {usesGridView
              ? '항공기 좌석 배치, 병동 베드, 충전 슬롯, AMR 교차로처럼 실제 공간 점유가 중요한 시나리오는 dark grid scene으로 렌더링합니다. 셀 점유, blocking, 대기열 정체를 한 화면에서 바로 읽을 수 있게 바꿨습니다.'
              : '식당, 공항 보안검색, 항공기 탑승, 병원 외래, 콜센터, 물류 허브, 쇼핑몰 계산대와 `M/M/1`, `M/M/c`, `M/D/1`, `Erlang-B`, `Jackson network`를 같은 엔진으로 돌립니다. 고객 에이전트는 Separation과 Arrive 조향으로 줄 간격을 유지하고, 라우팅, 선점, 배치 유입, finite capacity 규칙은 모델에 따라 달라집니다.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <InfoTile label="활성 모델" value={activeModel.name} description={activeModel.formula} />
            <InfoTile label="모델 설명" value={activeModel.summary} description={activeModel.description} />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, borderRadius: 28, background: ui.cardDark, padding: 20, color: '#fff' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.58)' }}>Simulation Setup</div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <MiniMetric label="유입 λ" value={`${controls.arrivalRate.toFixed(0)}명/분`} />
              <MiniMetric label="스테이지" value={`${snapshot.stages.length}개`} />
              <MiniMetric label="총 서버 수" value={`${snapshot.stages.reduce((sum, stage) => sum + stage.serverCount, 0)}대`} />
              <MiniMetric label="재생 배속" value={`${controls.speed.toFixed(1)}x`} />
            </div>
          </div>

          <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.58)' }}>Stage Capacity</div>
            <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
              {snapshot.stages.map((stage) => (
                <div key={stage.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, background: 'rgba(0,0,0,0.10)', padding: '12px 14px', fontSize: 14 }}>
                  <span>{stage.label}</span>
                  <span style={{ fontWeight: 700 }}>{stage.capacityPerMinute.toFixed(1)}명/분</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) 360px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <QueueMetricCard
              icon={Users}
              label="System Load"
              value={`${snapshot.activeCustomers}명`}
              tone="blue"
              description={`평균 ${snapshot.observedL.toFixed(1)}명이 시스템 안에 머뭅니다.`}
            />
            <QueueMetricCard
              icon={Clock3}
              label="Average W"
              value={formatDuration(snapshot.averageSystemTime)}
              tone="orange"
              description={`현재 처리율 ${snapshot.throughputRate.toFixed(1)}명/분 기준 평균 체류시간입니다.`}
            />
            <QueueMetricCard
              icon={Activity}
              label="Little's Law"
              value={snapshot.littleL.toFixed(1)}
              tone="teal"
              description={`L = λW, 관측값 ${snapshot.observedL.toFixed(1)}와 함께 비교합니다.`}
            />
            <QueueMetricCard
              icon={ArrowRightLeft}
              label="Bottleneck"
              value={snapshot.bottleneck}
              tone="slate"
              description={`대기 ${snapshot.queueLengthTotal}명 · 서비스 중 ${snapshot.inServiceTotal}명`}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            <QueueMetricCard
              icon={Users}
              label="Blocked"
              value={`${snapshot.blockedCustomers}명`}
              tone="slate"
              description="finite capacity 때문에 스테이지 진입 또는 이동이 막힌 고객 수입니다."
            />
            <QueueMetricCard
              icon={ArrowRightLeft}
              label="Balked"
              value={`${snapshot.balkedCustomers}명`}
              tone="orange"
              description="첫 대기열을 보고 진입을 포기한 고객 수입니다."
            />
            <QueueMetricCard
              icon={Clock3}
              label="Reneged"
              value={`${snapshot.renegedCustomers}명`}
              tone="teal"
              description="대기 중 이탈한 고객 수입니다."
            />
          </div>

          <section id="simulator" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: ui.text, fontSize: 28, fontWeight: 800 }}>
                  {usesGridView ? 'Grid Scene' : 'Queue Canvas'}
                </h3>
                <p style={{ margin: '6px 0 0', color: ui.muted, fontSize: 14 }}>
                  {usesGridView
                    ? '좌석, 베드, 충전기, 교차로를 셀 단위로 렌더링하고 점유 상태를 바로 보여줍니다.'
                    : '선택된 모델의 스테이지 체인을 에이전트 기반으로 시각화합니다.'}
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                {snapshot.stages.map((stage) => (
                  <span
                    key={stage.id}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, border: `1px solid ${stage.color}55`, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: ui.text, background: `${stage.color}18` }}
                  >
                    <span style={{ height: 10, width: 10, borderRadius: 999, background: stage.color, display: 'inline-block' }} />
                    {stage.label}
                  </span>
                ))}
              </div>
            </div>

            <CafeteriaSimulationCanvas
              controls={controls}
              running={running}
              resetKey={resetKey}
              onSnapshotChange={setSnapshot}
            />

            {usesGridView ? (
              <div style={{ borderRadius: 20, border: `1px solid ${ui.border}`, background: 'rgba(37,99,235,0.06)', padding: 16, color: ui.text, fontSize: 14, lineHeight: 1.7 }}>
                grid 시나리오는 실제 공간 점유를 기준으로 해석합니다. 상단 HUD는 시간, 진행률, 정체 시간을 보여주고,
                캔버스 안 셀은 좌석/베드/슬롯/노드 점유 상태를 직접 표시합니다.
              </div>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(3, Math.min(4, snapshot.stages.length + 1))}, minmax(0, 1fr))`, gap: 12 }}>
              {snapshot.stages.map((stage) => (
                <StageSummary
                  key={stage.id}
                  icon={Activity}
                  label={stage.label}
                  value={`${stage.queueLength + stage.inService}명`}
                  description={`대기 ${stage.queueLength} · 처리 ${stage.inService} · 점유율 ${Math.round(stage.utilization * 100)}%`}
                />
              ))}
              <StageSummary
                icon={Users}
                label="Throughput"
                value={`${snapshot.completedCustomers}명`}
                description={`${snapshot.throughputRate.toFixed(1)}명/분이 시스템을 빠져나갑니다.`}
              />
            </div>
          </section>

          <section id="theory" style={{ borderRadius: 28, border: `1px solid ${ui.border}`, background: ui.cardDark, padding: 20, color: '#fff', boxShadow: '0 24px 70px rgba(47,28,18,0.18)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.58)' }}>Theory Layer</div>
            <h3 style={{ margin: '12px 0 0', fontSize: 28, fontWeight: 800 }}>
              모델별 이론 지표
            </h3>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              {snapshot.theoryMetrics.map((metric) => (
                <div key={metric.label} style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', padding: 16 }}>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.58)' }}>{metric.label}</div>
                  <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>
                    {metric.value}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.78)' }}>{metric.detail}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ borderRadius: 28, border: `1px solid ${ui.border}`, background: ui.card, padding: 20, boxShadow: '0 24px 70px rgba(84,58,24,0.08)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: ui.muted }}>
              Easy Theory
            </div>
            <h3 style={{ margin: '12px 0 0', color: ui.text, fontSize: 28, fontWeight: 800 }}>
              쉽게 보는 이론 설명
            </h3>
            <p style={{ margin: '12px 0 0', color: ui.muted, fontSize: 14, lineHeight: 1.9 }}>
              {activeModel.theorySummary}
            </p>
          </section>
        </div>

        <aside id="controls" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section style={{ borderRadius: 28, border: `1px solid ${ui.border}`, background: ui.card, padding: 20, boxShadow: '0 24px 70px rgba(84,58,24,0.08)' }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: ui.muted }}>
                  Model Switch
                </div>
                <h3 style={{ margin: '8px 0 0', color: ui.text, fontSize: 28, fontWeight: 800 }}>
                  모델 선택
                </h3>
              </div>
              <div style={{ borderRadius: 999, padding: 12, background: ui.primarySoft }}>
                <SlidersHorizontal size={18} style={{ color: ui.primary }} />
              </div>
            </div>

            <select
              style={{ width: '100%', borderRadius: 16, border: `1px solid ${ui.border}`, background: '#fff', padding: '14px 16px', fontSize: 14, fontWeight: 700, color: ui.text }}
              value={controls.modelId}
              onChange={(event) => handleModelChange(event.target.value as QueueingModelId)}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>

            <div style={{ marginTop: 16, borderRadius: 20, background: 'rgba(79,140,255,0.08)', padding: 16, fontSize: 14, lineHeight: 1.7, color: ui.text }}>
              <div style={{ fontWeight: 700 }}>{activeModel.formula}</div>
              <div style={{ marginTop: 4, color: ui.muted }}>
                {activeModel.description}
              </div>
            </div>
          </section>

          <section style={{ borderRadius: 28, border: `1px solid ${ui.border}`, background: ui.card, padding: 20, boxShadow: '0 24px 70px rgba(84,58,24,0.08)' }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: ui.muted }}>
                  Control Panel
                </div>
                <h3 style={{ margin: '8px 0 0', color: ui.text, fontSize: 28, fontWeight: 800 }}>
                  실험 변수
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {controls.modelId === 'airplane' ? (
                <ControlSlider
                  label="탑승 순서"
                  value={AIRPLANE_BOARDING_STRATEGY_LABELS[controls.boardingStrategy]}
                  helper="랜덤, 뒷좌석 우선, WilMA, 구역별, Steffen 순서를 비교할 수 있습니다. 전략이 바뀌면 승객 manifest를 다시 생성합니다."
                >
                  <select
                    style={{ width: '100%', boxSizing: 'border-box', borderRadius: 16, border: `1px solid ${ui.border}`, background: '#fff', padding: '14px 16px', fontSize: 14, fontWeight: 700, color: ui.text }}
                    value={controls.boardingStrategy}
                    onChange={(event) => handleAirplaneStrategyChange(event.target.value as AirplaneBoardingStrategy)}
                  >
                    {Object.entries(AIRPLANE_BOARDING_STRATEGY_LABELS).map(([strategy, label]) => (
                      <option key={strategy} value={strategy}>
                        {label}
                      </option>
                    ))}
                  </select>
                </ControlSlider>
              ) : null}

              {activeModel.controlFields.map((field) => (
                <ControlSlider
                  key={field.key}
                  label={field.label}
                  value={formatFieldValue(field, controls[field.key])}
                  helper={field.helper}
                >
                  <input
                    style={{ width: '100%', boxSizing: 'border-box', borderRadius: 16, border: `1px solid ${ui.border}`, background: '#fff', padding: '14px 16px', fontSize: 14, fontWeight: 700, color: ui.text }}
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={controls[field.key]}
                    onChange={(event) => updateNumericControl(field, event.target.valueAsNumber)}
                  />
                </ControlSlider>
              ))}
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setRunning((prev) => !prev)}
                style={{ display: 'inline-flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, border: 'none', padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#fff', background: ui.primary, cursor: 'pointer' }}
              >
                {running ? <Pause size={16} /> : <Play size={16} />}
                {running ? '일시정지' : '재생'}
              </button>
              <button
                type="button"
                onClick={() => setResetKey((prev) => prev + 1)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, border: `1px solid ${ui.border}`, padding: '14px 16px', fontSize: 14, fontWeight: 700, color: ui.text, background: '#fff', cursor: 'pointer' }}
              >
                <RotateCcw size={16} />
                리셋
              </button>
            </div>
          </section>

          <section style={{ borderRadius: 28, border: `1px solid ${ui.border}`, background: ui.card, padding: 20, boxShadow: '0 24px 70px rgba(84,58,24,0.08)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: ui.muted }}>
              Queue Diagnostics
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {snapshot.stages.map((stage) => (
                <DiagnosticRow
                  key={stage.id}
                  label={`${stage.label} · ${stage.distribution === 'deterministic' ? 'D' : 'M'} service`}
                  value={`μ ${stage.capacityPerMinute.toFixed(1)}명/분 · Q ${stage.queueLength}`}
                />
              ))}
            </div>
          </section>

          <section style={{ borderRadius: 28, border: `1px solid ${ui.border}`, background: ui.card, padding: 20, boxShadow: '0 24px 70px rgba(84,58,24,0.08)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: ui.muted }}>
              Advanced Rules
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <DiagnosticRow label="Finite Capacity" value={`K=${controls.queueCapacity}`} />
              <DiagnosticRow label="Priority Queue" value={`우선 고객 ${controls.priorityShare.toFixed(0)}%`} />
              <DiagnosticRow label="Balking" value={`임계 ${controls.balkThreshold}명`} />
              <DiagnosticRow label="Reneging" value={`${controls.renegingSeconds.toFixed(0)}초`} />
              {activeModel.controlFields.some((field) => field.key === 'batchSize') ? (
                <DiagnosticRow label="Batch Arrival" value={`${controls.batchSize.toFixed(0)}명`} />
              ) : null}
              {activeModel.controlFields.some((field) => field.key === 'routingProbability') ? (
                <DiagnosticRow
                  label={controls.modelId === 'airplane' ? 'Carry-on Mix' : 'Routing'}
                  value={controls.modelId === 'airplane' ? `${controls.routingProbability.toFixed(0)}%` : `A→B ${controls.routingProbability.toFixed(0)}%`}
                />
              ) : null}
              {controls.modelId === 'airplane' ? (
                <DiagnosticRow
                  label="Boarding Order"
                  value={AIRPLANE_BOARDING_STRATEGY_LABELS[controls.boardingStrategy]}
                />
              ) : null}
              {controls.modelId === 'airplane' ? (
                <DiagnosticRow
                  label="Seat Interference"
                  value={`${controls.seatInterferenceSeconds.toFixed(0)}초`}
                />
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function formatFieldValue(field: ControlField, rawValue: number | string) {
  const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
  const precision = field.precision ?? (field.step < 1 ? 1 : 0);
  return `${numericValue.toFixed(precision)}${field.unit}`;
}

function InfoTile({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div style={{ borderRadius: 24, border: `1px solid ${ui.border}`, background: 'rgba(79,140,255,0.06)', padding: 16 }}>
      <div style={{ color: ui.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
        {label}
      </div>
      <div style={{ marginTop: 8, color: ui.text, fontSize: 18, fontWeight: 800, lineHeight: 1.5 }}>
        {value}
      </div>
      <div style={{ marginTop: 4, color: ui.muted, fontSize: 14, lineHeight: 1.7 }}>
        {description}
      </div>
    </div>
  );
}

function ControlSlider({
  children,
  helper,
  label,
  value,
}: {
  children: React.ReactNode;
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ color: ui.text, fontSize: 14, fontWeight: 700 }}>
          {label}
        </div>
        <div style={{ color: ui.primary, fontSize: 14, fontWeight: 700 }}>
          {value}
        </div>
      </div>
      {children}
      <p style={{ margin: 0, color: ui.muted, fontSize: 12, lineHeight: 1.6 }}>
        {helper}
      </p>
    </div>
  );
}

function StageSummary({
  description,
  icon: Icon,
  label,
  value,
}: {
  description: string;
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div style={{ borderRadius: 24, border: `1px solid ${ui.border}`, background: ui.card, padding: 16 }}>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ color: ui.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
          {label}
        </div>
        <div style={{ borderRadius: 999, padding: 8, background: 'rgba(79, 140, 255, 0.12)' }}>
          <Icon size={16} style={{ color: ui.primary }} />
        </div>
      </div>
      <div style={{ color: ui.text, fontSize: 28, fontWeight: 800 }}>
        {value}
      </div>
      <div style={{ marginTop: 8, color: ui.muted, fontSize: 14, lineHeight: 1.6 }}>
        {description}
      </div>
    </div>
  );
}

function DiagnosticRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 18, background: 'rgba(79,140,255,0.08)', padding: '12px 16px' }}>
      <span style={{ color: ui.muted, fontSize: 14 }}>{label}</span>
      <span style={{ color: ui.text, fontSize: 14, fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', padding: '12px 14px' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.52)' }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: '#fff' }}>
        {value}
      </div>
    </div>
  );
}
