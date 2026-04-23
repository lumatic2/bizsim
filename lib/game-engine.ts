import type { Decisions, SimulationResults, PersonaId, CompetitorState, RoundEvent, ProductDecision, ProductResult, ProductId, AdMix } from './types';
import { PERSONAS } from './personas';
import { CALM_EVENT } from './events';
import { learningCurveMultiplier } from './learning-curve';
import { serviceQueueImpact, SERVICE_COST_PER_UNIT } from './service-queue';
import { combineAdstock, EMPTY_ADSTOCK } from './adstock';
import { directChannelMultiplier, laborCostOf, G_AND_A_BASELINE, MAINTENANCE_RATE } from './labor';

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

function unitCostFor(quality: number, costMultiplier: number, learningMultiplier: number = 1, supplyIndex: number = 1): number {
  return Math.round((120_000 + (quality - 1) * 25_000) * costMultiplier * learningMultiplier * supplyIndex);
}

export function runSimulation(
  decisions: Decisions,
  competitors: CompetitorState[],
  marketSize: number,
  qualityCap: number,
  event: RoundEvent = CALM_EVENT,
  brandEquity: number = NEUTRAL_BRAND,
  productionCapacity: number = Infinity,
  cumulativeProduction: Record<ProductId, number> = { A: 0, B: 0 },
  supplyIndex: number = 1,
  exploreBoost: number = 0,
  // 이번 분기 실현 생산량 (생산 리드타임: 전 분기 의사결정분). 미지정 시 즉시생산 가정(레거시 호환).
  pendingProduction: Record<ProductId, number> = {
    A: decisions.products[0].production,
    B: decisions.products[1].production,
  },
  prevAdstock: AdMix = EMPTY_ADSTOCK,
): SimulationResults {
  const effects = event.effects;
  const effectiveMarketSize = Math.round(marketSize * (effects.marketSizeMultiplier ?? 1));
  // Ansoff explore: 플레이어 전용 유효시장 확장. 경쟁사는 기존 effectiveMarketSize로 계산.
  const playerMarketSize = Math.round(effectiveMarketSize * (1 + exploreBoost));
  const effectiveQualityCap = qualityCap + (effects.qualityCapBonus ?? 0);
  const martPenalty = effects.martChannelPenalty ?? 1;
  const competitorBoost = effects.competitorQualityBoost ?? 0;
  const costMultiplier = effects.costMultiplier ?? 1;

  // 생산능력 제약: 실현 생산(pending) 합계가 capacity 초과 시 비례 축소.
  // 리드타임 도입 후 capacity 제약은 "이번 분기 실제 제조 가능량"에만 적용.
  const requestedProduction = pendingProduction.A + pendingProduction.B;
  const capacityRatio = requestedProduction > productionCapacity && requestedProduction > 0
    ? productionCapacity / requestedProduction
    : 1;

  // Adstock (광고 carryover) 적용: 수요 계산에 쓰이는 유효 광고 = 현재 예산 + λ×전분기 스톡
  const effectiveAdBudget = combineAdstock(decisions.adBudget, prevAdstock);
  // 영업팀 규모 효과: 직영 채널 실효 비중을 headcount 배수로 조정 (baseline 4명 = ×1.0)
  const directBoost = directChannelMultiplier(decisions.headcount.sales);
  const adjustedChannels = {
    online: decisions.channels.online,
    mart: decisions.channels.mart,
    direct: decisions.channels.direct * directBoost,
  };
  // totalAd는 재무·UI용 이번 분기 실제 현금 지출 — carryover 아님 (현금 지출은 decisions.adBudget 원본)
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
      adBudget: effectiveAdBudget,
      channels: adjustedChannels,
    };

    const sd = calculateSegmentDemand(demandInput, playerMarketSize, martPenalty, brandEquity);
    const totalDemand = Object.values(sd).reduce((s, d) => s + d, 0);
    // 실현 생산량(전분기 결정분 또는 레거시 즉시생산) × capacity 제약 비율
    const effectiveProduction = Math.floor((pendingProduction[product.id] ?? product.production) * capacityRatio);
    const unitsSold = Math.min(totalDemand, effectiveProduction);
    const revenue = unitsSold * product.price;
    // 학습곡선: 기초 누적생산량 기준으로 이번 분기 unit cost 체감 계수 결정.
    // (이번 분기 생산 전 stock으로 계산 → 분기 내 비선형 효과는 근사 생략, 제품별 독립 적용)
    const learningMult = learningCurveMultiplier(cumulativeProduction[product.id] ?? 0);
    const unitCost = unitCostFor(effectiveQuality, costMultiplier, learningMult, supplyIndex);
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

  // 서비스 큐 오버플로: 서비스 capacity 초과 시 실판매량·매출 비례 축소 (제품별 균등).
  // weightedSatisfaction/weightedUnits는 비례 축소해도 평균 불변이므로 재계산 불필요.
  const queueMetrics = serviceQueueImpact(totalUnitsSold, decisions.serviceCapacity);
  if (queueMetrics.overflow > 0 && totalUnitsSold > 0) {
    const scale = queueMetrics.effectiveSales / totalUnitsSold;
    for (const id of ['A', 'B'] as ProductId[]) {
      const pr = perProduct[id];
      pr.unitsSold = Math.floor(pr.unitsSold * scale);
      pr.revenue = Math.floor(pr.revenue * scale);
      pr.cogs = Math.floor(pr.cogs * scale);
      pr.grossProfit = pr.revenue - pr.cogs;
      pr.segmentProfit = pr.grossProfit - pr.allocatedOverhead;
    }
    totalUnitsSold = perProduct.A.unitsSold + perProduct.B.unitsSold;
    totalRevenue = perProduct.A.revenue + perProduct.B.revenue;
    totalCogs = perProduct.A.cogs + perProduct.B.cogs;
  }

  // 공통간접비 매출 비중 배분: 광고·R&D·일반관리비·인건비·서비스 opex 합계를 제품 매출 비율로 나눔.
  // 감가상각·이자·유지비는 financial-mapper에서 정식 반영. 여기서는 runtime overhead 근사치만.
  const runtimeLabor = laborCostOf(decisions.headcount);
  const runtimeService = decisions.serviceCapacity * SERVICE_COST_PER_UNIT;
  const runtimeOverhead = totalAd + decisions.rdBudget / 4 + G_AND_A_BASELINE + runtimeLabor + runtimeService;
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
  const serviceCost = decisions.serviceCapacity * SERVICE_COST_PER_UNIT;
  const laborCost = laborCostOf(decisions.headcount);
  // game-engine의 operatingProfit은 프리뷰 용도 — 감가·유지·이자는 financial-mapper에서 정식 계산.
  // 여기서는 G&A baseline + laborCost + serviceCost만 차감 (runtime overhead와 일치).
  const operatingProfit = grossProfit - totalAd - decisions.rdBudget / 4 - G_AND_A_BASELINE - laborCost - serviceCost;

  const avgSatisfaction = weightedUnits > 0 ? weightedSatisfaction / weightedUnits : 0;
  const satisfaction = Math.round(clamp(
    avgSatisfaction - (effects.satisfactionPenalty ?? 0) + queueMetrics.satisfactionDelta,
    0, 100,
  ));

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
    serviceQueue: {
      utilization: queueMetrics.utilization,
      satisfactionDelta: queueMetrics.satisfactionDelta,
      overflow: queueMetrics.overflow,
    },
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
