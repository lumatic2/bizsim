'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameState, Decisions, SimulationResults, FinancialStatements, PersonaId, ChatMessage, CompetitorState, RoundSnapshot, CarryForwardBS, ProductId, ProductDecision } from '@/lib/types';
import { INITIAL_COMPETITORS, updateCompetitorDecisions, qualityCapFromRd } from '@/lib/competitor-ai';
import { CALM_EVENT, rollEvent } from '@/lib/events';
import { DEFAULT_SUPPLY_INDEX, rollSupplyIndex } from '@/lib/supply';
import { DEFAULT_RD_ALLOCATION, exploreBoostFrom } from '@/lib/ansoff';

const DEFAULT_DECISIONS: Decisions = {
  products: [
    { id: 'A', name: '프리미엄 라인', price: 429_000, quality: 4, production: 8_000 },
    { id: 'B', name: '밸류 라인', price: 279_000, quality: 3, production: 7_000 },
  ],
  rdBudget: 2_100_000_000,
  rdAllocation: { ...DEFAULT_RD_ALLOCATION },
  adBudget: { search: 300_000_000, display: 250_000_000, influencer: 250_000_000 },
  channels: { online: 60, mart: 30, direct: 10 },
  financing: { newDebt: 0, newEquity: 0 },
  capexInvestment: 0,
  dividendPayout: 0,
  serviceCapacity: 20_000,  // 분기 서비스 처리 능력 — 초기 unitsSold 범위 커버
};

type GameActions = {
  setDecisions: (decisions: Partial<Decisions>) => void;
  setChannels: (channels: Decisions['channels']) => void;
  setProduct: (id: ProductId, partial: Partial<ProductDecision>) => void;
  setResults: (results: SimulationResults) => void;
  setFinancials: (financials: FinancialStatements) => void;
  setStep: (step: GameState['step']) => void;
  setSelectedPersona: (id: PersonaId) => void;
  addMessage: (personaId: PersonaId, message: ChatMessage) => void;
  appendToLastAssistant: (personaId: PersonaId, chunk: string) => void;
  setRoundDebrief: (round: number, text: string) => void;
  setFinalDebrief: (text: string) => void;
  advanceRound: () => void;
  resetGame: () => void;
};

const initialState: GameState = {
  step: 'decision',
  currentRound: 1,
  maxRounds: 6,
  decisions: DEFAULT_DECISIONS,
  results: null,
  financials: null,
  chatHistories: { jiyeon: [], minsoo: [], soonja: [] },
  selectedPersona: 'jiyeon',
  roundHistory: [],
  competitors: INITIAL_COMPETITORS,
  cumulativeRd: 0,
  qualityCap: 3,
  previousBS: null,
  gameOver: false,
  roundDebriefs: {},
  finalDebrief: null,
  currentEvent: CALM_EVENT,
  brandEquity: 30,
  cumulativeLoss: 0,
  cumulativeProduction: { A: 0, B: 0 },
  supplyIndex: DEFAULT_SUPPLY_INDEX,
  cumulativeImproveRd: 0,
  cumulativeExploreRd: 0,
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set) => ({
      ...initialState,

      setDecisions: (partial) =>
        set((s) => ({ decisions: { ...s.decisions, ...partial } })),

      setChannels: (channels) =>
        set((s) => ({ decisions: { ...s.decisions, channels } })),

      setProduct: (id, partial) =>
        set((s) => {
          const products = s.decisions.products.map((p) => (p.id === id ? { ...p, ...partial } : p)) as Decisions['products'];
          return { decisions: { ...s.decisions, products } };
        }),

      setResults: (results) => set({ results }),
      setFinancials: (financials) => set({ financials }),
      setStep: (step) => set({ step }),
      setSelectedPersona: (id) => set({ selectedPersona: id }),

  addMessage: (personaId, message) =>
    set((s) => ({
      chatHistories: {
        ...s.chatHistories,
        [personaId]: [...s.chatHistories[personaId], message],
      },
    })),

  appendToLastAssistant: (personaId, chunk) =>
    set((s) => {
      const history = [...s.chatHistories[personaId]];
      const last = history[history.length - 1];
      if (last && last.role === 'assistant') {
        history[history.length - 1] = { ...last, content: last.content + chunk };
      }
      return { chatHistories: { ...s.chatHistories, [personaId]: history } };
    }),

  setRoundDebrief: (round, text) =>
    set((s) => ({ roundDebriefs: { ...s.roundDebriefs, [round]: text } })),

  setFinalDebrief: (text) => set({ finalDebrief: text }),

  advanceRound: () => set((s) => {
    if (!s.results || !s.financials) return s;

    const snapshot: RoundSnapshot = {
      round: s.currentRound,
      decisions: s.decisions,
      results: s.results,
      financials: s.financials,
      competitors: s.results.competitors,
      marketSize: s.results.marketSize,
      cumulativeRd: s.cumulativeRd,
      qualityCap: s.qualityCap,
      event: s.currentEvent,
      brandEquity: s.brandEquity,
      supplyIndex: s.supplyIndex,
    };

    // Ansoff R&D 분배: rdBudget을 improve/explore 비율로 나눠 각 stock에 가산
    const alloc = s.decisions.rdAllocation;
    const improveRd = Math.round(s.decisions.rdBudget * (alloc.improve / 100));
    const exploreRd = s.decisions.rdBudget - improveRd;
    const newCumulativeImproveRd = s.cumulativeImproveRd + improveRd;
    const newCumulativeExploreRd = s.cumulativeExploreRd + exploreRd;
    const newCumulativeRd = s.cumulativeRd + s.decisions.rdBudget;
    // qualityCap은 improve 누적에만 반응 (신시장 탐색은 품질 상한 올리지 않음)
    const newQualityCap = qualityCapFromRd(newCumulativeImproveRd);
    const bs = s.financials.bs;
    const newPreviousBS: CarryForwardBS = {
      cash: bs.cash,
      debt: bs.debt,
      equity: bs.equity,
      capitalSurplus: bs.capitalSurplus,
      retainedEarnings: bs.retainedEarnings,
      taxPayable: bs.taxPayable,
      ppe: bs.ppe,
      taxPpe: bs.taxPpe,
      deferredTaxLiability: bs.deferredTaxLiability,
    };
    const nextRound = s.currentRound + 1;
    // 플레이어 상대점유율: 우리 점유율 ÷ 최대 경쟁사 점유율. > 1 이면 BCG Star/Cash Cow 영역.
    const topCompetitorShare = s.results.competitors.reduce(
      (max, c) => (c.marketShare > max ? c.marketShare : max),
      0,
    );
    const playerRelativeShare = topCompetitorShare > 0
      ? s.results.marketShare / topCompetitorShare
      : s.results.marketShare > 0 ? 2 : 0;
    const newCompetitors = updateCompetitorDecisions(
      s.results.competitors,
      {
        round: nextRound,
        playerShare: s.results.marketShare,
        playerRelativeShare,
        supplyIndex: s.supplyIndex,
      },
    );

    // 브랜드 에쿼티: 감가(10%) + 광고비 기반 증가 - 이벤트/증자 페널티 (0~100 clamp).
    // 1B당 +10 pt 정도면 800M ~ 2B 레인지에서 의미있는 변동
    const totalAd = s.decisions.adBudget.search + s.decisions.adBudget.display + s.decisions.adBudget.influencer;
    const adGrowth = totalAd / 100_000_000;
    const eventPenalty = s.currentEvent.effects.brandEquityPenalty ?? 0;
    const dilutionPenalty = s.decisions.financing.newEquity / 1_000_000_000; // 증자 1B당 -1 pt
    const newBrandEquity = Math.max(0, Math.min(100, s.brandEquity * 0.9 + adGrowth - eventPenalty - dilutionPenalty));

    // 이월결손금 갱신: 당기 법인세차감전순이익 기준 (게임 전체 기간 이월, 실제 법령 15년 단순화)
    const pretax = s.financials.pnl.pretaxIncome;
    let newCumulativeLoss = s.cumulativeLoss;
    if (pretax > 0) {
      const used = Math.min(pretax, newCumulativeLoss);
      newCumulativeLoss -= used;
    } else if (pretax < 0) {
      newCumulativeLoss += -pretax;
    }

    const nextEvent = rollEvent(nextRound);

    // 학습곡선 stock: 이번 분기 실제 생산량(capacity 반영 후)을 제품별 누적에 가산
    const newCumulativeProduction: Record<ProductId, number> = {
      A: s.cumulativeProduction.A + (s.results.perProduct.A?.produced ?? 0),
      B: s.cumulativeProduction.B + (s.results.perProduct.B?.produced ?? 0),
    };

    // 공급자 교섭력: 다음 라운드 원자재 가격 지수를 AR(1) + drift로 갱신
    const newSupplyIndex = rollSupplyIndex(s.supplyIndex);

    return {
      roundHistory: [...s.roundHistory, snapshot],
      currentRound: nextRound,
      cumulativeRd: newCumulativeRd,
      qualityCap: newQualityCap,
      previousBS: newPreviousBS,
      competitors: newCompetitors,
      results: null,
      financials: null,
      chatHistories: { jiyeon: [], minsoo: [], soonja: [] },
      step: 'decision' as const,
      gameOver: nextRound > s.maxRounds,
      currentEvent: nextEvent,
      brandEquity: newBrandEquity,
      cumulativeLoss: newCumulativeLoss,
      cumulativeProduction: newCumulativeProduction,
      supplyIndex: newSupplyIndex,
      cumulativeImproveRd: newCumulativeImproveRd,
      cumulativeExploreRd: newCumulativeExploreRd,
    };
  }),

      resetGame: () => set(initialState),
    }),
    {
      name: 'bizsim-game',
      version: 11,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted: unknown, version: number) => {
        // v11: Phase F Queueing 흡수 — decisions.serviceCapacity + results.serviceQueue 추가. 이전 버전은 리셋.
        if (version < 11) {
          return initialState;
        }
        return persisted;
      },
      partialize: (state) => ({
        currentRound: state.currentRound,
        maxRounds: state.maxRounds,
        decisions: state.decisions,
        results: state.results,
        financials: state.financials,
        chatHistories: state.chatHistories,
        selectedPersona: state.selectedPersona,
        roundHistory: state.roundHistory,
        competitors: state.competitors,
        cumulativeRd: state.cumulativeRd,
        qualityCap: state.qualityCap,
        previousBS: state.previousBS,
        gameOver: state.gameOver,
        roundDebriefs: state.roundDebriefs,
        finalDebrief: state.finalDebrief,
        currentEvent: state.currentEvent,
        brandEquity: state.brandEquity,
        cumulativeLoss: state.cumulativeLoss,
        cumulativeProduction: state.cumulativeProduction,
        supplyIndex: state.supplyIndex,
        cumulativeImproveRd: state.cumulativeImproveRd,
        cumulativeExploreRd: state.cumulativeExploreRd,
      }),
    },
  ),
);
