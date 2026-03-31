import type { Decisions, SimulationResults, PersonaId, CompetitorState } from './types';
import { PERSONAS } from './personas';

const BASE_PRICE = 349_000;
const BASE_QUALITY = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function calculateSegmentDemand(decisions: Decisions, marketSize: number): Record<PersonaId, number> {
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

    const demand = marketSize *
      persona.segmentShare *
      priceEffect *
      qualityEffect *
      clamp(adEffect, 0.1, 1) *
      clamp(channelEffect * 3, 0.3, 1.5);

    result[persona.id] = Math.round(clamp(demand, 0, marketSize * persona.segmentShare));
  }

  return result as Record<PersonaId, number>;
}

export function runSimulation(
  decisions: Decisions,
  competitors: CompetitorState[],
  marketSize: number,
  qualityCap: number,
): SimulationResults {
  const effectiveQuality = Math.min(decisions.quality, Math.floor(qualityCap));
  const effectiveDecisions = { ...decisions, quality: effectiveQuality };

  const segmentDemand = calculateSegmentDemand(effectiveDecisions, marketSize);
  const totalPlayerDemand = Object.values(segmentDemand).reduce((s, d) => s + d, 0);

  // 경쟁사별 수요 계산 (동일 모델 사용)
  const competitorDemands = competitors.map((c) => {
    const cDecisions: Decisions = {
      price: c.price,
      rdBudget: 0,
      adBudget: c.adBudget,
      production: 30_000, // 경쟁사는 생산제약 없다고 가정
      channels: c.channels,
      quality: c.quality,
    };
    const sd = calculateSegmentDemand(cDecisions, marketSize);
    return Object.values(sd).reduce((s, d) => s + d, 0);
  });

  const totalDemand = totalPlayerDemand + competitorDemands.reduce((s, d) => s + d, 0);
  const playerShareRatio = totalDemand > 0 ? totalPlayerDemand / totalDemand : 0;

  const unitsSold = Math.min(totalPlayerDemand, decisions.production);
  const revenue = unitsSold * decisions.price;

  const unitCost = 120_000 + (effectiveQuality - 1) * 25_000;
  const cogs = unitsSold * unitCost;
  const grossProfit = revenue - cogs;
  const operatingProfit = grossProfit - decisions.adBudget - (decisions.rdBudget / 4) - 100_000_000;

  const marketShare = Math.round(playerShareRatio * 100 * 10) / 10;

  const priceSatisfaction = clamp(1 - (decisions.price - 250_000) / 300_000, 0.3, 1);
  const qualitySatisfaction = effectiveQuality / 5;
  const satisfaction = Math.round((priceSatisfaction * 40 + qualitySatisfaction * 60) * 100) / 100;

  // 경쟁사 결과 업데이트
  const updatedCompetitors: CompetitorState[] = competitors.map((c, i) => {
    const cShareRatio = totalDemand > 0 ? competitorDemands[i] / totalDemand : 0;
    const cShare = Math.round(cShareRatio * 100 * 10) / 10;
    const cSold = Math.round(competitorDemands[i]);
    return {
      ...c,
      marketShare: cShare,
      unitsSold: Math.min(cSold, 30_000),
      revenue: Math.min(cSold, 30_000) * c.price,
    };
  });

  return {
    marketShare,
    revenue,
    operatingProfit,
    satisfaction: Math.round(satisfaction),
    unitsSold,
    segmentDemand,
    marketSize,
    competitors: updatedCompetitors,
  };
}
