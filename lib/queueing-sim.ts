export type QueueingModelId =
  | 'cafeteria'
  | 'mm1'
  | 'mmc'
  | 'md1'
  | 'mg1'
  | 'gg1'
  | 'prioritynp'
  | 'priorityresume'
  | 'priorityrepeat'
  | 'tandem'
  | 'closed'
  | 'processor'
  | 'polling'
  | 'forkjoin'
  | 'retrial'
  | 'statedependent'
  | 'bulk'
  | 'airport'
  | 'airplane'
  | 'hospital'
  | 'callcenter'
  | 'logistics'
  | 'mall'
  | 'themepark'
  | 'baggage'
  | 'evcharging'
  | 'port'
  | 'ward'
  | 'amr'
  | 'erlangb'
  | 'jackson';

export type AirplaneBoardingStrategy = 'random' | 'backToFront' | 'wilma' | 'zone' | 'steffen';

export type SimulationControls = {
  modelId: QueueingModelId;
  boardingStrategy: AirplaneBoardingStrategy;
  arrivalRate: number;
  primaryServerCount: number;
  secondaryServerCount: number;
  tertiaryServerCount: number;
  seatInterferenceSeconds: number;
  primaryMeanSeconds: number;
  secondaryMeanSeconds: number;
  tertiaryMeanSeconds: number;
  queueCapacity: number;
  priorityShare: number;
  balkThreshold: number;
  renegingSeconds: number;
  batchSize: number;
  routingProbability: number;
  speed: number;
};

export type ControlField = {
  key: keyof SimulationControls;
  label: string;
  helper: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  precision?: number;
};

export type StageSnapshot = {
  id: string;
  label: string;
  description: string;
  color: string;
  queueLength: number;
  inService: number;
  serverCount: number;
  utilization: number;
  capacityPerMinute: number;
  meanServiceSeconds: number;
  distribution: 'exponential' | 'deterministic';
};

export type TheoryMetric = {
  label: string;
  value: string;
  detail: string;
};

export type SimulationSnapshot = {
  modelId: QueueingModelId;
  modelName: string;
  modelFormula: string;
  viewMode: 'flow' | 'grid';
  activeCustomers: number;
  completedCustomers: number;
  throughputRate: number;
  averageSystemTime: number;
  observedL: number;
  littleL: number;
  bottleneck: string;
  queueLengthTotal: number;
  inServiceTotal: number;
  balkedCustomers: number;
  renegedCustomers: number;
  blockedCustomers: number;
  theoryMetrics: TheoryMetric[];
  stages: StageSnapshot[];
};

type Vector = {
  x: number;
  y: number;
};

type AgentPhase = 'queue' | 'service' | 'exiting' | 'orbit' | 'thinking' | 'settled';

type Agent = {
  id: number;
  stageIndex: number | null;
  phase: AgentPhase;
  pos: Vector;
  vel: Vector;
  acc: Vector;
  radius: number;
  maxSpeed: number;
  maxForce: number;
  enteredAt: number;
  queuedAt: number;
  kind: 'priority' | 'normal' | 'specialist' | 'express';
  priority: 'high' | 'normal';
  serviceEndsAt: number | null;
  remainingServiceSeconds: number | null;
  retryAt: number | null;
  serverId: number | null;
  reservedServerId: number | null;
  needsStow: boolean;
};

type StageDefinition = {
  id: string;
  label: string;
  description: string;
  color: string;
  serverPrefix: string;
  serverCount: number;
  queueCapacity: number;
  meanServiceSeconds: number;
  distribution: 'exponential' | 'deterministic';
};

type ServerRuntime = {
  id: number;
  pos: Vector;
  agentId: number | null;
};

type QueueLayout = {
  kind: 'grid' | 'line';
  rows?: number;
  stepX: number;
  stepY: number;
};

type FlowPath = {
  from: Vector;
  to: Vector;
  via?: Vector;
};

type StagePlacement = {
  panel: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  queueAnchor: Vector;
  queueLayout?: QueueLayout;
  serverPositions?: Vector[];
  serviceTargetFallback?: Vector;
};

type SceneLayout = {
  modelId: QueueingModelId;
  points: {
    entry: Vector;
    exit: Vector;
    orbit: Vector;
    think: Vector;
  };
  flows: FlowPath[];
};

type SceneRuntimeBuild = {
  scene: SceneLayout;
  placements: StagePlacement[];
};

type StageRuntime = {
  spec: StageDefinition;
  queue: number[];
  servers: ServerRuntime[];
  panel: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  queueAnchor: Vector;
  queueLayout: QueueLayout;
  serviceTargetFallback: Vector;
};

type SimulationStats = {
  spawned: number;
  completed: number;
  balked: number;
  reneged: number;
  blocked: number;
  totalSystemTime: number;
  wipIntegral: number;
  gridDelaySeconds: number;
};

export type SimulationState = {
  controls: SimulationControls;
  scene: SceneLayout;
  stages: StageRuntime[];
  agents: Agent[];
  manifestSeatIds: number[];
  currentTime: number;
  nextArrivalAt: number;
  nextAgentId: number;
  stats: SimulationStats;
  latestSnapshot: SimulationSnapshot;
};

type ModelDefinition = {
  id: QueueingModelId;
  name: string;
  formula: string;
  summary: string;
  description: string;
  controlFields: ControlField[];
  buildStages: (controls: SimulationControls) => StageDefinition[];
  theorySummary?: string;
  priorityMode?: 'fifo' | 'priority' | 'preemptive' | 'preemptive-repeat';
  batchSize?: (controls: SimulationControls) => number;
  seedPopulation?: (controls: SimulationControls) => number;
  arrivalSampler?: (controls: SimulationControls, state: SimulationState | null, model: ModelDefinition) => number;
  classifyAgent?: (controls: SimulationControls) => Agent['kind'];
  getInitialStageIndex?: (state: SimulationState, agent: Agent) => number;
  getNextStageIndex?: (state: SimulationState, currentStageIndex: number, agent: Agent) => number | null;
  serviceTimeSampler?: (stage: StageDefinition, controls: SimulationControls, agent: Agent) => number;
  spawnLimit?: (controls: SimulationControls) => number;
};

export const WORLD_WIDTH = 1360;
export const WORLD_HEIGHT = 820;

export const DEFAULT_CONTROLS: SimulationControls = {
  modelId: 'cafeteria',
  boardingStrategy: 'random',
  arrivalRate: 18,
  primaryServerCount: 2,
  secondaryServerCount: 3,
  tertiaryServerCount: 12,
  seatInterferenceSeconds: 8,
  primaryMeanSeconds: 42,
  secondaryMeanSeconds: 28,
  tertiaryMeanSeconds: 390,
  queueCapacity: 18,
  priorityShare: 20,
  balkThreshold: 10,
  renegingSeconds: 180,
  batchSize: 4,
  routingProbability: 60,
  speed: 1,
};

const ENTRY_POINT: Vector = { x: 88, y: 410 };
const EXIT_POINT: Vector = { x: 1272, y: 410 };
const ORBIT_POINT: Vector = { x: 118, y: 140 };
const THINK_POINT: Vector = { x: 1240, y: 140 };
const AIRPLANE_AISLE_Y = 410;
const GRID_SCENARIOS: QueueingModelId[] = ['airplane', 'ward', 'evcharging', 'amr'];
const DEFAULT_QUEUE_LAYOUT: QueueLayout = { kind: 'grid', rows: 7, stepX: -40, stepY: 36 };

const phaseDynamics: Record<AgentPhase, { speed: number; force: number }> = {
  queue: { speed: 72, force: 150 },
  service: { speed: 42, force: 92 },
  exiting: { speed: 132, force: 188 },
  orbit: { speed: 96, force: 172 },
  thinking: { speed: 96, force: 172 },
  settled: { speed: 0, force: 0 },
};

const modelCatalog: ModelDefinition[] = [
  {
    id: 'cafeteria',
    name: '대학교 식당',
    formula: 'M/M/c → M/M/c → M/M/c',
    summary: '결제, 배식, 식사 구역이 직렬로 이어지는 멀티 스테이지 서비스 네트워크입니다.',
    description: '학생은 결제, 배식, 식사 좌석 점유를 순차적으로 거치며 각 단계의 병목이 연쇄적으로 이동합니다.',
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 도착 고객 수입니다.', min: 6, max: 108, step: 1, unit: '명/분' },
      { key: 'primaryServerCount', label: '결제 서버 수', helper: '키오스크 또는 결제 창구 수입니다.', min: 1, max: 15, step: 1, unit: '대' },
      { key: 'secondaryServerCount', label: '배식 서버 수', helper: '배식대 또는 수령 창구 수입니다.', min: 1, max: 15, step: 1, unit: '대' },
      { key: 'tertiaryServerCount', label: '좌석 수', helper: '식사 단계의 병렬 수용 용량입니다.', min: 3, max: 36, step: 1, unit: '석' },
      { key: 'queueCapacity', label: '단계당 수용 한도', helper: '각 스테이지의 최대 체류 인원입니다.', min: 4, max: 60, step: 1, unit: '명' },
      { key: 'priorityShare', label: '우선 고객 비율', helper: '높은 우선순위 고객의 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'balkThreshold', label: 'Balking 임계치', helper: '첫 대기열이 이 길이를 넘으면 일부 고객이 진입을 포기합니다.', min: 0, max: 40, step: 1, unit: '명' },
      { key: 'renegingSeconds', label: 'Reneging 시간', helper: '대기 시간이 이 값을 넘으면 줄을 이탈합니다.', min: 15, max: 600, step: 5, unit: '초' },
      { key: 'speed', label: '재생 배속', helper: '시간 진행 속도입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      {
        id: 'payment',
        label: '결제',
        description: '지수 분포 서비스',
        color: '#4f8cff',
        serverPrefix: 'K',
        serverCount: controls.primaryServerCount,
        queueCapacity: controls.queueCapacity,
        meanServiceSeconds: controls.primaryMeanSeconds,
        distribution: 'exponential',
      },
      {
        id: 'pickup',
        label: '배식',
        description: '지수 분포 서비스',
        color: '#ff7b54',
        serverPrefix: 'S',
        serverCount: controls.secondaryServerCount,
        queueCapacity: controls.queueCapacity,
        meanServiceSeconds: controls.secondaryMeanSeconds,
        distribution: 'exponential',
      },
      {
        id: 'dining',
        label: '식사',
        description: '좌석 점유 단계',
        color: '#1fbba6',
        serverPrefix: 'T',
        serverCount: controls.tertiaryServerCount,
        queueCapacity: controls.queueCapacity,
        meanServiceSeconds: controls.tertiaryMeanSeconds,
        distribution: 'exponential',
      },
    ],
  },
  {
    id: 'mm1',
    name: 'M/M/1',
    formula: 'Poisson arrivals / Exponential service / 1 server',
    summary: '가장 기본적인 단일 서버 대기행렬 모델입니다.',
    description: '포아송 도착과 지수 서비스 시간을 갖는 단일 서버 시스템의 표준 형태입니다.',
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 도착 고객 수입니다.', min: 2, max: 90, step: 1, unit: '명/분' },
      { key: 'primaryMeanSeconds', label: '평균 서비스 시간', helper: '서버 1명의 평균 처리 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'queueCapacity', label: '시스템 수용 한도', helper: '서버 포함 최대 체류 인원입니다.', min: 2, max: 40, step: 1, unit: '명' },
      { key: 'priorityShare', label: '우선 고객 비율', helper: '높은 우선순위 고객의 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'balkThreshold', label: 'Balking 임계치', helper: '첫 대기열이 이 길이를 넘으면 일부 고객이 진입을 포기합니다.', min: 0, max: 30, step: 1, unit: '명' },
      { key: 'renegingSeconds', label: 'Reneging 시간', helper: '대기 시간이 이 값을 넘으면 줄을 이탈합니다.', min: 15, max: 600, step: 5, unit: '초' },
      { key: 'speed', label: '재생 배속', helper: '시간 진행 속도입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      {
        id: 'service',
        label: '단일 서버',
        description: '지수 분포 서비스',
        color: '#4f8cff',
        serverPrefix: 'S',
        serverCount: 1,
        queueCapacity: controls.queueCapacity,
        meanServiceSeconds: controls.primaryMeanSeconds,
        distribution: 'exponential',
      },
    ],
  },
  {
    id: 'mmc',
    name: 'M/M/c',
    formula: 'Poisson arrivals / Exponential service / c servers',
    summary: '하나의 큐를 여러 서버가 공유하는 병렬 서비스 시스템입니다.',
    description: '같은 큐를 여러 서버가 처리하므로 서버 수가 늘면 병목과 대기시간이 급격히 변합니다.',
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 도착 고객 수입니다.', min: 2, max: 108, step: 1, unit: '명/분' },
      { key: 'primaryServerCount', label: '서버 수 c', helper: '병렬 서버 개수입니다.', min: 1, max: 15, step: 1, unit: '대' },
      { key: 'primaryMeanSeconds', label: '평균 서비스 시간', helper: '각 서버의 평균 처리 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'queueCapacity', label: '시스템 수용 한도', helper: '각 단계의 최대 체류 인원입니다.', min: 2, max: 50, step: 1, unit: '명' },
      { key: 'priorityShare', label: '우선 고객 비율', helper: '높은 우선순위 고객의 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'balkThreshold', label: 'Balking 임계치', helper: '첫 대기열이 이 길이를 넘으면 일부 고객이 진입을 포기합니다.', min: 0, max: 30, step: 1, unit: '명' },
      { key: 'renegingSeconds', label: 'Reneging 시간', helper: '대기 시간이 이 값을 넘으면 줄을 이탈합니다.', min: 15, max: 600, step: 5, unit: '초' },
      { key: 'speed', label: '재생 배속', helper: '시간 진행 속도입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      {
        id: 'parallel-service',
        label: '병렬 서버',
        description: '지수 분포 서비스',
        color: '#8d6fe8',
        serverPrefix: 'C',
        serverCount: controls.primaryServerCount,
        queueCapacity: controls.queueCapacity,
        meanServiceSeconds: controls.primaryMeanSeconds,
        distribution: 'exponential',
      },
    ],
  },
  {
    id: 'md1',
    name: 'M/D/1',
    formula: 'Poisson arrivals / Deterministic service / 1 server',
    summary: '도착은 확률적이지만 서비스 시간이 고정된 단일 서버 모델입니다.',
    description: '같은 평균 서비스율에서도 지수 서비스보다 변동성이 낮아 대기 분산이 줄어듭니다.',
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 도착 고객 수입니다.', min: 2, max: 90, step: 1, unit: '명/분' },
      { key: 'primaryMeanSeconds', label: '고정 서비스 시간', helper: '모든 고객에게 동일하게 적용됩니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'queueCapacity', label: '시스템 수용 한도', helper: '서버 포함 최대 체류 인원입니다.', min: 2, max: 40, step: 1, unit: '명' },
      { key: 'priorityShare', label: '우선 고객 비율', helper: '높은 우선순위 고객의 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'balkThreshold', label: 'Balking 임계치', helper: '첫 대기열이 이 길이를 넘으면 일부 고객이 진입을 포기합니다.', min: 0, max: 30, step: 1, unit: '명' },
      { key: 'renegingSeconds', label: 'Reneging 시간', helper: '대기 시간이 이 값을 넘으면 줄을 이탈합니다.', min: 15, max: 600, step: 5, unit: '초' },
      { key: 'speed', label: '재생 배속', helper: '시간 진행 속도입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      {
        id: 'deterministic-service',
        label: '고정 서버',
        description: '결정론적 서비스',
        color: '#ffb347',
        serverPrefix: 'D',
        serverCount: 1,
        queueCapacity: controls.queueCapacity,
        meanServiceSeconds: controls.primaryMeanSeconds,
        distribution: 'deterministic',
      },
    ],
  },
  {
    id: 'tandem',
    name: '2-Stage Tandem',
    formula: 'M/M/c → M/M/c',
    summary: '전처리와 본처리가 연속으로 이어지는 직렬 공정 비교용 모델입니다.',
    description: '앞단 처리율이 높아져도 후단이 느리면 병목이 다음 공정으로 이동하는 모습을 관찰할 수 있습니다.',
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 도착 고객 수입니다.', min: 2, max: 108, step: 1, unit: '명/분' },
      { key: 'primaryServerCount', label: '1단계 서버 수', helper: '전처리 단계의 병렬 서버 수입니다.', min: 1, max: 15, step: 1, unit: '대' },
      { key: 'primaryMeanSeconds', label: '1단계 평균 시간', helper: '전처리 단계 평균 서비스 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'secondaryServerCount', label: '2단계 서버 수', helper: '후단 처리 단계의 병렬 서버 수입니다.', min: 1, max: 15, step: 1, unit: '대' },
      { key: 'secondaryMeanSeconds', label: '2단계 평균 시간', helper: '후단 처리 단계 평균 서비스 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'queueCapacity', label: '단계당 수용 한도', helper: '각 단계의 최대 체류 인원입니다.', min: 2, max: 50, step: 1, unit: '명' },
      { key: 'priorityShare', label: '우선 고객 비율', helper: '높은 우선순위 고객의 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'balkThreshold', label: 'Balking 임계치', helper: '첫 대기열이 이 길이를 넘으면 일부 고객이 진입을 포기합니다.', min: 0, max: 30, step: 1, unit: '명' },
      { key: 'renegingSeconds', label: 'Reneging 시간', helper: '대기 시간이 이 값을 넘으면 줄을 이탈합니다.', min: 15, max: 600, step: 5, unit: '초' },
      { key: 'speed', label: '재생 배속', helper: '시간 진행 속도입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      {
        id: 'prep',
        label: '전처리',
        description: '지수 분포 서비스',
        color: '#4f8cff',
        serverPrefix: 'P',
        serverCount: controls.primaryServerCount,
        queueCapacity: controls.queueCapacity,
        meanServiceSeconds: controls.primaryMeanSeconds,
        distribution: 'exponential',
      },
      {
        id: 'main',
        label: '본처리',
        description: '지수 분포 서비스',
        color: '#ef476f',
        serverPrefix: 'M',
        serverCount: controls.secondaryServerCount,
        queueCapacity: controls.queueCapacity,
        meanServiceSeconds: controls.secondaryMeanSeconds,
        distribution: 'exponential',
      },
    ],
  },
  {
    id: 'airport',
    name: '공항 보안검색',
    formula: 'Priority lane + tandem + finite capacity',
    summary: '우선 검색 승객과 일반 승객이 같은 검색 시스템을 통과합니다.',
    description: '문서 확인, 스캔, 수동검색이 직렬로 이어지고 우선 승객이 큐에서 앞당겨집니다.',
    priorityMode: 'priority',
    controlFields: [
      { key: 'arrivalRate', label: '승객 유입 λ', helper: '분당 보안검색장으로 진입하는 승객 수입니다.', min: 4, max: 120, step: 1, unit: '명/분' },
      { key: 'primaryServerCount', label: '문서 확인 서버', helper: '신분 확인 인원 수입니다.', min: 1, max: 12, step: 1, unit: '명' },
      { key: 'secondaryServerCount', label: '스캐너 라인', helper: '보안 게이트 라인 수입니다.', min: 1, max: 12, step: 1, unit: '라인' },
      { key: 'tertiaryServerCount', label: '수동 검색 서버', helper: '추가 검색 인력 수입니다.', min: 1, max: 8, step: 1, unit: '명' },
      { key: 'queueCapacity', label: '구역 수용 한도', helper: '각 검색 구역의 최대 체류 인원입니다.', min: 4, max: 48, step: 1, unit: '명' },
      { key: 'priorityShare', label: 'Priority 승객 비율', helper: '우선 검색 승객 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'balkThreshold', label: 'Balking 임계치', helper: '입구 대기열이 길면 일부 승객이 다른 라인으로 이동한다고 가정합니다.', min: 0, max: 35, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'document', label: '문서 확인', description: 'Priority 승객 우선 처리', color: '#2878b5', serverPrefix: 'D', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
      { id: 'scan', label: '보안 스캔', description: '게이트 및 엑스레이', color: '#ff8c42', serverPrefix: 'X', serverCount: controls.secondaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.secondaryMeanSeconds, distribution: 'deterministic' },
      { id: 'manual', label: '수동 검색', description: '추가 검사 단계', color: '#bc5090', serverPrefix: 'M', serverCount: controls.tertiaryServerCount, queueCapacity: Math.max(3, Math.floor(controls.queueCapacity * 0.7)), meanServiceSeconds: controls.tertiaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'airplane',
    name: '항공기 탑승/착석',
    formula: 'Batch boarding + aisle walk + luggage stow + seating',
    summary: '탑승 그룹 유입과 좁은 통로 병목을 표현하는 탑승 시나리오입니다.',
    description: 'Priority boarding 승객이 먼저 탑승하고, 통로 이동 뒤 짐 적재가 복도를 막은 채 착석으로 이어집니다.',
    theorySummary: '항공기 탑승은 좁은 통로 하나를 여러 승객이 공유하는 blocking queue에 가깝습니다. 캐리어 적재와 좌석 비켜주기 시간이 핵심 병목이고, 랜덤보다 WilMA나 Steffen 같은 좌석 유형 중심 순서가 더 빠른 경향이 있습니다. 특히 기내 수하물 비율이 낮아질수록 전체 탑승시간이 크게 줄어듭니다.',
    priorityMode: 'priority',
    batchSize: (controls) => Math.max(1, Math.round(controls.batchSize)),
    spawnLimit: (controls) => Math.max(60, controls.tertiaryServerCount * 6),
    getNextStageIndex: (state, currentStageIndex, agent) => {
      if (currentStageIndex === 1) {
        return agent.needsStow ? 2 : 3;
      }
      return currentStageIndex === 2 ? 3 : null;
    },
    controlFields: [
      { key: 'arrivalRate', label: '탑승 λ', helper: '분당 탑승 승객 수입니다. 그룹 단위 호출로 해석됩니다.', min: 6, max: 90, step: 1, unit: '명/분' },
      { key: 'batchSize', label: '탑승 그룹 크기', helper: '한 번에 호출되는 boarding zone 인원입니다.', min: 1, max: 18, step: 1, unit: '명' },
      { key: 'primaryServerCount', label: '게이트 서버', helper: '탑승권 확인 게이트 수입니다.', min: 1, max: 6, step: 1, unit: '대' },
      { key: 'tertiaryServerCount', label: '좌석 열 수', helper: '기내 좌석 열 수입니다. 1열당 6석으로 계산합니다.', min: 10, max: 40, step: 1, unit: '열' },
      { key: 'routingProbability', label: '짐 적재 비율', helper: '짐을 올리기 위해 통로를 추가 점유하는 승객 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'secondaryMeanSeconds', label: '짐 적재 시간', helper: '오버헤드빈에 짐을 올리며 복도를 막는 평균 시간입니다.', min: 4, max: 45, step: 1, unit: '초' },
      { key: 'tertiaryMeanSeconds', label: '착석 정리 시간', helper: '좌석에 정착하고 자리를 정리하는 평균 시간입니다.', min: 8, max: 80, step: 1, unit: '초' },
      { key: 'seatInterferenceSeconds', label: '좌석 비켜주기 시간', helper: '창가/중앙석 승객을 위해 이미 앉아 있던 승객이 비켜주는 추가 시간입니다.', min: 0, max: 40, step: 1, unit: '초' },
      { key: 'queueCapacity', label: '통로 수용 한도', helper: '브리지와 통로에서 버틸 수 있는 최대 인원입니다.', min: 4, max: 40, step: 1, unit: '명' },
      { key: 'priorityShare', label: '우선 탑승 비율', helper: 'Priority boarding 승객 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'gate', label: '게이트', description: '탑승권 확인', color: '#5b8c5a', serverPrefix: 'G', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
      { id: 'aisle', label: '통로 이동', description: '승객이 순차적으로 통로 안으로 들어감', color: '#d97706', serverPrefix: 'A', serverCount: Math.max(2, Math.min(4, Math.floor(controls.batchSize / 2) || 2)), queueCapacity: Math.max(4, Math.floor(controls.queueCapacity * 0.75)), meanServiceSeconds: Math.max(3, Math.round(controls.secondaryMeanSeconds * 0.3)), distribution: 'deterministic' },
      { id: 'stow', label: '짐 적재', description: '오버헤드빈 적재 동안 뒤 승객이 통과 불가', color: '#b45309', serverPrefix: 'B', serverCount: 1, queueCapacity: Math.max(3, Math.floor(controls.queueCapacity * 0.5)), meanServiceSeconds: controls.secondaryMeanSeconds, distribution: 'deterministic' },
      { id: 'seat', label: '착석', description: '좌석 정착 단계', color: '#6366f1', serverPrefix: 'S', serverCount: Math.max(60, controls.tertiaryServerCount * 6), queueCapacity: Math.max(60, controls.tertiaryServerCount * 6), meanServiceSeconds: controls.tertiaryMeanSeconds, distribution: 'deterministic' },
    ],
  },
  {
    id: 'hospital',
    name: '병원 외래',
    formula: 'Triage priority + preemptive consult queue',
    summary: '긴급 환자와 일반 환자가 섞인 외래 대기행렬입니다.',
    description: 'Triage 이후 긴급 환자는 진료 서버를 선점할 수 있고 일반 환자는 오래 기다리면 이탈합니다.',
    priorityMode: 'preemptive',
    classifyAgent: (controls) => (Math.random() * 100 < controls.priorityShare ? 'priority' : 'normal'),
    controlFields: [
      { key: 'arrivalRate', label: '환자 유입 λ', helper: '분당 외래 환자 유입량입니다.', min: 2, max: 72, step: 1, unit: '명/분' },
      { key: 'primaryServerCount', label: '트리아지 서버', helper: '초기 분류 인원 수입니다.', min: 1, max: 10, step: 1, unit: '명' },
      { key: 'secondaryServerCount', label: '진료 서버', helper: '의사 수입니다.', min: 1, max: 12, step: 1, unit: '명' },
      { key: 'tertiaryServerCount', label: '후속 처리 서버', helper: '수납 또는 검사 처리 인력입니다.', min: 1, max: 10, step: 1, unit: '명' },
      { key: 'priorityShare', label: '긴급 환자 비율', helper: '선점 우선순위를 갖는 환자 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'renegingSeconds', label: '이탈 임계시간', helper: '일반 환자가 기다리다 포기하는 시간 기준입니다.', min: 15, max: 900, step: 5, unit: '초' },
      { key: 'queueCapacity', label: '대기구역 한도', helper: '각 단계의 최대 체류 인원입니다.', min: 4, max: 60, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'triage', label: '트리아지', description: '긴급도 분류', color: '#0f766e', serverPrefix: 'T', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
      { id: 'consult', label: '진료', description: '긴급 환자 선점 가능', color: '#2563eb', serverPrefix: 'C', serverCount: controls.secondaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.secondaryMeanSeconds, distribution: 'exponential' },
      { id: 'checkout', label: '후속 처리', description: '수납 또는 검사', color: '#f97316', serverPrefix: 'O', serverCount: controls.tertiaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.tertiaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'callcenter',
    name: '콜센터',
    formula: 'IVR + M/M/c + skill-based routing',
    summary: '일반 상담원 풀과 전문 상담원 풀을 가진 콜센터 모델입니다.',
    description: 'IVR 이후 전문 문의와 일반 문의가 다른 풀로 라우팅되며 포기 콜도 발생합니다.',
    priorityMode: 'fifo',
    classifyAgent: (controls) => (Math.random() * 100 < controls.priorityShare ? 'specialist' : 'normal'),
    getNextStageIndex: (_state, currentStageIndex, agent) => {
      if (currentStageIndex === 0) {
        return agent.kind === 'specialist' ? 2 : 1;
      }
      return null;
    },
    controlFields: [
      { key: 'arrivalRate', label: '콜 유입 λ', helper: '분당 유입 전화 수입니다.', min: 3, max: 120, step: 1, unit: '콜/분' },
      { key: 'primaryServerCount', label: 'IVR 채널', helper: '자동응답 처리 채널 수입니다.', min: 1, max: 12, step: 1, unit: '채널' },
      { key: 'secondaryServerCount', label: '일반 상담원', helper: '일반 문의 처리 인원 수입니다.', min: 1, max: 20, step: 1, unit: '명' },
      { key: 'tertiaryServerCount', label: '전문 상담원', helper: '전문 문의를 처리하는 인원 수입니다.', min: 1, max: 12, step: 1, unit: '명' },
      { key: 'priorityShare', label: '전문 문의 비율', helper: '전문 스킬 상담원으로 라우팅되는 문의 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'renegingSeconds', label: '포기 시간', helper: '기다리다 전화를 끊는 임계 시간입니다.', min: 15, max: 900, step: 5, unit: '초' },
      { key: 'queueCapacity', label: '큐 수용 한도', helper: '대기 가능한 최대 통화 수입니다.', min: 4, max: 80, step: 1, unit: '콜' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'ivr', label: 'IVR', description: '자동응답 분류', color: '#64748b', serverPrefix: 'I', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'deterministic' },
      { id: 'general', label: '일반 상담', description: '일반 문의 처리', color: '#22c55e', serverPrefix: 'G', serverCount: controls.secondaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.secondaryMeanSeconds, distribution: 'exponential' },
      { id: 'specialist', label: '전문 상담', description: '전문 스킬 라우팅', color: '#ef4444', serverPrefix: 'S', serverCount: controls.tertiaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.tertiaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'logistics',
    name: '물류 허브/컨베이어',
    formula: 'Finite-buffer tandem line',
    summary: '하역, 분류, 출고가 연결된 물류 처리 라인입니다.',
    description: '컨베이어와 버퍼 용량 때문에 후단이 느려지면 전단이 막히는 blocking 구조를 봅니다.',
    priorityMode: 'fifo',
    batchSize: (controls) => Math.max(1, Math.round(controls.batchSize)),
    controlFields: [
      { key: 'arrivalRate', label: '입고 λ', helper: '분당 도착 화물 수입니다.', min: 2, max: 90, step: 1, unit: '건/분' },
      { key: 'primaryServerCount', label: '하역 도크', helper: '하역 처리 도크 수입니다.', min: 1, max: 10, step: 1, unit: '개' },
      { key: 'secondaryServerCount', label: '분류 서버', helper: '분류 처리기 수입니다.', min: 1, max: 12, step: 1, unit: '대' },
      { key: 'tertiaryServerCount', label: '출고 라인', helper: '출고 게이트 수입니다.', min: 1, max: 10, step: 1, unit: '개' },
      { key: 'queueCapacity', label: '버퍼 한도', helper: '각 버퍼/컨베이어 구간의 최대 적재 수입니다.', min: 2, max: 40, step: 1, unit: '건' },
      { key: 'batchSize', label: '입고 배치 크기', helper: '트럭 한 대가 한 번에 내리는 물량입니다.', min: 1, max: 12, step: 1, unit: '건' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'unload', label: '하역', description: '도착 화물 하차', color: '#0ea5e9', serverPrefix: 'U', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'deterministic' },
      { id: 'sort', label: '분류', description: '컨베이어 분류', color: '#f59e0b', serverPrefix: 'R', serverCount: controls.secondaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.secondaryMeanSeconds, distribution: 'deterministic' },
      { id: 'dispatch', label: '출고', description: '게이트 출고', color: '#10b981', serverPrefix: 'D', serverCount: controls.tertiaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.tertiaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'mall',
    name: '쇼핑몰 계산대',
    formula: 'Lane choice + express lane comparison',
    summary: '고객이 일반 계산대와 익스프레스 계산대 중 하나를 선택합니다.',
    description: '소량 구매 고객은 express lane으로, 아니면 일반 계산대로 이동합니다.',
    priorityMode: 'fifo',
    classifyAgent: (controls) => (Math.random() * 100 < controls.priorityShare ? 'express' : 'normal'),
    getNextStageIndex: (state, currentStageIndex, agent) => {
      if (currentStageIndex !== 0) {
        return null;
      }
      const expressLoad = getStageLoad(state.stages[1]);
      const regularLoad = getStageLoad(state.stages[2]);
      if (agent.kind === 'express' && expressLoad <= regularLoad + 2) {
        return 1;
      }
      return 2;
    },
    controlFields: [
      { key: 'arrivalRate', label: '고객 유입 λ', helper: '분당 계산대 구역으로 진입하는 고객 수입니다.', min: 3, max: 120, step: 1, unit: '명/분' },
      { key: 'primaryMeanSeconds', label: '라인 선택 시간', helper: '고객이 계산대를 선택하는 평균 시간입니다.', min: 2, max: 20, step: 1, unit: '초' },
      { key: 'secondaryServerCount', label: '익스프레스 계산대', helper: 'Express lane 계산대 수입니다.', min: 1, max: 8, step: 1, unit: '대' },
      { key: 'secondaryMeanSeconds', label: '익스프레스 처리시간', helper: '익스프레스 계산대의 평균 결제 시간입니다.', min: 4, max: 40, step: 1, unit: '초' },
      { key: 'tertiaryServerCount', label: '일반 계산대', helper: '일반 계산대 서버 수입니다.', min: 1, max: 12, step: 1, unit: '대' },
      { key: 'tertiaryMeanSeconds', label: '일반 처리시간', helper: '일반 계산대의 평균 결제 시간입니다.', min: 8, max: 70, step: 1, unit: '초' },
      { key: 'priorityShare', label: '익스프레스 적격 비율', helper: '적은 물건을 가진 고객 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'balkThreshold', label: 'Balking 임계치', helper: '전체 계산대 대기열이 길면 일부 고객이 구매를 포기합니다.', min: 0, max: 40, step: 1, unit: '명' },
      { key: 'queueCapacity', label: '계산대 구역 한도', helper: '계산대 구역의 최대 체류 인원입니다.', min: 4, max: 50, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'chooser', label: '라인 선택', description: '고객이 계산대를 선택함', color: '#64748b', serverPrefix: 'L', serverCount: 1, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'deterministic' },
      { id: 'express', label: 'Express', description: '적은 품목 고객 전용', color: '#22c55e', serverPrefix: 'E', serverCount: controls.secondaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.secondaryMeanSeconds, distribution: 'exponential' },
      { id: 'regular', label: 'Regular', description: '일반 계산대', color: '#2563eb', serverPrefix: 'R', serverCount: controls.tertiaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.tertiaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'erlangb',
    name: 'Erlang-B Loss System',
    formula: 'M/M/c/c',
    summary: '대기열 없이 서버가 모두 차면 즉시 차단되는 손실 시스템입니다.',
    description: '채널, 회선, 무선 자원처럼 full이면 바로 차단되는 no-waiting 시스템을 표현합니다.',
    priorityMode: 'fifo',
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 호출 또는 요청 수입니다.', min: 2, max: 108, step: 1, unit: '건/분' },
      { key: 'primaryServerCount', label: '서버 수 c', helper: '동시에 처리 가능한 자원 수입니다.', min: 1, max: 20, step: 1, unit: '대' },
      { key: 'primaryMeanSeconds', label: '평균 서비스 시간', helper: '자원 점유 평균 시간입니다.', min: 4, max: 120, step: 1, unit: '초' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'loss-system', label: 'Loss Servers', description: '대기열 없음, full이면 차단', color: '#dc2626', serverPrefix: 'B', serverCount: controls.primaryServerCount, queueCapacity: controls.primaryServerCount, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'jackson',
    name: 'Jackson Network',
    formula: 'Open Jackson network with feedback',
    summary: '분기와 피드백이 있는 개방형 네트워크 큐입니다.',
    description: '세 노드가 서로를 오가며 traffic equation으로 외부 유입을 내부 부하로 변환합니다.',
    priorityMode: 'priority',
    getNextStageIndex: (state, currentStageIndex) => {
      const pAB = state.controls.routingProbability / 100;
      if (currentStageIndex === 0) {
        return Math.random() < pAB ? 1 : 2;
      }
      if (currentStageIndex === 1) {
        return Math.random() < 0.55 ? 2 : null;
      }
      if (currentStageIndex === 2) {
        return Math.random() < 0.18 ? 1 : null;
      }
      return null;
    },
    controlFields: [
      { key: 'arrivalRate', label: '외부 유입 λ₀', helper: '네트워크 외부에서 유입되는 분당 고객 수입니다.', min: 2, max: 90, step: 1, unit: '명/분' },
      { key: 'primaryServerCount', label: 'Node A 서버', helper: '첫 번째 노드의 서버 수입니다.', min: 1, max: 10, step: 1, unit: '대' },
      { key: 'secondaryServerCount', label: 'Node B 서버', helper: '두 번째 노드의 서버 수입니다.', min: 1, max: 10, step: 1, unit: '대' },
      { key: 'tertiaryServerCount', label: 'Node C 서버', helper: '세 번째 노드의 서버 수입니다.', min: 1, max: 10, step: 1, unit: '대' },
      { key: 'primaryMeanSeconds', label: 'Node A 평균 시간', helper: 'Node A의 평균 서비스 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'secondaryMeanSeconds', label: 'Node B 평균 시간', helper: 'Node B의 평균 서비스 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'tertiaryMeanSeconds', label: 'Node C 평균 시간', helper: 'Node C의 평균 서비스 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'routingProbability', label: 'A→B 확률', helper: 'Node A를 마친 고객이 B로 가는 확률입니다.', min: 10, max: 90, step: 5, unit: '%' },
      { key: 'queueCapacity', label: '노드 수용 한도', helper: '각 노드의 최대 체류 인원입니다.', min: 4, max: 50, step: 1, unit: '명' },
      { key: 'priorityShare', label: '우선 고객 비율', helper: '우선 고객은 각 노드에서 큐 순서를 앞당깁니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'node-a', label: 'Node A', description: '외부 유입 노드', color: '#4f46e5', serverPrefix: 'A', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
      { id: 'node-b', label: 'Node B', description: '중간 처리 노드', color: '#f59e0b', serverPrefix: 'B', serverCount: controls.secondaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.secondaryMeanSeconds, distribution: 'exponential' },
      { id: 'node-c', label: 'Node C', description: '출구 인접 노드', color: '#10b981', serverPrefix: 'C', serverCount: controls.tertiaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.tertiaryMeanSeconds, distribution: 'exponential' },
    ],
  },
];

const supplementalModelCatalog: ModelDefinition[] = [
  {
    id: 'mg1',
    name: 'M/G/1',
    formula: 'Poisson arrivals / General service / 1 server',
    summary: '서비스 분포가 일반형인 단일 서버 모델입니다.',
    description: '평균 서비스 시간은 같아도 분산이 커지면 대기시간이 늘어나는 효과를 봅니다.',
    theorySummary: 'M/G/1은 도착은 포아송이지만 서비스 분포는 자유롭게 바뀌는 단일 서버 모델입니다. 핵심은 평균보다 서비스시간 분산이 대기시간을 크게 키운다는 점입니다. Pollaczek-Khinchine 식으로 평균 대기시간을 근사합니다.',
    priorityMode: 'priority',
    serviceTimeSampler: (stage, controls) => sampleGeneralDuration(stage.meanServiceSeconds, normalizeCvPercent(controls.routingProbability)),
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 도착 고객 수입니다.', min: 2, max: 90, step: 1, unit: '명/분' },
      { key: 'primaryMeanSeconds', label: '평균 서비스 시간', helper: '서비스시간 평균입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'routingProbability', label: '서비스 변동성', helper: '100%가 CV=1입니다. 값이 클수록 서비스 분산이 커집니다.', min: 30, max: 250, step: 10, unit: '%' },
      { key: 'queueCapacity', label: '시스템 수용 한도', helper: '대기 포함 최대 체류 인원입니다.', min: 2, max: 40, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'general-service', label: '일반 서비스', description: '변동성 있는 일반 서비스 분포', color: '#7c3aed', serverPrefix: 'G', serverCount: 1, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'gg1',
    name: 'G/G/1',
    formula: 'General arrivals / General service / 1 server',
    summary: '도착과 서비스가 모두 일반 분포인 단일 서버 모델입니다.',
    description: 'Kingman 근사로 변동성 두 축이 대기시간을 어떻게 키우는지 보여줍니다.',
    theorySummary: 'G/G/1은 도착 간격과 서비스시간이 모두 일반 분포인 가장 유연한 단일 서버 모델입니다. 닫힌형식 해는 드물어 Kingman 근사처럼 평균과 변동성을 이용한 근사식을 자주 씁니다.',
    priorityMode: 'priority',
    arrivalSampler: (controls) => sampleGeneralDuration(60 / controls.arrivalRate, normalizeCvPercent(controls.batchSize)),
    serviceTimeSampler: (stage, controls) => sampleGeneralDuration(stage.meanServiceSeconds, normalizeCvPercent(controls.routingProbability)),
    controlFields: [
      { key: 'arrivalRate', label: '평균 유입 λ', helper: '분당 평균 도착 고객 수입니다.', min: 2, max: 90, step: 1, unit: '명/분' },
      { key: 'batchSize', label: '도착 변동성', helper: '100%가 도착 CV=1입니다.', min: 30, max: 250, step: 10, unit: '%' },
      { key: 'primaryMeanSeconds', label: '평균 서비스 시간', helper: '평균 처리 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'routingProbability', label: '서비스 변동성', helper: '100%가 서비스 CV=1입니다.', min: 30, max: 250, step: 10, unit: '%' },
      { key: 'queueCapacity', label: '시스템 수용 한도', helper: '대기 포함 최대 체류 인원입니다.', min: 2, max: 40, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'gg-service', label: '일반 서버', description: '도착과 서비스 모두 일반 분포', color: '#9333ea', serverPrefix: 'Q', serverCount: 1, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'prioritynp',
    name: 'Priority Queue · Non-preemptive',
    formula: 'M/M/1 with non-preemptive priority',
    summary: '높은 우선순위 고객이 먼저 처리되지만, 이미 시작된 서비스는 끝까지 이어집니다.',
    description: '응급도, VIP, 긴급 요청처럼 class-based 우선권은 있지만 진행 중 서비스는 끊지 않는 규칙입니다.',
    theorySummary: 'Non-preemptive priority는 우선 고객이 큐 앞쪽으로 오지만, 이미 시작된 서비스는 끝까지 유지되는 규칙입니다. 구현은 단순하지만 고우선 고객이 많아질수록 일반 고객의 대기시간이 빠르게 늘고, 낮은 우선순위 클래스는 쉽게 밀릴 수 있습니다.',
    priorityMode: 'priority',
    classifyAgent: (controls) => (Math.random() * 100 < controls.priorityShare ? 'priority' : 'normal'),
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 도착 고객 수입니다.', min: 2, max: 90, step: 1, unit: '명/분' },
      { key: 'primaryMeanSeconds', label: '평균 서비스 시간', helper: '단일 서버 평균 처리 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'priorityShare', label: '우선 고객 비율', helper: '고우선 고객이 차지하는 비율입니다.', min: 5, max: 95, step: 5, unit: '%' },
      { key: 'queueCapacity', label: '시스템 수용 한도', helper: '대기 포함 최대 체류 인원입니다.', min: 2, max: 40, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'priority-np', label: 'Priority Server', description: '선행 서비스는 끝까지 유지', color: '#2563eb', serverPrefix: 'P', serverCount: 1, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'priorityresume',
    name: 'Priority Queue · Preemptive Resume',
    formula: 'M/M/1 with preemptive-resume priority',
    summary: '우선 고객이 오면 현재 저우선 서비스가 중단되고, 나중에 이어서 재개됩니다.',
    description: 'CPU 인터럽트나 긴급 환자 선처치처럼 높은 우선순위가 진행 중 작업을 끊고 들어오는 규칙입니다.',
    theorySummary: 'Preemptive-resume priority는 우선 고객이 도착하면 현재 저우선 작업을 멈추고 먼저 처리한 뒤, 나중에 남은 작업을 이어서 끝내는 규칙입니다. 긴급 작업 응답은 빨라지지만 일반 작업은 잦은 중단 때문에 체감 지연이 커질 수 있습니다.',
    priorityMode: 'preemptive',
    classifyAgent: (controls) => (Math.random() * 100 < controls.priorityShare ? 'priority' : 'normal'),
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 도착 고객 수입니다.', min: 2, max: 90, step: 1, unit: '명/분' },
      { key: 'primaryMeanSeconds', label: '평균 서비스 시간', helper: '단일 서버 평균 처리 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'priorityShare', label: '우선 고객 비율', helper: '고우선 고객이 차지하는 비율입니다.', min: 5, max: 95, step: 5, unit: '%' },
      { key: 'queueCapacity', label: '시스템 수용 한도', helper: '대기 포함 최대 체류 인원입니다.', min: 2, max: 40, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'priority-pr', label: 'Resume Server', description: '중단된 작업은 남은 시간만 재개', color: '#7c3aed', serverPrefix: 'R', serverCount: 1, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'priorityrepeat',
    name: 'Priority Queue · Preemptive Repeat',
    formula: 'M/M/1 with preemptive-repeat priority',
    summary: '우선 고객이 오면 현재 저우선 서비스가 중단되고, 다시 시작할 때 처음부터 처리합니다.',
    description: '재작업 비용이 큰 검사·세척·셋업처럼 중단 후 재개가 아니라 restart가 필요한 규칙을 표현합니다.',
    theorySummary: 'Preemptive-repeat priority는 저우선 작업이 중간에 끊기면 남은 시간만 이어서 처리하지 않고 처음부터 다시 시작하는 규칙입니다. 중단 비용이 큰 공정에 가깝고, 선점이 잦을수록 일반 작업 손실이 가장 크게 나타납니다.',
    priorityMode: 'preemptive-repeat',
    classifyAgent: (controls) => (Math.random() * 100 < controls.priorityShare ? 'priority' : 'normal'),
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 도착 고객 수입니다.', min: 2, max: 90, step: 1, unit: '명/분' },
      { key: 'primaryMeanSeconds', label: '평균 서비스 시간', helper: '단일 서버 평균 처리 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'priorityShare', label: '우선 고객 비율', helper: '고우선 고객이 차지하는 비율입니다.', min: 5, max: 95, step: 5, unit: '%' },
      { key: 'queueCapacity', label: '시스템 수용 한도', helper: '대기 포함 최대 체류 인원입니다.', min: 2, max: 40, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'priority-rr', label: 'Repeat Server', description: '선점되면 서비스가 처음부터 다시 시작', color: '#dc2626', serverPrefix: 'X', serverCount: 1, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'closed',
    name: 'Closed Queueing Network',
    formula: 'Closed network with fixed population',
    summary: '외부 유입 없이 정해진 인구가 계속 순환하는 폐쇄형 네트워크입니다.',
    description: '사용자 수가 고정된 시스템에서 think time과 병목 서버가 throughput을 결정합니다.',
    theorySummary: 'Closed queueing network는 외부에서 새 고객이 들어오지 않고, 정해진 수의 고객이 시스템 안을 계속 순환합니다. 사용자가 많아질수록 처리량은 포화되고, 가장 느린 서버가 전체 사이클 타임을 좌우합니다.',
    priorityMode: 'fifo',
    seedPopulation: (controls) => Math.max(2, Math.round(controls.batchSize)),
    arrivalSampler: () => Number.POSITIVE_INFINITY,
    getNextStageIndex: (_state, currentStageIndex) => (currentStageIndex + 1) % 3,
    controlFields: [
      { key: 'batchSize', label: '순환 인구 N', helper: '시스템 안을 순환하는 고정 고객 수입니다.', min: 2, max: 30, step: 1, unit: '명' },
      { key: 'primaryServerCount', label: 'Node A 서버', helper: '첫 노드 서버 수입니다.', min: 1, max: 8, step: 1, unit: '대' },
      { key: 'secondaryServerCount', label: 'Node B 서버', helper: '둘째 노드 서버 수입니다.', min: 1, max: 8, step: 1, unit: '대' },
      { key: 'tertiaryServerCount', label: 'Think 서버', helper: '생각/준비 단계 서버 수입니다.', min: 1, max: 12, step: 1, unit: '대' },
      { key: 'primaryMeanSeconds', label: 'Node A 시간', helper: '첫 노드 평균 처리 시간입니다.', min: 4, max: 60, step: 1, unit: '초' },
      { key: 'secondaryMeanSeconds', label: 'Node B 시간', helper: '둘째 노드 평균 처리 시간입니다.', min: 4, max: 60, step: 1, unit: '초' },
      { key: 'tertiaryMeanSeconds', label: 'Think 시간', helper: '재진입 전 대기 시간입니다.', min: 4, max: 120, step: 1, unit: '초' },
      { key: 'queueCapacity', label: '노드 수용 한도', helper: '각 노드 최대 체류 인원입니다.', min: 3, max: 40, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'closed-a', label: 'Node A', description: '주요 처리 노드', color: '#2563eb', serverPrefix: 'A', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
      { id: 'closed-b', label: 'Node B', description: '보조 처리 노드', color: '#f97316', serverPrefix: 'B', serverCount: controls.secondaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.secondaryMeanSeconds, distribution: 'exponential' },
      { id: 'closed-think', label: 'Think', description: '재진입 전 대기', color: '#16a34a', serverPrefix: 'T', serverCount: controls.tertiaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.tertiaryMeanSeconds, distribution: 'deterministic' },
    ],
  },
  {
    id: 'processor',
    name: 'Processor Sharing',
    formula: 'M/G/1-PS approximation',
    summary: '작업들이 서버 용량을 동시에 나눠 쓰는 시간공유형 모델입니다.',
    description: '한 작업이 독점하지 않고 active job들이 용량을 공유해 응답시간이 바뀝니다.',
    theorySummary: 'Processor sharing은 여러 작업이 한 서버의 처리 용량을 동시에 나눠 쓰는 규칙입니다. 큰 작업이 뒤에서 들어와도 완전히 막히지 않고 조금씩 진행되며, 대화형 시스템이나 CPU 시간공유를 설명할 때 자주 씁니다.',
    priorityMode: 'fifo',
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 작업 도착 수입니다.', min: 2, max: 90, step: 1, unit: '건/분' },
      { key: 'primaryServerCount', label: '공유 채널 수', helper: '동시에 나눠 줄 수 있는 용량 슬롯 수입니다.', min: 1, max: 12, step: 1, unit: '슬롯' },
      { key: 'primaryMeanSeconds', label: '평균 작업 시간', helper: '작업량의 평균입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'queueCapacity', label: '활성 작업 한도', helper: '동시에 떠 있을 수 있는 작업 수입니다.', min: 2, max: 60, step: 1, unit: '건' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'ps-server', label: 'Shared CPU', description: '동시 작업 용량 공유', color: '#14b8a6', serverPrefix: 'P', serverCount: Math.max(1, controls.primaryServerCount), queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'polling',
    name: 'Polling System',
    formula: 'Single rover server over multiple queues',
    summary: '하나의 서버가 여러 큐를 순회하는 폴링 시스템 근사입니다.',
    description: '창구 하나가 여러 창을 돌며 처리하는 상황을 큐 단위 부하 비교로 표현합니다.',
    theorySummary: 'Polling system은 하나의 서버가 여러 큐를 번갈아 방문해 처리하는 구조입니다. 전환시간이 길수록 모든 큐의 대기시간이 함께 늘고, 가장 자주 쌓이는 큐가 전체 성능을 지배합니다.',
    priorityMode: 'fifo',
    controlFields: [
      { key: 'arrivalRate', label: '총 유입 λ', helper: '세 큐로 분산되는 총 도착량입니다.', min: 3, max: 90, step: 1, unit: '건/분' },
      { key: 'primaryMeanSeconds', label: '평균 처리 시간', helper: '각 요청 처리 평균 시간입니다.', min: 4, max: 60, step: 1, unit: '초' },
      { key: 'routingProbability', label: '1번 큐 비중', helper: '첫 번째 큐로 들어가는 비중입니다. 나머지는 나눠집니다.', min: 20, max: 80, step: 5, unit: '%' },
      { key: 'secondaryMeanSeconds', label: '전환 시간', helper: '큐 사이를 옮겨 다니는 평균 전환 시간입니다.', min: 2, max: 30, step: 1, unit: '초' },
      { key: 'queueCapacity', label: '큐 한도', helper: '각 큐의 최대 체류 인원입니다.', min: 3, max: 30, step: 1, unit: '건' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'poll-a', label: 'Queue A', description: '폴링 서버가 방문하는 1번 큐', color: '#0ea5e9', serverPrefix: 'A', serverCount: 1, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds + controls.secondaryMeanSeconds, distribution: 'deterministic' },
      { id: 'poll-b', label: 'Queue B', description: '폴링 서버가 방문하는 2번 큐', color: '#8b5cf6', serverPrefix: 'B', serverCount: 1, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds + controls.secondaryMeanSeconds, distribution: 'deterministic' },
      { id: 'poll-c', label: 'Queue C', description: '폴링 서버가 방문하는 3번 큐', color: '#f97316', serverPrefix: 'C', serverCount: 1, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds + controls.secondaryMeanSeconds, distribution: 'deterministic' },
    ],
    getInitialStageIndex: (state) => choosePollingStage(state.controls.routingProbability),
  },
  {
    id: 'forkjoin',
    name: 'Fork-Join',
    formula: 'Split → parallel work → join',
    summary: '작업을 병렬로 나눴다가 다시 합치는 구조의 근사 모델입니다.',
    description: '가장 늦는 병렬 분기가 전체 완료시간을 지배하는 효과를 보여줍니다.',
    theorySummary: 'Fork-join은 한 작업을 여러 하위 작업으로 나눠 병렬 처리한 뒤 모두 끝나야 다시 합치는 구조입니다. 병렬화 이점이 있어도 가장 늦는 분기가 전체 지연을 결정한다는 점이 핵심입니다.',
    priorityMode: 'fifo',
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 작업 도착 수입니다.', min: 2, max: 72, step: 1, unit: '건/분' },
      { key: 'primaryServerCount', label: '병렬 분기 A', helper: '분기 A 서버 수입니다.', min: 1, max: 8, step: 1, unit: '대' },
      { key: 'secondaryServerCount', label: '병렬 분기 B', helper: '분기 B 서버 수입니다.', min: 1, max: 8, step: 1, unit: '대' },
      { key: 'tertiaryServerCount', label: 'Join 서버', helper: '합류 후 처리 서버 수입니다.', min: 1, max: 8, step: 1, unit: '대' },
      { key: 'primaryMeanSeconds', label: '분기 A 시간', helper: '분기 A 평균 시간입니다.', min: 4, max: 60, step: 1, unit: '초' },
      { key: 'secondaryMeanSeconds', label: '분기 B 시간', helper: '분기 B 평균 시간입니다.', min: 4, max: 60, step: 1, unit: '초' },
      { key: 'tertiaryMeanSeconds', label: 'Join 시간', helper: '합류 후 평균 처리 시간입니다.', min: 4, max: 60, step: 1, unit: '초' },
      { key: 'queueCapacity', label: '단계당 한도', helper: '각 단계 최대 체류 인원입니다.', min: 3, max: 40, step: 1, unit: '건' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'split', label: 'Split', description: '작업 분기', color: '#64748b', serverPrefix: 'S', serverCount: 1, queueCapacity: controls.queueCapacity, meanServiceSeconds: 4, distribution: 'deterministic' },
      { id: 'parallel', label: 'Parallel Work', description: '병렬 분기 작업의 최대 지연 근사', color: '#7c3aed', serverPrefix: 'P', serverCount: controls.primaryServerCount + controls.secondaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: Math.max(controls.primaryMeanSeconds, controls.secondaryMeanSeconds), distribution: 'deterministic' },
      { id: 'join', label: 'Join', description: '병렬 분기 합류', color: '#10b981', serverPrefix: 'J', serverCount: controls.tertiaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.tertiaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'retrial',
    name: 'Retrial / Orbit Queue',
    formula: 'Blocked calls retry after orbit delay',
    summary: '바로 서비스받지 못한 고객이 orbit로 빠졌다가 다시 시도하는 모델입니다.',
    description: '통화 재시도나 재접속처럼 실패 고객이 일정 시간 뒤 다시 유입됩니다.',
    theorySummary: 'Retrial queue는 처음 시도에서 실패한 고객이 완전히 떠나지 않고 orbit에 머물다가 다시 진입하는 모델입니다. 혼잡이 심할수록 orbit 인구가 커지고 재시도 트래픽이 원래 유입을 더 압박합니다.',
    priorityMode: 'priority',
    controlFields: [
      { key: 'arrivalRate', label: '유입 λ', helper: '분당 기본 도착량입니다.', min: 2, max: 90, step: 1, unit: '건/분' },
      { key: 'primaryServerCount', label: '서버 수', helper: '동시에 처리 가능한 서버 수입니다.', min: 1, max: 12, step: 1, unit: '대' },
      { key: 'primaryMeanSeconds', label: '평균 서비스 시간', helper: '평균 처리 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'queueCapacity', label: '즉시 수용 한도', helper: '이 한도를 넘으면 orbit로 이동합니다.', min: 1, max: 20, step: 1, unit: '건' },
      { key: 'secondaryMeanSeconds', label: '재시도 지연', helper: 'orbit에 있다가 다시 시도하기까지의 평균 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'retrial-service', label: '서비스', description: '실패 시 orbit로 이동 후 재시도', color: '#e11d48', serverPrefix: 'R', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'statedependent',
    name: 'State-Dependent Queue',
    formula: 'Rates depend on current congestion',
    summary: '혼잡 상태에 따라 유입 또는 서비스율이 달라지는 모델입니다.',
    description: '혼잡이 커지면 유입이 줄거나 서비스가 빨라지는 반응형 시스템을 표현합니다.',
    theorySummary: 'State-dependent queue는 시스템 상태에 따라 도착률이나 서비스율이 달라지는 모델입니다. 혼잡이 심하면 유입이 줄거나 처리 속도가 변하는 식으로, 현실 시스템의 적응적 반응을 표현할 때 유용합니다.',
    priorityMode: 'priority',
    arrivalSampler: (controls, state) => {
      const baseRate = controls.arrivalRate;
      const loadRatio = state ? Math.min(1.2, state.agents.length / Math.max(controls.queueCapacity, 1)) : 0;
      const sensitivity = controls.routingProbability / 100;
      const effectiveRate = Math.max(0.2, baseRate * (1 - loadRatio * sensitivity * 0.75));
      return sampleExponential(effectiveRate);
    },
    controlFields: [
      { key: 'arrivalRate', label: '기준 유입 λ', helper: '혼잡이 없을 때의 기준 유입량입니다.', min: 2, max: 90, step: 1, unit: '명/분' },
      { key: 'primaryServerCount', label: '서버 수', helper: '기본 서버 수입니다.', min: 1, max: 12, step: 1, unit: '대' },
      { key: 'primaryMeanSeconds', label: '기준 서비스 시간', helper: '혼잡이 없을 때 평균 처리 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'routingProbability', label: '혼잡 민감도', helper: '값이 클수록 혼잡 시 유입이 더 빨리 감소합니다.', min: 10, max: 90, step: 5, unit: '%' },
      { key: 'queueCapacity', label: '시스템 수용 한도', helper: '대기 포함 최대 체류 인원입니다.', min: 2, max: 40, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'state-service', label: '상태의존 서버', description: '혼잡 상태에 따라 유효 λ가 달라짐', color: '#0f766e', serverPrefix: 'S', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'bulk',
    name: 'Bulk Arrival / Bulk Service',
    formula: 'Grouped arrivals and grouped departures',
    summary: '고객이 묶음으로 들어오고 서버도 묶음으로 처리하는 모델입니다.',
    description: '셔틀, 차량, 배치 처리처럼 arrival과 service가 묶음 단위로 움직입니다.',
    theorySummary: 'Bulk model은 고객이 한 명씩이 아니라 묶음으로 들어오거나, 서버가 여러 명을 한 번에 처리하는 구조입니다. 배치 크기가 커질수록 순간 혼잡과 대기열 파동이 더 크게 나타납니다.',
    priorityMode: 'fifo',
    batchSize: (controls) => Math.max(1, Math.round(controls.batchSize)),
    controlFields: [
      { key: 'arrivalRate', label: '평균 유입 λ', helper: '분당 평균 유입량입니다. 실제 유입은 배치 단위입니다.', min: 2, max: 120, step: 1, unit: '명/분' },
      { key: 'batchSize', label: '배치 크기', helper: '한 번에 들어오거나 처리되는 고객 수입니다.', min: 2, max: 20, step: 1, unit: '명' },
      { key: 'primaryServerCount', label: '서버 수', helper: '배치 처리 서버 수입니다.', min: 1, max: 10, step: 1, unit: '대' },
      { key: 'primaryMeanSeconds', label: '배치 처리 시간', helper: '한 배치를 처리하는 평균 시간입니다.', min: 4, max: 90, step: 1, unit: '초' },
      { key: 'queueCapacity', label: '시스템 수용 한도', helper: '대기 포함 최대 체류 인원입니다.', min: 4, max: 60, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'bulk-service', label: '배치 서비스', description: '묶음 유입과 묶음 처리', color: '#ea580c', serverPrefix: 'B', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'deterministic' },
    ],
  },
  {
    id: 'themepark',
    name: '테마파크 탑승',
    formula: 'Batch loading + priority pass + balking',
    summary: '탑승 그룹과 priority pass, 대기 포기를 함께 보는 놀이기구 큐입니다.',
    description: '한 번에 여러 명을 태우고 VIP 패스 손님은 우선 탑승합니다.',
    theorySummary: '테마파크 탑승 큐는 여러 손님을 한 번에 태우는 batch loading, 빠른 탑승권의 우선 처리, 긴 대기열을 보고 포기하는 balking이 동시에 나타나는 대표 사례입니다.',
    priorityMode: 'priority',
    batchSize: (controls) => Math.max(1, Math.round(controls.batchSize)),
    controlFields: [
      { key: 'arrivalRate', label: '방문객 유입 λ', helper: '분당 놀이기구 대기열로 오는 방문객 수입니다.', min: 4, max: 120, step: 1, unit: '명/분' },
      { key: 'batchSize', label: '탑승 배치 크기', helper: '한 번에 탑승하는 인원입니다.', min: 2, max: 24, step: 1, unit: '명' },
      { key: 'primaryServerCount', label: '탑승 플랫폼', helper: '동시에 운행 가능한 플랫폼 수입니다.', min: 1, max: 6, step: 1, unit: '대' },
      { key: 'primaryMeanSeconds', label: '운행 사이클 시간', helper: '한 배치가 출발해 돌아오기까지의 평균 시간입니다.', min: 10, max: 120, step: 1, unit: '초' },
      { key: 'priorityShare', label: 'Priority pass 비율', helper: '우선 탑승권을 가진 손님 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'balkThreshold', label: '포기 임계치', helper: '대기열이 길면 일부 손님이 줄을 떠납니다.', min: 0, max: 40, step: 1, unit: '명' },
      { key: 'queueCapacity', label: '대기 구역 한도', helper: '대기 구역 최대 수용 인원입니다.', min: 4, max: 60, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'ride-queue', label: '탑승 대기', description: 'Priority pass 손님 우선 처리', color: '#db2777', serverPrefix: 'R', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'deterministic' },
    ],
  },
  {
    id: 'baggage',
    name: '공항 수하물 수취',
    formula: 'Carousel congestion + jockeying',
    summary: '승객이 여러 수하물 벨트 중 하나를 선택하는 혼잡 모델입니다.',
    description: '혼잡한 벨트는 피하고 다른 벨트로 이동하는 jockeying을 단순화했습니다.',
    theorySummary: '수하물 수취는 여러 carousel 중 어디가 덜 혼잡한지 보고 이동하는 jockeying과, 벨트 주변 공간이 차며 발생하는 blocking이 함께 나타나는 시나리오입니다.',
    priorityMode: 'fifo',
    getInitialStageIndex: () => 0,
    getNextStageIndex: (state, currentStageIndex) => {
      if (currentStageIndex !== 0) {
        return null;
      }
      return getStageLoad(state.stages[1]) <= getStageLoad(state.stages[2]) ? 1 : 2;
    },
    controlFields: [
      { key: 'arrivalRate', label: '승객 유입 λ', helper: '분당 벨트 구역에 도착하는 승객 수입니다.', min: 2, max: 90, step: 1, unit: '명/분' },
      { key: 'secondaryServerCount', label: 'Carousel A', helper: '첫 번째 벨트의 하차 포지션 수입니다.', min: 1, max: 10, step: 1, unit: '칸' },
      { key: 'tertiaryServerCount', label: 'Carousel B', helper: '두 번째 벨트의 하차 포지션 수입니다.', min: 1, max: 10, step: 1, unit: '칸' },
      { key: 'secondaryMeanSeconds', label: 'A 벨트 평균 시간', helper: '수하물 수거 평균 시간입니다.', min: 6, max: 80, step: 1, unit: '초' },
      { key: 'tertiaryMeanSeconds', label: 'B 벨트 평균 시간', helper: '수하물 수거 평균 시간입니다.', min: 6, max: 80, step: 1, unit: '초' },
      { key: 'queueCapacity', label: '벨트 구역 한도', helper: '각 벨트 주변 최대 체류 인원입니다.', min: 4, max: 50, step: 1, unit: '명' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'choose-belt', label: '벨트 선택', description: '덜 혼잡한 carousel을 선택', color: '#64748b', serverPrefix: 'C', serverCount: 1, queueCapacity: controls.queueCapacity, meanServiceSeconds: 4, distribution: 'deterministic' },
      { id: 'carousel-a', label: 'Carousel A', description: '수하물 벨트 A', color: '#0ea5e9', serverPrefix: 'A', serverCount: controls.secondaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.secondaryMeanSeconds, distribution: 'deterministic' },
      { id: 'carousel-b', label: 'Carousel B', description: '수하물 벨트 B', color: '#f59e0b', serverPrefix: 'B', serverCount: controls.tertiaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.tertiaryMeanSeconds, distribution: 'deterministic' },
    ],
  },
  {
    id: 'evcharging',
    name: '전기차 충전소',
    formula: 'Finite capacity + reneging + reservation priority',
    summary: '충전기 수가 제한된 충전소에서 예약 고객 우선권을 반영합니다.',
    description: '예약 고객은 우선 충전하고, 오래 기다린 고객은 떠날 수 있습니다.',
    theorySummary: '전기차 충전소는 자원 수가 제한된 finite-capacity 시스템이고, 예약 차량이나 급속 충전 고객을 우선 처리할 수 있습니다. 대기시간이 길면 떠나는 reneging도 현실적으로 자주 나타납니다.',
    priorityMode: 'priority',
    controlFields: [
      { key: 'arrivalRate', label: '차량 유입 λ', helper: '분당 충전소 진입 차량 수입니다.', min: 1, max: 60, step: 1, unit: '대/분' },
      { key: 'primaryServerCount', label: '충전기 수', helper: '동시에 충전 가능한 충전기 수입니다.', min: 1, max: 20, step: 1, unit: '기' },
      { key: 'primaryMeanSeconds', label: '평균 충전 시간', helper: '한 차량의 평균 점유 시간입니다.', min: 20, max: 240, step: 5, unit: '초' },
      { key: 'priorityShare', label: '예약 차량 비율', helper: '예약 또는 우선 차량 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'renegingSeconds', label: '이탈 임계시간', helper: '기다리다 떠나는 시간 기준입니다.', min: 30, max: 1200, step: 10, unit: '초' },
      { key: 'queueCapacity', label: '대기 구역 한도', helper: '충전 대기 구역 최대 차량 수입니다.', min: 2, max: 40, step: 1, unit: '대' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'charger', label: '충전기', description: '예약 차량 우선 충전', color: '#16a34a', serverPrefix: 'E', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'port',
    name: '항만/컨테이너 터미널',
    formula: 'Tandem + yard blocking + batch arrival',
    summary: '선박 하역, 야드 적치, 게이트 출고가 연결된 항만 모델입니다.',
    description: '대형 선박 배치 도착과 yard blocking을 함께 시각화합니다.',
    theorySummary: '컨테이너 터미널은 선박 단위의 batch arrival, 야드 적치 공간 부족으로 인한 blocking, 게이트 출고 지연이 함께 나타나는 대규모 직렬 네트워크입니다.',
    priorityMode: 'fifo',
    batchSize: (controls) => Math.max(1, Math.round(controls.batchSize)),
    controlFields: [
      { key: 'arrivalRate', label: '선적 유입 λ', helper: '분당 평균 컨테이너 유입량입니다. 실제로는 배치 도착입니다.', min: 2, max: 90, step: 1, unit: 'TEU/분' },
      { key: 'batchSize', label: '선박 배치 크기', helper: '한 번에 입항해 적하하는 물량입니다.', min: 2, max: 24, step: 1, unit: 'TEU' },
      { key: 'primaryServerCount', label: '안벽 크레인', helper: '선박 하역 크레인 수입니다.', min: 1, max: 10, step: 1, unit: '기' },
      { key: 'secondaryServerCount', label: '야드 장비', helper: '야드 적치 장비 수입니다.', min: 1, max: 12, step: 1, unit: '기' },
      { key: 'tertiaryServerCount', label: '게이트 라인', helper: '육상 출고 게이트 수입니다.', min: 1, max: 10, step: 1, unit: '라인' },
      { key: 'queueCapacity', label: '야드 버퍼 한도', helper: '적치 공간 최대 수용량입니다.', min: 4, max: 60, step: 1, unit: 'TEU' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'berth', label: '안벽 하역', description: '배치 도착 선박 하역', color: '#0ea5e9', serverPrefix: 'B', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'deterministic' },
      { id: 'yard', label: '야드 적치', description: 'yard blocking 가능', color: '#84cc16', serverPrefix: 'Y', serverCount: controls.secondaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.secondaryMeanSeconds, distribution: 'deterministic' },
      { id: 'gate', label: '게이트 출고', description: '육상 반출', color: '#f97316', serverPrefix: 'G', serverCount: controls.tertiaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.tertiaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'ward',
    name: '응급실/병동 베드 배정',
    formula: 'Loss system + preemption + boarding delay',
    summary: '베드가 가득 차면 응급실에 체류하며, 중증 환자가 우선권을 가집니다.',
    description: '베드 부족에 따른 boarding delay와 중증 환자 우선 배정을 표현합니다.',
    theorySummary: '응급실과 병동 베드 배정은 사실상 loss system과 preemption이 섞인 구조입니다. 베드가 없으면 응급실에 머무는 boarding delay가 생기고, 중증 환자가 우선권을 가져 전체 흐름을 흔듭니다.',
    priorityMode: 'preemptive',
    classifyAgent: (controls) => (Math.random() * 100 < controls.priorityShare ? 'priority' : 'normal'),
    controlFields: [
      { key: 'arrivalRate', label: '환자 유입 λ', helper: '분당 응급실 유입 환자 수입니다.', min: 1, max: 60, step: 1, unit: '명/분' },
      { key: 'primaryServerCount', label: '응급실 베드', helper: '응급실 초기 처치 베드 수입니다.', min: 1, max: 12, step: 1, unit: '상' },
      { key: 'secondaryServerCount', label: '병동 베드', helper: '전실 가능한 병동 베드 수입니다.', min: 1, max: 20, step: 1, unit: '상' },
      { key: 'primaryMeanSeconds', label: '응급실 체류 시간', helper: '초기 처치 평균 시간입니다.', min: 8, max: 120, step: 1, unit: '초' },
      { key: 'secondaryMeanSeconds', label: '병동 점유 시간', helper: '병동 평균 체류 시간입니다.', min: 20, max: 240, step: 5, unit: '초' },
      { key: 'priorityShare', label: '중증 환자 비율', helper: '선점 우선권을 갖는 환자 비율입니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'queueCapacity', label: '응급실 체류 한도', helper: '전실 대기까지 포함한 최대 체류 인원입니다.', min: 2, max: 40, step: 1, unit: '명' },
      { key: 'renegingSeconds', label: '지연 임계시간', helper: '오래 대기하면 이탈 또는 전원 처리된다고 가정합니다.', min: 30, max: 1200, step: 10, unit: '초' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'ed-bed', label: '응급실 베드', description: '중증 환자 우선 처치', color: '#dc2626', serverPrefix: 'E', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'exponential' },
      { id: 'ward-bed', label: '병동 베드', description: '전실 지연 가능', color: '#2563eb', serverPrefix: 'W', serverCount: controls.secondaryServerCount, queueCapacity: Math.max(controls.secondaryServerCount, Math.floor(controls.queueCapacity * 0.7)), meanServiceSeconds: controls.secondaryMeanSeconds, distribution: 'exponential' },
    ],
  },
  {
    id: 'amr',
    name: '창고 AMR/로봇 교차로',
    formula: 'Network routing + blocking + shared intersections',
    summary: '여러 로봇이 교차로와 작업 노드를 오가며 발생하는 네트워크 혼잡을 봅니다.',
    description: '교차로 점유가 길어지면 전체 경로망이 막히는 현상을 표현합니다.',
    theorySummary: 'AMR 교차로는 개별 로봇이 네트워크를 따라 움직이는 queueing network입니다. 교차로가 잠기면 뒤쪽 경로까지 blocking이 전파되고, 라우팅 정책이 전체 처리량을 크게 바꿉니다.',
    priorityMode: 'priority',
    getNextStageIndex: (state, currentStageIndex) => {
      if (currentStageIndex === 0) {
        return Math.random() < state.controls.routingProbability / 100 ? 1 : 2;
      }
      return null;
    },
    controlFields: [
      { key: 'arrivalRate', label: '작업 유입 λ', helper: '분당 생성되는 로봇 작업 수입니다.', min: 2, max: 90, step: 1, unit: '건/분' },
      { key: 'primaryServerCount', label: '교차로 슬롯', helper: '동시에 통과 가능한 교차로 슬롯 수입니다.', min: 1, max: 10, step: 1, unit: '슬롯' },
      { key: 'secondaryServerCount', label: '경로 A 서버', helper: '경로 A의 처리 슬롯 수입니다.', min: 1, max: 10, step: 1, unit: '슬롯' },
      { key: 'tertiaryServerCount', label: '경로 B 서버', helper: '경로 B의 처리 슬롯 수입니다.', min: 1, max: 10, step: 1, unit: '슬롯' },
      { key: 'primaryMeanSeconds', label: '교차로 점유 시간', helper: '교차로 평균 점유 시간입니다.', min: 2, max: 30, step: 1, unit: '초' },
      { key: 'secondaryMeanSeconds', label: '경로 A 시간', helper: '경로 A 평균 시간입니다.', min: 4, max: 60, step: 1, unit: '초' },
      { key: 'tertiaryMeanSeconds', label: '경로 B 시간', helper: '경로 B 평균 시간입니다.', min: 4, max: 60, step: 1, unit: '초' },
      { key: 'routingProbability', label: 'A 경로 비율', helper: '교차로 후 경로 A로 가는 비율입니다.', min: 10, max: 90, step: 5, unit: '%' },
      { key: 'queueCapacity', label: '노드 수용 한도', helper: '각 경로의 최대 체류 인원입니다.', min: 3, max: 40, step: 1, unit: '건' },
      { key: 'priorityShare', label: '긴급 작업 비율', helper: '긴급 작업이 교차로에서 우선권을 가집니다.', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'speed', label: '재생 배속', helper: '시뮬레이션 시간 배속입니다.', min: 0.5, max: 6, step: 0.1, unit: 'x', precision: 1 },
    ],
    buildStages: (controls) => [
      { id: 'intersection', label: '교차로', description: '공유 교차 지점', color: '#334155', serverPrefix: 'X', serverCount: controls.primaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.primaryMeanSeconds, distribution: 'deterministic' },
      { id: 'route-a', label: '경로 A', description: '작업 구역 A', color: '#14b8a6', serverPrefix: 'A', serverCount: controls.secondaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.secondaryMeanSeconds, distribution: 'exponential' },
      { id: 'route-b', label: '경로 B', description: '작업 구역 B', color: '#f97316', serverPrefix: 'B', serverCount: controls.tertiaryServerCount, queueCapacity: controls.queueCapacity, meanServiceSeconds: controls.tertiaryMeanSeconds, distribution: 'exponential' },
    ],
  },
];

const allModelCatalog = [...modelCatalog, ...supplementalModelCatalog];

export function getModelCatalog() {
  return allModelCatalog.map((model) => ({
    id: model.id,
    name: model.name,
    formula: model.formula,
    summary: model.summary,
    description: model.description,
    theorySummary: model.theorySummary ?? defaultTheorySummary(model.id),
    controlFields: model.controlFields,
  }));
}

export function getModelDefinition(modelId: QueueingModelId) {
  return allModelCatalog.find((model) => model.id === modelId) ?? allModelCatalog[0];
}

export function isGridScenario(modelId: QueueingModelId) {
  return GRID_SCENARIOS.includes(modelId);
}

export const AIRPLANE_BOARDING_STRATEGY_LABELS: Record<AirplaneBoardingStrategy, string> = {
  random: '랜덤 탑승',
  backToFront: '뒷좌석부터 탑승',
  wilma: 'Wilma',
  zone: '구역별 탑승',
  steffen: 'Steffen',
};

export function getDefaultControlsForModel(modelId: QueueingModelId): SimulationControls {
  const base: SimulationControls = {
    ...DEFAULT_CONTROLS,
    modelId,
  };

  if (modelId === 'mm1') {
    return { ...base, arrivalRate: 12, primaryServerCount: 1, primaryMeanSeconds: 6, secondaryServerCount: 0, tertiaryServerCount: 0, queueCapacity: 12, priorityShare: 20, balkThreshold: 6, renegingSeconds: 120 };
  }

  if (modelId === 'mmc') {
    return { ...base, arrivalRate: 18, primaryServerCount: 3, primaryMeanSeconds: 10, secondaryServerCount: 0, tertiaryServerCount: 0, queueCapacity: 18, priorityShare: 25, balkThreshold: 8, renegingSeconds: 150 };
  }

  if (modelId === 'md1') {
    return { ...base, arrivalRate: 12, primaryServerCount: 1, primaryMeanSeconds: 8, secondaryServerCount: 0, tertiaryServerCount: 0, queueCapacity: 12, priorityShare: 20, balkThreshold: 6, renegingSeconds: 120 };
  }

  if (modelId === 'mg1') {
    return { ...base, arrivalRate: 14, primaryServerCount: 1, primaryMeanSeconds: 10, queueCapacity: 14, routingProbability: 140, priorityShare: 15, balkThreshold: 0, renegingSeconds: 0, batchSize: 100 };
  }

  if (modelId === 'gg1') {
    return { ...base, arrivalRate: 14, primaryServerCount: 1, primaryMeanSeconds: 10, queueCapacity: 14, batchSize: 140, routingProbability: 150, priorityShare: 0, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'prioritynp') {
    return { ...base, arrivalRate: 16, primaryServerCount: 1, primaryMeanSeconds: 9, queueCapacity: 16, priorityShare: 30, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'priorityresume') {
    return { ...base, arrivalRate: 16, primaryServerCount: 1, primaryMeanSeconds: 9, queueCapacity: 16, priorityShare: 30, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'priorityrepeat') {
    return { ...base, arrivalRate: 16, primaryServerCount: 1, primaryMeanSeconds: 9, queueCapacity: 16, priorityShare: 30, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'tandem') {
    return { ...base, arrivalRate: 20, primaryServerCount: 2, primaryMeanSeconds: 12, secondaryServerCount: 2, secondaryMeanSeconds: 16, tertiaryServerCount: 0, queueCapacity: 16, priorityShare: 25, balkThreshold: 8, renegingSeconds: 140 };
  }

  if (modelId === 'closed') {
    return { ...base, arrivalRate: 0, primaryServerCount: 2, secondaryServerCount: 2, tertiaryServerCount: 6, primaryMeanSeconds: 10, secondaryMeanSeconds: 14, tertiaryMeanSeconds: 20, queueCapacity: 18, batchSize: 12, priorityShare: 0, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'processor') {
    return { ...base, arrivalRate: 20, primaryServerCount: 4, primaryMeanSeconds: 18, queueCapacity: 28, priorityShare: 0, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'polling') {
    return { ...base, arrivalRate: 18, primaryMeanSeconds: 10, secondaryMeanSeconds: 5, routingProbability: 40, queueCapacity: 14, priorityShare: 0, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'forkjoin') {
    return { ...base, arrivalRate: 12, primaryServerCount: 2, secondaryServerCount: 3, tertiaryServerCount: 2, primaryMeanSeconds: 10, secondaryMeanSeconds: 16, tertiaryMeanSeconds: 8, queueCapacity: 16, priorityShare: 0, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'retrial') {
    return { ...base, arrivalRate: 18, primaryServerCount: 2, primaryMeanSeconds: 14, secondaryMeanSeconds: 18, queueCapacity: 4, priorityShare: 20, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'statedependent') {
    return { ...base, arrivalRate: 24, primaryServerCount: 3, primaryMeanSeconds: 12, queueCapacity: 18, routingProbability: 55, priorityShare: 0, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'bulk') {
    return { ...base, arrivalRate: 30, primaryServerCount: 2, primaryMeanSeconds: 14, batchSize: 5, queueCapacity: 24, priorityShare: 0, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'airport') {
    return { ...base, arrivalRate: 30, primaryServerCount: 3, secondaryServerCount: 4, tertiaryServerCount: 2, primaryMeanSeconds: 10, secondaryMeanSeconds: 14, tertiaryMeanSeconds: 28, queueCapacity: 18, priorityShare: 20, balkThreshold: 12, renegingSeconds: 0, batchSize: 1 };
  }

  if (modelId === 'airplane') {
    return { ...base, arrivalRate: 36, primaryServerCount: 2, secondaryServerCount: 1, tertiaryServerCount: 30, primaryMeanSeconds: 6, secondaryMeanSeconds: 12, tertiaryMeanSeconds: 22, queueCapacity: 28, priorityShare: 18, balkThreshold: 0, renegingSeconds: 0, batchSize: 6, routingProbability: 65 };
  }

  if (modelId === 'hospital') {
    return { ...base, arrivalRate: 16, primaryServerCount: 2, secondaryServerCount: 4, tertiaryServerCount: 2, primaryMeanSeconds: 8, secondaryMeanSeconds: 18, tertiaryMeanSeconds: 10, queueCapacity: 18, priorityShare: 22, balkThreshold: 0, renegingSeconds: 240, batchSize: 1 };
  }

  if (modelId === 'callcenter') {
    return { ...base, arrivalRate: 42, primaryServerCount: 4, secondaryServerCount: 8, tertiaryServerCount: 3, primaryMeanSeconds: 4, secondaryMeanSeconds: 22, tertiaryMeanSeconds: 28, queueCapacity: 28, priorityShare: 30, balkThreshold: 0, renegingSeconds: 150, batchSize: 1 };
  }

  if (modelId === 'logistics') {
    return { ...base, arrivalRate: 24, primaryServerCount: 2, secondaryServerCount: 3, tertiaryServerCount: 2, primaryMeanSeconds: 10, secondaryMeanSeconds: 16, tertiaryMeanSeconds: 12, queueCapacity: 10, priorityShare: 0, balkThreshold: 0, renegingSeconds: 0, batchSize: 4 };
  }

  if (modelId === 'mall') {
    return { ...base, arrivalRate: 30, primaryServerCount: 1, secondaryServerCount: 2, tertiaryServerCount: 4, primaryMeanSeconds: 4, secondaryMeanSeconds: 10, tertiaryMeanSeconds: 18, queueCapacity: 20, priorityShare: 35, balkThreshold: 10, renegingSeconds: 0, batchSize: 1 };
  }

  if (modelId === 'themepark') {
    return { ...base, arrivalRate: 42, primaryServerCount: 2, primaryMeanSeconds: 45, batchSize: 12, queueCapacity: 28, priorityShare: 18, balkThreshold: 16, renegingSeconds: 0 };
  }

  if (modelId === 'baggage') {
    return { ...base, arrivalRate: 18, secondaryServerCount: 4, tertiaryServerCount: 3, secondaryMeanSeconds: 18, tertiaryMeanSeconds: 24, queueCapacity: 20, priorityShare: 0, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'evcharging') {
    return { ...base, arrivalRate: 6, primaryServerCount: 6, primaryMeanSeconds: 90, queueCapacity: 12, priorityShare: 30, balkThreshold: 0, renegingSeconds: 300 };
  }

  if (modelId === 'port') {
    return { ...base, arrivalRate: 20, primaryServerCount: 3, secondaryServerCount: 4, tertiaryServerCount: 3, primaryMeanSeconds: 18, secondaryMeanSeconds: 24, tertiaryMeanSeconds: 16, batchSize: 10, queueCapacity: 24, priorityShare: 0, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'ward') {
    return { ...base, arrivalRate: 8, primaryServerCount: 5, secondaryServerCount: 10, primaryMeanSeconds: 18, secondaryMeanSeconds: 80, priorityShare: 25, queueCapacity: 18, renegingSeconds: 360, balkThreshold: 0 };
  }

  if (modelId === 'amr') {
    return { ...base, arrivalRate: 24, primaryServerCount: 2, secondaryServerCount: 3, tertiaryServerCount: 3, primaryMeanSeconds: 6, secondaryMeanSeconds: 14, tertiaryMeanSeconds: 12, routingProbability: 55, queueCapacity: 18, priorityShare: 20, balkThreshold: 0, renegingSeconds: 0 };
  }

  if (modelId === 'erlangb') {
    return { ...base, arrivalRate: 24, primaryServerCount: 6, primaryMeanSeconds: 18, secondaryServerCount: 0, tertiaryServerCount: 0, queueCapacity: 6, priorityShare: 0, balkThreshold: 0, renegingSeconds: 0, batchSize: 1 };
  }

  if (modelId === 'jackson') {
    return { ...base, arrivalRate: 18, primaryServerCount: 2, secondaryServerCount: 2, tertiaryServerCount: 2, primaryMeanSeconds: 10, secondaryMeanSeconds: 16, tertiaryMeanSeconds: 12, queueCapacity: 18, priorityShare: 20, balkThreshold: 0, renegingSeconds: 0, batchSize: 1, routingProbability: 60 };
  }

  return base;
}

export function sampleExponential(ratePerMinute: number, rng: () => number = Math.random) {
  if (ratePerMinute <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  const uniform = Math.max(rng(), 1e-6);
  return -Math.log(uniform) / ratePerMinute * 60;
}

export function sampleExponentialByMean(meanSeconds: number, rng: () => number = Math.random) {
  const uniform = Math.max(rng(), 1e-6);
  return -Math.log(uniform) * meanSeconds;
}

export function computeLittleLaw(effectiveArrivalRatePerMinute: number, averageTimeSeconds: number) {
  return effectiveArrivalRatePerMinute * (averageTimeSeconds / 60);
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0초';
  }
  if (seconds < 60) {
    return `${seconds.toFixed(0)}초`;
  }
  return `${Math.floor(seconds / 60)}분 ${Math.round(seconds % 60)}초`;
}

export function createEmptySnapshot(controls: SimulationControls = DEFAULT_CONTROLS): SimulationSnapshot {
  const model = getModelDefinition(controls.modelId);
  const stageDefinitions = model.buildStages(controls);
  return {
    modelId: model.id,
    modelName: model.name,
    modelFormula: model.formula,
    viewMode: isGridScenario(model.id) ? 'grid' : 'flow',
    activeCustomers: 0,
    completedCustomers: 0,
    throughputRate: 0,
    averageSystemTime: 0,
    observedL: 0,
    littleL: 0,
    bottleneck: '안정',
    queueLengthTotal: 0,
    inServiceTotal: 0,
    balkedCustomers: 0,
    renegedCustomers: 0,
    blockedCustomers: 0,
    theoryMetrics: [],
    stages: stageDefinitions.map((stage) => ({
      id: stage.id,
      label: stage.label,
      description: stage.description,
      color: stage.color,
      queueLength: 0,
      inService: 0,
      serverCount: stage.serverCount,
      utilization: 0,
      capacityPerMinute: 0,
      meanServiceSeconds: stage.meanServiceSeconds,
      distribution: stage.distribution,
    })),
  };
}

export function createSimulationState(controls: SimulationControls = DEFAULT_CONTROLS): SimulationState {
  const model = getModelDefinition(controls.modelId);
  const runtime = buildSceneRuntime(controls);
  const manifestSeatIds = controls.modelId === 'airplane' ? buildAirplaneManifest(controls) : [];
  const state: SimulationState = {
    controls,
    scene: runtime.scene,
    stages: runtime.stages,
    agents: [],
    manifestSeatIds,
    currentTime: 0,
    nextArrivalAt: sampleNextArrival(controls, null, model),
    nextAgentId: 1,
    stats: {
      spawned: 0,
      completed: 0,
      balked: 0,
      reneged: 0,
      blocked: 0,
      totalSystemTime: 0,
      wipIntegral: 0,
      gridDelaySeconds: 0,
    },
    latestSnapshot: createEmptySnapshot(controls),
  };

  seedModelPopulation(state, model);
  state.latestSnapshot = buildSnapshot(state, controls);
  return state;
}

export function stepSimulation(state: SimulationState, controls: SimulationControls, deltaSeconds: number) {
  const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
  if (dt === 0) {
    return state.latestSnapshot;
  }

  state.currentTime += dt;
  syncModelRuntime(state, controls);
  const model = getModelDefinition(controls.modelId);

  while (state.currentTime >= state.nextArrivalAt) {
    const remainingCapacity = getRemainingSpawnCapacity(state, model);
    if (remainingCapacity <= 0) {
      state.nextArrivalAt = Number.POSITIVE_INFINITY;
      break;
    }
    spawnBatch(state, model, remainingCapacity);
    if (getRemainingSpawnCapacity(state, model) <= 0) {
      state.nextArrivalAt = Number.POSITIVE_INFINITY;
      break;
    }
    state.nextArrivalAt += sampleNextArrival(controls, state, model);
  }

  resolveDormantAgents(state, model);
  resolveReneging(state, controls);
  resolveServiceCompletions(state);
  resolvePreemptions(state, model);
  assignServers(state);
  updateAgents(state, dt);
  resolveDepartures(state);
  updateGridDelayStats(state, dt);

  state.stats.wipIntegral += state.agents.length * dt;
  state.latestSnapshot = buildSnapshot(state, controls);
  return state.latestSnapshot;
}

export function drawSimulation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: SimulationState,
  snapshot: SimulationSnapshot,
) {
  const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
  const offsetX = (width - WORLD_WIDTH * scale) / 2;
  const offsetY = (height - WORLD_HEIGHT * scale) / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  if (isGridScenario(snapshot.modelId)) {
    drawGridSimulation(ctx, state, snapshot);
    ctx.restore();
    return;
  }

  const bg = ctx.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  bg.addColorStop(0, '#f6f0e8');
  bg.addColorStop(0.55, '#fdfaf4');
  bg.addColorStop(1, '#efe4d3');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  drawSceneBackdrop(ctx, state, snapshot);
  drawEntryAndExit(ctx, state);

  state.stages.forEach((stage) => {
    drawStagePanel(ctx, stage, snapshot);
    drawServers(ctx, stage.servers, stage.spec.color, stage.spec.serverPrefix);
    drawQueueGuides(ctx, stage);
  });

  state.scene.flows.forEach((flow) => {
    drawFlowArrow(ctx, flow.from, flow.to, flow.via);
  });

  drawAgents(ctx, state, snapshot.modelId === 'cafeteria');
  drawOverlayStats(ctx, snapshot);

  ctx.restore();
}

function drawGridSimulation(ctx: CanvasRenderingContext2D, state: SimulationState, snapshot: SimulationSnapshot) {
  const bg = ctx.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  bg.addColorStop(0, '#030712');
  bg.addColorStop(0.55, '#090f1f');
  bg.addColorStop(1, '#020617');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  if (snapshot.modelId === 'airplane') {
    drawAirplaneGridScene(ctx, state);
  } else {
    drawScenarioGridScene(ctx, state, snapshot);
  }

  drawGridAgents(ctx, state);
  drawGridOverlayStats(ctx, state, snapshot);
}

function drawStagePanel(ctx: CanvasRenderingContext2D, stage: StageRuntime, snapshot: SimulationSnapshot) {
  const stageSnapshot = snapshot.stages.find((candidate) => candidate.id === stage.spec.id);
  const compact = stage.panel.height <= 160;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 252, 247, 0.92)';
  ctx.strokeStyle = 'rgba(88, 58, 28, 0.18)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, stage.panel.x, stage.panel.y, stage.panel.width, stage.panel.height, 28);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = stage.spec.color;
  roundRect(ctx, stage.panel.x + 14, stage.panel.y + 14, stage.panel.width - 28, compact ? 36 : 46, 16);
  ctx.fill();

  ctx.fillStyle = '#fffdf8';
  ctx.font = compact ? '700 18px "Space Grotesk", sans-serif' : '700 24px "Space Grotesk", sans-serif';
  ctx.fillText(stage.spec.label, stage.panel.x + 24, stage.panel.y + (compact ? 38 : 48));

  ctx.fillStyle = '#50321f';
  ctx.font = compact ? '600 15px "Plus Jakarta Sans", sans-serif' : '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    `대기 ${stageSnapshot?.queueLength ?? 0} · 서버 ${stage.spec.serverCount}`,
    stage.panel.x + 18,
    stage.panel.y + (compact ? 74 : 94),
  );

  if (compact) {
    ctx.fillStyle = 'rgba(80, 50, 31, 0.72)';
    ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`μ ${(stageSnapshot?.capacityPerMinute ?? 0).toFixed(1)}/분`, stage.panel.x + 18, stage.panel.y + 98);
  } else {
    ctx.fillStyle = 'rgba(80, 50, 31, 0.76)';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    const lines = wrapText(ctx, stage.spec.description, stage.panel.width - 40);
    lines.slice(0, 2).forEach((line, index) => {
      ctx.fillText(line, stage.panel.x + 20, stage.panel.y + 132 + index * 24);
    });
  }
  ctx.restore();
}

function drawFlowArrow(ctx: CanvasRenderingContext2D, from: Vector, to: Vector, via?: Vector) {
  ctx.save();
  ctx.strokeStyle = 'rgba(120, 97, 79, 0.36)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  if (via) {
    ctx.lineTo(via.x, via.y);
  }
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.fillStyle = 'rgba(120, 97, 79, 0.42)';
  const lastStart = via ?? from;
  const angle = Math.atan2(to.y - lastStart.y, to.x - lastStart.x);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - 18 * Math.cos(angle - Math.PI / 7), to.y - 18 * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(to.x - 18 * Math.cos(angle + Math.PI / 7), to.y - 18 * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEntryAndExit(ctx: CanvasRenderingContext2D, state: SimulationState) {
  const { entry, exit, orbit, think } = state.scene.points;
  const showOrbit = state.controls.modelId === 'retrial' || state.agents.some((agent) => agent.phase === 'orbit');
  const showThink = state.agents.some((agent) => agent.phase === 'thinking');
  const showExit = state.controls.modelId !== 'airplane';
  ctx.save();
  ctx.fillStyle = '#2d4861';
  roundRect(ctx, entry.x - 26, entry.y - 110, 52, 220, 26);
  ctx.fill();
  ctx.fillStyle = '#eff6ff';
  ctx.font = '700 18px "Space Grotesk", sans-serif';
  ctx.fillText('IN', entry.x - 14, entry.y + 6);

  if (showExit) {
    ctx.fillStyle = '#6d7993';
    roundRect(ctx, exit.x - 24, exit.y - 110, 48, 220, 24);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('OUT', exit.x - 22, exit.y + 6);
  }

  if (showOrbit) {
    ctx.fillStyle = 'rgba(99, 102, 241, 0.22)';
    ctx.beginPath();
    ctx.arc(orbit.x, orbit.y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f3f95';
    ctx.fillText('ORBIT', orbit.x - 28, orbit.y + 6);
  }

  if (showThink) {
    ctx.fillStyle = 'rgba(22, 163, 74, 0.18)';
    ctx.beginPath();
    ctx.arc(think.x, think.y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#166534';
    ctx.fillText('THINK', think.x - 26, think.y + 6);
  }
  ctx.restore();
}

function drawServers(ctx: CanvasRenderingContext2D, servers: ServerRuntime[], color: string, prefix: string) {
  ctx.save();
  const dense = servers.length >= 6;
  const width = dense ? 34 : 56;
  const height = dense ? 28 : 44;
  const radius = dense ? 10 : 14;
  const font = dense ? '700 11px "Space Grotesk", sans-serif' : '700 18px "Space Grotesk", sans-serif';
  servers.forEach((server, index) => {
    ctx.fillStyle = server.agentId == null ? color : shadeColor(color, -16);
    roundRect(ctx, server.pos.x - width / 2, server.pos.y - height / 2, width, height, radius);
    ctx.fill();
    ctx.fillStyle = '#fffdf8';
    ctx.font = font;
    ctx.fillText(dense ? `${index + 1}` : `${prefix}${index + 1}`, server.pos.x - (dense ? 5 : 16), server.pos.y + 4);
  });
  ctx.restore();
}

function drawQueueGuides(ctx: CanvasRenderingContext2D, stage: StageRuntime) {
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = 'rgba(120, 97, 79, 0.26)';
  ctx.lineWidth = 2;
  const slots = Math.max(stage.queue.length + 2, 6);

  for (let index = 0; index < slots; index += 1) {
    const slot = getQueueSlot(stage, index);
    ctx.beginPath();
    ctx.arc(slot.x, slot.y, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAgents(ctx: CanvasRenderingContext2D, state: SimulationState, emphasizeDining: boolean) {
  ctx.save();
  state.agents.forEach((agent) => {
    const baseColor = getAgentColor(state, agent, emphasizeDining);
    ctx.save();
    ctx.translate(agent.pos.x, agent.pos.y);
    ctx.shadowColor = `${baseColor}55`;
    ctx.shadowBlur = 12;
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(0, 0, agent.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 253, 248, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, agent.radius - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

function drawGridAgents(ctx: CanvasRenderingContext2D, state: SimulationState) {
  ctx.save();
  state.agents.forEach((agent) => {
    const size = state.controls.modelId === 'airplane' ? 28 : 22;
    let fill = getAgentColor(state, agent, false);
    let text = '#f8fafc';

    if (state.controls.modelId === 'airplane') {
      if (agent.phase === 'settled') {
        fill = '#10b981';
        text = '#d1fae5';
      } else if (agent.phase === 'service' && agent.stageIndex === 2) {
        fill = '#f97316';
      } else {
        fill = '#fda4af';
        text = '#ffe4e6';
      }
    }

    ctx.fillStyle = `${fill}20`;
    fillRoundedRect(ctx, agent.pos.x - size / 2, agent.pos.y - size / 2, size, size, Math.max(8, size / 3), fill);
    ctx.strokeStyle = `${fill}55`;
    ctx.lineWidth = 2;
    roundRect(ctx, agent.pos.x - size / 2, agent.pos.y - size / 2, size, size, Math.max(8, size / 3));
    ctx.stroke();
    ctx.fillStyle = text;
    ctx.font = `700 ${state.controls.modelId === 'airplane' ? 10 : 9}px "Space Grotesk", sans-serif`;
    const label = state.controls.modelId === 'airplane' ? 'P' : 'Q';
    ctx.fillText(label, agent.pos.x - 4, agent.pos.y + 4);
  });
  ctx.restore();
}

function drawOverlayStats(ctx: CanvasRenderingContext2D, snapshot: SimulationSnapshot) {
  ctx.save();
  ctx.fillStyle = 'rgba(40, 26, 16, 0.68)';
  roundRect(ctx, 34, 34, 640, 92, 24);
  ctx.fill();

  ctx.fillStyle = '#fffdf8';
  ctx.font = '700 20px "Space Grotesk", sans-serif';
  ctx.fillText(`${snapshot.modelName} Live Feed`, 58, 68);
  ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    `${snapshot.modelFormula} · L=${snapshot.observedL.toFixed(1)} · λW=${snapshot.littleL.toFixed(1)} · 병목 ${snapshot.bottleneck}`,
    58,
    96,
  );
  ctx.restore();
}

function drawGridOverlayStats(ctx: CanvasRenderingContext2D, state: SimulationState, snapshot: SimulationSnapshot) {
  const metrics = buildGridOverlayMetrics(state, snapshot);
  ctx.save();
  metrics.forEach((metric, index) => {
    const x = 366 + index * 228;
    ctx.fillStyle = 'rgba(17, 24, 39, 0.92)';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.18)';
    ctx.lineWidth = 2;
    roundRect(ctx, x, 54, 188, 98, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 14px "Space Grotesk", sans-serif';
    ctx.fillText(metric.label.toUpperCase(), x + 20, 88);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 42px "Space Grotesk", sans-serif';
    ctx.fillText(metric.value, x + 20, 132);
    if (metric.accentWidth != null) {
      fillRoundedRect(ctx, x + 20, 138, 148, 12, 6, '#1f2940');
      fillRoundedRect(ctx, x + 20, 138, metric.accentWidth, 12, 6, metric.accentColor ?? '#34d399');
    }
  });
  ctx.restore();
}

function drawSceneBackdrop(ctx: CanvasRenderingContext2D, state: SimulationState, snapshot: SimulationSnapshot) {
  switch (snapshot.modelId) {
    case 'cafeteria':
      drawCafeteriaBackdrop(ctx, state);
      return;
    case 'airport':
      drawAirportBackdrop(ctx);
      return;
    case 'airplane':
      drawAirplaneBackdrop(ctx);
      return;
    case 'hospital':
      drawHospitalBackdrop(ctx);
      return;
    case 'callcenter':
      drawCallcenterBackdrop(ctx);
      return;
    case 'logistics':
      drawLogisticsBackdrop(ctx);
      return;
    case 'mall':
      drawMallBackdrop(ctx);
      return;
    case 'themepark':
      drawThemeparkBackdrop(ctx);
      return;
    case 'baggage':
      drawBaggageBackdrop(ctx);
      return;
    case 'evcharging':
      drawEvChargingBackdrop(ctx);
      return;
    case 'port':
      drawPortBackdrop(ctx);
      return;
    case 'ward':
      drawWardBackdrop(ctx);
      return;
    case 'amr':
      drawAmrBackdrop(ctx);
      return;
    default:
      drawGenericBackdrop(ctx, state);
  }
}

function buildGridOverlayMetrics(state: SimulationState, snapshot: SimulationSnapshot) {
  if (snapshot.modelId === 'airplane') {
    const manifest = getModelDefinition('airplane').spawnLimit?.(state.controls) ?? Math.max(state.stats.spawned, snapshot.completedCustomers);
    const progressRatio = manifest > 0 ? Math.min(1, snapshot.completedCustomers / manifest) : 0;
    return [
      { label: 'Total Time (Ticks)', value: `${Math.round(state.currentTime)}` },
      {
        label: 'Progress',
        value: `${snapshot.completedCustomers} / ${Math.round(manifest)}`,
        accentWidth: 148 * progressRatio,
        accentColor: '#34d399',
      },
      { label: '줄이 멈춘 시간 (Ticks)', value: `${Math.round(state.stats.gridDelaySeconds)}` },
    ];
  }

  if (snapshot.modelId === 'ward') {
    const bedCapacity = snapshot.stages.reduce((sum, stage) => sum + stage.serverCount, 0);
    return [
      { label: 'Total Time (Ticks)', value: `${Math.round(state.currentTime)}` },
      { label: 'Bed Occupancy', value: `${snapshot.inServiceTotal} / ${bedCapacity}` },
      { label: 'Boarding Delay', value: `${Math.round(state.stats.gridDelaySeconds)}` },
    ];
  }

  if (snapshot.modelId === 'evcharging') {
    const chargers = snapshot.stages[0]?.serverCount ?? 0;
    return [
      { label: 'Total Time (Ticks)', value: `${Math.round(state.currentTime)}` },
      { label: 'Chargers Used', value: `${snapshot.inServiceTotal} / ${chargers}` },
      { label: 'Wait Delay', value: `${Math.round(state.stats.gridDelaySeconds)}` },
    ];
  }

  return [
    { label: 'Total Time (Ticks)', value: `${Math.round(state.currentTime)}` },
    { label: 'Completed Jobs', value: `${snapshot.completedCustomers}` },
    { label: 'Intersection Block', value: `${Math.round(state.stats.gridDelaySeconds)}` },
  ];
}

function drawAirplaneGridScene(ctx: CanvasRenderingContext2D, state: SimulationState) {
  const seatStage = state.stages.find((stage) => stage.spec.id === 'seat');
  const rows = Math.max(10, Math.round((seatStage?.servers.length ?? 60) / 6));
  const seats = aircraftSeatPositions(rows * 6);
  const minSeatX = Math.min(...seats.map((seat) => seat.x));
  const maxSeatX = Math.max(...seats.map((seat) => seat.x));
  const minSeatY = Math.min(...seats.map((seat) => seat.y));
  const maxSeatY = Math.max(...seats.map((seat) => seat.y));
  const hullX = 26;
  const hullY = 282;
  const hullRight = Math.min(WORLD_WIDTH - 26, maxSeatX + 104);
  const hullWidth = hullRight - hullX;
  const cabinX = hullX + 26;
  const cabinY = 320;
  const cabinWidth = hullWidth - 52;
  const bridgeWidth = Math.max(228, minSeatX - cabinX - 42);
  const aisleX = minSeatX - 44;
  const aisleWidth = maxSeatX - minSeatX + 88;
  const binX = minSeatX - 18;
  const binWidth = maxSeatX - minSeatX + 36;
  const stowX = minSeatX + 52;

  ctx.save();
  fillRoundedRect(ctx, hullX, hullY, hullWidth, 446, 34, '#151824');
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.lineWidth = 3;
  roundRect(ctx, hullX, hullY, hullWidth, 446, 34);
  ctx.stroke();

  fillRoundedRect(ctx, cabinX, cabinY, cabinWidth, 364, 30, '#1b2030');
  fillRoundedRect(ctx, cabinX + 2, cabinY + 4, cabinWidth - 4, 356, 26, '#0f172a');
  fillRoundedRect(ctx, cabinX + 16, AIRPLANE_AISLE_Y - 58, bridgeWidth, 116, 28, '#181c29');
  fillRoundedRect(ctx, aisleX, AIRPLANE_AISLE_Y - 32, aisleWidth, 64, 26, 'rgba(37, 99, 235, 0.10)');
  fillRoundedRect(ctx, binX, minSeatY - 54, binWidth, 18, 8, '#2b334a');
  fillRoundedRect(ctx, binX, maxSeatY + 36, binWidth, 18, 8, '#2b334a');
  fillRoundedRect(ctx, stowX, 264, 94, 26, 10, '#f59e0b');
  fillRoundedRect(ctx, stowX, 530, 94, 26, 10, '#f59e0b');
  fillRoundedRect(ctx, minSeatX - 60, 246, 10, 324, 8, '#2f374e');

  for (let row = 0; row < rows; row += 1) {
    const x = seats[row * 6]?.x ?? minSeatX;
    ctx.fillStyle = '#8b93a8';
    ctx.font = '600 15px "Space Grotesk", sans-serif';
    ctx.fillText(`${row + 1}`, x - 6, 308);
  }

  seats.forEach((seat) => {
    drawGridSeatCell(ctx, seat.x, seat.y);
  });

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '700 16px "Space Grotesk", sans-serif';
  ctx.fillText('Boarding Bridge', cabinX + 28, AIRPLANE_AISLE_Y - 32);
  ctx.fillStyle = '#64748b';
  ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('승객은 기내 통로를 따라 줄을 서고,', cabinX + 28, AIRPLANE_AISLE_Y - 8);
  ctx.fillText('짐 적재와 좌석 비켜주기가 row 단위 병목을 만듭니다.', cabinX + 28, AIRPLANE_AISLE_Y + 14);
  ctx.restore();
}

function drawScenarioGridScene(ctx: CanvasRenderingContext2D, state: SimulationState, snapshot: SimulationSnapshot) {
  ctx.save();
  fillRoundedRect(ctx, 44, 250, 1272, 500, 36, '#121826');
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 2;
  roundRect(ctx, 44, 250, 1272, 500, 36);
  ctx.stroke();

  if (snapshot.modelId === 'ward') {
    drawWardBackdrop(ctx);
  } else if (snapshot.modelId === 'evcharging') {
    drawEvChargingBackdrop(ctx);
  } else if (snapshot.modelId === 'amr') {
    drawAmrBackdrop(ctx);
  }

  state.stages.forEach((stage) => {
    const panel = stage.panel;
    fillRoundedRect(ctx, panel.x - 32, panel.y + 142, panel.width + 280, 292, 28, '#1a2031');
    ctx.fillStyle = '#dbe4ff';
    ctx.font = '700 18px "Space Grotesk", sans-serif';
    ctx.fillText(stage.spec.label, panel.x - 12, panel.y + 176);
    ctx.fillStyle = '#7c8aa8';
    ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(stage.spec.description, panel.x - 12, panel.y + 198);
    stage.servers.forEach((server) => drawGridServerCell(ctx, server.pos.x, server.pos.y, stage.spec.color));
  });
  ctx.restore();
}

function drawGenericBackdrop(ctx: CanvasRenderingContext2D, state: SimulationState) {
  ctx.save();
  ctx.fillStyle = 'rgba(112, 91, 73, 0.06)';
  state.stages.forEach((stage) => {
    roundRect(ctx, stage.panel.x - 26, 210, stage.panel.width + 52, 430, 32);
    ctx.fill();
  });
  ctx.restore();
}

function drawCafeteriaBackdrop(ctx: CanvasRenderingContext2D, state: SimulationState) {
  ctx.save();
  ctx.fillStyle = '#f8efe3';
  ctx.fillRect(48, 214, 1240, 470);

  fillRoundedRect(ctx, 170, 238, 220, 336, 30, '#eef5ff');
  fillRoundedRect(ctx, 540, 238, 240, 336, 30, '#fff1e6');
  fillRoundedRect(ctx, 872, 220, 352, 372, 34, '#e9fbf8');

  linePositions(326, 282, 5, 56, 'vertical').forEach((pos) => drawKiosk(ctx, pos.x, pos.y));
  fillRoundedRect(ctx, 604, 258, 122, 254, 24, '#ffb88f');
  linePositions(986, 280, 8, 92, 'horizontal').slice(0, 4).forEach((pos, index) => {
    drawTable(ctx, pos.x, 314 + Math.floor(index / 2) * 146);
  });
  linePositions(986, 280, 8, 92, 'horizontal').slice(0, 4).forEach((pos, index) => {
    drawTable(ctx, pos.x, 458 + Math.floor(index / 2) * 146);
  });
  ctx.restore();
}

function drawAirportBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.save();
  fillRoundedRect(ctx, 64, 220, 304, 420, 32, '#eef5ff');
  fillRoundedRect(ctx, 462, 220, 420, 420, 32, '#fff5e8');
  fillRoundedRect(ctx, 972, 220, 248, 420, 32, '#f7eef7');

  linePositions(324, 284, 5, 64, 'vertical').forEach((pos) => drawDesk(ctx, pos.x, pos.y, '#2878b5'));
  linePositions(612, 330, 4, 90, 'horizontal').forEach((pos) => {
    fillRoundedRect(ctx, pos.x - 24, pos.y - 84, 48, 168, 16, '#ffcf9f');
    ctx.strokeStyle = 'rgba(111, 72, 43, 0.24)';
    ctx.strokeRect(pos.x - 10, pos.y - 74, 20, 148);
  });
  gridPositions(1056, 298, 4, 2, 92, 116).forEach((pos) => drawScannerBooth(ctx, pos.x, pos.y, '#bc5090'));
  ctx.restore();
}

function drawAirplaneBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.save();
  fillRoundedRect(ctx, 410, 196, 820, 428, 160, '#f1f5f9');
  fillRoundedRect(ctx, 470, 222, 700, 376, 120, '#ffffff');
  fillRoundedRect(ctx, 562, 250, 42, 316, 18, '#e2e8f0');
  fillRoundedRect(ctx, 350, 350, 78, 116, 24, '#dbeafe');
  fillRoundedRect(ctx, 620, 232, 560, 18, 8, '#cbd5e1');
  fillRoundedRect(ctx, 620, 568, 560, 18, 8, '#cbd5e1');
  fillRoundedRect(ctx, 680, 266, 106, 30, 10, '#fbbf24');
  fillRoundedRect(ctx, 680, 524, 106, 30, 10, '#fbbf24');
  aircraftSeatPositions(36).forEach((seat) => drawSeat(ctx, seat.x, seat.y, '#6366f1'));
  ctx.restore();
}

function drawHospitalBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.save();
  fillRoundedRect(ctx, 72, 224, 298, 404, 30, '#e7f9f6');
  fillRoundedRect(ctx, 474, 224, 444, 404, 30, '#eef5ff');
  fillRoundedRect(ctx, 990, 260, 196, 344, 30, '#fff0df');
  linePositions(304, 300, 4, 72, 'vertical').forEach((pos) => drawDesk(ctx, pos.x, pos.y, '#0f766e'));
  gridPositions(756, 286, 6, 3, 110, 120).forEach((pos) => drawBed(ctx, pos.x, pos.y, '#2563eb'));
  linePositions(1128, 338, 4, 76, 'vertical').forEach((pos) => drawDesk(ctx, pos.x, pos.y, '#f97316'));
  ctx.restore();
}

function drawCallcenterBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.save();
  fillRoundedRect(ctx, 62, 224, 320, 404, 30, '#eef2f7');
  fillRoundedRect(ctx, 846, 214, 322, 198, 30, '#ecfdf3');
  fillRoundedRect(ctx, 846, 440, 322, 198, 30, '#fff1f2');
  linePositions(306, 290, 4, 76, 'vertical').forEach((pos) => drawDesk(ctx, pos.x, pos.y, '#64748b'));
  gridPositions(928, 270, 8, 4, 64, 70).forEach((pos) => drawOperatorDesk(ctx, pos.x, pos.y, '#22c55e'));
  gridPositions(928, 496, 6, 3, 72, 74).forEach((pos) => drawOperatorDesk(ctx, pos.x, pos.y, '#ef4444'));
  ctx.restore();
}

function drawLogisticsBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.save();
  fillRoundedRect(ctx, 64, 248, 280, 360, 28, '#eaf4ff');
  fillRoundedRect(ctx, 430, 320, 474, 156, 34, '#fff3d7');
  fillRoundedRect(ctx, 984, 248, 236, 360, 28, '#e8faf2');
  linePositions(308, 294, 4, 72, 'vertical').forEach((pos) => drawDock(ctx, pos.x, pos.y));
  drawConveyor(ctx, 466, 360, 400, 80);
  linePositions(1120, 292, 4, 72, 'vertical').forEach((pos) => drawGateBooth(ctx, pos.x, pos.y, '#10b981'));
  ctx.restore();
}

function drawMallBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.save();
  fillRoundedRect(ctx, 66, 226, 300, 404, 30, '#f5f5f4');
  fillRoundedRect(ctx, 856, 220, 300, 186, 30, '#ecfdf3');
  fillRoundedRect(ctx, 856, 432, 300, 198, 30, '#eef5ff');
  linePositions(300, 278, 4, 74, 'vertical').forEach((pos) => drawShelf(ctx, pos.x, pos.y));
  linePositions(1040, 286, 4, 76, 'vertical').forEach((pos) => drawCheckout(ctx, pos.x, pos.y, '#22c55e'));
  linePositions(1040, 492, 5, 76, 'vertical').forEach((pos) => drawCheckout(ctx, pos.x, pos.y, '#2563eb'));
  ctx.restore();
}

function drawThemeparkBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.save();
  fillRoundedRect(ctx, 72, 230, 580, 398, 30, '#fff4f6');
  fillRoundedRect(ctx, 902, 276, 270, 270, 36, '#fff0c7');
  drawSerpentineQueue(ctx, 170, 286, 380, 264);
  linePositions(1000, 410, 6, 48, 'horizontal').forEach((pos) => drawRideSeat(ctx, pos.x, pos.y));
  ctx.restore();
}

function drawBaggageBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.save();
  fillRoundedRect(ctx, 68, 224, 306, 404, 30, '#eff3f8');
  drawCarousel(ctx, 930, 302, 196, 94, '#0ea5e9');
  drawCarousel(ctx, 930, 576, 196, 94, '#f59e0b');
  linePositions(308, 300, 4, 72, 'vertical').forEach((pos) => drawDesk(ctx, pos.x, pos.y, '#64748b'));
  ctx.restore();
}

function drawEvChargingBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.save();
  fillRoundedRect(ctx, 92, 240, 1140, 348, 32, '#eff6ff');
  for (let x = 756; x <= 1092; x += 112) {
    for (let y = 234; y <= 546; y += 104) {
      drawParkingBay(ctx, x, y);
    }
  }
  ctx.restore();
}

function drawPortBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(56, 236, 250, 390);
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(306, 236, 922, 390);
  drawShip(ctx, 90, 452);
  gridPositions(610, 300, 12, 3, 94, 74).forEach((pos) => drawContainer(ctx, pos.x, pos.y));
  linePositions(1120, 300, 4, 76, 'vertical').forEach((pos) => drawGateBooth(ctx, pos.x, pos.y, '#f97316'));
  ctx.restore();
}

function drawWardBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.save();
  fillRoundedRect(ctx, 76, 236, 438, 384, 30, '#fee2e2');
  fillRoundedRect(ctx, 810, 236, 448, 384, 30, '#dbeafe');
  gridPositions(244, 292, 6, 2, 120, 104).forEach((pos) => drawBed(ctx, pos.x, pos.y, '#dc2626'));
  gridPositions(932, 282, 8, 3, 104, 92).forEach((pos) => drawBed(ctx, pos.x, pos.y, '#2563eb'));
  ctx.restore();
}

function drawAmrBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.save();
  fillRoundedRect(ctx, 66, 224, 1220, 404, 30, '#f8fafc');
  drawWarehouseGrid(ctx, 120, 268, 1110, 314);
  fillRoundedRect(ctx, 552, 348, 116, 116, 20, '#334155');
  fillRoundedRect(ctx, 924, 254, 232, 144, 26, '#ccfbf1');
  fillRoundedRect(ctx, 924, 486, 232, 144, 26, '#ffedd5');
  ctx.restore();
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
) {
  ctx.save();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.restore();
}

function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  fillRoundedRect(ctx, x - 26, y - 18, 52, 36, 12, color);
  fillRoundedRect(ctx, x - 12, y - 30, 24, 10, 4, '#f8fafc');
}

function drawOperatorDesk(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  drawDesk(ctx, x, y, color);
  ctx.save();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 24, 10, Math.PI * 0.15, Math.PI * 0.9);
  ctx.stroke();
  ctx.restore();
}

function drawScannerBooth(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  fillRoundedRect(ctx, x - 34, y - 44, 68, 88, 18, `${color}22`);
  fillRoundedRect(ctx, x - 20, y - 30, 40, 60, 12, color);
}

function drawKiosk(ctx: CanvasRenderingContext2D, x: number, y: number) {
  fillRoundedRect(ctx, x - 24, y - 30, 48, 60, 14, '#4f8cff');
  fillRoundedRect(ctx, x - 12, y - 16, 24, 16, 4, '#eff6ff');
}

function drawTable(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#1fbba6';
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fill();
  ['#0f766e', '#0f766e', '#0f766e', '#0f766e'].forEach((fill, index) => {
    const angle = (Math.PI / 2) * index;
    fillRoundedRect(ctx, x + Math.cos(angle) * 34 - 10, y + Math.sin(angle) * 34 - 10, 20, 20, 8, fill);
  });
  ctx.restore();
}

function drawSeat(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  fillRoundedRect(ctx, x - 18, y - 16, 36, 32, 10, `${color}33`);
  fillRoundedRect(ctx, x - 16, y - 14, 32, 12, 6, color);
  fillRoundedRect(ctx, x - 10, y + 2, 20, 12, 6, shadeColor(color, -20));
}

function drawBed(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  fillRoundedRect(ctx, x - 36, y - 18, 72, 36, 14, `${color}22`);
  fillRoundedRect(ctx, x - 32, y - 14, 52, 28, 10, '#ffffff');
  fillRoundedRect(ctx, x + 22, y - 14, 10, 28, 4, color);
}

function drawDock(ctx: CanvasRenderingContext2D, x: number, y: number) {
  fillRoundedRect(ctx, x - 26, y - 36, 52, 72, 16, '#0ea5e9');
  fillRoundedRect(ctx, x - 18, y - 28, 36, 48, 8, '#f8fafc');
}

function drawConveyor(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  fillRoundedRect(ctx, x, y, width, height, 34, '#f59e0b33');
  fillRoundedRect(ctx, x + 16, y + 28, width - 32, height - 56, 24, '#f59e0b');
  ctx.save();
  ctx.strokeStyle = '#fff7ed';
  ctx.lineWidth = 4;
  for (let lane = x + 52; lane < x + width - 20; lane += 64) {
    ctx.beginPath();
    ctx.moveTo(lane, y + 16);
    ctx.lineTo(lane - 24, y + height - 16);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGateBooth(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  fillRoundedRect(ctx, x - 24, y - 30, 48, 60, 14, color);
  fillRoundedRect(ctx, x - 18, y - 18, 36, 20, 8, '#fff7ed');
}

function drawShelf(ctx: CanvasRenderingContext2D, x: number, y: number) {
  fillRoundedRect(ctx, x - 26, y - 32, 52, 64, 12, '#78716c');
  fillRoundedRect(ctx, x - 20, y - 24, 40, 8, 4, '#e7e5e4');
  fillRoundedRect(ctx, x - 20, y - 2, 40, 8, 4, '#e7e5e4');
  fillRoundedRect(ctx, x - 20, y + 20, 40, 8, 4, '#e7e5e4');
}

function drawCheckout(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  fillRoundedRect(ctx, x - 32, y - 26, 64, 52, 14, `${color}22`);
  fillRoundedRect(ctx, x - 26, y - 20, 52, 40, 12, color);
  fillRoundedRect(ctx, x - 10, y - 34, 20, 10, 4, '#f8fafc');
}

function drawSerpentineQueue(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.save();
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 8;
  const lanes = 5;
  const gap = height / lanes;
  for (let lane = 0; lane < lanes; lane += 1) {
    const top = y + lane * gap;
    ctx.beginPath();
    if (lane % 2 === 0) {
      ctx.moveTo(x, top);
      ctx.lineTo(x + width, top);
    } else {
      ctx.moveTo(x + width, top);
      ctx.lineTo(x, top);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawRideSeat(ctx: CanvasRenderingContext2D, x: number, y: number) {
  fillRoundedRect(ctx, x - 20, y - 22, 40, 44, 14, '#db2777');
  fillRoundedRect(ctx, x - 12, y - 14, 24, 20, 8, '#fff1f2');
}

function drawCarousel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
  ctx.save();
  ctx.strokeStyle = `${color}88`;
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(x, y, width / 2 - 12, height / 2 - 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawParkingBay(ctx: CanvasRenderingContext2D, x: number, y: number) {
  fillRoundedRect(ctx, x, y, 84, 56, 14, '#ffffff');
  fillRoundedRect(ctx, x + 60, y + 10, 12, 36, 6, '#16a34a');
}

function drawGridSeatCell(ctx: CanvasRenderingContext2D, x: number, y: number) {
  fillRoundedRect(ctx, x - 18, y - 18, 36, 36, 10, '#2a3144');
  fillRoundedRect(ctx, x - 16, y - 16, 32, 32, 8, '#313a52');
}

function drawGridServerCell(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  fillRoundedRect(ctx, x - 18, y - 18, 36, 36, 10, '#232a3e');
  fillRoundedRect(ctx, x - 16, y - 16, 32, 32, 8, `${color}30`);
  ctx.strokeStyle = `${color}88`;
  ctx.lineWidth = 2;
  roundRect(ctx, x - 16, y - 16, 32, 32, 8);
  ctx.stroke();
}

function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number) {
  fillRoundedRect(ctx, x, y, 180, 46, 18, '#2563eb');
  fillRoundedRect(ctx, x + 22, y - 48, 82, 40, 12, '#93c5fd');
}

function drawContainer(ctx: CanvasRenderingContext2D, x: number, y: number) {
  fillRoundedRect(ctx, x - 34, y - 22, 68, 44, 10, '#84cc16');
  ctx.save();
  ctx.strokeStyle = '#eaffbf';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 28, y - 16, 56, 32);
  ctx.restore();
}

function drawWarehouseGrid(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.14)';
  ctx.lineWidth = 2;
  for (let lane = x; lane <= x + width; lane += 56) {
    ctx.beginPath();
    ctx.moveTo(lane, y);
    ctx.lineTo(lane, y + height);
    ctx.stroke();
  }
  for (let lane = y; lane <= y + height; lane += 52) {
    ctx.beginPath();
    ctx.moveTo(x, lane);
    ctx.lineTo(x + width, lane);
    ctx.stroke();
  }
  ctx.restore();
}

function getAgentColor(state: SimulationState, agent: Agent, emphasizeDining: boolean) {
  if (agent.phase === 'orbit') {
    return '#6366f1';
  }

  if (agent.phase === 'thinking') {
    return '#16a34a';
  }

  if (agent.phase === 'exiting' || agent.stageIndex == null) {
    return '#7b8aa8';
  }

  const stage = state.stages[agent.stageIndex];
  if (agent.phase === 'service' || agent.phase === 'settled') {
    return shadeColor(stage.spec.color, emphasizeDining && stage.spec.id === 'dining' ? -26 : -18);
  }
  return stage.spec.color;
}

function buildSceneRuntime(controls: SimulationControls) {
  const model = getModelDefinition(controls.modelId);
  const definitions = model.buildStages(controls);
  const sceneBuild = getSceneRuntimeBuild(controls, definitions);
  const stages = definitions.map((definition, index) => {
    const placement = sceneBuild.placements[index] ?? createGenericPlacement(index, definitions.length);
    const serverPositions = placement.serverPositions ?? getServerPositions(placement.panel, definition.serverCount);

    return {
      spec: definition,
      queue: [],
      servers: serverPositions.map((pos, serverIndex) => ({
        id: serverIndex,
        pos,
        agentId: null,
      })),
      panel: placement.panel,
      queueAnchor: placement.queueAnchor,
      queueLayout: placement.queueLayout ?? DEFAULT_QUEUE_LAYOUT,
      serviceTargetFallback:
        placement.serviceTargetFallback ??
        serverPositions[0] ?? { x: placement.panel.x + placement.panel.width - 36, y: placement.panel.y + placement.panel.height / 2 },
    };
  });

  return {
    scene: sceneBuild.scene,
    stages,
  };
}

function getServerPositions(panel: StageRuntime['panel'], count: number) {
  const x = panel.x + panel.width - 72;
  const top = panel.y + 120;
  const bottom = panel.y + panel.height - 86;
  const step = count <= 1 ? 0 : (bottom - top) / (count - 1);

  return Array.from({ length: count }, (_, index) => ({
    x,
    y: top + step * index,
  }));
}

function getSceneRuntimeBuild(controls: SimulationControls, definitions: StageDefinition[]): SceneRuntimeBuild {
  switch (controls.modelId) {
    case 'cafeteria':
      return buildCafeteriaScene(definitions);
    case 'airport':
      return buildAirportScene(definitions);
    case 'airplane':
      return buildAirplaneScene(definitions);
    case 'hospital':
      return buildHospitalScene(definitions);
    case 'callcenter':
      return buildCallcenterScene(definitions);
    case 'logistics':
      return buildLogisticsScene(definitions);
    case 'mall':
      return buildMallScene(definitions);
    case 'themepark':
      return buildThemeparkScene(definitions);
    case 'baggage':
      return buildBaggageScene(definitions);
    case 'evcharging':
      return buildEvChargingScene(definitions);
    case 'port':
      return buildPortScene(definitions);
    case 'ward':
      return buildWardScene(definitions);
    case 'amr':
      return buildAmrScene(definitions);
    default:
      return buildGenericScene(definitions, controls.modelId);
  }
}

function buildGenericScene(definitions: StageDefinition[], modelId: QueueingModelId): SceneRuntimeBuild {
  const stageCount = definitions.length;
  const zoneWidth = 980 / Math.max(stageCount, 1);
  const placements: StagePlacement[] = definitions.map((_, index) => {
    const left = 200 + zoneWidth * index;
    const centerX = left + zoneWidth / 2;
    return {
      panel: createCard(centerX - 96, 78, 192, 118),
      queueAnchor: { x: centerX, y: 560 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -34 },
      serviceTargetFallback: { x: centerX + 56, y: 350 },
    };
  });

  const flows: FlowPath[] = [];
  if (placements.length > 0) {
    flows.push({ from: ENTRY_POINT, to: placements[0].queueAnchor });
    for (let index = 0; index < placements.length - 1; index += 1) {
      flows.push({
        from: placements[index].serviceTargetFallback ?? placements[index].queueAnchor,
        to: placements[index + 1].queueAnchor,
      });
    }
    flows.push({
      from: placements[placements.length - 1].serviceTargetFallback ?? placements[placements.length - 1].queueAnchor,
      to: EXIT_POINT,
    });
  }

  return {
    scene: buildScene(modelId, flows),
    placements,
  };
}

function buildCafeteriaScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const placements: StagePlacement[] = [
    {
      panel: createCard(116, 72, 190, 118),
      queueAnchor: { x: 248, y: 580 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -34 },
      serverPositions: linePositions(338, 292, definitions[0]?.serverCount ?? 1, 74, 'vertical'),
      serviceTargetFallback: { x: 338, y: 402 },
    },
    {
      panel: createCard(486, 72, 190, 118),
      queueAnchor: { x: 620, y: 580 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -34 },
      serverPositions: linePositions(710, 286, definitions[1]?.serverCount ?? 1, 74, 'vertical'),
      serviceTargetFallback: { x: 710, y: 402 },
    },
    {
      panel: createCard(910, 72, 210, 118),
      queueAnchor: { x: 954, y: 594 },
      queueLayout: { kind: 'grid', rows: 5, stepX: -34, stepY: -34 },
      serverPositions: gridPositions(970, 248, definitions[2]?.serverCount ?? 1, 4, 74, 74),
      serviceTargetFallback: { x: 1060, y: 430 },
    },
  ];

  return {
    scene: buildScene('cafeteria', [
      { from: ENTRY_POINT, to: placements[0].queueAnchor },
      { from: { x: 360, y: 402 }, to: placements[1].queueAnchor },
      { from: { x: 734, y: 402 }, to: placements[2].queueAnchor },
      { from: { x: 1144, y: 430 }, to: EXIT_POINT },
    ]),
    placements,
  };
}

function buildAirportScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const placements: StagePlacement[] = [
    {
      panel: createCard(110, 72, 188, 118),
      queueAnchor: { x: 240, y: 604 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -34 },
      serverPositions: linePositions(332, 302, definitions[0]?.serverCount ?? 1, 68, 'vertical'),
      serviceTargetFallback: { x: 332, y: 410 },
    },
    {
      panel: createCard(470, 72, 188, 118),
      queueAnchor: { x: 646, y: 646 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -32 },
      serverPositions: linePositions(656, 348, definitions[1]?.serverCount ?? 1, 96, 'horizontal'),
      serviceTargetFallback: { x: 776, y: 348 },
    },
    {
      panel: createCard(976, 72, 204, 118),
      queueAnchor: { x: 1048, y: 570 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -34 },
      serverPositions: gridPositions(1060, 286, definitions[2]?.serverCount ?? 1, 2, 86, 92),
      serviceTargetFallback: { x: 1130, y: 410 },
    },
  ];

  return {
    scene: buildScene('airport', [
      { from: ENTRY_POINT, to: placements[0].queueAnchor },
      { from: { x: 356, y: 410 }, to: placements[1].queueAnchor, via: { x: 500, y: 520 } },
      { from: { x: 824, y: 348 }, to: placements[2].queueAnchor, via: { x: 930, y: 470 } },
      { from: { x: 1164, y: 410 }, to: EXIT_POINT },
    ]),
    placements,
  };
}

function buildAirplaneScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const seatPositions = aircraftSeatPositions(definitions[3]?.serverCount ?? 60);
  const firstSeatX = seatPositions[0]?.x ?? 404;
  const entryPoint = { x: 92, y: 442 };
  const placements: StagePlacement[] = [
    {
      panel: createCard(88, 112, 170, 108),
      queueAnchor: { x: 128, y: entryPoint.y },
      queueLayout: { kind: 'line', stepX: 16, stepY: 0 },
      serverPositions: linePositions(184, AIRPLANE_AISLE_Y, definitions[0]?.serverCount ?? 1, 28, 'horizontal'),
      serviceTargetFallback: { x: 214, y: AIRPLANE_AISLE_Y },
    },
    {
      panel: createCard(294, 112, 170, 108),
      queueAnchor: { x: 252, y: AIRPLANE_AISLE_Y },
      queueLayout: { kind: 'line', stepX: 18, stepY: 0 },
      serverPositions: linePositions(Math.max(308, firstSeatX - 76), AIRPLANE_AISLE_Y, definitions[1]?.serverCount ?? 1, 32, 'horizontal'),
      serviceTargetFallback: { x: Math.max(336, firstSeatX - 52), y: AIRPLANE_AISLE_Y },
    },
    {
      panel: createCard(544, 112, 170, 108),
      queueAnchor: { x: Math.max(340, firstSeatX - 30), y: AIRPLANE_AISLE_Y },
      queueLayout: { kind: 'line', stepX: 14, stepY: 0 },
      serverPositions: [{ x: firstSeatX + 40, y: AIRPLANE_AISLE_Y }],
      serviceTargetFallback: { x: firstSeatX + 40, y: AIRPLANE_AISLE_Y },
    },
    {
      panel: createCard(980, 112, 184, 108),
      queueAnchor: { x: firstSeatX + 8, y: AIRPLANE_AISLE_Y },
      queueLayout: { kind: 'line', stepX: 12, stepY: 0 },
      serverPositions: seatPositions,
      serviceTargetFallback: { x: firstSeatX + 12, y: AIRPLANE_AISLE_Y },
    },
  ];

  return {
    scene: {
      modelId: 'airplane',
      points: {
        entry: entryPoint,
        exit: { ...EXIT_POINT },
        orbit: { ...ORBIT_POINT },
        think: { ...THINK_POINT },
      },
      flows: [
        { from: entryPoint, to: placements[0].queueAnchor },
        { from: { x: 220, y: AIRPLANE_AISLE_Y }, to: placements[1].queueAnchor },
        { from: { x: Math.max(340, firstSeatX - 56), y: AIRPLANE_AISLE_Y }, to: placements[2].queueAnchor },
        { from: { x: firstSeatX + 72, y: AIRPLANE_AISLE_Y }, to: placements[3].queueAnchor },
      ],
    },
    placements,
  };
}

function buildHospitalScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const placements: StagePlacement[] = [
    {
      panel: createCard(116, 72, 182, 118),
      queueAnchor: { x: 232, y: 584 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -32 },
      serverPositions: linePositions(316, 320, definitions[0]?.serverCount ?? 1, 64, 'vertical'),
      serviceTargetFallback: { x: 316, y: 410 },
    },
    {
      panel: createCard(564, 72, 188, 118),
      queueAnchor: { x: 650, y: 584 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -32 },
      serverPositions: gridPositions(760, 264, definitions[1]?.serverCount ?? 1, 3, 88, 108),
      serviceTargetFallback: { x: 844, y: 410 },
    },
    {
      panel: createCard(1016, 72, 188, 118),
      queueAnchor: { x: 1060, y: 604 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -32 },
      serverPositions: linePositions(1148, 360, definitions[2]?.serverCount ?? 1, 70, 'vertical'),
      serviceTargetFallback: { x: 1148, y: 430 },
    },
  ];

  return {
    scene: buildScene('hospital', [
      { from: ENTRY_POINT, to: placements[0].queueAnchor },
      { from: { x: 336, y: 410 }, to: placements[1].queueAnchor },
      { from: { x: 880, y: 410 }, to: placements[2].queueAnchor },
      { from: { x: 1168, y: 430 }, to: EXIT_POINT },
    ]),
    placements,
  };
}

function buildCallcenterScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const placements: StagePlacement[] = [
    {
      panel: createCard(112, 82, 180, 112),
      queueAnchor: { x: 224, y: 418 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -28 },
      serverPositions: linePositions(324, 350, definitions[0]?.serverCount ?? 1, 58, 'vertical'),
      serviceTargetFallback: { x: 324, y: 410 },
    },
    {
      panel: createCard(906, 122, 190, 112),
      queueAnchor: { x: 770, y: 304 },
      queueLayout: { kind: 'line', stepX: -32, stepY: 0 },
      serverPositions: gridPositions(932, 254, definitions[1]?.serverCount ?? 1, 4, 62, 72),
      serviceTargetFallback: { x: 1040, y: 320 },
    },
    {
      panel: createCard(906, 506, 190, 112),
      queueAnchor: { x: 770, y: 520 },
      queueLayout: { kind: 'line', stepX: -32, stepY: 0 },
      serverPositions: gridPositions(932, 530, definitions[2]?.serverCount ?? 1, 3, 68, 72),
      serviceTargetFallback: { x: 1032, y: 566 },
    },
  ];

  return {
    scene: buildScene('callcenter', [
      { from: ENTRY_POINT, to: placements[0].queueAnchor },
      { from: { x: 358, y: 350 }, to: placements[1].queueAnchor, via: { x: 588, y: 268 } },
      { from: { x: 358, y: 470 }, to: placements[2].queueAnchor, via: { x: 588, y: 556 } },
      { from: { x: 1098, y: 320 }, to: EXIT_POINT },
      { from: { x: 1098, y: 566 }, to: EXIT_POINT },
    ]),
    placements,
  };
}

function buildLogisticsScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const placements: StagePlacement[] = [
    {
      panel: createCard(114, 72, 188, 118),
      queueAnchor: { x: 234, y: 590 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -34 },
      serverPositions: linePositions(328, 328, definitions[0]?.serverCount ?? 1, 72, 'vertical'),
      serviceTargetFallback: { x: 328, y: 430 },
    },
    {
      panel: createCard(560, 72, 188, 118),
      queueAnchor: { x: 648, y: 612 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -30 },
      serverPositions: linePositions(700, 392, definitions[1]?.serverCount ?? 1, 84, 'horizontal'),
      serviceTargetFallback: { x: 860, y: 392 },
    },
    {
      panel: createCard(1010, 72, 188, 118),
      queueAnchor: { x: 1046, y: 590 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -34 },
      serverPositions: linePositions(1140, 332, definitions[2]?.serverCount ?? 1, 72, 'vertical'),
      serviceTargetFallback: { x: 1140, y: 430 },
    },
  ];

  return {
    scene: buildScene('logistics', [
      { from: ENTRY_POINT, to: placements[0].queueAnchor },
      { from: { x: 352, y: 430 }, to: placements[1].queueAnchor },
      { from: { x: 884, y: 392 }, to: placements[2].queueAnchor },
      { from: { x: 1164, y: 430 }, to: EXIT_POINT },
    ]),
    placements,
  };
}

function buildMallScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const placements: StagePlacement[] = [
    {
      panel: createCard(116, 72, 182, 118),
      queueAnchor: { x: 226, y: 584 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -32 },
      serverPositions: [{ x: 334, y: 410 }],
      serviceTargetFallback: { x: 334, y: 410 },
    },
    {
      panel: createCard(948, 146, 188, 112),
      queueAnchor: { x: 764, y: 284 },
      queueLayout: { kind: 'line', stepX: -34, stepY: 0 },
      serverPositions: linePositions(1048, 320, definitions[1]?.serverCount ?? 1, 74, 'vertical'),
      serviceTargetFallback: { x: 1048, y: 320 },
    },
    {
      panel: createCard(948, 498, 188, 112),
      queueAnchor: { x: 764, y: 536 },
      queueLayout: { kind: 'line', stepX: -34, stepY: 0 },
      serverPositions: linePositions(1048, 560, definitions[2]?.serverCount ?? 1, 74, 'vertical'),
      serviceTargetFallback: { x: 1048, y: 560 },
    },
  ];

  return {
    scene: buildScene('mall', [
      { from: ENTRY_POINT, to: placements[0].queueAnchor },
      { from: { x: 358, y: 410 }, to: placements[1].queueAnchor, via: { x: 610, y: 284 } },
      { from: { x: 358, y: 410 }, to: placements[2].queueAnchor, via: { x: 610, y: 536 } },
      { from: { x: 1076, y: 320 }, to: EXIT_POINT },
      { from: { x: 1076, y: 560 }, to: EXIT_POINT },
    ]),
    placements,
  };
}

function buildThemeparkScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const placements: StagePlacement[] = [
    {
      panel: createCard(98, 72, 208, 118),
      queueAnchor: { x: 402, y: 612 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -28 },
      serverPositions: linePositions(1030, 410, definitions[0]?.serverCount ?? 1, 72, 'horizontal'),
      serviceTargetFallback: { x: 1030, y: 410 },
    },
  ];

  return {
    scene: buildScene('themepark', [
      { from: ENTRY_POINT, to: placements[0].queueAnchor },
      { from: { x: 1100, y: 410 }, to: EXIT_POINT },
    ]),
    placements,
  };
}

function buildBaggageScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const placements: StagePlacement[] = [
    {
      panel: createCard(112, 78, 186, 112),
      queueAnchor: { x: 224, y: 420 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -30 },
      serverPositions: [{ x: 330, y: 410 }],
      serviceTargetFallback: { x: 330, y: 410 },
    },
    {
      panel: createCard(930, 132, 182, 112),
      queueAnchor: { x: 730, y: 262 },
      queueLayout: { kind: 'line', stepX: -30, stepY: 0 },
      serverPositions: ellipsePositions(930, 302, 150, 64, definitions[1]?.serverCount ?? 1),
      serviceTargetFallback: { x: 930, y: 302 },
    },
    {
      panel: createCard(930, 504, 182, 112),
      queueAnchor: { x: 730, y: 534 },
      queueLayout: { kind: 'line', stepX: -30, stepY: 0 },
      serverPositions: ellipsePositions(930, 576, 150, 64, definitions[2]?.serverCount ?? 1),
      serviceTargetFallback: { x: 930, y: 576 },
    },
  ];

  return {
    scene: buildScene('baggage', [
      { from: ENTRY_POINT, to: placements[0].queueAnchor },
      { from: { x: 356, y: 410 }, to: placements[1].queueAnchor, via: { x: 584, y: 270 } },
      { from: { x: 356, y: 410 }, to: placements[2].queueAnchor, via: { x: 584, y: 548 } },
      { from: { x: 1098, y: 302 }, to: EXIT_POINT },
      { from: { x: 1098, y: 576 }, to: EXIT_POINT },
    ]),
    placements,
  };
}

function buildEvChargingScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const placements: StagePlacement[] = [
    {
      panel: createCard(112, 72, 198, 118),
      queueAnchor: { x: 328, y: 612 },
      queueLayout: { kind: 'line', stepX: 38, stepY: 0 },
      serverPositions: parkingBayPositions(812, 248, definitions[0]?.serverCount ?? 1),
      serviceTargetFallback: { x: 872, y: 410 },
    },
  ];

  return {
    scene: buildScene('evcharging', [
      { from: ENTRY_POINT, to: placements[0].queueAnchor },
      { from: { x: 1140, y: 410 }, to: EXIT_POINT },
    ]),
    placements,
  };
}

function buildPortScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const placements: StagePlacement[] = [
    {
      panel: createCard(104, 72, 190, 118),
      queueAnchor: { x: 216, y: 588 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -32 },
      serverPositions: linePositions(308, 286, definitions[0]?.serverCount ?? 1, 84, 'vertical'),
      serviceTargetFallback: { x: 308, y: 410 },
    },
    {
      panel: createCard(560, 72, 188, 118),
      queueAnchor: { x: 646, y: 590 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -30 },
      serverPositions: gridPositions(650, 292, definitions[1]?.serverCount ?? 1, 3, 94, 88),
      serviceTargetFallback: { x: 738, y: 410 },
    },
    {
      panel: createCard(1010, 72, 186, 118),
      queueAnchor: { x: 1040, y: 590 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -32 },
      serverPositions: linePositions(1130, 300, definitions[2]?.serverCount ?? 1, 74, 'vertical'),
      serviceTargetFallback: { x: 1130, y: 410 },
    },
  ];

  return {
    scene: buildScene('port', [
      { from: ENTRY_POINT, to: placements[0].queueAnchor },
      { from: { x: 332, y: 410 }, to: placements[1].queueAnchor },
      { from: { x: 764, y: 410 }, to: placements[2].queueAnchor },
      { from: { x: 1154, y: 410 }, to: EXIT_POINT },
    ]),
    placements,
  };
}

function buildWardScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const placements: StagePlacement[] = [
    {
      panel: createCard(118, 72, 196, 118),
      queueAnchor: { x: 232, y: 586 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -30 },
      serverPositions: gridPositions(280, 276, definitions[0]?.serverCount ?? 1, 2, 94, 94),
      serviceTargetFallback: { x: 364, y: 410 },
    },
    {
      panel: createCard(934, 72, 196, 118),
      queueAnchor: { x: 954, y: 586 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -30 },
      serverPositions: gridPositions(914, 252, definitions[1]?.serverCount ?? 1, 3, 96, 88),
      serviceTargetFallback: { x: 1010, y: 410 },
    },
  ];

  return {
    scene: buildScene('ward', [
      { from: ENTRY_POINT, to: placements[0].queueAnchor },
      { from: { x: 392, y: 410 }, to: placements[1].queueAnchor, via: { x: 658, y: 410 } },
      { from: { x: 1128, y: 410 }, to: EXIT_POINT },
    ]),
    placements,
  };
}

function buildAmrScene(definitions: StageDefinition[]): SceneRuntimeBuild {
  const placements: StagePlacement[] = [
    {
      panel: createCard(490, 74, 186, 112),
      queueAnchor: { x: 476, y: 590 },
      queueLayout: { kind: 'line', stepX: 0, stepY: -28 },
      serverPositions: gridPositions(576, 350, definitions[0]?.serverCount ?? 1, 2, 34, 34),
      serviceTargetFallback: { x: 610, y: 410 },
    },
    {
      panel: createCard(968, 150, 180, 112),
      queueAnchor: { x: 804, y: 286 },
      queueLayout: { kind: 'line', stepX: -30, stepY: 0 },
      serverPositions: gridPositions(960, 286, definitions[1]?.serverCount ?? 1, 3, 60, 60),
      serviceTargetFallback: { x: 1040, y: 330 },
    },
    {
      panel: createCard(968, 500, 180, 112),
      queueAnchor: { x: 804, y: 536 },
      queueLayout: { kind: 'line', stepX: -30, stepY: 0 },
      serverPositions: gridPositions(960, 534, definitions[2]?.serverCount ?? 1, 3, 60, 60),
      serviceTargetFallback: { x: 1040, y: 566 },
    },
  ];

  return {
    scene: buildScene('amr', [
      { from: ENTRY_POINT, to: placements[0].queueAnchor },
      { from: { x: 626, y: 344 }, to: placements[1].queueAnchor, via: { x: 754, y: 308 } },
      { from: { x: 626, y: 476 }, to: placements[2].queueAnchor, via: { x: 754, y: 544 } },
      { from: { x: 1124, y: 330 }, to: EXIT_POINT },
      { from: { x: 1124, y: 566 }, to: EXIT_POINT },
    ]),
    placements,
  };
}

function buildScene(modelId: QueueingModelId, flows: FlowPath[]): SceneLayout {
  return {
    modelId,
    points: {
      entry: { ...ENTRY_POINT },
      exit: { ...EXIT_POINT },
      orbit: { ...ORBIT_POINT },
      think: { ...THINK_POINT },
    },
    flows,
  };
}

function createGenericPlacement(index: number, total: number): StagePlacement {
  const zoneWidth = 980 / Math.max(total, 1);
  const left = 200 + zoneWidth * index;
  const centerX = left + zoneWidth / 2;
  return {
    panel: createCard(centerX - 96, 78, 192, 118),
    queueAnchor: { x: centerX, y: 560 },
    queueLayout: { kind: 'line', stepX: 0, stepY: -34 },
    serviceTargetFallback: { x: centerX + 56, y: 350 },
  };
}

function createCard(x: number, y: number, width: number, height: number) {
  return { x, y, width, height };
}

function linePositions(x: number, y: number, count: number, gap: number, axis: 'vertical' | 'horizontal') {
  return Array.from({ length: Math.max(count, 1) }, (_, index) => ({
    x: axis === 'vertical' ? x : x + gap * index,
    y: axis === 'vertical' ? y + gap * index : y,
  }));
}

function gridPositions(x: number, y: number, count: number, cols: number, gapX: number, gapY: number) {
  return Array.from({ length: Math.max(count, 1) }, (_, index) => ({
    x: x + (index % cols) * gapX,
    y: y + Math.floor(index / cols) * gapY,
  }));
}

function ellipsePositions(cx: number, cy: number, rx: number, ry: number, count: number) {
  return Array.from({ length: Math.max(count, 1) }, (_, index) => {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / Math.max(count, 1);
    return {
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    };
  });
}

function parkingBayPositions(startX: number, startY: number, count: number) {
  return Array.from({ length: Math.max(count, 1) }, (_, index) => ({
    x: startX + (index % 4) * 112,
    y: startY + Math.floor(index / 4) * 104,
  }));
}

function aircraftSeatPositions(count: number) {
  const seatBands = [268, 318, 368, 452, 502, 552];
  return Array.from({ length: Math.max(count, 1) }, (_, index) => {
    const row = Math.floor(index / seatBands.length);
    const seat = index % seatBands.length;
    return {
      x: 404 + row * 20,
      y: seatBands[seat],
    };
  });
}

function buildAirplaneManifest(controls: SimulationControls) {
  const rowCount = Math.max(10, controls.tertiaryServerCount);
  const seatIds = Array.from({ length: rowCount * 6 }, (_, index) => index);

  if (controls.boardingStrategy === 'random') {
    return shuffleSeatIds(seatIds);
  }

  if (controls.boardingStrategy === 'backToFront') {
    return [...seatIds].sort((left, right) => {
      const leftMeta = getAircraftSeatMeta(left);
      const rightMeta = getAircraftSeatMeta(right);
      if (leftMeta.row !== rightMeta.row) {
        return rightMeta.row - leftMeta.row;
      }
      return Math.random() - 0.5;
    });
  }

  if (controls.boardingStrategy === 'wilma') {
    const seatPriority = { window: 0, middle: 1, aisle: 2 } as const;
    return [...seatIds].sort((left, right) => {
      const leftMeta = getAircraftSeatMeta(left);
      const rightMeta = getAircraftSeatMeta(right);
      const seatDelta = seatPriority[leftMeta.type] - seatPriority[rightMeta.type];
      if (seatDelta !== 0) {
        return seatDelta;
      }
      return rightMeta.row - leftMeta.row;
    });
  }

  if (controls.boardingStrategy === 'zone') {
    const zoneSize = Math.max(1, Math.ceil(rowCount / 4));
    return [...seatIds].sort((left, right) => {
      const leftMeta = getAircraftSeatMeta(left);
      const rightMeta = getAircraftSeatMeta(right);
      const leftZone = Math.floor((rowCount - 1 - leftMeta.row) / zoneSize);
      const rightZone = Math.floor((rowCount - 1 - rightMeta.row) / zoneSize);
      if (leftZone !== rightZone) {
        return leftZone - rightZone;
      }
      return rightMeta.row - leftMeta.row;
    });
  }

  const seatPriority = { window: 0, middle: 1, aisle: 2 } as const;
  return [...seatIds].sort((left, right) => {
    const leftMeta = getAircraftSeatMeta(left);
    const rightMeta = getAircraftSeatMeta(right);
    const seatDelta = seatPriority[leftMeta.type] - seatPriority[rightMeta.type];
    if (seatDelta !== 0) {
      return seatDelta;
    }
    if (leftMeta.parity !== rightMeta.parity) {
      return leftMeta.parity === 'odd' ? -1 : 1;
    }
    return rightMeta.row - leftMeta.row;
  });
}

function shuffleSeatIds(seatIds: number[]) {
  const copy = [...seatIds];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function getAircraftSeatMeta(seatId: number) {
  const row = Math.floor(seatId / 6);
  const seat = seatId % 6;
  const type: 'window' | 'middle' | 'aisle' = seat === 0 || seat === 5 ? 'window' : seat === 1 || seat === 4 ? 'middle' : 'aisle';
  const side: 'left' | 'right' = seat <= 2 ? 'left' : 'right';
  return {
    row,
    seat,
    type,
    side,
    parity: (row + 1) % 2 === 0 ? 'even' as const : 'odd' as const,
  };
}

function syncModelRuntime(state: SimulationState, controls: SimulationControls) {
  const currentDefinition = getModelDefinition(state.controls.modelId);
  const nextDefinition = getModelDefinition(controls.modelId);
  const controlsChanged = JSON.stringify(state.controls) !== JSON.stringify(controls);

  if (controlsChanged && currentDefinition.id !== nextDefinition.id) {
    const reset = createSimulationState(controls);
    state.controls = reset.controls;
    state.scene = reset.scene;
    state.stages = reset.stages;
    state.agents = reset.agents;
    state.manifestSeatIds = reset.manifestSeatIds;
    state.currentTime = reset.currentTime;
    state.nextArrivalAt = reset.nextArrivalAt;
    state.nextAgentId = reset.nextAgentId;
    state.stats = reset.stats;
    state.latestSnapshot = reset.latestSnapshot;
    return;
  }

  if (!controlsChanged) {
    return;
  }

  state.controls = controls;
  const rebuiltRuntime = buildSceneRuntime(controls);
  const rebuiltStages = rebuiltRuntime.stages;
  state.scene = rebuiltRuntime.scene;

  rebuiltStages.forEach((rebuiltStage, stageIndex) => {
    const existing = state.stages[stageIndex];
    if (!existing) {
      return;
    }

    existing.spec = rebuiltStage.spec;
    existing.panel = rebuiltStage.panel;
    existing.queueAnchor = rebuiltStage.queueAnchor;
    existing.queueLayout = rebuiltStage.queueLayout;
    existing.serviceTargetFallback = rebuiltStage.serviceTargetFallback;

    while (existing.servers.length < rebuiltStage.servers.length) {
      existing.servers.push({
        id: existing.servers.length,
        pos: rebuiltStage.servers[existing.servers.length].pos,
        agentId: null,
      });
    }

    while (existing.servers.length > rebuiltStage.servers.length) {
      const removed = existing.servers.pop();
      if (removed?.agentId != null) {
        existing.queue.unshift(removed.agentId);
        const agent = getAgent(state, removed.agentId);
        if (agent) {
          agent.phase = 'queue';
          agent.serverId = null;
          agent.serviceEndsAt = null;
          agent.queuedAt = state.currentTime;
        }
      }
    }

    existing.servers.forEach((server, serverIndex) => {
      server.id = serverIndex;
      server.pos = rebuiltStage.servers[serverIndex].pos;
    });
  });

  state.stages = state.stages.slice(0, rebuiltStages.length);
}

function getRemainingSpawnCapacity(state: SimulationState, model: ModelDefinition) {
  const limit = model.spawnLimit?.(state.controls);
  if (limit == null || !Number.isFinite(limit)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, Math.round(limit) - state.stats.spawned);
}

function spawnBatch(state: SimulationState, model: ModelDefinition, remainingCapacity = Number.POSITIVE_INFINITY) {
  const count = Math.min(
    Math.max(1, Math.round(model.batchSize?.(state.controls) ?? 1)),
    Number.isFinite(remainingCapacity) ? Math.max(0, Math.round(remainingCapacity)) : Number.POSITIVE_INFINITY,
  );
  for (let index = 0; index < count; index += 1) {
    spawnAgent(state, model);
  }
}

function spawnAgent(state: SimulationState, model: ModelDefinition) {
  if (model.id === 'airplane' && state.manifestSeatIds.length === 0) {
    return;
  }

  const kind = model.classifyAgent?.(state.controls) ?? (Math.random() * 100 < state.controls.priorityShare ? 'priority' : 'normal');
  const priority: Agent['priority'] = kind === 'priority' ? 'high' : 'normal';
  const reservedServerId = model.id === 'airplane' ? state.manifestSeatIds.shift() ?? null : null;
  const templateAgent: Agent = {
    id: state.nextAgentId,
    stageIndex: null,
    phase: 'queue',
    pos: { x: state.scene.points.entry.x - 8, y: state.scene.points.entry.y },
    vel: { x: 0, y: 0 },
    acc: { x: 0, y: 0 },
    radius: 11,
    maxSpeed: phaseDynamics.queue.speed,
    maxForce: phaseDynamics.queue.force,
    enteredAt: state.currentTime,
    queuedAt: state.currentTime,
    kind,
    priority,
    serviceEndsAt: null,
    remainingServiceSeconds: null,
    retryAt: null,
    serverId: null,
    reservedServerId,
    needsStow: model.id === 'airplane' ? Math.random() * 100 < state.controls.routingProbability : true,
  };
  const initialStageIndex = model.getInitialStageIndex?.(state, templateAgent) ?? 0;
  const firstStage = state.stages[initialStageIndex];
  if (!firstStage) {
    return;
  }

  if (getStageLoad(firstStage) >= firstStage.spec.queueCapacity) {
    if (model.id === 'retrial') {
      createOrbitAgent(state, templateAgent);
    } else {
      state.stats.blocked += 1;
    }
    return;
  }

  if (shouldBalk(state, state.controls, firstStage)) {
    state.stats.balked += 1;
    return;
  }

  const jitter = (Math.random() - 0.5) * 22;
  const agent: Agent = {
    ...templateAgent,
    stageIndex: initialStageIndex,
    pos: { x: state.scene.points.entry.x - 8, y: state.scene.points.entry.y + jitter },
  };

  state.nextAgentId += 1;
  state.stats.spawned += 1;
  state.agents.push(agent);
  enqueueAgent(state, firstStage, agent.id);
}

function createOrbitAgent(state: SimulationState, templateAgent: Agent) {
  const orbitAgent: Agent = {
    ...templateAgent,
    id: state.nextAgentId,
    phase: 'orbit',
    stageIndex: null,
    pos: { x: state.scene.points.entry.x - 10, y: state.scene.points.entry.y + (Math.random() - 0.5) * 18 },
    retryAt: state.currentTime + state.controls.secondaryMeanSeconds,
    needsStow: templateAgent.needsStow,
  };
  state.nextAgentId += 1;
  state.stats.spawned += 1;
  state.stats.blocked += 1;
  state.agents.push(orbitAgent);
}

function resolveDormantAgents(state: SimulationState, model: ModelDefinition) {
  state.agents.forEach((agent) => {
    if ((agent.phase !== 'orbit' && agent.phase !== 'thinking') || agent.retryAt == null || state.currentTime < agent.retryAt) {
      return;
    }

    const initialStageIndex = model.getInitialStageIndex?.(state, agent) ?? 0;
    const stage = state.stages[initialStageIndex];
    if (!stage || getStageLoad(stage) >= stage.spec.queueCapacity) {
      agent.retryAt = state.currentTime + state.controls.secondaryMeanSeconds;
      return;
    }

    agent.phase = 'queue';
    agent.stageIndex = initialStageIndex;
    agent.queuedAt = state.currentTime;
    agent.retryAt = null;
    agent.pos = {
      x: state.scene.points.entry.x - 8,
      y: state.scene.points.entry.y + (Math.random() - 0.5) * 16,
    };
    enqueueAgent(state, stage, agent.id);
  });
}

function resolveReneging(state: SimulationState, controls: SimulationControls) {
  if (controls.renegingSeconds <= 0) {
    return;
  }
  state.stages.forEach((stage) => {
    for (let index = stage.queue.length - 1; index >= 0; index -= 1) {
      const agent = getAgent(state, stage.queue[index]);
      if (!agent) {
        stage.queue.splice(index, 1);
        continue;
      }

      if (state.currentTime - agent.queuedAt < controls.renegingSeconds) {
        continue;
      }

      stage.queue.splice(index, 1);
      agent.phase = 'exiting';
      agent.stageIndex = null;
      state.stats.reneged += 1;
    }
  });
}

function resolveServiceCompletions(state: SimulationState) {
  const model = getModelDefinition(state.controls.modelId);
  state.stages.forEach((stage, stageIndex) => {
    stage.servers.forEach((server) => {
      if (server.agentId == null) {
        return;
      }
      const agent = getAgent(state, server.agentId);
      if (!agent) {
        server.agentId = null;
        return;
      }
      if (agent.serviceEndsAt == null || state.currentTime < agent.serviceEndsAt) {
        return;
      }

      if (model.id === 'airplane' && stage.spec.id === 'seat') {
        agent.phase = 'settled';
        agent.stageIndex = stageIndex;
        agent.serverId = server.id;
        agent.serviceEndsAt = null;
        state.stats.completed += 1;
        state.stats.totalSystemTime += state.currentTime - agent.enteredAt;
        return;
      }

      server.agentId = null;
      agent.serverId = null;
      agent.serviceEndsAt = null;

      if (stageIndex === state.stages.length - 1) {
        const nextStageIndex = model.getNextStageIndex?.(state, stageIndex, agent);
        if (nextStageIndex == null) {
          agent.phase = 'exiting';
          agent.stageIndex = null;
          return;
        }
        const nextStage = state.stages[nextStageIndex];
        if (!nextStage) {
          agent.phase = 'exiting';
          agent.stageIndex = null;
          return;
        }
        if (getStageLoad(nextStage) >= nextStage.spec.queueCapacity) {
          server.agentId = agent.id;
          agent.serverId = server.id;
          agent.serviceEndsAt = state.currentTime + 0.2;
          state.stats.blocked += 1;
          return;
        }
        agent.phase = 'queue';
        agent.stageIndex = nextStageIndex;
        agent.queuedAt = state.currentTime;
        enqueueAgent(state, nextStage, agent.id);
        return;
      }

      const nextStageIndex = model.getNextStageIndex?.(state, stageIndex, agent) ?? stageIndex + 1;
      if (nextStageIndex == null) {
        agent.phase = 'exiting';
        agent.stageIndex = null;
        return;
      }
      const nextStage = state.stages[nextStageIndex];
      if (!nextStage) {
        agent.phase = 'exiting';
        agent.stageIndex = null;
        return;
      }
      if (model.id === 'airplane' && (nextStage.spec.id === 'stow' || nextStage.spec.id === 'seat') && reserveAirplaneSeat(state, agent) == null) {
        server.agentId = agent.id;
        agent.serverId = server.id;
        agent.serviceEndsAt = state.currentTime + 0.2;
        state.stats.blocked += 1;
        return;
      }
      if (getStageLoad(nextStage) >= nextStage.spec.queueCapacity) {
        server.agentId = agent.id;
        agent.serverId = server.id;
        agent.serviceEndsAt = state.currentTime + 0.2;
        state.stats.blocked += 1;
        return;
      }

      agent.phase = 'queue';
      agent.stageIndex = nextStageIndex;
      agent.queuedAt = state.currentTime;
      enqueueAgent(state, nextStage, agent.id);
    });
  });
}

function assignServers(state: SimulationState) {
  const model = getModelDefinition(state.controls.modelId);
  state.stages.forEach((stage, stageIndex) => {
    if (model.id === 'airplane' && stage.spec.id === 'seat') {
      assignReservedAirplaneSeats(state, stage, stageIndex, model);
      return;
    }
    stage.servers.forEach((server) => {
      if (server.agentId != null || stage.queue.length === 0) {
        return;
      }
      const agentId = stage.queue.shift();
      if (agentId == null) {
        return;
      }
      const agent = getAgent(state, agentId);
      if (!agent) {
        return;
      }

      agent.phase = 'service';
      agent.stageIndex = stageIndex;
      agent.serverId = server.id;
      agent.serviceEndsAt = state.currentTime + takeServiceDuration(state, stage, agent, model);

      server.agentId = agent.id;
    });
  });
}

function assignReservedAirplaneSeats(
  state: SimulationState,
  stage: StageRuntime,
  stageIndex: number,
  model: ModelDefinition,
) {
  const remainingQueue: number[] = [];
  stage.queue.forEach((agentId) => {
    const agent = getAgent(state, agentId);
    if (!agent) {
      return;
    }

    const reservedSeat = stage.servers.find((server) => server.id === agent.reservedServerId);
    if (!reservedSeat || reservedSeat.agentId != null) {
      remainingQueue.push(agentId);
      return;
    }

    agent.phase = 'service';
    agent.stageIndex = stageIndex;
    agent.serverId = reservedSeat.id;
    agent.serviceEndsAt = state.currentTime + takeServiceDuration(state, stage, agent, model);
    reservedSeat.agentId = agent.id;
  });
  stage.queue = remainingQueue;
}

function resolvePreemptions(state: SimulationState, model: ModelDefinition) {
  if (model.priorityMode !== 'preemptive' && model.priorityMode !== 'preemptive-repeat') {
    return;
  }

  state.stages.forEach((stage, stageIndex) => {
    const waitingAgentId = stage.queue[0];
    if (waitingAgentId == null) {
      return;
    }

    const waitingAgent = getAgent(state, waitingAgentId);
    if (!waitingAgent || waitingAgent.priority !== 'high') {
      return;
    }

    const targetServer = stage.servers.find((server) => {
      if (server.agentId == null) {
        return false;
      }
      const inService = getAgent(state, server.agentId);
      return inService?.priority === 'normal';
    });

    if (!targetServer || targetServer.agentId == null) {
      return;
    }

    const preemptedAgent = getAgent(state, targetServer.agentId);
    if (!preemptedAgent) {
      targetServer.agentId = null;
      return;
    }

    stage.queue.shift();
    preemptedAgent.phase = 'queue';
    preemptedAgent.stageIndex = stageIndex;
    preemptedAgent.serverId = null;
    preemptedAgent.remainingServiceSeconds =
      model.priorityMode === 'preemptive-repeat'
        ? null
        : Math.max(0.5, (preemptedAgent.serviceEndsAt ?? state.currentTime) - state.currentTime);
    preemptedAgent.serviceEndsAt = null;
    preemptedAgent.queuedAt = state.currentTime;
    enqueueAgent(state, stage, preemptedAgent.id);

    waitingAgent.phase = 'service';
    waitingAgent.stageIndex = stageIndex;
    waitingAgent.serverId = targetServer.id;
    waitingAgent.serviceEndsAt = state.currentTime + takeServiceDuration(state, stage, waitingAgent, model);
    targetServer.agentId = waitingAgent.id;
  });
}

function takeServiceDuration(state: SimulationState, stage: StageRuntime, agent: Agent, model: ModelDefinition) {
  if (agent.remainingServiceSeconds != null) {
    const remaining = agent.remainingServiceSeconds;
    agent.remainingServiceSeconds = null;
    return remaining;
  }

  if (model.id === 'airplane' && stage.spec.id === 'seat') {
    const blockers = countAirplaneSeatBlockers(state, agent);
    return state.controls.tertiaryMeanSeconds + blockers * state.controls.seatInterferenceSeconds;
  }

  if (model.serviceTimeSampler) {
    return model.serviceTimeSampler(stage.spec, state.controls, agent);
  }

  return stage.spec.distribution === 'deterministic'
    ? stage.spec.meanServiceSeconds
    : sampleExponentialByMean(stage.spec.meanServiceSeconds);
}

function countAirplaneSeatBlockers(state: SimulationState, agent: Agent) {
  if (agent.reservedServerId == null) {
    return 0;
  }

  const seatMeta = getAircraftSeatMeta(agent.reservedServerId);
  const blockerSeats =
    seatMeta.seat === 0 ? [1, 2]
    : seatMeta.seat === 1 ? [2]
    : seatMeta.seat === 5 ? [4, 3]
    : seatMeta.seat === 4 ? [3]
    : [];

  return blockerSeats.filter((seat) => {
    const seatId = seatMeta.row * 6 + seat;
    return state.agents.some((candidate) => (
      candidate.id !== agent.id &&
      candidate.reservedServerId === seatId &&
      (candidate.phase === 'settled' || (candidate.phase === 'service' && state.stages[candidate.stageIndex ?? -1]?.spec.id === 'seat'))
    ));
  }).length;
}

function shouldBalk(state: SimulationState, controls: SimulationControls, stage: StageRuntime) {
  if (controls.balkThreshold <= 0) {
    return false;
  }

  const queueOverflow = stage.queue.length - controls.balkThreshold;
  if (queueOverflow < 0) {
    return false;
  }

  const probability = Math.min(0.85, 0.2 + queueOverflow * 0.08);
  return Math.random() < probability;
}

function enqueueAgent(state: SimulationState, stage: StageRuntime, agentId: number) {
  const agent = getAgent(state, agentId);
  if (!agent) {
    return;
  }

  if (getPriorityMode(state.controls.modelId) === 'fifo') {
    stage.queue.push(agentId);
    return;
  }

  if (agent.priority === 'high') {
    const firstNormalIndex = stage.queue.findIndex((queuedId) => getAgent(state, queuedId)?.priority !== 'high');
    if (firstNormalIndex === -1) {
      stage.queue.push(agentId);
      return;
    }
    stage.queue.splice(firstNormalIndex, 0, agentId);
    return;
  }

  stage.queue.push(agentId);
}

function getStageLoad(stage: StageRuntime) {
  return stage.queue.length + stage.servers.filter((server) => server.agentId != null).length;
}

function getEffectiveArrivalRate(controls: SimulationControls, model: ModelDefinition) {
  const batchSize = Math.max(1, Math.round(model.batchSize?.(controls) ?? 1));
  return controls.arrivalRate / batchSize;
}

function sampleNextArrival(controls: SimulationControls, state: SimulationState | null, model: ModelDefinition) {
  if (model.arrivalSampler) {
    return model.arrivalSampler(controls, state, model);
  }
  return sampleExponential(getEffectiveArrivalRate(controls, model));
}

function seedModelPopulation(state: SimulationState, model: ModelDefinition) {
  const population = Math.max(0, Math.round(model.seedPopulation?.(state.controls) ?? 0));
  for (let index = 0; index < population; index += 1) {
    spawnAgent(state, model);
  }
  if (population > 0) {
    state.nextArrivalAt = Number.POSITIVE_INFINITY;
  }
}

function getPriorityMode(modelId: QueueingModelId) {
  return getModelDefinition(modelId).priorityMode ?? 'priority';
}

function normalizeCvPercent(value: number) {
  return Math.max(0.2, value / 100);
}

function sampleGeneralDuration(meanSeconds: number, cv: number) {
  if (meanSeconds <= 0) {
    return 0;
  }
  if (cv <= 0.25) {
    return meanSeconds;
  }
  const spread = meanSeconds * cv;
  const normalLike = meanSeconds + spread * (Math.random() - 0.5) * 1.6;
  return Math.max(1, normalLike);
}

function choosePollingStage(primarySharePercent: number) {
  const first = primarySharePercent / 100;
  const second = (1 - first) / 2;
  const draw = Math.random();
  if (draw < first) {
    return 0;
  }
  if (draw < first + second) {
    return 1;
  }
  return 2;
}

function defaultTheorySummary(modelId: QueueingModelId) {
  const summaries: Record<QueueingModelId, string> = {
    cafeteria: '직렬 공정에서는 각 단계의 처리율이 다르면 병목이 뒤로 이동합니다. 식당처럼 여러 단계를 순서대로 거치는 시스템은 각 단계의 λ와 μ를 따로 보고, 가장 높은 ρ를 가진 단계가 전체 성능을 좌우합니다.',
    mm1: 'M/M/1은 포아송 도착과 지수 서비스, 단일 서버를 가정하는 가장 기본적인 대기행렬 모델입니다. 도착률이 서비스율에 가까워질수록 대기시간과 대기열 길이가 급격히 커집니다.',
    mmc: 'M/M/c는 하나의 큐를 여러 서버가 공유하는 모델입니다. 서버 수가 늘면 대기 확률이 줄고, Erlang-C 식으로 P(wait)와 평균 대기시간을 계산할 수 있습니다.',
    md1: 'M/D/1은 도착은 확률적이지만 서비스시간은 일정한 단일 서버 모델입니다. 서비스 변동성이 없기 때문에 M/M/1보다 같은 평균 처리율에서 대기시간이 짧아지는 경향이 있습니다.',
    mg1: 'M/G/1은 도착은 포아송이지만 서비스 분포는 자유롭게 바뀌는 단일 서버 모델입니다. 핵심은 평균보다 서비스시간 분산이 대기시간을 크게 키운다는 점입니다. Pollaczek-Khinchine 식으로 평균 대기시간을 근사합니다.',
    gg1: 'G/G/1은 도착 간격과 서비스시간이 모두 일반 분포인 가장 유연한 단일 서버 모델입니다. 닫힌형식 해는 드물어 Kingman 근사처럼 평균과 변동성을 이용한 근사식을 자주 씁니다.',
    prioritynp: 'Non-preemptive priority는 우선 고객이 큐 앞쪽으로 오지만, 이미 시작된 서비스는 끝까지 유지되는 규칙입니다. 구현은 단순하지만 고우선 고객이 많아질수록 일반 고객의 대기시간이 빠르게 늘고, 낮은 우선순위 클래스는 쉽게 밀릴 수 있습니다.',
    priorityresume: 'Preemptive-resume priority는 우선 고객이 도착하면 현재 저우선 작업을 멈추고 먼저 처리한 뒤, 나중에 남은 작업을 이어서 끝내는 규칙입니다. 긴급 작업 응답은 빨라지지만 일반 작업은 잦은 중단 때문에 체감 지연이 커질 수 있습니다.',
    priorityrepeat: 'Preemptive-repeat priority는 저우선 작업이 중간에 끊기면 남은 시간만 이어서 처리하지 않고 처음부터 다시 시작하는 규칙입니다. 중단 비용이 큰 공정에 가깝고, 선점이 잦을수록 일반 작업 손실이 가장 크게 나타납니다.',
    tandem: '직렬 공정에서는 앞단을 개선해도 후단이 느리면 병목이 다음 단계로 옮겨갑니다. tandem 모델은 이 병목 이동을 가장 단순하게 보여주는 구조입니다.',
    closed: 'Closed queueing network는 외부에서 새 고객이 들어오지 않고, 정해진 수의 고객이 시스템 안을 계속 순환합니다. 사용자가 많아질수록 처리량은 포화되고, 가장 느린 서버가 전체 사이클 타임을 좌우합니다.',
    processor: 'Processor sharing은 여러 작업이 한 서버의 처리 용량을 동시에 나눠 쓰는 규칙입니다. 큰 작업이 뒤에서 들어와도 완전히 막히지 않고 조금씩 진행되며, 대화형 시스템이나 CPU 시간공유를 설명할 때 자주 씁니다.',
    polling: 'Polling system은 하나의 서버가 여러 큐를 번갈아 방문해 처리하는 구조입니다. 전환시간이 길수록 모든 큐의 대기시간이 함께 늘고, 가장 자주 쌓이는 큐가 전체 성능을 지배합니다.',
    forkjoin: 'Fork-join은 한 작업을 여러 하위 작업으로 나눠 병렬 처리한 뒤 모두 끝나야 다시 합치는 구조입니다. 병렬화 이점이 있어도 가장 늦는 분기가 전체 지연을 결정한다는 점이 핵심입니다.',
    retrial: 'Retrial queue는 처음 시도에서 실패한 고객이 완전히 떠나지 않고 orbit에 머물다가 다시 진입하는 모델입니다. 혼잡이 심할수록 orbit 인구가 커지고 재시도 트래픽이 원래 유입을 더 압박합니다.',
    statedependent: 'State-dependent queue는 시스템 상태에 따라 도착률이나 서비스율이 달라지는 모델입니다. 혼잡이 심하면 유입이 줄거나 처리 속도가 변하는 식으로, 현실 시스템의 적응적 반응을 표현할 때 유용합니다.',
    bulk: 'Bulk model은 고객이 한 명씩이 아니라 묶음으로 들어오거나, 서버가 여러 명을 한 번에 처리하는 구조입니다. 배치 크기가 커질수록 순간 혼잡과 대기열 파동이 더 크게 나타납니다.',
    airport: '공항 보안검색은 우선 검색 승객, 직렬 검색 공정, 구역 수용 한도가 동시에 작동하는 대표적인 서비스 네트워크입니다. 빠른 승객 비율과 스캐너 수를 바꾸면 병목 단계가 쉽게 이동합니다.',
    airplane: '항공기 탑승은 배치 호출, 통로 병목, 좌석 정착 시간이 겹치는 대기행렬입니다. 탑승 그룹이 커질수록 순간 혼잡이 커지고, 통로 점유시간이 전체 탑승 완료시간을 좌우합니다.',
    hospital: '병원 외래는 긴급도에 따른 우선순위와 중도 이탈이 함께 나타나는 시스템입니다. 긴급 환자가 선점할수록 일반 환자의 체류시간은 길어지고, 진료 단계가 가장 큰 병목이 되기 쉽습니다.',
    callcenter: '콜센터는 여러 상담원이 하나의 큐를 공유하는 M/M/c 구조에 가깝지만, 전문 문의는 별도 풀로 라우팅되고 기다리다 끊는 abandonment가 발생합니다. 풀별 부하 차이가 핵심입니다.',
    logistics: '물류 허브는 하역, 분류, 출고가 이어지는 finite-buffer 직렬 네트워크입니다. 후단 버퍼가 차면 앞단이 막혀 전체 처리량이 떨어지는 blocking이 핵심 현상입니다.',
    mall: '쇼핑몰 계산대는 고객이 대기열을 보고 라인을 선택하는 lane choice 문제입니다. express lane이 충분히 빠르면 소량 구매 고객을 빨아들이고, 그렇지 않으면 일반 계산대로 다시 쏠립니다.',
    themepark: '테마파크 탑승 큐는 여러 손님을 한 번에 태우는 batch loading, 빠른 탑승권의 우선 처리, 긴 대기열을 보고 포기하는 balking이 동시에 나타나는 대표 사례입니다.',
    baggage: '수하물 수취는 여러 carousel 중 어디가 덜 혼잡한지 보고 이동하는 jockeying과, 벨트 주변 공간이 차며 발생하는 blocking이 함께 나타나는 시나리오입니다.',
    evcharging: '전기차 충전소는 자원 수가 제한된 finite-capacity 시스템이고, 예약 차량이나 급속 충전 고객을 우선 처리할 수 있습니다. 대기시간이 길면 떠나는 reneging도 현실적으로 자주 나타납니다.',
    port: '컨테이너 터미널은 선박 단위의 batch arrival, 야드 적치 공간 부족으로 인한 blocking, 게이트 출고 지연이 함께 나타나는 대규모 직렬 네트워크입니다.',
    ward: '응급실과 병동 베드 배정은 사실상 loss system과 preemption이 섞인 구조입니다. 베드가 없으면 응급실에 머무는 boarding delay가 생기고, 중증 환자가 우선권을 가져 전체 흐름을 흔듭니다.',
    amr: 'AMR 교차로는 개별 로봇이 네트워크를 따라 움직이는 queueing network입니다. 교차로가 잠기면 뒤쪽 경로까지 blocking이 전파되고, 라우팅 정책이 전체 처리량을 크게 바꿉니다.',
    erlangb: 'Erlang-B는 대기열이 전혀 없고 서버가 모두 차면 즉시 차단되는 손실 시스템입니다. 전화 회선, 무선 채널처럼 “바쁘면 바로 거절”되는 자원 시스템을 설명할 때 자주 씁니다.',
    jackson: 'Jackson network는 여러 서비스 노드가 연결된 개방형 네트워크 모델입니다. 각 노드가 M/M/c처럼 보이더라도 라우팅 확률 때문에 내부 유효 도착률이 바뀌며, traffic equation으로 전체 균형을 풉니다.',
  };
  return summaries[modelId];
}

function updateGridDelayStats(state: SimulationState, dt: number) {
  if (!isGridScenario(state.controls.modelId)) {
    return;
  }

  if (state.controls.modelId === 'airplane') {
    const aisleStage = state.stages.find((stage) => stage.spec.id === 'aisle');
    const stowStage = state.stages.find((stage) => stage.spec.id === 'stow');
    const stowBusy = stowStage?.servers.some((server) => server.agentId != null) ?? false;
    if ((aisleStage?.queue.length ?? 0) > 0 && stowBusy) {
      state.stats.gridDelaySeconds += dt;
    }
    return;
  }

  if (state.controls.modelId === 'ward') {
    const edStage = state.stages.find((stage) => stage.spec.id === 'ed-bed');
    const wardStage = state.stages.find((stage) => stage.spec.id === 'ward-bed');
    if ((edStage?.queue.length ?? 0) > 0 && (wardStage?.servers.every((server) => server.agentId != null) ?? false)) {
      state.stats.gridDelaySeconds += dt;
    }
    return;
  }

  if (state.controls.modelId === 'evcharging') {
    const chargingStage = state.stages[0];
    if ((chargingStage?.queue.length ?? 0) > 0 && (chargingStage?.servers.every((server) => server.agentId != null) ?? false)) {
      state.stats.gridDelaySeconds += dt;
    }
    return;
  }

  const intersectionStage = state.stages.find((stage) => stage.spec.id === 'intersection');
  if ((intersectionStage?.queue.length ?? 0) > 0 && (intersectionStage?.servers.every((server) => server.agentId != null) ?? false)) {
    state.stats.gridDelaySeconds += dt;
  }
}

function updateAgents(state: SimulationState, dt: number) {
  state.agents.forEach((agent) => {
    const target = getTargetForAgent(state, agent);
    const arriveForce = arrive(agent, target);
    const separationForce = separate(agent, state.agents);

    agent.acc.x += arriveForce.x + separationForce.x * 1.2;
    agent.acc.y += arriveForce.y + separationForce.y * 1.2;

    const dynamics = phaseDynamics[agent.phase];
    agent.maxSpeed = dynamics.speed;
    agent.maxForce = dynamics.force;

    agent.vel.x += agent.acc.x * dt;
    agent.vel.y += agent.acc.y * dt;
    limitVector(agent.vel, agent.maxSpeed);
    agent.pos.x += agent.vel.x * dt;
    agent.pos.y += agent.vel.y * dt;
    agent.acc.x = 0;
    agent.acc.y = 0;
  });
}

function resolveDepartures(state: SimulationState) {
  for (let index = state.agents.length - 1; index >= 0; index -= 1) {
    const agent = state.agents[index];
    if (agent.phase !== 'exiting') {
      continue;
    }
    if (distance(agent.pos, state.scene.points.exit) > 20) {
      continue;
    }
    state.stats.completed += 1;
    state.stats.totalSystemTime += state.currentTime - agent.enteredAt;
    state.agents.splice(index, 1);
  }
}

function buildSnapshot(state: SimulationState, controls: SimulationControls): SimulationSnapshot {
  const model = getModelDefinition(controls.modelId);
  const stages = state.stages.map<StageSnapshot>((stage) => ({
    id: stage.spec.id,
    label: stage.spec.label,
    description: stage.spec.description,
    color: stage.spec.color,
    queueLength: stage.queue.length,
    inService: stage.servers.filter((server) => server.agentId != null).length,
    serverCount: stage.spec.serverCount,
    utilization: stage.spec.serverCount === 0 ? 0 : stage.servers.filter((server) => server.agentId != null).length / stage.spec.serverCount,
    capacityPerMinute: stage.spec.serverCount * (60 / stage.spec.meanServiceSeconds),
    meanServiceSeconds: stage.spec.meanServiceSeconds,
    distribution: stage.spec.distribution,
  }));

  const throughputRate = state.currentTime > 0 ? (state.stats.completed / state.currentTime) * 60 : 0;
  const averageSystemTime = state.stats.completed > 0 ? state.stats.totalSystemTime / state.stats.completed : 0;
  const observedL = state.currentTime > 0 ? state.stats.wipIntegral / state.currentTime : state.agents.length;
  const queueLengthTotal = stages.reduce((sum, stage) => sum + stage.queueLength, 0);
  const inServiceTotal = stages.reduce((sum, stage) => sum + stage.inService, 0);

  return {
    modelId: model.id,
    modelName: model.name,
    modelFormula: model.formula,
    viewMode: isGridScenario(model.id) ? 'grid' : 'flow',
    activeCustomers: state.agents.length,
    completedCustomers: state.stats.completed,
    throughputRate,
    averageSystemTime,
    observedL,
    littleL: computeLittleLaw(throughputRate || controls.arrivalRate, averageSystemTime),
    bottleneck: detectBottleneck(stages),
    queueLengthTotal,
    inServiceTotal,
    balkedCustomers: state.stats.balked,
    renegedCustomers: state.stats.reneged,
    blockedCustomers: state.stats.blocked,
    theoryMetrics: buildTheoryMetrics(state, controls, stages),
    stages,
  };
}

function buildTheoryMetrics(state: SimulationState, controls: SimulationControls, stages: StageSnapshot[]): TheoryMetric[] {
  const firstStage = stages[0];
  if (!firstStage) {
    return [];
  }

  const metrics: TheoryMetric[] = [
    {
      label: '가동률 ρ',
      value: stageRho(firstStage, controls.arrivalRate).toFixed(2),
      detail: '첫 단계 기준 λ/(cμ)입니다. 1.00 이상이면 불안정 구간입니다.',
    },
    {
      label: '수용 한도 K',
      value: `${controls.queueCapacity}`,
      detail: '단계당 최대 체류 인원입니다. 초과 시 capacity block이 발생합니다.',
    },
  ];

  if (controls.priorityShare > 0) {
    metrics.push({
      label: 'Priority Mix',
      value: `${controls.priorityShare.toFixed(0)}%`,
      detail: getPriorityMode(controls.modelId) === 'preemptive'
        ? '우선 고객은 낮은 우선순위 고객의 서비스를 선점할 수 있습니다.'
        : '우선 고객은 같은 큐에서 일반 고객보다 먼저 처리됩니다.',
    });
  }

  if (controls.balkThreshold > 0 || controls.renegingSeconds > 0) {
    metrics.push({
      label: 'Loss Rules',
      value: `B${controls.balkThreshold}/R${controls.renegingSeconds}s`,
      detail: 'Balking과 reneging 규칙이 유입 손실과 중도 이탈을 동시에 만듭니다.',
    });
  }

  if (controls.modelId === 'mm1') {
    metrics.push(...buildMm1Metrics(controls.arrivalRate, firstStage.meanServiceSeconds));
    return metrics;
  }

  if (controls.modelId === 'md1') {
    metrics.push(...buildMd1Metrics(controls.arrivalRate, firstStage.meanServiceSeconds));
    return metrics;
  }

  if (controls.modelId === 'mg1') {
    metrics.push(...buildMg1Metrics(controls.arrivalRate, firstStage.meanServiceSeconds, normalizeCvPercent(controls.routingProbability)));
    return metrics;
  }

  if (controls.modelId === 'gg1') {
    metrics.push(...buildGg1Metrics(controls.arrivalRate, firstStage.meanServiceSeconds, normalizeCvPercent(controls.batchSize), normalizeCvPercent(controls.routingProbability)));
    return metrics;
  }

  if (controls.modelId === 'prioritynp') {
    metrics.push(...buildPriorityMetrics(controls.arrivalRate, firstStage.meanServiceSeconds, controls.priorityShare, 'non-preemptive'));
    return metrics;
  }

  if (controls.modelId === 'priorityresume') {
    metrics.push(...buildPriorityMetrics(controls.arrivalRate, firstStage.meanServiceSeconds, controls.priorityShare, 'preemptive-resume'));
    return metrics;
  }

  if (controls.modelId === 'priorityrepeat') {
    metrics.push(...buildPriorityMetrics(controls.arrivalRate, firstStage.meanServiceSeconds, controls.priorityShare, 'preemptive-repeat'));
    return metrics;
  }

  if (controls.modelId === 'mmc') {
    metrics.push(...buildMmcMetrics(controls.arrivalRate, firstStage.meanServiceSeconds, firstStage.serverCount));
    return metrics;
  }

  if (controls.modelId === 'erlangb') {
    metrics.push(...buildErlangBMetrics(controls.arrivalRate, firstStage.meanServiceSeconds, firstStage.serverCount));
    return metrics;
  }

  if (controls.modelId === 'jackson') {
    metrics.push(...buildJacksonMetrics(controls, stages));
    return metrics;
  }

  if (controls.modelId === 'closed') {
    metrics.push(...buildClosedMetrics(controls, stages));
    return metrics;
  }

  if (controls.modelId === 'processor') {
    metrics.push(...buildProcessorMetrics(controls));
    return metrics;
  }

  if (controls.modelId === 'polling') {
    metrics.push(...buildPollingMetrics(controls, stages));
    return metrics;
  }

  if (controls.modelId === 'forkjoin') {
    metrics.push(...buildForkJoinMetrics(controls));
    return metrics;
  }

  if (controls.modelId === 'retrial') {
    metrics.push(...buildRetrialMetrics(state, controls, stages));
    return metrics;
  }

  if (controls.modelId === 'statedependent') {
    metrics.push(...buildStateDependentMetrics(state, controls, stages[0]));
    return metrics;
  }

  if (controls.modelId === 'bulk') {
    metrics.push(...buildBulkMetrics(controls, stages[0]));
    return metrics;
  }

  if (controls.modelId === 'cafeteria' || controls.modelId === 'tandem' || controls.modelId === 'airport' || controls.modelId === 'logistics' || controls.modelId === 'port') {
    metrics.push(...buildSerialNetworkMetrics(controls.arrivalRate, stages));
  }

  if (controls.modelId === 'airplane') {
    const manifest = getModelDefinition('airplane').spawnLimit?.(controls) ?? state.stats.spawned;
    const aisleStage = stages[1];
    const stowStage = stages[2];
    const seatStage = stages[3];
    metrics.push(
      {
        label: 'Manifest',
        value: `${Math.round(manifest)}명`,
        detail: '탑승 완료를 목표로 하는 총 승객 수입니다.',
      },
      {
        label: 'Aisle ρ',
        value: stageRho(aisleStage, controls.arrivalRate).toFixed(2),
        detail: '통로 병목이 높을수록 aisle blocking이 심해집니다.',
      },
      {
        label: 'Carry-on Mix',
        value: `${controls.routingProbability.toFixed(0)}%`,
        detail: '짐 적재 구간을 실제로 거치는 승객 비율입니다.',
      },
      {
        label: 'Stow + Seat',
        value: formatDuration(stowStage.meanServiceSeconds + seatStage.meanServiceSeconds),
        detail: '짐 적재 승객 기준 평균 점유시간 합입니다.',
      },
    );
  }

  if (controls.modelId === 'hospital') {
    metrics.push(
      {
        label: 'Triage ρ',
        value: stageRho(stages[0], controls.arrivalRate).toFixed(2),
        detail: '트리아지 단계의 부하입니다.',
      },
      {
        label: 'Consult ρ',
        value: stageRho(stages[1], controls.arrivalRate).toFixed(2),
        detail: '진료 단계의 부하입니다.',
      },
      {
        label: 'Abandon Rate',
        value: `${ratioToPercent(state.stats.reneged, state.stats.spawned)}%`,
        detail: '기다리다 이탈한 환자의 비율입니다.',
      },
    );
  }

  if (controls.modelId === 'callcenter') {
    const specialistRate = controls.arrivalRate * (controls.priorityShare / 100);
    const generalRate = Math.max(0, controls.arrivalRate - specialistRate);
    metrics.push(
      {
        label: 'General ρ',
        value: stageRho(stages[1], generalRate).toFixed(2),
        detail: '일반 상담원 풀의 부하입니다.',
      },
      {
        label: 'Specialist ρ',
        value: stageRho(stages[2], specialistRate).toFixed(2),
        detail: '전문 상담원 풀의 부하입니다.',
      },
      {
        label: 'Abandon Rate',
        value: `${ratioToPercent(state.stats.reneged, state.stats.spawned)}%`,
        detail: '대기 도중 전화를 끊은 콜 비율입니다.',
      },
    );
  }

  if (controls.modelId === 'mall') {
    const expressEligible = controls.arrivalRate * (controls.priorityShare / 100);
    metrics.push(
      {
        label: 'Express Eligible',
        value: `${controls.priorityShare.toFixed(0)}%`,
        detail: `${expressEligible.toFixed(1)}명/분이 express lane 자격을 가집니다.`,
      },
      {
        label: 'Express ρ',
        value: stageRho(stages[1], expressEligible).toFixed(2),
        detail: 'Express lane의 부하입니다.',
      },
      {
        label: 'Balk Rate',
        value: `${ratioToPercent(state.stats.balked, state.stats.spawned + state.stats.balked)}%`,
        detail: '계산대 대기열을 보고 구매를 포기한 고객 비율입니다.',
      },
    );
  }

  if (controls.modelId === 'themepark') {
    metrics.push(
      { label: 'Ride Batch', value: `${controls.batchSize.toFixed(0)}명`, detail: '한 사이클에 태우는 손님 수입니다.' },
      { label: 'VIP Mix', value: `${controls.priorityShare.toFixed(0)}%`, detail: '우선 탑승 손님 비율입니다.' },
      { label: 'Balk Rate', value: `${ratioToPercent(state.stats.balked, state.stats.spawned + state.stats.balked)}%`, detail: '줄을 보고 포기한 방문객 비율입니다.' },
    );
  }

  if (controls.modelId === 'baggage') {
    metrics.push(
      { label: 'Carousel A ρ', value: stageRho(stages[1], controls.arrivalRate / 2).toFixed(2), detail: '벨트 A의 부하입니다.' },
      { label: 'Carousel B ρ', value: stageRho(stages[2], controls.arrivalRate / 2).toFixed(2), detail: '벨트 B의 부하입니다.' },
      { label: 'Jockey Signal', value: `${Math.abs(stages[1].queueLength - stages[2].queueLength)}명`, detail: '두 벨트 대기열 차이가 클수록 이동 유인이 커집니다.' },
    );
  }

  if (controls.modelId === 'evcharging') {
    metrics.push(
      { label: 'Blocking Risk', value: stageRho(stages[0], controls.arrivalRate).toFixed(2), detail: '충전기 수 대비 유입 강도입니다.' },
      { label: 'Reservation Mix', value: `${controls.priorityShare.toFixed(0)}%`, detail: '예약 차량이 우선 충전됩니다.' },
      { label: 'Abandon Rate', value: `${ratioToPercent(state.stats.reneged, state.stats.spawned)}%`, detail: '대기 중 떠난 차량 비율입니다.' },
    );
  }

  if (controls.modelId === 'ward') {
    metrics.push(
      { label: 'ED ρ', value: stageRho(stages[0], controls.arrivalRate).toFixed(2), detail: '응급실 베드 점유 강도입니다.' },
      { label: 'Ward ρ', value: stageRho(stages[1], controls.arrivalRate).toFixed(2), detail: '병동 베드 점유 강도입니다.' },
      { label: 'Boarding Delay', value: formatDuration(approximateStageResidenceSeconds(stages[1], controls.arrivalRate)), detail: '병동 베드 부족으로 발생하는 지연의 근사치입니다.' },
    );
  }

  if (controls.modelId === 'amr') {
    metrics.push(...buildJacksonMetrics({ ...controls, arrivalRate: controls.arrivalRate }, stages));
  }

  return metrics;
}

function buildMm1Metrics(arrivalRatePerMinute: number, meanServiceSeconds: number): TheoryMetric[] {
  const lambda = arrivalRatePerMinute / 60;
  const mu = meanServiceSeconds > 0 ? 1 / meanServiceSeconds : 0;
  if (lambda <= 0 || mu <= 0 || lambda >= mu) {
    return [{ label: 'Stability', value: 'unstable', detail: 'λ ≥ μ 이면 M/M/1 정상상태 해가 존재하지 않습니다.' }];
  }
  const rho = lambda / mu;
  const lq = (rho * rho) / (1 - rho);
  const wq = lq / lambda;
  const w = 1 / (mu - lambda);
  const l = lambda * w;
  return [
    { label: 'P0', value: (1 - rho).toFixed(2), detail: '시스템이 비어 있을 확률입니다.' },
    { label: '이론 Lq', value: lq.toFixed(2), detail: 'M/M/1의 평균 대기열 길이입니다.' },
    { label: '이론 Wq', value: formatDuration(wq), detail: 'M/M/1의 평균 대기시간입니다.' },
    { label: '이론 L', value: l.toFixed(2), detail: '시스템 내 평균 고객 수입니다.' },
    { label: '이론 W', value: formatDuration(w), detail: '대기를 포함한 평균 체류시간입니다.' },
  ];
}

function buildMd1Metrics(arrivalRatePerMinute: number, meanServiceSeconds: number): TheoryMetric[] {
  const lambda = arrivalRatePerMinute / 60;
  const mu = meanServiceSeconds > 0 ? 1 / meanServiceSeconds : 0;
  if (lambda <= 0 || mu <= 0 || lambda >= mu) {
    return [{ label: 'Stability', value: 'unstable', detail: 'λ ≥ μ 이면 M/D/1 정상상태 해가 존재하지 않습니다.' }];
  }
  const rho = lambda / mu;
  const lq = (rho * rho) / (2 * (1 - rho));
  const wq = lq / lambda;
  const w = wq + 1 / mu;
  return [
    { label: 'ρ', value: rho.toFixed(2), detail: '서버 점유율입니다.' },
    { label: '이론 Lq', value: lq.toFixed(2), detail: 'M/D/1의 평균 대기열 길이입니다.' },
    { label: '이론 Wq', value: formatDuration(wq), detail: '결정론적 서비스의 평균 대기시간입니다.' },
    { label: '이론 W', value: formatDuration(w), detail: '대기 포함 평균 체류시간입니다.' },
  ];
}

function buildMg1Metrics(arrivalRatePerMinute: number, meanServiceSeconds: number, cv: number): TheoryMetric[] {
  const lambda = arrivalRatePerMinute / 60;
  const serviceMean = meanServiceSeconds;
  const mu = serviceMean > 0 ? 1 / serviceMean : 0;
  if (lambda <= 0 || mu <= 0 || lambda >= mu) {
    return [{ label: 'Stability', value: 'unstable', detail: 'λE[S] ≥ 1 이면 M/G/1 정상상태 해가 존재하지 않습니다.' }];
  }
  const rho = lambda / mu;
  const cs2 = cv * cv;
  const wq = (lambda * (1 + cs2) * serviceMean * serviceMean) / (2 * (1 - rho));
  const lq = lambda * wq;
  return [
    { label: '서비스 CV', value: cv.toFixed(2), detail: '서비스시간 변동성입니다.' },
    { label: 'PK Wq', value: formatDuration(wq), detail: 'Pollaczek-Khinchine 근사 평균 대기시간입니다.' },
    { label: 'PK Lq', value: lq.toFixed(2), detail: '평균 대기열 길이 근사입니다.' },
  ];
}

function buildGg1Metrics(arrivalRatePerMinute: number, meanServiceSeconds: number, arrivalCv: number, serviceCv: number): TheoryMetric[] {
  const lambda = arrivalRatePerMinute / 60;
  const mu = meanServiceSeconds > 0 ? 1 / meanServiceSeconds : 0;
  if (lambda <= 0 || mu <= 0 || lambda >= mu) {
    return [{ label: 'Stability', value: 'unstable', detail: 'ρ ≥ 1 이면 G/G/1 근사도 급격히 커집니다.' }];
  }
  const rho = lambda / mu;
  const kingmanWq = ((rho / (1 - rho)) * ((arrivalCv * arrivalCv + serviceCv * serviceCv) / 2)) * meanServiceSeconds;
  return [
    { label: 'Arrival CV', value: arrivalCv.toFixed(2), detail: '도착 간격 변동성입니다.' },
    { label: 'Service CV', value: serviceCv.toFixed(2), detail: '서비스시간 변동성입니다.' },
    { label: 'Kingman Wq', value: formatDuration(kingmanWq), detail: 'G/G/1 평균 대기시간 근사입니다.' },
  ];
}

function buildPriorityMetrics(
  arrivalRatePerMinute: number,
  meanServiceSeconds: number,
  priorityShare: number,
  discipline: 'non-preemptive' | 'preemptive-resume' | 'preemptive-repeat',
): TheoryMetric[] {
  const lambda = arrivalRatePerMinute / 60;
  const mu = meanServiceSeconds > 0 ? 1 / meanServiceSeconds : 0;
  if (lambda <= 0 || mu <= 0 || lambda >= mu) {
    return [{ label: 'Stability', value: 'unstable', detail: 'λ ≥ μ 이면 우선순위 큐의 평균 대기시간이 급격히 커집니다.' }];
  }
  const highLambda = lambda * (priorityShare / 100);
  const lowLambda = Math.max(0, lambda - highLambda);
  const rho = lambda / mu;
  const highDelay = highLambda > 0 ? highLambda / (mu * Math.max(mu - highLambda, 1e-6)) : 0;
  const baseLowDelay = lowLambda > 0 ? lambda / (mu * Math.max(mu - lambda, 1e-6)) : 0;
  const disciplinePenalty =
    discipline === 'preemptive-repeat' ? 1.45 :
    discipline === 'preemptive-resume' ? 1.18 :
    1.0;

  return [
    { label: 'High-class λ', value: `${(highLambda * 60).toFixed(1)}명/분`, detail: '고우선 클래스의 유효 도착률입니다.' },
    { label: 'Low-class λ', value: `${(lowLambda * 60).toFixed(1)}명/분`, detail: '일반 클래스의 유효 도착률입니다.' },
    { label: 'High Wq', value: formatDuration(highDelay), detail: `${discipline} 규칙에서 고우선 클래스의 평균 대기 근사입니다.` },
    { label: 'Low Wq', value: formatDuration(baseLowDelay * disciplinePenalty), detail: `${discipline} 규칙이 일반 클래스 지연을 얼마나 키우는지 보는 근사치입니다.` },
    { label: 'ρ', value: rho.toFixed(2), detail: '단일 서버 기준 전체 점유율입니다.' },
  ];
}

function buildClosedMetrics(controls: SimulationControls, stages: StageSnapshot[]): TheoryMetric[] {
  const population = Math.max(2, Math.round(controls.batchSize));
  const demands = stages.map((stage) => ({
    label: stage.label,
    demand: stage.meanServiceSeconds / Math.max(stage.serverCount, 1),
  }));
  const dominant = demands.reduce((winner, stage) => (stage.demand > winner.demand ? stage : winner), demands[0] ?? { label: 'Node A', demand: 0 });
  const totalDemand = demands.reduce((sum, stage) => sum + stage.demand, 0);
  const asymptoticThroughput = dominant.demand > 0 ? 60 / dominant.demand : 0;
  const thinkDemand = stages[stages.length - 1]?.meanServiceSeconds ?? 0;
  const interactionBound = totalDemand + thinkDemand;
  const interactiveThroughput = interactionBound > 0 ? (population * 60) / interactionBound : 0;
  const throughput = Math.min(asymptoticThroughput, interactiveThroughput);
  const cycleSeconds = throughput > 0 ? (population / throughput) * 60 : 0;

  return [
    { label: 'Population N', value: `${population}명`, detail: '시스템 안을 계속 순환하는 고정 고객 수입니다.' },
    { label: 'Cycle Time', value: formatDuration(cycleSeconds), detail: '한 고객이 한 바퀴 순환하는 평균 시간 근사입니다.' },
    { label: 'Throughput X', value: `${throughput.toFixed(1)}명/분`, detail: '폐쇄형 네트워크의 순환 처리율 근사입니다.' },
    { label: 'Bottleneck Node', value: dominant.label, detail: '가장 큰 서비스 수요를 가진 노드가 전체 처리량을 제한합니다.' },
  ];
}

function buildProcessorMetrics(controls: SimulationControls): TheoryMetric[] {
  const servers = Math.max(1, controls.primaryServerCount);
  const lambda = controls.arrivalRate / 60;
  const serviceMean = controls.primaryMeanSeconds;
  const rho = lambda * serviceMean / servers;
  if (rho >= 1) {
    return [{ label: 'Stability', value: 'unstable', detail: '총 요구 작업량이 공유 용량을 넘으면 응답시간이 폭증합니다.' }];
  }
  const response = serviceMean / (1 - rho);
  const slowdown = response / Math.max(serviceMean, 1e-6);
  return [
    { label: 'Shared Capacity', value: `${servers.toFixed(0)}슬롯`, detail: '동시에 나눠 줄 수 있는 총 용량입니다.' },
    { label: 'PS ρ', value: rho.toFixed(2), detail: '도착 작업량 대비 공유 용량 점유율입니다.' },
    { label: 'Response', value: formatDuration(response), detail: 'processor sharing의 평균 응답시간 근사입니다.' },
    { label: 'Slowdown', value: `${slowdown.toFixed(2)}x`, detail: '작업량 대비 체감 지연 배율입니다.' },
  ];
}

function buildPollingMetrics(controls: SimulationControls, stages: StageSnapshot[]): TheoryMetric[] {
  const shareA = controls.routingProbability / 100;
  const shareB = (1 - shareA) / 2;
  const arrivals = [shareA, shareB, shareB].map((share) => controls.arrivalRate * share);
  const dominant = stages.reduce(
    (winner, stage, index) => {
      const rho = stageRho(stage, arrivals[index] ?? 0);
      return rho > winner.rho ? { label: stage.label, rho } : winner;
    },
    { label: stages[0]?.label ?? 'Queue A', rho: 0 },
  );
  const cycle = stages.length * controls.secondaryMeanSeconds + stages.length * controls.primaryMeanSeconds;
  return [
    { label: 'Switch-over', value: formatDuration(controls.secondaryMeanSeconds), detail: '큐 사이를 이동하는 전환시간입니다.' },
    { label: 'Polling Cycle', value: formatDuration(cycle), detail: '세 큐를 한 바퀴 도는 평균 주기 근사입니다.' },
    { label: 'Queue Split', value: arrivals.map((value) => value.toFixed(1)).join(' / '), detail: 'A/B/C 큐에 분배되는 도착량입니다.' },
    { label: 'Dominant Queue', value: dominant.label, detail: `가장 높은 부하 ρ=${dominant.rho.toFixed(2)}를 가지는 큐입니다.` },
  ];
}

function buildForkJoinMetrics(controls: SimulationControls): TheoryMetric[] {
  const branchA = controls.primaryMeanSeconds / Math.max(controls.primaryServerCount, 1);
  const branchB = controls.secondaryMeanSeconds / Math.max(controls.secondaryServerCount, 1);
  const syncDelay = Math.max(branchA, branchB);
  const total = syncDelay + controls.tertiaryMeanSeconds / Math.max(controls.tertiaryServerCount, 1);
  const branchGap = Math.abs(branchA - branchB);
  return [
    { label: 'Branch A Demand', value: formatDuration(branchA), detail: '병렬 분기 A의 서버당 유효 작업시간입니다.' },
    { label: 'Branch B Demand', value: formatDuration(branchB), detail: '병렬 분기 B의 서버당 유효 작업시간입니다.' },
    { label: 'Sync Delay', value: formatDuration(syncDelay), detail: '더 느린 분기가 합류 지연을 결정합니다.' },
    { label: 'Imbalance', value: formatDuration(branchGap), detail: '두 병렬 분기 사이의 처리 불균형입니다.' },
    { label: 'Join W', value: formatDuration(total), detail: '분기 작업과 합류 후 처리를 합친 근사 체류시간입니다.' },
  ];
}

function buildRetrialMetrics(state: SimulationState, controls: SimulationControls, stages: StageSnapshot[]): TheoryMetric[] {
  const orbitSize = state.agents.filter((agent) => agent.phase === 'orbit').length;
  const retryRate = controls.secondaryMeanSeconds > 0 ? orbitSize * (60 / controls.secondaryMeanSeconds) : 0;
  const offeredRate = controls.arrivalRate + retryRate;
  const rho = stageRho(stages[0], offeredRate);
  return [
    { label: 'Orbit Size', value: `${orbitSize}명`, detail: '재시도 대기 중인 고객 수입니다.' },
    { label: 'Retry λ', value: `${retryRate.toFixed(1)}명/분`, detail: 'orbit 고객이 다시 들어오는 유효 재시도율입니다.' },
    { label: 'Offered λ', value: `${offeredRate.toFixed(1)}명/분`, detail: '원래 유입과 재시도를 합친 총 부하입니다.' },
    { label: 'Service ρ', value: rho.toFixed(2), detail: '재시도 부하까지 반영한 서버 점유율입니다.' },
  ];
}

function buildStateDependentMetrics(state: SimulationState, controls: SimulationControls, stage: StageSnapshot): TheoryMetric[] {
  const loadRatio = Math.min(1.2, state.agents.length / Math.max(controls.queueCapacity, 1));
  const sensitivity = controls.routingProbability / 100;
  const effectiveRate = Math.max(0.2, controls.arrivalRate * (1 - loadRatio * sensitivity * 0.75));
  return [
    { label: 'Base λ', value: `${controls.arrivalRate.toFixed(1)}명/분`, detail: '혼잡 반응이 없을 때 기준 유입입니다.' },
    { label: 'Effective λ', value: `${effectiveRate.toFixed(1)}명/분`, detail: '현재 혼잡 수준을 반영한 실시간 유효 유입률입니다.' },
    { label: 'Sensitivity', value: `${controls.routingProbability.toFixed(0)}%`, detail: '혼잡이 커질 때 유입이 줄어드는 민감도입니다.' },
    { label: 'Adaptive ρ', value: stageRho(stage, effectiveRate).toFixed(2), detail: '적응적 유입을 반영한 현재 점유율입니다.' },
  ];
}

function buildBulkMetrics(controls: SimulationControls, stage: StageSnapshot): TheoryMetric[] {
  const batchSize = Math.max(1, Math.round(controls.batchSize));
  const arrivalWaves = controls.arrivalRate / batchSize;
  const serviceCapacity = stage.meanServiceSeconds > 0
    ? stage.serverCount * batchSize * (60 / stage.meanServiceSeconds)
    : 0;
  const waveSeconds = arrivalWaves > 0 ? 60 / arrivalWaves : 0;
  return [
    { label: 'Batch Size', value: `${batchSize}명`, detail: '한 번에 들어오거나 처리되는 묶음 크기입니다.' },
    { label: 'Wave Interval', value: formatDuration(waveSeconds), detail: '배치 유입 사이 평균 간격입니다.' },
    { label: 'Bulk Capacity', value: `${serviceCapacity.toFixed(1)}명/분`, detail: '배치 처리를 가정한 순간 처리 용량입니다.' },
    { label: 'Wave Pressure', value: stageRho(stage, controls.arrivalRate).toFixed(2), detail: '배치 유입이 만드는 평균 부하 강도입니다.' },
  ];
}

function buildMmcMetrics(arrivalRatePerMinute: number, meanServiceSeconds: number, servers: number): TheoryMetric[] {
  const lambda = arrivalRatePerMinute / 60;
  const mu = meanServiceSeconds > 0 ? 1 / meanServiceSeconds : 0;
  if (lambda <= 0 || mu <= 0 || servers <= 0) {
    return [];
  }
  const offeredLoad = lambda / mu;
  const rho = offeredLoad / servers;
  if (rho >= 1) {
    return [{ label: 'Stability', value: 'unstable', detail: 'ρ ≥ 1 이면 M/M/c 정상상태 해가 존재하지 않습니다.' }];
  }
  const erlang = computeErlangC(offeredLoad, servers);
  const lq = erlang.probabilityWait * rho / (1 - rho);
  const wq = lq / lambda;
  const w = wq + 1 / mu;
  return [
    { label: 'P0', value: erlang.p0.toFixed(2), detail: '모든 서버가 유휴 상태일 확률입니다.' },
    { label: 'P(wait)', value: erlang.probabilityWait.toFixed(2), detail: '도착 고객이 대기할 확률입니다.' },
    { label: '이론 Lq', value: lq.toFixed(2), detail: 'M/M/c의 평균 대기열 길이입니다.' },
    { label: '이론 Wq', value: formatDuration(wq), detail: 'M/M/c의 평균 대기시간입니다.' },
    { label: '이론 W', value: formatDuration(w), detail: '대기 포함 평균 체류시간입니다.' },
  ];
}

function buildErlangBMetrics(arrivalRatePerMinute: number, meanServiceSeconds: number, servers: number): TheoryMetric[] {
  const offeredLoad = (arrivalRatePerMinute / 60) * meanServiceSeconds;
  const blocking = computeErlangB(offeredLoad, servers);
  const carried = offeredLoad * (1 - blocking);
  return [
    { label: 'Erlang-B', value: blocking.toFixed(2), detail: '대기열이 없을 때 차단 확률입니다.' },
    { label: 'Carried Load', value: carried.toFixed(2), detail: '실제로 수용되는 트래픽 양입니다.' },
    { label: 'Utilization', value: (carried / Math.max(servers, 1)).toFixed(2), detail: '서버당 평균 점유율입니다.' },
  ];
}

function buildSerialNetworkMetrics(arrivalRatePerMinute: number, stages: StageSnapshot[]): TheoryMetric[] {
  const dominant = stages.reduce(
    (winner, stage) => {
      const rho = stageRho(stage, arrivalRatePerMinute);
      return rho > winner.rho ? { label: stage.label, rho } : winner;
    },
    { label: stages[0].label, rho: 0 },
  );

  const totalApproxW = stages.reduce((sum, stage) => sum + approximateStageResidenceSeconds(stage, arrivalRatePerMinute), 0);

  return [
    { label: 'Dominant Stage', value: dominant.label, detail: `가장 높은 ρ=${dominant.rho.toFixed(2)}를 보이는 단계입니다.` },
    { label: 'ΣW Approx', value: formatDuration(totalApproxW), detail: '단계별 근사 체류시간을 합친 네트워크 총 체류시간입니다.' },
    { label: 'Bottleneck ρ', value: dominant.rho.toFixed(2), detail: '가장 느린 단계의 부담 정도입니다.' },
  ];
}

function buildJacksonMetrics(controls: SimulationControls, stages: StageSnapshot[]): TheoryMetric[] {
  const pAB = controls.routingProbability / 100;
  const routing = [
    [0, pAB, 1 - pAB],
    [0, 0, 0.55],
    [0, 0.18, 0],
  ];
  const lambdas = solveJacksonTraffic(controls.arrivalRate, routing);
  const nodeMetrics = stages.map((stage, index) => {
    const lambda = lambdas[index] ?? 0;
    const residence = approximateStageResidenceSeconds(stage, lambda);
    return { stage, lambda, rho: stageRho(stage, lambda), residence };
  });
  const totalL = nodeMetrics.reduce((sum, item) => sum + (item.lambda / 60) * item.residence, 0);
  const totalW = controls.arrivalRate > 0 ? (totalL / controls.arrivalRate) * 60 : 0;
  const dominant = nodeMetrics.reduce((winner, item) => (item.rho > winner.rho ? item : winner), nodeMetrics[0]);

  return [
    { label: 'λA, λB, λC', value: nodeMetrics.map((item) => item.lambda.toFixed(1)).join(' / '), detail: 'Traffic equation으로 계산한 노드별 유효 도착률입니다.' },
    { label: 'Dominant Node', value: dominant.stage.label, detail: `가장 높은 node utilization ρ=${dominant.rho.toFixed(2)}입니다.` },
    { label: 'Network L', value: totalL.toFixed(2), detail: 'Jackson 근사에 따른 전체 네트워크 평균 재공 수입니다.' },
    { label: 'Network W', value: formatDuration(totalW), detail: '외부 유입 기준 전체 네트워크 평균 체류시간입니다.' },
  ];
}

function computeErlangC(trafficIntensity: number, servers: number) {
  let sum = 0;
  for (let n = 0; n < servers; n += 1) {
    sum += Math.pow(trafficIntensity, n) / factorial(n);
  }
  const tail =
    (Math.pow(trafficIntensity, servers) / factorial(servers)) *
    (servers / (servers - trafficIntensity));
  const probabilityWait = tail / (sum + tail);
  const p0 = 1 / (sum + tail);
  return { probabilityWait, p0 };
}

function computeErlangB(offeredLoad: number, servers: number) {
  let blocking = 1;
  for (let count = 1; count <= servers; count += 1) {
    blocking = (offeredLoad * blocking) / (count + offeredLoad * blocking);
  }
  return blocking;
}

function solveJacksonTraffic(externalArrivalRatePerMinute: number, routing: number[][]) {
  const pAB = routing[0][1];
  const pAC = routing[0][2];
  const pBC = routing[1][2];
  const pCB = routing[2][1];
  const lambdaA = externalArrivalRatePerMinute;
  const denominator = 1 - pBC * pCB;
  const lambdaB = denominator <= 0 ? lambdaA * pAB : (lambdaA * (pAB + pAC * pCB)) / denominator;
  const lambdaC = lambdaA * pAC + lambdaB * pBC;
  return [lambdaA, lambdaB, lambdaC];
}

function stageRho(stage: StageSnapshot | undefined, arrivalRatePerMinute: number) {
  if (!stage || stage.capacityPerMinute <= 0) {
    return 0;
  }
  return arrivalRatePerMinute / stage.capacityPerMinute;
}

function approximateStageResidenceSeconds(stage: StageSnapshot, arrivalRatePerMinute: number) {
  const rho = stageRho(stage, arrivalRatePerMinute);
  if (arrivalRatePerMinute <= 0) {
    return 0;
  }
  if (stage.distribution === 'deterministic' && stage.serverCount === 1) {
    const lambda = arrivalRatePerMinute / 60;
    const mu = stage.meanServiceSeconds > 0 ? 1 / stage.meanServiceSeconds : 0;
    if (lambda <= 0 || mu <= 0 || rho >= 1) {
      return stage.meanServiceSeconds;
    }
    const lq = (rho * rho) / (2 * (1 - rho));
    return stage.meanServiceSeconds + lq / lambda;
  }
  if (stage.serverCount === 1) {
    const lambda = arrivalRatePerMinute / 60;
    const mu = stage.meanServiceSeconds > 0 ? 1 / stage.meanServiceSeconds : 0;
    if (lambda <= 0 || mu <= 0 || rho >= 1) {
      return stage.meanServiceSeconds;
    }
    return 1 / (mu - lambda);
  }
  const lambda = arrivalRatePerMinute / 60;
  const mu = stage.meanServiceSeconds > 0 ? 1 / stage.meanServiceSeconds : 0;
  if (lambda <= 0 || mu <= 0 || rho >= 1) {
    return stage.meanServiceSeconds;
  }
  const offeredLoad = lambda / mu;
  const erlang = computeErlangC(offeredLoad, stage.serverCount);
  const wq = erlang.probabilityWait / (stage.serverCount * mu - lambda);
  return wq + 1 / mu;
}

function ratioToPercent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return '0.0';
  }
  return ((numerator / denominator) * 100).toFixed(1);
}

function factorial(value: number) {
  if (value <= 1) {
    return 1;
  }
  let total = 1;
  for (let index = 2; index <= value; index += 1) {
    total *= index;
  }
  return total;
}

function detectBottleneck(stages: StageSnapshot[]) {
  let winner = '안정';
  let maxPressure = 0;

  stages.forEach((stage) => {
    const pressure = stage.queueLength + stage.utilization * 3.4;
    if (pressure > maxPressure) {
      maxPressure = pressure;
      winner = stage.label;
    }
  });

  return maxPressure < 2.2 ? '안정' : winner;
}

function reserveAirplaneSeat(state: SimulationState, agent: Agent) {
  if (agent.reservedServerId != null) {
    return agent.reservedServerId;
  }

  const seatStage = state.stages.find((stage) => stage.spec.id === 'seat');
  if (!seatStage) {
    return null;
  }

  const reservedIds = new Set(
    state.agents
      .map((candidate) => candidate.reservedServerId)
      .filter((candidate): candidate is number => candidate != null),
  );
  const availableSeat = seatStage.servers.find((server) => !reservedIds.has(server.id) && server.agentId == null);
  if (!availableSeat) {
    return null;
  }

  agent.reservedServerId = availableSeat.id;
  return availableSeat.id;
}

function getAirplaneReservedSeatTarget(state: SimulationState, agent: Agent, fallback: Vector) {
  if (agent.reservedServerId == null) {
    return fallback;
  }
  const seatStage = state.stages.find((stage) => stage.spec.id === 'seat');
  return getServerTarget(seatStage?.servers ?? [], agent.reservedServerId, fallback);
}

function getAirplaneStowTarget(state: SimulationState, agent: Agent, fallback: Vector) {
  const seatTarget = getAirplaneReservedSeatTarget(state, agent, fallback);
  return {
    x: seatTarget.x,
    y: AIRPLANE_AISLE_Y,
  };
}

function getTargetForAgent(state: SimulationState, agent: Agent) {
  if (agent.phase === 'orbit') {
    return state.scene.points.orbit;
  }

  if (agent.phase === 'thinking') {
    return state.scene.points.think;
  }

  if (agent.phase === 'exiting' || agent.stageIndex == null) {
    return state.scene.points.exit;
  }

  const stage = state.stages[agent.stageIndex];
  if (agent.phase === 'settled') {
    if (state.controls.modelId === 'airplane') {
      return getAirplaneReservedSeatTarget(state, agent, stage.serviceTargetFallback);
    }
    return getServerTarget(stage.servers, agent.serverId, stage.serviceTargetFallback);
  }

  if (agent.phase === 'service') {
    if (state.controls.modelId === 'airplane' && stage.spec.id === 'stow') {
      return getAirplaneStowTarget(state, agent, stage.serviceTargetFallback);
    }
    if (state.controls.modelId === 'airplane' && stage.spec.id === 'seat') {
      return getAirplaneReservedSeatTarget(state, agent, stage.serviceTargetFallback);
    }
    return getServerTarget(stage.servers, agent.serverId, stage.serviceTargetFallback);
  }

  const index = stage.queue.indexOf(agent.id);
  return getQueueSlot(stage, Math.max(index, 0));
}

function getServerTarget(servers: ServerRuntime[], serverId: number | null, fallback: Vector) {
  if (serverId == null) {
    return fallback;
  }
  const server = servers.find((candidate) => candidate.id === serverId);
  return server?.pos ?? fallback;
}

function getQueueSlot(stage: StageRuntime, index: number) {
  if (stage.queueLayout.kind === 'line') {
    return {
      x: stage.queueAnchor.x + stage.queueLayout.stepX * index,
      y: stage.queueAnchor.y + stage.queueLayout.stepY * index,
    };
  }

  const rows = stage.queueLayout.rows ?? 7;
  const column = Math.floor(index / rows);
  const row = index % rows;
  return {
    x: stage.queueAnchor.x + stage.queueLayout.stepX * column,
    y: stage.queueAnchor.y + stage.queueLayout.stepY * row,
  };
}

function getAgent(state: SimulationState, id: number) {
  return state.agents.find((agent) => agent.id === id);
}

function arrive(agent: Agent, target: Vector) {
  const desired = subtract(target, agent.pos);
  const distanceToTarget = magnitude(desired);
  const slowingRadius = agent.phase === 'exiting' ? 120 : 84;
  const speed = distanceToTarget < slowingRadius ? agent.maxSpeed * (distanceToTarget / slowingRadius) : agent.maxSpeed;
  if (distanceToTarget === 0) {
    return { x: 0, y: 0 };
  }
  const steer = setMagnitude(desired, speed);
  steer.x -= agent.vel.x;
  steer.y -= agent.vel.y;
  limitVector(steer, agent.maxForce);
  return steer;
}

function separate(agent: Agent, agents: Agent[]) {
  const desiredDistance = 30;
  const steering = { x: 0, y: 0 };
  let neighbors = 0;

  agents.forEach((other) => {
    if (other.id === agent.id) {
      return;
    }
    const distanceToOther = distance(agent.pos, other.pos);
    if (distanceToOther <= 0 || distanceToOther >= desiredDistance) {
      return;
    }
    const diff = subtract(agent.pos, other.pos);
    const normalized = setMagnitude(diff, 1 / distanceToOther);
    steering.x += normalized.x;
    steering.y += normalized.y;
    neighbors += 1;
  });

  if (neighbors === 0) {
    return steering;
  }

  steering.x /= neighbors;
  steering.y /= neighbors;
  const separated = setMagnitude(steering, agent.maxSpeed);
  separated.x -= agent.vel.x;
  separated.y -= agent.vel.y;
  limitVector(separated, agent.maxForce * 0.92);
  return separated;
}

function subtract(a: Vector, b: Vector) {
  return { x: a.x - b.x, y: a.y - b.y };
}

function magnitude(vector: Vector) {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

function setMagnitude(vector: Vector, value: number) {
  const mag = magnitude(vector);
  if (mag === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: (vector.x / mag) * value,
    y: (vector.y / mag) * value,
  };
}

function distance(a: Vector, b: Vector) {
  return magnitude(subtract(a, b));
}

function limitVector(vector: Vector, max: number) {
  const mag = magnitude(vector);
  if (mag <= max || mag === 0) {
    return;
  }
  vector.x = (vector.x / mag) * max;
  vector.y = (vector.y / mag) * max;
}

function shadeColor(hexColor: string, delta: number) {
  const numeric = Number.parseInt(hexColor.replace('#', ''), 16);
  const red = Math.min(255, Math.max(0, (numeric >> 16) + delta));
  const green = Math.min(255, Math.max(0, ((numeric >> 8) & 0xff) + delta));
  const blue = Math.min(255, Math.max(0, (numeric & 0xff) + delta));
  return `rgb(${red}, ${green}, ${blue})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth) {
      line = trial;
      return;
    }
    if (line) {
      lines.push(line);
    }
    line = word;
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}
