// STP 프레임워크 (Kotler) — Segmentation · Targeting · Positioning
// 포지셔닝 맵은 results 페이지에 이미 존재. 여기서는 S·T 분석 수치를 준비.
//
// Segmentation: 페르소나별 "세그먼트 규모" + "획득 비율" + "매력도"
//   매력도 = 0.5 × 규모정규화 + 0.5 × 획득률 (내게 얼마나 잘 맞는지)
//
// Targeting: 페르소나별 광고 도달 점수
//   도달 = Σ(채널 광고비 × 채널 응답계수) / adSaturation  (saturation 반영 소비자 반응)

import type { SimulationResults, Decisions, PersonaId } from './types';
import { PERSONAS } from './personas';

export type SegmentProfile = {
  personaId: PersonaId;
  name: string;
  emoji: string;
  description: string;
  segmentSize: number;          // 페르소나 잠재 수요 (segmentShare × effectiveMarketSize)
  captured: number;              // 우리가 획득 (실제 demand)
  captureRate: number;           // captured / segmentSize (0~1)
  attractiveness: number;        // 0~100, 정규화된 종합 매력도
  adReachScore: number;          // 광고 도달 점수 (0~1, 포화곡선 반영)
  topChannel: 'search' | 'display' | 'influencer';  // 이 페르소나에 가장 효과적인 채널
};

export function computeSegmentProfiles(
  results: SimulationResults,
  decisions: Decisions,
): SegmentProfile[] {
  const profiles: SegmentProfile[] = [];
  const totalCaptured = results.unitsSold;
  for (const persona of PERSONAS) {
    const captured = results.segmentDemand[persona.id] ?? 0;
    const segmentSize = Math.round(results.marketSize * persona.segmentShare);
    const captureRate = segmentSize > 0 ? captured / segmentSize : 0;

    const effectiveAd =
      decisions.adBudget.search * persona.adResponse.search +
      decisions.adBudget.display * persona.adResponse.display +
      decisions.adBudget.influencer * persona.adResponse.influencer;
    const adReachScore = 1 - Math.exp(-effectiveAd / persona.adSaturation);

    // 이 페르소나에 가장 효과적인 채널 (adResponse 최대)
    const channels: ('search' | 'display' | 'influencer')[] = ['search', 'display', 'influencer'];
    const topChannel = channels.reduce((best, ch) => (persona.adResponse[ch] > persona.adResponse[best] ? ch : best), 'search');

    const sizeNorm = results.marketSize > 0 ? segmentSize / results.marketSize : 0;
    const attractiveness = Math.round(100 * (0.5 * sizeNorm * 2.5 + 0.5 * captureRate));  // 2.5 배수로 크기 스케일

    profiles.push({
      personaId: persona.id,
      name: persona.name,
      emoji: persona.emoji,
      description: persona.description,
      segmentSize,
      captured,
      captureRate,
      attractiveness: Math.min(100, attractiveness),
      adReachScore,
      topChannel,
    });
  }
  // 매력도 내림차순
  profiles.sort((a, b) => b.attractiveness - a.attractiveness);

  // 참조용: totalCaptured는 디버그 — 합은 results.unitsSold와 같아야.
  void totalCaptured;
  return profiles;
}
