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
  retainedEarnings: number;
};

export type ProductResult = {
  id: ProductId;
  name: string;
  unitsSold: number;
  revenue: number;
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
  otherExpense: number;
  operatingProfit: number;
  interestExpense: number;
  netIncome: number;
};

export type BalanceSheet = {
  cash: number;
  receivables: number;
  inventory: number;
  totalAssets: number;
  payables: number;
  debt: number;
  equity: number;
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
};
