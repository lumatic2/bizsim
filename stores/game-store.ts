'use client';

import { create } from 'zustand';
import type { GameState, Decisions, SimulationResults, FinancialStatements, PersonaId, ChatMessage, CompetitorState, RoundSnapshot, CarryForwardBS } from '@/lib/types';
import { INITIAL_COMPETITORS, updateCompetitorDecisions, qualityCapFromRd } from '@/lib/competitor-ai';

const DEFAULT_DECISIONS: Decisions = {
  price: 349_000,
  rdBudget: 2_100_000_000,
  adBudget: 800_000_000,
  production: 15_000,
  channels: { online: 60, mart: 30, direct: 10 },
  quality: 4,
};

type GameActions = {
  setDecisions: (decisions: Partial<Decisions>) => void;
  setChannels: (channels: Decisions['channels']) => void;
  setResults: (results: SimulationResults) => void;
  setFinancials: (financials: FinancialStatements) => void;
  setStep: (step: GameState['step']) => void;
  setSelectedPersona: (id: PersonaId) => void;
  addMessage: (personaId: PersonaId, message: ChatMessage) => void;
  appendToLastAssistant: (personaId: PersonaId, chunk: string) => void;
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
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  setDecisions: (partial) =>
    set((s) => ({ decisions: { ...s.decisions, ...partial } })),

  setChannels: (channels) =>
    set((s) => ({ decisions: { ...s.decisions, channels } })),

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
    };

    const newCumulativeRd = s.cumulativeRd + s.decisions.rdBudget;
    const newQualityCap = qualityCapFromRd(newCumulativeRd);
    const bs = s.financials.bs;
    const newPreviousBS: CarryForwardBS = {
      cash: bs.cash,
      debt: bs.debt,
      equity: bs.equity,
      retainedEarnings: bs.retainedEarnings,
    };
    const nextRound = s.currentRound + 1;
    const newCompetitors = updateCompetitorDecisions(
      s.results.competitors,
      nextRound,
      s.results.marketShare,
    );

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
    };
  }),

  resetGame: () => set(initialState),
}));
