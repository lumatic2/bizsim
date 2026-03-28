'use client';

import { create } from 'zustand';
import type { GameState, Decisions, SimulationResults, FinancialStatements, PersonaId, ChatMessage } from '@/lib/types';

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
  reset: () => void;
};

const initialState: GameState = {
  step: 'decision',
  decisions: DEFAULT_DECISIONS,
  results: null,
  financials: null,
  chatHistories: { jiyeon: [], minsoo: [], soonja: [] },
  selectedPersona: 'jiyeon',
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

  reset: () => set(initialState),
}));
