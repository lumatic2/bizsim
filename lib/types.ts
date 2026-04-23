export type PersonaId = 'jiyeon' | 'minsoo' | 'soonja';

export type AdChannel = 'search' | 'display' | 'influencer';

export type AdMix = { search: number; display: number; influencer: number };

export type AdResponse = { search: number; display: number; influencer: number };

export type PersonaAttributes = {
  id: PersonaId;
  name: string;
  age: number;
  description: string;
  priceSensitivity: number;
  qualityWeight: number;
  brandLoyalty: number;
  channelPreference: { online: number; mart: number; direct: number };
  segmentShare: number;
  adSaturation: number;
  adResponse: AdResponse;
  emoji: string;
};

export type Financing = { newDebt: number; newEquity: number };

export type ProductId = 'A' | 'B';

export type ProductDecision = {
  id: ProductId;
  name: string;
  price: number;
  quality: number;
  production: number;
};

export type RdAllocation = {
  improve: number;  // % of rdBudget → quality cap (기존 제품·시장 침투)
  explore: number;  // % of rdBudget → 신시장 탐색 (플레이어 전용 시장 확장)
};

export type Headcount = {
  sales: number;  // 영업팀 규모 — 직영 채널 효과 배수 (0.8 + N×0.05)
  rd: number;     // R&D 팀 규모 — cumulativeImproveRd 실효 배수 (0.8 + N×0.05)
};

// 급여 수준 (1.0 = 업계평균). 0.7~1.5 범위. 낮으면 이탈, 높으면 인건비 부담.
export type SalaryMultiplier = number;

export type Decisions = {
  products: [ProductDecision, ProductDecision];
  rdBudget: number;
  rdAllocation: RdAllocation;  // Ansoff: improve(quality cap) vs explore(시장 확장)
  adBudget: AdMix;
  channels: { online: number; mart: number; direct: number };
  financing: Financing;
  capexInvestment: number;  // 이번 분기 설비투자 (유형자산 증가, 다음 분기부터 capacity 반영)
  dividendPayout: number;   // 이익잉여금에서 지급하는 현금 배당 (상법 §462 배당가능이익 한도)
  serviceCapacity: number;  // 분기 서비스 처리 능력 (A/S·상담·배송). 대당 50,000원 opex 가산
  headcount: Headcount;     // 인력 레버 (영업·R&D) — 채널 효과·R&D 실효성에 영향
  salaryMultiplier: SalaryMultiplier;  // 급여 수준 배수. 1.0 = 업계평균. <0.9 이탈 위험, >1.1 인건비 부담
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type CompetitorArchetype = {
  label: string;      // 짧은 태그 (예: "공격형 리더")
  summary: string;    // 한 줄 설명
  strengths: string;  // 강점
  playbook: string;   // 전형적 반응 패턴
};

export type CompetitorState = {
  name: string;
  price: number;
  adBudget: number;
  quality: number;
  channels: { online: number; mart: number; direct: number };
  marketShare: number;
  revenue: number;
  unitsSold: number;
  cumulativeRd: number;  // 경쟁사 R&D 스태미나 (품질 상승 속도 결정)
  archetype?: CompetitorArchetype;  // 전략 성향 메타 (UI 표시용, 시뮬 로직에는 미사용)
};

export type EventSeverity = 'good' | 'bad' | 'neutral';

export type EventEffects = {
  costMultiplier?: number;
  marketSizeMultiplier?: number;
  qualityCapBonus?: number;
  competitorQualityBoost?: number;
  martChannelPenalty?: number;
  satisfactionPenalty?: number;
  brandEquityPenalty?: number;
};

export type RoundEvent = {
  id: string;
  title: string;
  description: string;
  severity: EventSeverity;
  effects: EventEffects;
};

export type RoundSnapshot = {
  round: number;
  decisions: Decisions;
  results: SimulationResults;
  financials: FinancialStatements;
  competitors: CompetitorState[];
  marketSize: number;
  cumulativeRd: number;
  qualityCap: number;
  event: RoundEvent;
  brandEquity: number;
  supplyIndex: number;
};

export type CarryForwardBS = {
  cash: number;
  receivables: number;  // 매출채권 (간접법 CF에서 ΔAR 계산용)
  inventory: number;    // 재고자산 (ΔInventory)
  payables: number;     // 매입채무 (ΔAP)
  debt: number;
  equity: number;
  capitalSurplus: number;
  retainedEarnings: number;
  taxPayable: number;
  ppe: number;
  taxPpe: number;                 // 세법상 유형자산 장부가 (외부 공시 X, 내부 관리용)
  deferredTaxLiability: number;
  deferredTaxAsset: number;
};

export type ProductResult = {
  id: ProductId;
  name: string;
  produced: number;   // 실제 생산량 (capacity 제약 반영 후)
  unitsSold: number;
  revenue: number;
  cogs: number;                // 제품별 매출원가 (변동제조원가 합)
  grossProfit: number;         // revenue − cogs
  allocatedOverhead: number;   // 매출 비중 기반 배분된 공통간접비 (광고·R&D·감가상각·일반관리비)
  segmentProfit: number;       // grossProfit − allocatedOverhead (사업부문 이익)
  segmentDemand: Record<PersonaId, number>;
};

export type ServiceQueueReport = {
  utilization: number;
  satisfactionDelta: number;
  overflow: number;
};

export type SimulationResults = {
  marketShare: number;
  revenue: number;
  operatingProfit: number;
  satisfaction: number;
  unitsSold: number;
  segmentDemand: Record<PersonaId, number>;
  marketSize: number;
  competitors: CompetitorState[];
  perProduct: Record<ProductId, ProductResult>;
  serviceQueue: ServiceQueueReport;
};

export type PnL = {
  revenue: number;
  cogs: number;
  grossProfit: number;
  adExpense: number;
  rdExpense: number;
  depreciationExpense: number;  // 회계상 감가상각비 (정액법 12.5%/분기)
  laborCost: number;            // 인건비 (영업·R&D 인력 × 1인당 분기 급여)
  maintenanceCost: number;      // 설비유지비 (PPE × 유지율)
  serviceCost: number;          // 서비스 capacity opex (대당 50,000원)
  inventoryHoldingCost: number; // 기말 재고 × 분기 유지비율 (창고·자본기회비용)
  otherExpense: number;         // G&A baseline + laborCost + maintenanceCost + serviceCost + inventoryHoldingCost
  operatingProfit: number;
  interestExpense: number;
  pretaxIncome: number;
  currentTax: number;           // 당기 현금 법인세 (세법상 과세소득 기반, 실제 납부 대상)
  deferredTaxExpense: number;   // 이연법인세비용 (음수면 이연법인세수익)
  rdTaxCredit: number;          // 조특법 §10 (중소기업 25%)
  investmentTaxCredit: number;  // 조특법 §24 통합투자세액공제 (중소기업 7%)
  incomeTax: number;            // 회계상 총 법인세비용 = currentTax + deferredTaxExpense
  netIncome: number;
};

export type BalanceSheet = {
  cash: number;
  receivables: number;
  inventory: number;
  ppe: number;              // 유형자산 장부가 (정액법 감가상각 후)
  taxPpe: number;           // [내부] 세법상 유형자산 장부가 (UI 미노출, carry-forward 용)
  totalAssets: number;
  payables: number;
  taxPayable: number;
  deferredTaxLiability: number;  // 이연법인세부채 (세법·회계 일시차이 × 세율 누적)
  deferredTaxAsset: number;      // 이연법인세자산 (세법 < 회계 누적 손실·차이 × 세율)
  debt: number;
  equity: number;           // 자본금 (액면)
  capitalSurplus: number;   // 자본잉여금 (주식발행초과금)
  retainedEarnings: number;
  totalLiabilities: number;
};

export type CashFlow = {
  operatingCF: number;
  investingCF: number;
  financingCF: number;
  netCashChange: number;
};

export type FinancialStatements = {
  pnl: PnL;
  bs: BalanceSheet;
  cf: CashFlow;
};

export type GameState = {
  step: 'decision' | 'interview' | 'results' | 'financials';
  currentRound: number;
  maxRounds: number;
  decisions: Decisions;
  results: SimulationResults | null;
  financials: FinancialStatements | null;
  chatHistories: Record<PersonaId, ChatMessage[]>;
  selectedPersona: PersonaId;
  roundHistory: RoundSnapshot[];
  competitors: CompetitorState[];
  cumulativeRd: number;
  qualityCap: number;
  previousBS: CarryForwardBS | null;
  gameOver: boolean;
  roundDebriefs: Record<number, string>;
  finalDebrief: string | null;
  currentEvent: RoundEvent;
  brandEquity: number;
  cumulativeLoss: number;  // 이월결손금 잔액 (누적 적자 - 이미 공제 사용된 분)
  cumulativeProduction: Record<ProductId, number>;  // 제품별 누적 실제 생산량 (학습곡선 stock)
  supplyIndex: number;  // 공급자 교섭력 지수 (Porter 5 Forces) — 1.0 기준, 원자재 가격 배수
  cumulativeImproveRd: number;  // Ansoff improve 누적 R&D (quality cap 산출 기반)
  cumulativeExploreRd: number;  // Ansoff explore 누적 R&D (시장 확장 부스트 기반)
  pendingProduction: Record<ProductId, number>;  // 생산 리드타임: 이번 분기에 실현되는 제품별 생산량 (전 분기 의사결정분)
  adstock: AdMix;  // Koyck adstock: 직전 분기 효과 스톡 (이번 분기 광고 효과 = 현재 예산 + λ×adstock)
  lastAttrition: { sales: number; rd: number };  // 직전 분기 이탈자 수 (UI 표시용)
};
