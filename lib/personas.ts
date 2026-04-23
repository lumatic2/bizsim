import type { PersonaAttributes, PersonaId, Decisions } from './types';

export const PERSONAS: PersonaAttributes[] = [
  {
    id: 'jiyeon',
    name: '김지현',
    age: 32,
    description: '맞벌이 · 실용주의 · 가성비 중시',
    priceSensitivity: 0.8,
    qualityWeight: 0.5,
    brandLoyalty: 0.2,
    channelPreference: { online: 0.7, mart: 0.2, direct: 0.1 },
    segmentShare: 0.4,
    adSaturation: 800_000_000,
    adResponse: { search: 0.35, display: 0.25, influencer: 0.4 },
    emoji: '👩',
  },
  {
    id: 'minsoo',
    name: '박민수',
    age: 45,
    description: '얼리어답터 · 기술 매니아 · 고소득',
    priceSensitivity: 0.3,
    qualityWeight: 0.9,
    brandLoyalty: 0.5,
    channelPreference: { online: 0.5, mart: 0.1, direct: 0.4 },
    segmentShare: 0.25,
    adSaturation: 1_200_000_000,
    adResponse: { search: 0.55, display: 0.2, influencer: 0.25 },
    emoji: '👨',
  },
  {
    id: 'soonja',
    name: '이순자',
    age: 58,
    description: '주부 · 브랜드 충성 · 안정 선호',
    priceSensitivity: 0.5,
    qualityWeight: 0.6,
    brandLoyalty: 0.8,
    channelPreference: { online: 0.15, mart: 0.7, direct: 0.15 },
    segmentShare: 0.35,
    adSaturation: 600_000_000,
    adResponse: { search: 0.15, display: 0.7, influencer: 0.15 },
    emoji: '👵',
  },
];

export function getPersona(id: PersonaId): PersonaAttributes {
  return PERSONAS.find((p) => p.id === id)!;
}

export function buildSystemPrompt(persona: PersonaAttributes, decisions: Decisions): string {
  const productLines = decisions.products.map((p) => {
    const priceStr = (p.price / 10000).toFixed(1);
    const qualityStars = '★'.repeat(p.quality) + '☆'.repeat(5 - p.quality);
    return `- ${p.name}: ${priceStr}만원, 품질 ${qualityStars}`;
  }).join('\n');
  const totalAd = decisions.adBudget.search + decisions.adBudget.display + decisions.adBudget.influencer;
  const mix = decisions.adBudget;
  const dominantChannel = mix.search >= mix.display && mix.search >= mix.influencer
    ? '검색광고'
    : mix.display >= mix.influencer
      ? '디스플레이·배너광고'
      : '인플루언서·SNS 콘텐츠';

  return `당신은 한국 스마트홈 가전 시장의 소비자 "${persona.name}"입니다.

## 당신의 프로필
- 나이: ${persona.age}세
- 특성: ${persona.description}
- 가격 민감도: ${persona.priceSensitivity >= 0.7 ? '높음' : persona.priceSensitivity >= 0.4 ? '중간' : '낮음'}
- 품질 중시도: ${persona.qualityWeight >= 0.7 ? '높음' : persona.qualityWeight >= 0.4 ? '중간' : '낮음'}
- 브랜드 충성도: ${persona.brandLoyalty >= 0.7 ? '높음' : persona.brandLoyalty >= 0.4 ? '중간' : '낮음'}
- 선호 쇼핑 채널: ${persona.channelPreference.online > 0.5 ? '온라인' : persona.channelPreference.mart > 0.5 ? '대형마트' : '직영매장'}

## 현재 시장 상황
- 이 브랜드는 두 개의 제품 라인을 운영 중:
${productLines}
- 광고를 ${totalAd > 1_000_000_000 ? '많이' : totalAd > 500_000_000 ? '적당히' : '거의'} 보았음. 특히 ${dominantChannel}에서 자주 눈에 띔
- R&D 투자 수준: ${decisions.rdBudget > 3_000_000_000 ? '매우 높음' : decisions.rdBudget > 1_500_000_000 ? '보통' : '낮음'}

## 대화 규칙
- 자연스러운 한국어로 대화하세요. 존댓말을 사용하세요.
- 당신의 성격과 상황에 맞게 솔직하게 답변하세요.
- 가격, 품질, 기능에 대한 실질적인 의견을 말하세요.
- 너무 길지 않게, 2-4문장으로 답변하세요.
- 이전 대화와 일관성을 유지하세요.`;
}
