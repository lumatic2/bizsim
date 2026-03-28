import type { Decisions, SimulationResults, PersonaId } from './types';
import { PERSONAS } from './personas';

const MARKET_SIZE = 100_000;
const BASE_PRICE = 349_000;
const BASE_QUALITY = 3;

const COMPETITORS = [
  { name: '경쟁사A', share: 0.22 },
  { name: '경쟁사B', share: 0.18 },
  { name: '경쟁사C', share: 0.15 },
];
const COMPETITOR_TOTAL = COMPETITORS.reduce((s, c) => s + c.share, 0);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function calculateSegmentDemand(decisions: Decisions): Record<PersonaId, number> {
  const result: Record<string, number> = {};

  for (const persona of PERSONAS) {
    const priceEffect = Math.pow(
      BASE_PRICE / decisions.price,
      persona.priceSensitivity
    );

    const qualityEffect = Math.pow(
      decisions.quality / BASE_QUALITY,
      persona.qualityWeight
    );

    const adEffect = 1 - Math.exp(-decisions.adBudget / persona.adSaturation);

    const channelEffect =
      (decisions.channels.online / 100) * persona.channelPreference.online +
      (decisions.channels.mart / 100) * persona.channelPreference.mart +
      (decisions.channels.direct / 100) * persona.channelPreference.direct;

    const demand = MARKET_SIZE *
      persona.segmentShare *
      priceEffect *
      qualityEffect *
      clamp(adEffect, 0.1, 1) *
      clamp(channelEffect * 3, 0.3, 1.5);

    result[persona.id] = Math.round(clamp(demand, 0, MARKET_SIZE * persona.segmentShare));
  }

  return result as Record<PersonaId, number>;
}

export function runSimulation(decisions: Decisions): SimulationResults {
  const segmentDemand = calculateSegmentDemand(decisions);
  const totalDemand = Object.values(segmentDemand).reduce((s, d) => s + d, 0);
  const unitsSold = Math.min(totalDemand, decisions.production);
  const revenue = unitsSold * decisions.price;

  const unitCost = 120_000 + (decisions.quality - 1) * 25_000;
  const cogs = unitsSold * unitCost;
  const grossProfit = revenue - cogs;
  const operatingProfit = grossProfit - decisions.adBudget - (decisions.rdBudget / 4) - 100_000_000;

  const ourShare = totalDemand / MARKET_SIZE;
  const adjustedShare = clamp(ourShare * (1 - COMPETITOR_TOTAL), 0, 1 - COMPETITOR_TOTAL);
  const marketShare = adjustedShare * 100;

  const priceSatisfaction = clamp(1 - (decisions.price - 250_000) / 300_000, 0.3, 1);
  const qualitySatisfaction = decisions.quality / 5;
  const satisfaction = Math.round((priceSatisfaction * 40 + qualitySatisfaction * 60) * 100) / 100;

  return {
    marketShare: Math.round(marketShare * 10) / 10,
    revenue,
    operatingProfit,
    satisfaction: Math.round(satisfaction),
    unitsSold,
    segmentDemand,
  };
}
