import type { Decisions, SimulationResults, PersonaId, CompetitorState, RoundEvent, ProductDecision, ProductResult, ProductId } from './types';
import { PERSONAS } from './personas';
import { CALM_EVENT } from './events';

const BASE_PRICE = 349_000;
const BASE_QUALITY = 3;
const NEUTRAL_BRAND = 50;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type DemandInput = {
  price: number;
  quality: number;
  adBudget: Decisions['adBudget'];
  channels: Decisions['channels'];
};

function calculateSegmentDemand(
  input: DemandInput,
  marketSize: number,
  martPenalty: number,
  brandEquity: number,
): Record<PersonaId, number> {
  const result: Record<string, number> = {};
  const brandDelta = (brandEquity - NEUTRAL_BRAND) / 200;

  for (const persona of PERSONAS) {
    const priceSens = Math.max(0.1, persona.priceSensitivity * (1 - brandDelta * 0.5));
    const priceEffect = Math.pow(BASE_PRICE / input.price, priceSens);
    const qualityEffect = Math.pow(input.quality / BASE_QUALITY, persona.qualityWeight);

    const effectiveAd =
      input.adBudget.search * persona.adResponse.search +
      input.adBudget.display * persona.adResponse.display +
      input.adBudget.influencer * persona.adResponse.influencer;
    const adEffect = 1 - Math.exp(-effectiveAd / persona.adSaturation);

    const effectiveMart = (input.channels.mart / 100) * martPenalty;
    const channelEffect =
      (input.channels.online / 100) * persona.channelPreference.online +
      effectiveMart * persona.channelPreference.mart +
      (input.channels.direct / 100) * persona.channelPreference.direct;

    const brandBonus = clamp(1 + persona.brandLoyalty * brandDelta, 0.7, 1.3);

    const demand = marketSize *
      persona.segmentShare *
      priceEffect *
      qualityEffect *
      clamp(adEffect, 0.1, 1) *
      clamp(channelEffect * 3, 0.3, 1.5) *
      brandBonus;

    result[persona.id] = Math.round(clamp(demand, 0, marketSize * persona.segmentShare));
  }

  return result as Record<PersonaId, number>;
}

function unitCostFor(quality: number, costMultiplier: number): number {
  return Math.round((120_000 + (quality - 1) * 25_000) * costMultiplier);
}

export function runSimulation(
  decisions: Decisions,
  competitors: CompetitorState[],
  marketSize: number,
  qualityCap: number,
  event: RoundEvent = CALM_EVENT,
  brandEquity: number = NEUTRAL_BRAND,
  productionCapacity: number = Infinity,
): SimulationResults {
  const effects = event.effects;
  const effectiveMarketSize = Math.round(marketSize * (effects.marketSizeMultiplier ?? 1));
  const effectiveQualityCap = qualityCap + (effects.qualityCapBonus ?? 0);
  const martPenalty = effects.martChannelPenalty ?? 1;
  const competitorBoost = effects.competitorQualityBoost ?? 0;
  const costMultiplier = effects.costMultiplier ?? 1;

  // 생산능력 제약: 제품 A+B 합계가 capacity 초과 시 비례 축소하여 "실제 생산 가능량"으로 환산
  const requestedProduction = decisions.products.reduce((s, p) => s + p.production, 0);
  const capacityRatio = requestedProduction > productionCapacity && requestedProduction > 0
    ? productionCapacity / requestedProduction
    : 1;

  const totalAd = decisions.adBudget.search + decisions.adBudget.display + decisions.adBudget.influencer;

  // 제품별 수요 계산. 캐니벌라이제이션은 단순화 (제품 A, B 독립 집계).
  const perProduct: Record<ProductId, ProductResult> = { A: emptyResult(decisions.products[0]), B: emptyResult(decisions.products[1]) };
  let totalUnitsSold = 0;
  let totalRevenue = 0;
  let totalCogs = 0;
  const aggregateSegmentDemand: Record<PersonaId, number> = { jiyeon: 0, minsoo: 0, soonja: 0 };
  let weightedSatisfaction = 0;
  let weightedUnits = 0;

  for (const product of decisions.products) {
    const effectiveQuality = Math.min(product.quality, Math.floor(effectiveQualityCap));
    const demandInput: DemandInput = {
      price: product.price,
      quality: effectiveQuality,
      adBudget: decisions.adBudget,
      channels: decisions.channels,
    };

    const sd = calculateSegmentDemand(demandInput, effectiveMarketSize, martPenalty, brandEquity);
    const totalDemand = Object.values(sd).reduce((s, d) => s + d, 0);
    const effectiveProduction = Math.floor(product.production * capacityRatio);
    const unitsSold = Math.min(totalDemand, effectiveProduction);
    const revenue = unitsSold * product.price;
    const unitCost = unitCostFor(effectiveQuality, costMultiplier);
    const productCogs = unitsSold * unitCost;
    totalCogs += productCogs;
    totalUnitsSold += unitsSold;
    totalRevenue += revenue;

    for (const pid of ['jiyeon', 'minsoo', 'soonja'] as PersonaId[]) {
      aggregateSegmentDemand[pid] += sd[pid];
    }

    const priceSatisfaction = clamp(1 - (product.price - 250_000) / 300_000, 0.3, 1);
    const qualitySatisfaction = effectiveQuality / 5;
    const rawSat = priceSatisfaction * 40 + qualitySatisfaction * 60;
    weightedSatisfaction += rawSat * unitsSold;
    weightedUnits += unitsSold;

    perProduct[product.id] = {
      id: product.id,
      name: product.name,
      produced: effectiveProduction,
      unitsSold,
      revenue,
      cogs: productCogs,
      grossProfit: revenue - productCogs,
      allocatedOverhead: 0, // 배분은 재무 단계에서 PnL 확정 후 재계산 (runSimulation 말미에 채움)
      segmentProfit: revenue - productCogs,
      segmentDemand: sd,
    };
  }

  // 공통간접비 매출 비중 배분: 광고·R&D·감가상각·일반관리비·이자비용 합계를 제품 매출 비율로 나눔.
  // 감가상각과 이자는 이 시점엔 아직 모름 → financial-mapper에서 다시 덮어씀. 여기서는 판매단계 OH만 배분.
  // 단순화: 여기서는 광고비 + R&D + otherExpense(고정 100M)만 배분. 감가/이자/세금은 PnL 확정 후.
  const runtimeOverhead = totalAd + decisions.rdBudget / 4 + 100_000_000;
  for (const id of ['A', 'B'] as ProductId[]) {
    const pr = perProduct[id];
    const share = totalRevenue > 0 ? pr.revenue / totalRevenue : 0.5;
    pr.allocatedOverhead = Math.round(runtimeOverhead * share);
    pr.segmentProfit = pr.grossProfit - pr.allocatedOverhead;
  }

  // 경쟁사 수요: 대표 제품 하나로 모델링 (기존 구조 유지)
  const competitorDemands = competitors.map((c) => {
    const third = c.adBudget / 3;
    const demandInput: DemandInput = {
      price: c.price,
      quality: clamp(c.quality + competitorBoost, 1, 5),
      adBudget: { search: third, display: third, influencer: third },
      channels: c.channels,
    };
    const sd = calculateSegmentDemand(demandInput, effectiveMarketSize, martPenalty, NEUTRAL_BRAND);
    return Object.values(sd).reduce((s, d) => s + d, 0);
  });

  const competitorDemandTotal = competitorDemands.reduce((s, d) => s + d, 0);
  const totalMarket = totalUnitsSold + competitorDemandTotal;
  const marketShare = totalMarket > 0 ? Math.round((totalUnitsSold / totalMarket) * 100 * 10) / 10 : 0;

  const grossProfit = totalRevenue - totalCogs;
  const operatingProfit = grossProfit - totalAd - decisions.rdBudget / 4 - 100_000_000;

  const avgSatisfaction = weightedUnits > 0 ? weightedSatisfaction / weightedUnits : 0;
  const satisfaction = Math.round(clamp(avgSatisfaction - (effects.satisfactionPenalty ?? 0), 0, 100));

  const updatedCompetitors: CompetitorState[] = competitors.map((c, i) => {
    const cShareRatio = totalMarket > 0 ? competitorDemands[i] / totalMarket : 0;
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
    revenue: totalRevenue,
    operatingProfit,
    satisfaction,
    unitsSold: totalUnitsSold,
    segmentDemand: aggregateSegmentDemand,
    marketSize: effectiveMarketSize,
    competitors: updatedCompetitors,
    perProduct,
  };
}

function emptyResult(product: ProductDecision): ProductResult {
  return {
    id: product.id,
    name: product.name,
    produced: 0,
    unitsSold: 0,
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    allocatedOverhead: 0,
    segmentProfit: 0,
    segmentDemand: { jiyeon: 0, minsoo: 0, soonja: 0 },
  };
}
