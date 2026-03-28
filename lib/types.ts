export type PersonaId = 'jiyeon' | 'minsoo' | 'soonja';

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
  emoji: string;
};

export type Decisions = {
  price: number;
  rdBudget: number;
  adBudget: number;
  production: number;
  channels: { online: number; mart: number; direct: number };
  quality: number;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type SimulationResults = {
  marketShare: number;
  revenue: number;
  operatingProfit: number;
  satisfaction: number;
  unitsSold: number;
  segmentDemand: Record<PersonaId, number>;
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
  decisions: Decisions;
  results: SimulationResults | null;
  financials: FinancialStatements | null;
  chatHistories: Record<PersonaId, ChatMessage[]>;
  selectedPersona: PersonaId;
};
