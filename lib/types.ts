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

export type Decisions = {
  products: [ProductDecision, ProductDecision];
  rdBudget: number;
  adBudget: AdMix;
  channels: { online: number; mart: number; direct: number };
  financing: Financing;
  capexInvestment: number;  // 이번 분기 설비투자 (유형자산 증가, 다음 분기부터 capacity 반영)
  dividendPayout: number;   // 이익잉여금에서 지급하는 현금 배당 (상법 §462 배당가능이익 한도)
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
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
};

export type CarryForwardBS = {
  cash: number;
  debt: number;
  equity: number;
  capitalSurplus: number;
  retainedEarnings: number;
  taxPayable: number;
  ppe: number;
  taxPpe: number;                 // 세법상 유형자산 장부가 (외부 공시 X, 내부 관리용)
  deferredTaxLiability: number;
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
};

export type PnL = {
  revenue: number;
  cogs: number;
  grossProfit: number;
  adExpense: number;
  rdExpense: number;
  depreciationExpense: number;  // 회계상 감가상각비 (정액법 12.5%/분기)
  otherExpense: number;
  operatingProfit: number;
  interestExpense: number;
  pretaxIncome: number;
  currentTax: number;           // 당기 현금 법인세 (세법상 과세소득 기반, 실제 납부 대상)
  deferredTaxExpense: number;   // 이연법인세비용 (음수면 이연법인세수익)
  rdTaxCredit: number;          // 조특법 §10 (중소기업 25%)
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
};
