'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameState, Decisions, SimulationResults, FinancialStatements, PersonaId, ChatMessage, CompetitorState, RoundSnapshot, CarryForwardBS, ProductId, ProductDecision } from '@/lib/types';
import { INITIAL_COMPETITORS, updateCompetitorDecisions, qualityCapFromRd } from '@/lib/competitor-ai';
import { CALM_EVENT, rollEvent } from '@/lib/events';

const DEFAULT_DECISIONS: Decisions = {
  products: [
    { id: 'A', name: '프리미엄 라인', price: 429_000, quality: 4, production: 8_000 },
    { id: 'B', name: '밸류 라인', price: 279_000, quality: 3, production: 7_000 },
  ],
  rdBudget: 2_100_000_000,
  adBudget: { search: 300_000_000, display: 250_000_000, influencer: 250_000_000 },
  channels: { online: 60, mart: 30, direct: 10 },
  financing: { newDebt: 0, newEquity: 0 },
  capexInvestment: 0,
  dividendPayout: 0,
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
    };

    const newCumulativeRd = s.cumulativeRd + s.decisions.rdBudget;
    const newQualityCap = qualityCapFromRd(newCumulativeRd);
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
    const newCompetitors = updateCompetitorDecisions(
      s.results.competitors,
      nextRound,
      s.results.marketShare,
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
    };
  }),

      resetGame: () => set(initialState),
    }),
    {
      name: 'bizsim-game',
      version: 6,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted: unknown, version: number) => {
        // v6: Phase D 묶음4 (배당·이연법인세·원가배분) 구조 추가. 이전 버전은 전부 리셋.
        if (version < 6) {
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
      }),
    },
  ),
);
